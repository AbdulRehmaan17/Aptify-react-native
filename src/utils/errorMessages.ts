/**
 * Helper to map low-level Firebase / network errors to
 * user-friendly, non-technical messages.
 */

export const getFriendlyErrorMessage = (
  error: any,
  fallback: string
): string => {
  if (!error) return fallback;

  const code = error.code || '';
  const rawMessage: string = typeof error.message === 'string' ? error.message.toLowerCase() : '';

  if (code === 'permission-denied' || rawMessage.includes('permission')) {
    return 'You do not have permission to perform this action.';
  }

  if (code === 'unauthenticated' || rawMessage.includes('auth') || rawMessage.includes('login')) {
    return 'Please log in to continue.';
  }

  if (code === 'unavailable' || rawMessage.includes('network') || rawMessage.includes('offline')) {
    return 'Network issue detected. Please check your connection and try again.';
  }

  if (code === 'deadline-exceeded' || rawMessage.includes('timeout')) {
    return 'The request took too long. Please try again in a moment.';
  }

  // Default safe message (never show raw Firebase error)
  return fallback;
};

