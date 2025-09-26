import { useRuntimeConfig } from '#imports';

export const useScbdIndexEndpoint = () => {
  const config = useRuntimeConfig();

  return config.public.scbdIndexEndpoint;
};