import { useEffect, useState } from 'react';
import { bulkSetStatus } from '@/api/client';
import { AssetDetail } from '@/features/assets/AssetDetail';
import { AssetGrid } from '@/features/assets/AssetGrid';
import { useAssets } from '@/features/assets/useAssets';
import { statusLabel } from '@/lib/format';
import type { Asset, AssetKind, AssetStatus, AssetQuery } from '@/lib/types';

const STATUSES: AssetStatus[] = ['draft', 'in_review', 'approved', 'archived'];
const KINDS: AssetKind[] = ['image', 'video', 'document'];
const SORTS: Array<{ value: NonNullable<AssetQuery['sort']>; label: string }> = [
  { value: 'updatedAt:desc', label: 'Recently updated' },
  { value: 'name:asc', label: 'Name A–Z' },
  { value: 'sizeBytes:desc', label: 'Largest first' },
  { value: 'createdAt:desc', label: 'Newest' },
];
const DEFAULT_SORT = 'updatedAt:desc' as const;

interface QueryState {
  q: string;
  status: AssetStatus[];
  kind: AssetKind[];
  tag: string[];
  sort: NonNullable<AssetQuery['sort']>;
}

function readQueryFromUrl(): QueryState {
  const params = new URLSearchParams(window.location.search);
  const status = (params.get('status')?.split(',') ?? []).filter((value): value is AssetStatus =>
    STATUSES.includes(value as AssetStatus),
  );
  const kind = (params.get('kind')?.split(',') ?? []).filter((value): value is AssetKind =>
    KINDS.includes(value as AssetKind),
  );
  const sort = params.get('sort');

  return {
    q: params.get('q') ?? '',
    status: [...new Set(status)],
    kind: [...new Set(kind)],
    tag: [...new Set((params.get('tag')?.split(',') ?? []).map((value) => value.trim()).filter(Boolean))],
    sort: SORTS.some((option) => option.value === sort)
      ? (sort as QueryState['sort'])
      : DEFAULT_SORT,
  };
}

export function App() {
  const [queryState, setQueryState] = useState(readQueryFromUrl);
  const { q, status, kind, tag, sort } = queryState;
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeId, setActiveId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    function handlePopState() {
      setQueryState(readQueryFromUrl());
    }

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (status.length) params.set('status', status.join(','));
    if (kind.length) params.set('kind', kind.join(','));
    if (tag.length) params.set('tag', tag.join(','));
    if (sort !== DEFAULT_SORT) params.set('sort', sort);

    const query = params.toString();
    window.history.replaceState(null, '', `${window.location.pathname}${query ? `?${query}` : ''}`);
  }, [q, status, kind, tag, sort]);

  const { items, total, loading, error } = useAssets({ q, status, kind, tag, sort, limit: 24 });

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function applyBulkStatus(next: AssetStatus) {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    setNotice(null);
    try {
      // Sends every selected id in one call, which the API refuses above 50.
      const result = await bulkSetStatus(ids, next);
      setNotice(`${result.applied} updated, ${result.failed} failed.`);
      setSelectedIds(new Set());
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Bulk update failed');
    }
  }

  function handleSaved(_asset: Asset) {
    // The list is not told that anything changed, so it shows stale rows.
  }

  return (
    <div className="app">
      <header className="topbar">
        <h1>MediaVault</h1>
        <input
          className="search"
          type="search"
          placeholder="Search assets"
          value={q}
          onChange={(e) => setQueryState((current) => ({ ...current, q: e.target.value }))}
        />
        <select
          value={sort}
          onChange={(e) =>
            setQueryState((current) => ({
              ...current,
              sort: e.target.value as QueryState['sort'],
            }))
          }
        >
          {SORTS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </header>

      <div className="filters">
        {STATUSES.map((s) => (
          <label key={s}>
            <input
              type="checkbox"
              checked={status.includes(s)}
              onChange={(e) =>
                setQueryState((current) => ({
                  ...current,
                  status: e.target.checked
                    ? [...current.status, s]
                    : current.status.filter((x) => x !== s),
                }))
              }
            />
            {statusLabel(s)}
          </label>
        ))}
        {KINDS.map((kindValue) => (
          <label key={kindValue}>
            <input
              type="checkbox"
              checked={kind.includes(kindValue)}
              onChange={(e) =>
                setQueryState((current) => ({
                  ...current,
                  kind: e.target.checked
                    ? [...current.kind, kindValue]
                    : current.kind.filter((value) => value !== kindValue),
                }))
              }
            />
            {kindValue}
          </label>
        ))}
        <label>
          Tags
          <input
            type="text"
            value={tag.join(', ')}
            placeholder="hero, studio"
            onChange={(e) =>
              setQueryState((current) => ({
                ...current,
                tag: [...new Set(e.target.value.split(',').map((value) => value.trim()).filter(Boolean))],
              }))
            }
          />
        </label>
        <span className="muted">
          {loading ? 'Loading…' : `${items.length} of ${total.toLocaleString()} shown`}
        </span>
      </div>

      {selectedIds.size > 0 && (
        <div className="bulkbar">
          <span>{selectedIds.size} selected</span>
          {STATUSES.map((s) => (
            <button key={s} onClick={() => applyBulkStatus(s)}>
              Set {statusLabel(s).toLowerCase()}
            </button>
          ))}
          <button onClick={() => setSelectedIds(new Set())}>Clear selection</button>
        </div>
      )}

      {notice && <p className="notice">{notice}</p>}
      {error && <p className="error">{error}</p>}

      <main className="content">
        {loading && items.length === 0 ? (
          <div className="empty">
            <p>Loading assets…</p>
          </div>
        ) : error && items.length === 0 ? (
          <div className="empty">
            <p>We could not load these assets.</p>
            <p className="muted">Check your connection and try again.</p>
          </div>
        ) : (
          <AssetGrid
            assets={items}
            selectedIds={selectedIds}
            activeId={activeId}
            onToggleSelect={toggleSelect}
            onOpen={setActiveId}
          />
        )}
        {activeId && (
          <AssetDetail id={activeId} onClose={() => setActiveId(null)} onSaved={handleSaved} />
        )}
      </main>
    </div>
  );
}
