import { useCallback, useEffect, useRef, useState } from 'react';
import { bulkSetStatus } from '@/api/client';
import { AssetDetail } from '@/features/assets/AssetDetail';
import { AssetGrid } from '@/features/assets/AssetGrid';
import { useAssets } from '@/features/assets/useAssets';
import { friendlyError, statusLabel } from '@/lib/format';
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

function SkeletonGrid() {
  return (
    <div className="skeleton-grid" aria-hidden="true">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="skeleton-card">
          <div className="skeleton-thumb" />
          <div className="skeleton-body">
            <div className="skeleton-line skeleton-line--title" />
            <div className="skeleton-line skeleton-line--meta" />
            <div className="skeleton-line skeleton-line--pill" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function App() {
  const [queryState, setQueryState] = useState(readQueryFromUrl);
  const { q, status, kind, tag, sort } = queryState;
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeId, setActiveId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [liveMessage, setLiveMessage] = useState<string>('');
  const focusByIndexRef = useRef<((index: number) => void) | null>(null);
  const activeAssetIndexRef = useRef<number>(0);

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

  const { items, total, loading, loadingMore, nextCursor, error, loadMore } = useAssets({
    q,
    status,
    kind,
    tag,
    sort,
    limit: 24,
  });

  // Debounced live region announcements
  useEffect(() => {
    if (!loading && items.length > 0) {
      const timer = setTimeout(() => {
        setLiveMessage(`${items.length} of ${total.toLocaleString()} assets shown`);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [items.length, total, loading]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  async function applyBulkStatus(next: AssetStatus) {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    setNotice(null);
    try {
      const result = await bulkSetStatus(ids, next);
      const message = `${result.applied} asset${result.applied !== 1 ? 's' : ''} set to ${statusLabel(next).toLowerCase()}${result.failed > 0 ? `, ${result.failed} failed` : ''}`;
      setNotice(message);
      setLiveMessage(message);
      setSelectedIds(new Set());
    } catch (err) {
      const message = friendlyError(err);
      setNotice(message);
      setLiveMessage(message);
    }
  }

  function handleSaved(_asset: Asset) {
    // The list is not told that anything changed, so it shows stale rows.
  }

  function handleAssetOpen(id: string) {
    const index = items.findIndex((a) => a.id === id);
    if (index !== -1) activeAssetIndexRef.current = index;
    setActiveId(id);
  }

  function handleAssetClose() {
    setActiveId(null);
    // Restore keyboard focus to the card that triggered the panel open
    setTimeout(() => {
      focusByIndexRef.current?.(activeAssetIndexRef.current);
    }, 0);
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
        <span className="result-count">
          {loading ? 'Loading…' : `${items.length} of ${total.toLocaleString()} shown`}
        </span>
        {(status.length + kind.length + tag.length) > 0 && (
          <>
            <span className="filter-badge">
              {status.length + kind.length + tag.length} filter{status.length + kind.length + tag.length !== 1 ? 's' : ''} active
            </span>
            <button
              className="filter-clear"
              onClick={() =>
                setQueryState((current) => ({
                  ...current,
                  status: [],
                  kind: [],
                  tag: [],
                }))
              }
            >
              Clear filters
            </button>
          </>
        )}
      </div>

      <div className={`bulkbar${selectedIds.size === 0 ? ' bulkbar--empty' : ''}`}>
        {selectedIds.size > 0 && (
          <>
            <span>{selectedIds.size} selected</span>
            {selectedIds.size < items.length && (
              <button
                onClick={() => setSelectedIds(new Set(items.map((a) => a.id)))}
              >
                Select all {items.length}
              </button>
            )}
            {STATUSES.map((s) => (
              <button key={s} onClick={() => applyBulkStatus(s)}>
                Set {statusLabel(s).toLowerCase()}
              </button>
            ))}
            <button onClick={() => setSelectedIds(new Set())}>Clear selection</button>
          </>
        )}
      </div>

      {notice && <p className="notice">{notice}</p>}
      {error && <p className="error">{error}</p>}
      
      {/* Live region for screen reader announcements */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {liveMessage}
      </div>

      <main className="content">
        {loading && items.length === 0 ? (
          <SkeletonGrid />
        ) : error && items.length === 0 ? (
          <div className="empty">
            <svg className="empty__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p className="empty__title">Could not load assets</p>
            <p className="empty__sub">{error}</p>
          </div>
        ) : !loading && items.length === 0 ? (
          <div className="empty">
            <svg className="empty__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <p className="empty__title">No assets found</p>
            <p className="empty__sub">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <AssetGrid
            assets={items}
            selectedIds={selectedIds}
            activeId={activeId}
            onToggleSelect={toggleSelect}
            onOpen={handleAssetOpen}
            onLoadMore={loadMore}
            loadingMore={loadingMore}
            hasMore={nextCursor !== null}
            onRegisterFocusByIndex={(fn) => { focusByIndexRef.current = fn; }}
          />
        )}
        {activeId && (
          <AssetDetail id={activeId} onClose={handleAssetClose} onSaved={handleSaved} />
        )}
      </main>
    </div>
  );
}
