import { useRuntimeConfig } from '#imports';

export const useScbdIndexEndpoint = () => {
  const config = useRuntimeConfig();

  return config.public.SCBD_INDEX_ENDPOINT;
};