import { useState, useEffect, useCallback } from "react";

// Pass a stable fetch function (useCallback when it depends on props or state).
export default function useApi(fetchFn) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(() => {
    return Promise.resolve()
      .then(() => fetchFn())
      .then((result) => {
        setData(result);
        setError(null);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [fetchFn]);

  const execute = useCallback(() => {
    setLoading(true);
    setError(null);
    return fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: execute };
}
