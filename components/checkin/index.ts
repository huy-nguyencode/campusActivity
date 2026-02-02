/**
 * LEARNING POINT: Barrel Exports (index.ts)
 *
 * A barrel file re-exports all components from a directory.
 * This simplifies imports throughout your app:
 *
 * Without barrel:
 *   import { CheckInButtons } from '@/components/checkin/CheckInButtons';
 *   import { CooldownTimer } from '@/components/checkin/CooldownTimer';
 *
 * With barrel:
 *   import { CheckInButtons, CooldownTimer } from '@/components/checkin';
 *
 * Benefits:
 * 1. Cleaner imports - one line instead of many
 * 2. Encapsulation - internal file structure can change
 * 3. Discoverability - easy to see what a directory exports
 *
 * Drawback:
 * - Can impact tree-shaking in some bundlers (less of an issue with modern tools)
 */
export { CheckInButtons } from './CheckInButtons';
export { CooldownTimer } from './CooldownTimer';
export { StaleIndicator } from './StaleIndicator';
