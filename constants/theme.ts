/**
 * LEARNING POINT: Design Tokens — "Cherry" Theme
 *
 * Design tokens are the atomic values of your design system.
 * They centralize visual decisions (colors, spacing, typography)
 * so the entire app stays consistent. Benefits:
 *
 * 1. Single source of truth - change once, update everywhere
 * 2. Semantic naming - 'primary[500]' is clearer than '#C41E3A'
 * 3. Theme support - swap tokens for a different personality
 * 4. Design handoff - designers and devs speak the same language
 *
 * This "Cherry" theme uses cherry red + warm whites/creams for a
 * warm, organic, playful-yet-refined aesthetic. Cards float on
 * cherry-tinted shadows ("pink cushions") and status indicators
 * use cherry emoji where appropriate.
 */

// =============================================================================
// COLOR PALETTE
// =============================================================================

/**
 * LEARNING POINT: Color Naming Conventions
 *
 * Using a numerical scale (50-900) like Tailwind CSS allows for:
 * - Predictable lightness progression
 * - Easy generation of tints/shades
 * - Consistent color relationships across palettes
 *
 * 500 is the "base" color, lower numbers are lighter, higher are darker.
 */
export const COLORS = {
    // Primary — Cherry Red (warm, distinctive, playful-yet-refined)
    primary: {
        50: '#FFF5F6',
        100: '#FFE0E4',
        200: '#FFC1C9',
        300: '#FF97A4',
        400: '#E8425A',
        500: '#C41E3A', // Signature cherry
        600: '#A81832',
        700: '#8C1229',
        800: '#700E21',
        900: '#580A19',
    },

    /**
     * LEARNING POINT: Complementary Color Theory
     *
     * A warm teal secondary complements cherry red — they sit on
     * opposite sides of the color wheel, creating vibrant contrast
     * without clashing. Teal adds coolness to balance the warm reds.
     */
    // Secondary — Warm Teal (complement to cherry, for links/CTAs)
    secondary: {
        50: '#F0FDFB',
        100: '#CCFBF1',
        200: '#99F6E4',
        300: '#5EEAD4',
        400: '#2DD4BF',
        500: '#14B8A6', // Warm teal
        600: '#0D9488',
        700: '#0F766E',
        800: '#115E59',
        900: '#134E4A',
    },

    // Accent — Warm Gold (highlights, badges, timers)
    accent: {
        50: '#FFFBEB',
        100: '#FEF3C7',
        200: '#FDE68A',
        300: '#FCD34D',
        400: '#FBBF24',
        500: '#F59E0B', // Warm gold
        600: '#D97706',
        700: '#B45309',
        800: '#92400E',
        900: '#78350F',
    },

    // Semantic status colors (for busy indicators — stay true to universal meaning)
    status: {
        green: '#10B981',     // Not busy — Emerald
        greenLight: '#D1FAE5',
        yellow: '#F59E0B',    // Moderate — Amber
        yellowLight: '#FEF3C7',
        red: '#EF4444',       // Busy — Red
        redLight: '#FEE2E2',
    },

    /**
     * LEARNING POINT: Warm-Tinted Neutrals
     *
     * Instead of pure gray (#F5F5F5), using stone-undertone neutrals
     * (#FAFAF9, #F5F3F1) makes the entire UI feel warmer. The slight
     * yellow/brown tint is barely perceptible on its own but transforms
     * the overall feel when used consistently across backgrounds,
     * borders, and text colors.
     */
    // Neutrals — warm stone undertone
    neutral: {
        0: '#FFFFFF',
        50: '#FAFAF9',
        100: '#F5F3F1',
        200: '#E7E5E4',
        300: '#D6D3D1',
        400: '#A8A29E',
        500: '#78716C',
        600: '#57534E',
        700: '#44403C',
        800: '#292524',
        900: '#1C1917',
    },
} as const;

// =============================================================================
// SEMANTIC COLORS (for specific use cases)
// =============================================================================

export const SEMANTIC_COLORS = {
    // Backgrounds
    background: {
        primary: COLORS.neutral[50],   // Main background (#FAFAF9)
        warm: '#FFF5F6',               // Cherry-cream tint for welcome/special sections
        card: COLORS.neutral[0],       // Cards (#FFFFFF)
        overlay: 'rgba(0, 0, 0, 0.5)', // Modal overlays
    },

    // Text
    text: {
        primary: COLORS.neutral[900],   // #1C1917 — headings, important text
        secondary: COLORS.neutral[600], // #57534E — body text
        tertiary: COLORS.neutral[400],  // #A8A29E — hints, placeholders
        inverse: COLORS.neutral[0],     // #FFFFFF — text on dark backgrounds
    },

    // Interactive
    interactive: {
        primary: COLORS.primary[500],
        primaryHover: COLORS.primary[600],
        primaryPressed: COLORS.primary[700],
        secondary: COLORS.secondary[500],
        secondaryHover: COLORS.secondary[600],
        disabled: COLORS.neutral[300],
    },

    // Borders
    border: {
        light: COLORS.neutral[200],
        default: COLORS.neutral[300],
        focus: COLORS.primary[500],
    },
} as const;

// =============================================================================
// TYPOGRAPHY
// =============================================================================

/**
 * LEARNING POINT: Font Pairing — Geometric Display + Organic Body
 *
 * Outfit (display) — geometric, modern, with playful roundness in its
 * letter shapes. Great for headings where you want personality.
 *
 * Figtree (body) — warm, friendly, organic curves with excellent
 * readability at small sizes. Its slightly wider x-height makes it
 * comfortable to read in paragraphs.
 *
 * This pairing creates contrast (geometric vs organic) while sharing
 * warmth — they complement rather than compete with each other.
 */
export const FONTS = {
    // Display font — Outfit (geometric, modern, playful roundness)
    display: {
        medium: 'Outfit_500Medium',
        semiBold: 'Outfit_600SemiBold',
        bold: 'Outfit_700Bold',
    },

    // Body font — Figtree (warm, friendly, organic, excellent readability)
    body: {
        regular: 'Figtree_400Regular',
        semiBold: 'Figtree_600SemiBold',
        bold: 'Figtree_700Bold',
    },
} as const;

/**
 * LEARNING POINT: Type Scale
 *
 * A consistent type scale creates visual hierarchy.
 * Each step should feel noticeably different from the previous.
 * Common ratios: 1.125 (minor second), 1.25 (major third), 1.333 (perfect fourth)
 */
export const FONT_SIZES = {
    xs: 12,
    sm: 14,
    md: 16,   // Base size
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
} as const;

export const LINE_HEIGHTS = {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
} as const;

// =============================================================================
// SPACING
// =============================================================================

/**
 * LEARNING POINT: Spacing Scale
 *
 * Consistent spacing creates visual rhythm. Using a base unit (4px)
 * with multipliers ensures harmony. Common approach: 4, 8, 12, 16, 20, 24, 32...
 */
export const SPACING = {
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    8: 32,
    10: 40,
    12: 48,
    16: 64,
} as const;

// =============================================================================
// BORDER RADIUS
// =============================================================================

/**
 * LEARNING POINT: Rounded Corners for Playful Feel
 *
 * Larger border radii create a friendlier, more approachable UI.
 * The "playful" aesthetic uses generous rounding.
 */
export const RADIUS = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    full: 9999, // For pill shapes and circles
} as const;

// =============================================================================
// SHADOWS
// =============================================================================

/**
 * LEARNING POINT: Cross-Platform Shadows
 *
 * iOS uses shadow* properties (Core Animation).
 * Android uses elevation (Material Design).
 * We need both for consistent shadow rendering.
 */
export const SHADOWS = {
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
        elevation: 5,
    },
    // Cherry-colored glow for primary buttons
    primaryGlow: {
        shadowColor: COLORS.primary[500],
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    /**
     * LEARNING POINT: Cherry-Tinted Warm Shadows
     *
     * Instead of black shadows, using a cherry-tinted shadow (primary[200])
     * creates a "pink cushion" effect — cards look like they're floating on
     * soft cherry-colored pillows. This is the signature visual detail of
     * the Cherry theme. The warm tint makes shadows feel like part of the
     * color story rather than just depth indicators.
     *
     * The softer spread (shadowRadius: 12) and moderate opacity (0.30)
     * keep it refined rather than garish.
     */
    warm: {
        shadowColor: COLORS.primary[200],
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.30,
        shadowRadius: 12,
        elevation: 3,
    },
} as const;

// =============================================================================
// ANIMATION
// =============================================================================

/**
 * LEARNING POINT: Soft Spring Animations
 *
 * The Cherry theme uses softer, more damped springs compared to a
 * snappier UI. Higher damping (20 vs 15) reduces bounce/overshoot.
 * Lower stiffness (120 vs 150) makes the spring settle more gently.
 * Combined with a larger press scale (0.97 vs 0.95), interactions
 * feel gentle and refined — a soft "press into a cushion" rather
 * than a snappy mechanical click.
 *
 * Duration values are also slightly longer (200/350/500 vs 150/250/350)
 * to give transitions a more graceful, unhurried feel.
 */
export const ANIMATION = {
    duration: {
        fast: 200,
        normal: 350,
        slow: 500,
    },
    // Softer spring config — high damping, lower stiffness
    spring: {
        damping: 20,
        stiffness: 120,
        mass: 1,
    },
    // Gentler press scale — barely perceptible but tactile
    pressScale: 0.97,
} as const;

// =============================================================================
// COMPONENT-SPECIFIC TOKENS
// =============================================================================

/**
 * LEARNING POINT: Component Tokens
 *
 * Higher-level tokens that combine primitives for specific components.
 * This creates consistency across component variants.
 */
export const COMPONENT_TOKENS = {
    // Button sizes
    button: {
        sm: {
            paddingVertical: SPACING[2],
            paddingHorizontal: SPACING[4],
            fontSize: FONT_SIZES.sm,
            borderRadius: RADIUS.md,
        },
        md: {
            paddingVertical: SPACING[3],
            paddingHorizontal: SPACING[5],
            fontSize: FONT_SIZES.md,
            borderRadius: RADIUS.lg,
        },
        lg: {
            paddingVertical: SPACING[4],
            paddingHorizontal: SPACING[6],
            fontSize: FONT_SIZES.lg,
            borderRadius: RADIUS.xl,
        },
    },

    // Card variants
    card: {
        default: {
            backgroundColor: SEMANTIC_COLORS.background.card,
            borderRadius: RADIUS.lg,
            padding: SPACING[4],
            ...SHADOWS.md,
        },
    },

    // Input fields
    input: {
        borderRadius: RADIUS.md,
        paddingVertical: SPACING[3],
        paddingHorizontal: SPACING[4],
        borderWidth: 1,
        borderColor: SEMANTIC_COLORS.border.light,
        fontSize: FONT_SIZES.md,
    },
} as const;

// =============================================================================
// BUSY LEVEL COLORS (Legacy support for existing config)
// =============================================================================

export const BUSY_COLORS = {
    GREEN: COLORS.status.green,
    YELLOW: COLORS.status.yellow,
    RED: COLORS.status.red,
} as const;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export function getBusyStatusColor(percent: number): string {
    if (percent < 30) return COLORS.status.green;
    if (percent < 60) return COLORS.status.yellow;
    return COLORS.status.red;
}

export function getBusyStatus(percent: number): { color: string; label: string; lightBg: string; emoji: string } {
    if (percent < 30) {
        return {
            color: COLORS.status.green,
            label: 'Not Busy',
            lightBg: COLORS.status.greenLight,
            emoji: '😴',
        };
    }
    if (percent < 60) {
        return {
            color: COLORS.status.yellow,
            label: 'Moderate',
            lightBg: COLORS.status.yellowLight,
            emoji: '🙂',
        };
    }
    return {
        color: COLORS.status.red,
        label: 'Busy',
        lightBg: COLORS.status.redLight,
        emoji: '🤬',
    };
}
