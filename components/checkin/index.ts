/**
 * LEARNING POINT: Barrel Exports (index.ts)
 *
 * A barrel file re-exports all components from a directory.
 * This simplifies imports throughout your app:
 *
 * Without barrel:
 *   import { CrowdLevelButtons } from '@/components/checkin/CrowdLevelButtons';
 *   import { CooldownTimer } from '@/components/checkin/CooldownTimer';
 *
 * With barrel:
 *   import { CrowdLevelButtons, CooldownTimer } from '@/components/checkin';
 *
 * Benefits:
 * 1. Cleaner imports - one line instead of many
 * 2. Encapsulation - internal file structure can change
 * 3. Discoverability - easy to see what a directory exports
 *
 * Drawback:
 * - Can impact tree-shaking in some bundlers (less of an issue with modern tools)
 */
export { CrowdLevelButtons } from './CrowdLevelButtons';
export { CooldownTimer } from './CooldownTimer';
export { StaleCrowdIndicator } from './StaleCrowdIndicator';
