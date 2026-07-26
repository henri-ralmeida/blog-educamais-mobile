import { useCallback, useEffect, useRef, useState } from 'react';

export function usePaginatedCrudList(service, { pageLimit = 10 } = {}) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState(false);
  const [reconciliationError, setReconciliationError] = useState(false);

  const mountedRef = useRef(true);
  const requestGenerationRef = useRef(0);
  const endReachedLockRef = useRef(false);
  const nextPageRef = useRef(2);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      requestGenerationRef.current += 1;
    };
  }, []);

  const loadFirstPage = useCallback(async ({
    showLoading = false,
    showRefreshing = false,
    reconciliation = false,
  } = {}) => {
    const requestGeneration = ++requestGenerationRef.current;
    endReachedLockRef.current = true;
    setIsFetchingMore(false);
    setLoadMoreError(false);
    if (showLoading) setLoading(true);
    if (showRefreshing) setRefreshing(true);
    if (reconciliation) setReconciliationError(false);
    else setHasError(false);

    try {
      const res = await service.list({ page: 1, limit: pageLimit });
      if (!mountedRef.current || requestGeneration !== requestGenerationRef.current) return false;
      setItems(res.data);
      setTotal(res.total);
      nextPageRef.current = 2;
      setHasError(false);
      setReconciliationError(false);
      return true;
    } catch {
      if (!mountedRef.current || requestGeneration !== requestGenerationRef.current) return false;
      if (reconciliation) setReconciliationError(true);
      else setHasError(true);
      return false;
    } finally {
      if (mountedRef.current && requestGeneration === requestGenerationRef.current) {
        endReachedLockRef.current = false;
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [pageLimit, service]);

  useEffect(() => {
    loadFirstPage({ showLoading: true });
  }, [loadFirstPage]);

  const refresh = useCallback(() => {
    loadFirstPage({ showRefreshing: true });
  }, [loadFirstPage]);

  const loadMore = useCallback(({ retry = false } = {}) => {
    if (
      endReachedLockRef.current
      || items.length >= total
      || hasError
      || reconciliationError
      || (loadMoreError && !retry)
    ) return;
    endReachedLockRef.current = true;
    setIsFetchingMore(true);
    setLoadMoreError(false);
    const nextPage = nextPageRef.current;
    const requestGeneration = requestGenerationRef.current;

    service.list({ page: nextPage, limit: pageLimit })
      .then((res) => {
        if (!mountedRef.current || requestGeneration !== requestGenerationRef.current) return;
        setItems((current) => [...current, ...res.data]);
        setTotal(res.total);
        nextPageRef.current = nextPage + 1;
      })
      .catch(() => {
        if (!mountedRef.current || requestGeneration !== requestGenerationRef.current) return;
        setLoadMoreError(true);
      })
      .finally(() => {
        if (!mountedRef.current || requestGeneration !== requestGenerationRef.current) return;
        endReachedLockRef.current = false;
        setIsFetchingMore(false);
      });
  }, [hasError, items.length, loadMoreError, pageLimit, reconciliationError, service, total]);

  const reconcileFirstPage = useCallback(() => (
    loadFirstPage({ reconciliation: true })
  ), [loadFirstPage]);

  return {
    items,
    loading,
    refreshing,
    isFetchingMore,
    hasError,
    loadMoreError,
    reconciliationError,
    loadFirstPage,
    refresh,
    loadMore,
    reconcileFirstPage,
  };
}
