import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { thumbnailUrl } from '@/api/client';
import { formatBytes, formatDate, statusLabel } from '@/lib/format';
import type { Asset } from '@/lib/types';

interface Props {
  assets: Asset[];
  selectedIds: Set<string>;
  activeId: string | null;
  onToggleSelect: (id: string) => void;
  onOpen: (id: string) => void;
  onLoadMore: () => void;
  loadingMore: boolean;
  hasMore: boolean;
  /** Parent registers a callback here to imperatively focus a card by index after panel close */
  onRegisterFocusByIndex?: (fn: (index: number) => void) => void;
}

function AssetThumbnail({ id, hasThumbnail }: { id: string; hasThumbnail: boolean }) {
  const [missing, setMissing] = useState(!hasThumbnail);

  return (
    <div className="card__thumb">
      {missing ? (
        <span className="card__thumb-placeholder" aria-hidden="true">No preview</span>
      ) : (
        <img
          className="card__thumb-image"
          src={thumbnailUrl(id)}
          alt=""
          loading="lazy"
          onError={() => setMissing(true)}
        />
      )}
    </div>
  );
}

interface AssetCardProps {
  asset: Asset;
  selected: boolean;
  active: boolean;
  focused: boolean;
  width: number;
  left: number;
  top: number;
  onToggleSelect: (id: string) => void;
  onOpen: (id: string) => void;
  onFocus: (id: string) => void;
  cardRef: (el: HTMLDivElement | null) => void;
}

const AssetCard = memo(function AssetCard({
  asset,
  selected,
  active,
  focused,
  width,
  left,
  top,
  onToggleSelect,
  onOpen,
  onFocus,
  cardRef,
}: AssetCardProps) {
  return (
    <div
      ref={cardRef}
      role="gridcell"
      aria-selected={selected}
      aria-label={`${asset.name}, ${statusLabel(asset.status)}, ${asset.kind}`}
      tabIndex={focused ? 0 : -1}
      className={
        'card' +
        (selected ? ' card--selected' : '') +
        (active ? ' card--active' : '')
      }
      style={{ width, left, top }}
      onClick={() => onOpen(asset.id)}
      onFocus={() => onFocus(asset.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          onOpen(asset.id);
        }
        if (e.key === ' ') {
          e.preventDefault();
          onToggleSelect(asset.id);
        }
      }}
    >
      <AssetThumbnail id={asset.id} hasThumbnail={asset.hasThumbnail} />
      <div className="card__body">
        <p className="card__name">{asset.name}</p>
        <p className="card__meta">
          {asset.kind} · {formatBytes(asset.sizeBytes)} · {formatDate(asset.updatedAt)}
        </p>
        <span
          className={`pill pill--${asset.status}`}
          aria-hidden="true"
          title={`Step ${['draft','in_review','approved','archived'].indexOf(asset.status) + 1} of 4 — ${statusLabel(asset.status)}`}
        >
          {statusLabel(asset.status)}
        </span>
      </div>
      <input
        type="checkbox"
        className="card__check"
        tabIndex={-1}
        aria-hidden="true"
        checked={selected}
        onChange={() => {/* controlled via onClick below */}}
        onClick={(e) => {
          e.stopPropagation();
          onToggleSelect(asset.id);
        }}
      />
    </div>
  );
});
/**
 * Virtualised grid with full keyboard support:
 *   - Arrow keys navigate between cards (roving tabindex)
 *   - Shift+Arrow extends a range selection
 *   - Enter opens the detail panel
 *   - Space toggles selection
 *   - role="grid" / role="gridcell" with aria-selected for screen readers
 */
export function AssetGrid({
  assets,
  selectedIds,
  activeId,
  onToggleSelect,
  onOpen,
  onLoadMore,
  loadingMore,
  hasMore,
  onRegisterFocusByIndex,
}: Props) {
  const gridRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const onLoadMoreRef = useRef(onLoadMore);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [viewport, setViewport] = useState({ width: 0, height: 0, scrollTop: 0 });
  const scrollPositionRef = useRef(0);
  const previousActiveIdRef = useRef(activeId);
  const previousSelectedIdsRef = useRef(selectedIds);
  onLoadMoreRef.current = onLoadMore;

  // Roving tabindex: which asset index currently owns tabIndex=0
  const [focusedIndex, setFocusedIndex] = useState(0);
  // Anchor for Shift+Arrow range selection
  const anchorIndexRef = useRef(0);
  // DOM refs keyed by absolute asset index (not visible-slice index)
  const cardRefsMap = useRef<Map<number, HTMLDivElement>>(new Map());

  const handleToggleSelect = useCallback(
    (id: string) => {
      if (gridRef.current) scrollPositionRef.current = gridRef.current.scrollTop;
      onToggleSelect(id);
    },
    [onToggleSelect],
  );

  // Let App restore focus to a specific card after the detail panel closes
  useEffect(() => {
    if (!onRegisterFocusByIndex) return;
    onRegisterFocusByIndex((index: number) => {
      const clamped = Math.max(0, Math.min(index, assets.length - 1));
      setFocusedIndex(clamped);
      anchorIndexRef.current = clamped;
      requestAnimationFrame(() => {
        cardRefsMap.current.get(clamped)?.focus();
      });
    });
  }, [onRegisterFocusByIndex, assets.length]);

  // Viewport size tracking via ResizeObserver
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const update = () =>
      setViewport({ width: grid.clientWidth, height: grid.clientHeight, scrollTop: grid.scrollTop });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(grid);
    return () => ro.disconnect();
  }, []);

  useLayoutEffect(() => {
    if (previousActiveIdRef.current === activeId) return;
    previousActiveIdRef.current = activeId;
    const grid = gridRef.current;
    if (!grid) return;
    grid.scrollTop = scrollPositionRef.current;
    setViewport((c) => ({ ...c, scrollTop: grid.scrollTop }));
  }, [activeId]);

  useLayoutEffect(() => {
    if (previousSelectedIdsRef.current === selectedIds) return;
    previousSelectedIdsRef.current = selectedIds;
    const grid = gridRef.current;
    if (!grid) return;
    grid.scrollTop = scrollPositionRef.current;
    setViewport((c) => ({ ...c, scrollTop: grid.scrollTop }));
  }, [selectedIds]);

  // Infinite scroll sentinel
  useEffect(() => {
    const root = gridRef.current;
    const sentinel = sentinelRef.current;
    if (!root || !sentinel || !hasMore || !hasScrolled) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0]?.isIntersecting) onLoadMoreRef.current(); },
      { root, rootMargin: '0px' },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, hasScrolled]);

  if (assets.length === 0) {
    return (
      <div className="empty">
        <p>Nothing matches these filters.</p>
        <p className="muted">Clear the search box or widen the status filter.</p>
      </div>
    );
  }

  // Layout calculations
  const gap = 12;
  const padding = 16;
  const cardMinimumWidth = 220;
  const contentWidth = Math.max(viewport.width - padding * 2, cardMinimumWidth);
  const columns = Math.max(1, Math.floor((contentWidth + gap) / (cardMinimumWidth + gap)));
  const cardWidth = (contentWidth - gap * (columns - 1)) / columns;
  const rowHeight = 292;
  const rowCount = Math.ceil(assets.length / columns);
  const startRow = Math.max(0, Math.floor(viewport.scrollTop / rowHeight) - 1);
  const endRow = Math.min(rowCount, Math.ceil((viewport.scrollTop + viewport.height) / rowHeight) + 1);
  const visibleAssets = assets.slice(startRow * columns, endRow * columns);
  const canvasHeight = rowCount * rowHeight;

  // Arrow-key navigation with optional Shift+Arrow range selection
  function handleGridKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const isArrow = ['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(e.key);
    if (!isArrow) return;
    e.preventDefault();

    const current = focusedIndex;
    let next = current;
    if (e.key === 'ArrowRight') next = Math.min(assets.length - 1, current + 1);
    if (e.key === 'ArrowLeft')  next = Math.max(0, current - 1);
    if (e.key === 'ArrowDown')  next = Math.min(assets.length - 1, current + columns);
    if (e.key === 'ArrowUp')    next = Math.max(0, current - columns);
    if (next === current) return;

    if (e.shiftKey) {
      const anchor = anchorIndexRef.current;
      const newLo = Math.min(anchor, next);
      const newHi = Math.max(anchor, next);
      const oldLo = Math.min(anchor, current);
      const oldHi = Math.max(anchor, current);
      for (let i = oldLo; i <= oldHi; i++) {
        if (i < newLo || i > newHi) {
          const id = assets[i]?.id;
          if (id && selectedIds.has(id)) onToggleSelect(id);
        }
      }
      for (let i = newLo; i <= newHi; i++) {
        const id = assets[i]?.id;
        if (id && !selectedIds.has(id)) onToggleSelect(id);
      }
    } else {
      anchorIndexRef.current = next;
    }

    setFocusedIndex(next);

    // Scroll target row into view if needed
    const targetTop = Math.floor(next / columns) * rowHeight;
    const grid = gridRef.current;
    if (grid) {
      if (targetTop < grid.scrollTop) {
        grid.scrollTop = targetTop;
      } else if (targetTop + rowHeight > grid.scrollTop + grid.clientHeight) {
        grid.scrollTop = targetTop + rowHeight - grid.clientHeight;
      }
    }

    requestAnimationFrame(() => {
      cardRefsMap.current.get(next)?.focus();
    });
  }

  return (
    <div
      role="grid"
      aria-label="Media assets"
      aria-rowcount={rowCount}
      aria-colcount={columns}
      className="grid"
      ref={gridRef}
      onKeyDown={handleGridKeyDown}
      onScroll={(event: React.UIEvent<HTMLDivElement>) => {
        if (!hasScrolled) setHasScrolled(true);
        const { clientHeight, scrollTop } = event.currentTarget;
        scrollPositionRef.current = scrollTop;
        setViewport((c) => ({ ...c, scrollTop, height: clientHeight }));
      }}
    >
      <div className="grid__canvas" style={{ height: canvasHeight }}>
        {visibleAssets.map((asset, visibleIndex) => {
          const index = startRow * columns + visibleIndex;
          const row = Math.floor(index / columns);
          const column = index % columns;
          return (
            <AssetCard
              key={asset.id}
              asset={asset}
              selected={selectedIds.has(asset.id)}
              active={activeId === asset.id}
              focused={focusedIndex === index}
              width={cardWidth}
              left={padding + column * (cardWidth + gap)}
              top={row * rowHeight}
              onToggleSelect={handleToggleSelect}
              onOpen={onOpen}
              onFocus={(id) => {
                const idx = assets.findIndex((a) => a.id === id);
                if (idx !== -1) {
                  setFocusedIndex(idx);
                  anchorIndexRef.current = idx;
                }
              }}
              cardRef={(el) => {
                if (el) cardRefsMap.current.set(index, el);
                else cardRefsMap.current.delete(index);
              }}
            />
          );
        })}
        <div
          ref={sentinelRef}
          className="grid__sentinel"
          style={{ top: Math.max(0, canvasHeight - 1) }}
          aria-hidden="true"
        />
      </div>
      {(hasMore || loadingMore) && (
        <div className="load-more">
          {loadingMore ? (
            <span className="muted">Loading more…</span>
          ) : (
            <button className="load-more__btn" onClick={onLoadMore}>
              Load more
            </button>
          )}
        </div>
      )}
    </div>
  );
}
