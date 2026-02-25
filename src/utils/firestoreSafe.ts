
/**
 * Centralized Firestore helpers to keep the app stable even when
 * composite indexes are missing or queries fail.
 */

export const isFirestoreIndexError = (error: any): boolean => {
  if (!error) return false;
  if (error.code === 'failed-precondition') return true;
  const message = typeof error.message === 'string' ? error.message.toLowerCase() : '';
  const isIndexError = message.includes('index') || message.includes('indexes');
  if (isIndexError) {
    console.warn('[FirestoreSafe] ⚠️ Index error detected:', message);
  }
  return isIndexError;
};

type SafeQueryResult<T> = {
  data: T[];
  error: any | null;
};

/**
 * Wraps a Firestore query function and guarantees:
 * - Never throws for index errors
 * - Always returns an array for `data` (never undefined/null)
 * - Logs warnings instead of crashing the app
 */
export async function safeQuery<T>(fn: () => Promise<T[]>): Promise<SafeQueryResult<T>> {
  try {
    const data = await fn();
    return {
      data: Array.isArray(data) ? data : [],
      error: null,
    };
  } catch (error: any) {
    if (isFirestoreIndexError(error)) {
      console.warn('[FirestoreSafe] ⚠️ Missing Firestore index. Returning empty result.', {
        code: error?.code,
        message: error?.message,
        link: error?.message?.match(/https:\/\/console\.firebase\.google\.com[^\s]*/)?.[0],
      });
      return { data: [], error: null };
    }

    console.warn('[FirestoreSafe] ⚠️ Firestore query failed. Returning empty result.', {
      code: error?.code,
      message: error?.message,
    });

    return { data: [], error };
  }
}

