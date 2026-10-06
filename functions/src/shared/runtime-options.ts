// These jobs mostly wait for Firestore; fractional CPU avoids paying for a full core.
// Callable functions retain a full CPU and concurrency for responsive user requests.
export const SCHEDULED_FUNCTION_OPTIONS = {
    region: 'us-central1',
    memory: '256MiB',
    cpu: 'gcf_gen1',
    concurrency: 1,
    minInstances: 0,
    maxInstances: 1,
} as const;

export const CALLABLE_FUNCTION_OPTIONS = {
    region: 'us-central1',
    memory: '256MiB',
    minInstances: 0,
    maxInstances: 5,
} as const;
