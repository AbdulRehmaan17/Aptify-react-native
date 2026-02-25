import { colors as baseColors } from './index';

/**
 * Typed re-export of global color tokens.
 * Keeps a single source of truth in `src/theme/index.ts`.
 */

export const colors = baseColors;
export type Colors = typeof colors;
