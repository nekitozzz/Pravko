import { queryClient } from "./queryClient";

export const PREWARM_DEBOUNCE_MS = 120;

type PrefetchSpec = {
  queryKey: string[];
  queryFn: () => Promise<unknown>;
  key: string;
};

export function makePrefetchSpec<T>(
  queryKey: string[],
  queryFn: () => Promise<T>,
): PrefetchSpec {
  return {
    queryKey,
    queryFn,
    key: queryKey.join(":"),
  };
}

const lastPrewarmedAt = new Map<string, number>();
const DEDUPE_MS = 3_000;

export function prewarmSpecs(specs: PrefetchSpec[]) {
  const now = Date.now();
  for (const spec of specs) {
    const previous = lastPrewarmedAt.get(spec.key);
    if (previous !== undefined && now - previous < DEDUPE_MS) continue;
    lastPrewarmedAt.set(spec.key, now);
    queryClient.prefetchQuery({
      queryKey: spec.queryKey,
      queryFn: spec.queryFn,
      staleTime: 8_000,
    });
  }
}
