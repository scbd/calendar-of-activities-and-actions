import type { SolrSelectBody, SolrResponse } from '../../shared/types/solr';

export const useQueryIndex = <TDoc = Record<string, unknown>>(
  body: SolrSelectBody,
  endpoint?: string,
) => {
  const config = useRuntimeConfig();
  const finalEndpoint = endpoint || config.public.SCBD_INDEX_ENDPOINT;

  return useFetch<SolrResponse<TDoc>>(finalEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
};