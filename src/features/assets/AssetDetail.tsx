import { useEffect, useRef, useState } from 'react';
import { getAsset, thumbnailUrl, updateAsset } from '@/api/client';
import { formatBytes, formatDate, formatDuration, statusLabel } from '@/lib/format';
import type { Asset, AssetStatus } from '@/lib/types';

const STATUSES: AssetStatus[] = ['draft', 'in_review', 'approved', 'archived'];

interface Props {
  id: string;
  onClose: () => void;
  onSaved: (asset: Asset) => void;
}

export function AssetDetail({ id, onClose, onSaved }: Props) {
  const [asset, setAsset] = useState<Asset | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);

  // Move focus into the panel when it opens
  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  // Escape closes the panel (focus return is handled by the caller)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    }
    const panel = panelRef.current;
    panel?.addEventListener('keydown', handleKeyDown);
    return () => panel?.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    setAsset(null);
    setError(null);
    getAsset(id)
      .then(setAsset)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Load failed'));
  }, [id]);

  async function setStatus(status: AssetStatus) {
    if (!asset) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await updateAsset(asset.id, asset.version, { status });
      setAsset(updated);
      onSaved(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <aside
      ref={panelRef}
      className="panel"
      role="region"
      aria-label={asset ? `Details for ${asset.name}` : 'Asset details'}
    >
      <div className="panel__head">
        <h2>Asset detail</h2>
        <button ref={closeButtonRef} onClick={onClose} aria-label="Close asset detail">
          Close
        </button>
      </div>

      {error && <p className="error" role="alert">{error}</p>}
      {!asset && !error && <p className="muted">Loading…</p>}

      {asset && (
        <div className="panel__body">
          <img className="panel__thumb" src={thumbnailUrl(asset.id)} alt="" />
          <h3>{asset.name}</h3>
          <dl className="facts">
            <dt>Id</dt>
            <dd>{asset.id}</dd>
            <dt>Kind</dt>
            <dd>{asset.kind}</dd>
            <dt>Size</dt>
            <dd>{formatBytes(asset.sizeBytes)}</dd>
            {asset.width && (
              <>
                <dt>Dimensions</dt>
                <dd>{asset.width}×{asset.height}</dd>
              </>
            )}
            {asset.durationSec && (
              <>
                <dt>Duration</dt>
                <dd>{formatDuration(asset.durationSec)}</dd>
              </>
            )}
            <dt>Owner</dt>
            <dd>{asset.owner.name}</dd>
            <dt>Updated</dt>
            <dd>{formatDate(asset.updatedAt)}</dd>
            <dt>Version</dt>
            <dd>{asset.version}</dd>
          </dl>

          {asset.tags.length > 0 && (
            <ul className="tags">
              {asset.tags.map((tag) => (
                <li key={tag}>{tag}</li>
              ))}
            </ul>
          )}

          <p className="muted" id="status-label">Status</p>
          <div className="row" role="group" aria-labelledby="status-label">
            {STATUSES.map((status) => (
              <button
                key={status}
                disabled={saving || status === asset.status}
                aria-pressed={status === asset.status}
                onClick={() => setStatus(status)}
              >
                {statusLabel(status)}
              </button>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
