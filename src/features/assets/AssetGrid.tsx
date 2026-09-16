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
}

function AssetThumbnail({ id, hasThumbnail }: { id: string; hasThumbnail: boolean }) {
  const [missing, setMissing] = useState(!hasThumbnail);

  return (
    <div className="card__thumb">
      {missing ? (
        <span className="card__thumb-placeholder">Preview unavailable</span>
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
  width: number;
  left: number;
  top: number;
  onToggleSelect: (id: string) => void;
  onOpen: (id: string) => void;
}

const AssetCard = memo(function AssetCard({
  asset,
  selected,
  active,
  width,
  left,
  top,
  onToggleSelect,
  onOpen,
}: AssetCardProps) {
  return (
    <div
      className={'card' + (selected ? ' card--selected' : '') + (active ? ' card--active' : '')}
      style={{ width, left, top }}
      onClick={() => onOpen(asset.id)}
    >
      <AssetThumbnail id={asset.id} hasThumbnail={asset.hasThumbnail} />
      <div className="card__body">
        <p className="card__name">{asset.name}</p>
        <p className="muted">
          {asset.kind} · {formatBytes(asset.sizeBytes)} · {formatDate(asset.updatedAt)}
        </p>
        <span className={`pill pill--${asset.status}`}>{statusLabel(asset.status)}</span>
      </div>
      <input
        type="checkbox"
        className="card__check"
        checked={selected}
        onClick={(event) => event.stopPropagation()}
        onChange={() => onToggleSelect(asset.id)}
      />
    </div>
  );
});

/**
 * Baseline grid. Renders every row it is given, re-renders every card on any
 * selection change, and is not reachable by keyboard.
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
  const handleToggleSelect = useCallback(
    (id: string) => {
      if (gridRef.current) scrollPositionRef.current = gridRef.current.scrollTop;
      onToggleSelect(id);
    },
    [onToggleSelect],
  );

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    const updateViewport = () => {
      if (grid.scrollTop !== scrollPositionRef.current) {
        grid.scrollTop = scrollPositionRef.current;
      }
      setViewport({ width: grid.clientWidth, height: grid.clientHeight, scrollTop: grid.scrollTop });
    };
    updateViewport();
    const resizeObserver = new ResizeObserver(updateViewport);
    resizeObserver.observe(grid);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (assets.length === 0) {
      setHasScrolled(false);
    }
  }, [assets.length]);

  useLayoutEffect(() => {
    if (previousActiveIdRef.current === activeId) return;
    previousActiveIdRef.current = activeId;
    const grid = gridRef.current;
    if (!grid) return;
    grid.scrollTop = scrollPositionRef.current;
    setViewport((current) => ({ ...current, scrollTop: grid.scrollTop }));
  }, [activeId]);

  useLayoutEffect(() => {
    if (previousSelectedIdsRef.current === selectedIds) return;
    previousSelectedIdsRef.current = selectedIds;
    const grid = gridRef.current;
    if (!grid) return;
    grid.scrollTop = scrollPositionRef.current;
    setViewport((current) => ({ ...current, scrollTop: grid.scrollTop }));
  }, [selectedIds]);

  useEffect(() => {
    const root = gridRef.current;
    const sentinel = sentinelRef.current;
    if (!root || !sentinel || !hasMore || !hasScrolled) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) onLoadMoreRef.current();
      },
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

  const gap = 12;
  const padding = 16;
  const cardMinimumWidth = 220;
  const contentWidth = Math.max(viewport.width - padding * 2, cardMinimumWidth);
  const columns = Math.max(
    1,
    Math.floor((contentWidth + gap) / (cardMinimumWidth + gap)),
  );
  const cardWidth = (contentWidth - gap * (columns - 1)) / columns;
  const rowHeight = 292;
  const rowCount = Math.ceil(assets.length / columns);
  const startRow = Math.max(0, Math.floor(viewport.scrollTop / rowHeight) - 1);
  const endRow = Math.min(
    rowCount,
    Math.ceil((viewport.scrollTop + viewport.height) / rowHeight) + 1,
  );
  const visibleAssets = assets.slice(startRow * columns, endRow * columns);
  const canvasHeight = rowCount * rowHeight;

  return (
    <div
      className="grid"
      ref={gridRef}
      onScroll={(event: React.UIEvent<HTMLDivElement>) => {
        if (!hasScrolled) setHasScrolled(true);
        const { clientHeight, scrollTop } = event.currentTarget;
        scrollPositionRef.current = scrollTop;
        setViewport((current) => ({
          ...current,
          scrollTop,
          height: clientHeight,
        }));
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
              width={cardWidth}
              left={padding + column * (cardWidth + gap)}
              top={row * rowHeight}
              onToggleSelect={handleToggleSelect}
              onOpen={onOpen}
            />
          );
        })}
        <div
          ref={sentinelRef}
          className="grid__sentinel"
          style={{ top: Math.max(0, canvasHeight - 1) }}
          aria-hidden="true"
        >
          {loadingMore && <span className="muted">Loading more assets…</span>}
        </div>
      </div>
    </div>
  );
}
