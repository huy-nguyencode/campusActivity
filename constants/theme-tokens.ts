import { CONFIG } from '@/constants/app-config';

// =============================================================================
// COLOR PALETTE
// =============================================================================

export const COLORS = {
    primary: {
        50: '#FFF5F6',
        100: '#FFE0E4',
        200: '#FFC1C9',
        300: '#FF97A4',
        400: '#E8425A',
        500: '#C41E3A',
        600: '#A81832',
        700: '#8C1229',
        800: '#700E21',
        900: '#580A19',
    },
    secondary: {
        50: '#F0FDFB',
        100: '#CCFBF1',
        200: '#99F6E4',
        300: '#5EEAD4',
        400: '#2DD4BF',
        500: '#14B8A6',
        600: '#0D9488',
        700: '#0F766E',
        800: '#115E59',
        900: '#134E4A',
    },
    accent: {
        50: '#FFFBEB',
        100: '#FEF3C7',
        200: '#FDE68A',
        300: '#FCD34D',
        400: '#FBBF24',
        500: '#F59E0B',
        600: '#D97706',
        700: '#B45309',
        800: '#92400E',
        900: '#78350F',
    },
    status: {
        green: '#10B981',
        greenLight: '#D1FAE5',
        yellow: '#F59E0B',
        yellowLight: '#FEF3C7',
        red: '#EF4444',
        redLight: '#FEE2E2',
    },
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
// SEMANTIC COLORS
// =============================================================================

export const SEMANTIC_COLORS = {
    background: {
        primary: COLORS.neutral[50],
        warm: '#FFF5F6',
        card: COLORS.neutral[0],
        overlay: 'rgba(0, 0, 0, 0.5)',
    },
    text: {
        primary: COLORS.neutral[900],
        secondary: COLORS.neutral[600],
        tertiary: COLORS.neutral[400],
        inverse: COLORS.neutral[0],
    },
    interactive: {
        primary: COLORS.primary[500],
        primaryHover: COLORS.primary[600],
        primaryPressed: COLORS.primary[700],
        secondary: COLORS.secondary[500],
        secondaryHover: COLORS.secondary[600],
        disabled: COLORS.neutral[300],
    },
    border: {
        light: COLORS.neutral[200],
        default: COLORS.neutral[300],
        focus: COLORS.primary[500],
    },
} as const;

// =============================================================================
// TYPOGRAPHY
// =============================================================================

export const FONTS = {
    display: {
        medium: 'Outfit_500Medium',
        semiBold: 'Outfit_600SemiBold',
        bold: 'Outfit_700Bold',
    },
    body: {
        regular: 'Figtree_400Regular',
        semiBold: 'Figtree_600SemiBold',
        bold: 'Figtree_700Bold',
    },
} as const;

export const FONT_SIZES = {
    xs: 12,
    sm: 14,
    md: 16,
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

export const RADIUS = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    full: 9999,
} as const;

// =============================================================================
// SHADOWS
// =============================================================================

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
    primaryGlow: {
        shadowColor: COLORS.primary[500],
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
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

export const ANIMATION = {
    duration: {
        fast: 200,
        normal: 350,
        slow: 500,
    },
    spring: {
        damping: 20,
        stiffness: 120,
        mass: 1,
    },
    pressScale: 0.97,
} as const;

// =============================================================================
// COMPONENT TOKENS
// =============================================================================

export const COMPONENT_TOKENS = {
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
    card: {
        default: {
            backgroundColor: SEMANTIC_COLORS.background.card,
            borderRadius: RADIUS.lg,
            padding: SPACING[4],
            ...SHADOWS.md,
        },
    },
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
// BUSY LEVEL COLORS
// =============================================================================

export const BUSY_COLORS = {
    GREEN: COLORS.status.green,
    YELLOW: COLORS.status.yellow,
    RED: COLORS.status.red,
} as const;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export function getBusyColor(percent: number): 'green' | 'yellow' | 'red' {
    if (percent <= CONFIG.BUSY_THRESHOLDS.GREEN) return 'green';
    if (percent <= CONFIG.BUSY_THRESHOLDS.YELLOW) return 'yellow';
    return 'red';
}

export function getBusyStatusColor(percent: number): string {
    const busyColor = getBusyColor(percent);
    if (busyColor === 'green') return COLORS.status.green;
    if (busyColor === 'yellow') return COLORS.status.yellow;
    return COLORS.status.red;
}

export function getBusyStatus(percent: number): { color: string; label: string; lightBg: string; emoji: string } {
    const busyColor = getBusyColor(percent);

    if (busyColor === 'green') {
        return {
            color: COLORS.status.green,
            label: 'Not Busy',
            lightBg: COLORS.status.greenLight,
            emoji: '😴',
        };
    }
    if (busyColor === 'yellow') {
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
