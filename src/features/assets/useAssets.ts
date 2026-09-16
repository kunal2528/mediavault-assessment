import { useCallback, useEffect, useRef, useState } from 'react';
import { listAssets } from '@/api/client';
import type { Asset, AssetQuery } from '@/lib/types';

interface State {
  items: Asset[];
  total: number;
  nextCursor: string | null;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
}

/**
 * Baseline loader. Reviewers know this hook is wrong in several ways.
 * Replacing it wholesale is expected and encouraged.
 */
export function useAssets(query: AssetQuery) {
  const [state, setState] = useState<State>({
    items: [],
    total: 0,
    nextCursor: null,
    loading: true,
    loadingMore: false,
    error: null,
  });
  const queryKey = JSON.stringify(query);
  const generationRef = useRef(0);
  const loadMoreControllerRef = useRef<AbortController | null>(null);
  const loadingMoreRef = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    const generation = generationRef.current + 1;
    generationRef.current = generation;
    loadMoreControllerRef.current?.abort();
    loadMoreControllerRef.current = null;
    loadingMoreRef.current = false;

    setState((s) => ({
      ...s,
      items: [],
      total: 0,
      nextCursor: null,
      loading: true,
      loadingMore: false,
      error: null,
    }));
    const timer = window.setTimeout(() => {
      listAssets(query, controller.signal)
        .then((page) => {
          if (generationRef.current !== generation) return;
          setState({
            items: page.items,
            total: page.total,
            nextCursor: page.nextCursor,
            loading: false,
            loadingMore: false,
            error: null,
          });
        })
        .catch((err: unknown) => {
          if (
            generationRef.current !== generation ||
            (err instanceof DOMException && err.name === 'AbortError')
          ) return;
          setState((s) => ({
            ...s,
            loading: false,
            loadingMore: false,
            error: err instanceof Error ? err.message : 'Something went wrong',
          }));
        });
    }, 300);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
      loadMoreControllerRef.current?.abort();
    };
  }, [queryKey]);

  const loadMore = useCallback(() => {
    if (!state.nextCursor || state.loading || loadingMoreRef.current) return;

    const generation = generationRef.current;
    const controller = new AbortController();
    const cursor = state.nextCursor;
    loadingMoreRef.current = true;
    loadMoreControllerRef.current = controller;
    setState((s) => ({ ...s, loadingMore: true, error: null }));

    listAssets({ ...query, cursor }, controller.signal)
      .then((page) => {
        if (generationRef.current !== generation) return;
        setState((s) => ({
          ...s,
          items: [...s.items, ...page.items],
          total: page.total,
          nextCursor: page.nextCursor,
          loadingMore: false,
        }));
      })
      .catch((err: unknown) => {
        if (
          generationRef.current !== generation ||
          (err instanceof DOMException && err.name === 'AbortError')
        ) return;
        setState((s) => ({
          ...s,
          loadingMore: false,
          error: err instanceof Error ? err.message : 'Something went wrong',
        }));
      })
      .finally(() => {
        if (generationRef.current !== generation) return;
        loadingMoreRef.current = false;
        loadMoreControllerRef.current = null;
      });
  }, [query, state.loading, state.nextCursor]);

  return { ...state, loadMore };
}
