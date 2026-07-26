import { useCallback, useEffect, useRef, useState } from 'react';
import { describeRequestError } from '../utils/requestError';

export function usePaginatedCrudList(service, { pageLimit = 10 } = {}) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [loadMoreError, setLoadMoreError] = useState(false);
  const [reconciliationError, setReconciliationError] = useState(false);

  const mountedRef = useRef(true);
  const requestGenerationRef = useRef(0);
  const endReachedLockRef = useRef(false);
  const nextPageRef = useRef(2);
  const exhaustedRef = useRef(false);

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
    else setErrorMessage(null);

    try {
      const res = await service.list({ page: 1, limit: pageLimit });
      if (!mountedRef.current || requestGeneration !== requestGenerationRef.current) return false;
      setItems(res.data);
      setTotal(res.total);
      nextPageRef.current = 2;
      exhaustedRef.current = res.data.length < pageLimit;
      setErrorMessage(null);
      setReconciliationError(false);
      return true;
    } catch (error) {
      if (!mountedRef.current || requestGeneration !== requestGenerationRef.current) return false;
      if (reconciliation) setReconciliationError(true);
      else setErrorMessage(describeRequestError(error).message);
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
      || exhaustedRef.current
      || items.length >= total
      || errorMessage
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
        // Paginação por offset com escrita concorrente repetia registros entre
        // páginas, e a chave duplicada quebrava o keyExtractor da FlatList.
        setItems((current) => {
          const vistos = new Set(current.map((item) => String(item.id)));
          const novos = res.data.filter((item) => !vistos.has(String(item.id)));
          return novos.length === 0 ? current : [...current, ...novos];
        });
        setTotal(res.total);
        nextPageRef.current = nextPage + 1;
        // Página vazia (ou menor que o limite) encerra a paginação mesmo quando
        // o total do servidor está adiantado em relação ao que já foi lido.
        if (res.data.length === 0 || res.data.length < pageLimit) exhaustedRef.current = true;
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
  }, [errorMessage, items.length, loadMoreError, pageLimit, reconciliationError, service, total]);

  const reconcileFirstPage = useCallback(() => (
    loadFirstPage({ reconciliation: true })
  ), [loadFirstPage]);

  return {
    items,
    loading,
    refreshing,
    isFetchingMore,
    errorMessage,
    loadMoreError,
    reconciliationError,
    loadFirstPage,
    refresh,
    loadMore,
    reconcileFirstPage,
  };
}
