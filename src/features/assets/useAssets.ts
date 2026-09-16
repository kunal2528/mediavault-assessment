import { useEffect, useState } from 'react';
import { listAssets } from '@/api/client';
import type { Asset, AssetQuery } from '@/lib/types';

interface State {
  items: Asset[];
  total: number;
  nextCursor: string | null;
  loading: boolean;
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
    error: null,
  });

  useEffect(() => {
    const controller = new AbortController();
    let current = true;

    setState((s) => ({ ...s, loading: true, error: null }));
    const timer = window.setTimeout(() => {
      listAssets(query, controller.signal)
        .then((page) => {
          if (!current) return;
          setState({
            items: page.items,
            total: page.total,
            nextCursor: page.nextCursor,
            loading: false,
            error: null,
          });
        })
        .catch((err: unknown) => {
          if (!current || (err instanceof DOMException && err.name === 'AbortError')) return;
          setState((s) => ({
            ...s,
            loading: false,
            error: err instanceof Error ? err.message : 'Something went wrong',
          }));
        });
    }, 300);

    return () => {
      current = false;
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [JSON.stringify(query)]);

  return state;
}
