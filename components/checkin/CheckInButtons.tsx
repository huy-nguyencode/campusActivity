import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import * as Haptics from 'expo-haptics';
import { BusyLevel } from '@/types';

/**
 * LEARNING POINT: Defining Data Outside the Component
 *
 * Constants that don't change should be defined outside the component.
 * This prevents them from being recreated on every render, which:
 * 1. Saves memory - only one array exists in memory
 * 2. Enables referential equality - React can skip re-renders
 * 3. Makes the code cleaner - separates data from logic
 */
const BUSY_LEVELS: { level: BusyLevel; emoji: string; label: string }[] = [
    { level: 1, emoji: '😴', label: 'Not Busy' },
    { level: 2, emoji: '🙂', label: 'Moderate' },
    { level: 3, emoji: '🤬', label: 'Very Busy' },
];

/**
 * LEARNING POINT: Props Interface Design
 *
 * Good props interfaces are:
 * 1. Minimal - only what the component needs
 * 2. Clear - descriptive names (onCheckIn vs onClick)
 * 3. Optional where sensible - isLoading defaults to false
 *
 * The component doesn't need to know WHY it's disabled, just IF it is.
 * This keeps the component focused and reusable.
 */
interface CheckInButtonsProps {
    /** Called when user selects a busyness level */
    onCheckIn: (level: BusyLevel) => void;
    /** Prevents all button interactions */
    disabled?: boolean;
    /** Shows loading overlay during submission */
    isLoading?: boolean;
}

/**
 * CheckInButtons - Three emoji buttons for rating busyness
 *
 * LEARNING POINT: Single Responsibility Principle
 *
 * This component does ONE thing: render busyness selection buttons.
 * It doesn't know about:
 * - Where the data comes from (hooks, services)
 * - What happens after selection (navigation, API calls)
 * - Why it might be disabled (cooldown, distance, accuracy)
 *
 * This makes it highly reusable and easy to test.
 */
export function CheckInButtons({ onCheckIn, disabled = false, isLoading = false }: CheckInButtonsProps) {
    /**
     * LEARNING POINT: Handling User Interactions
     *
     * Always consider the user experience:
     * 1. Haptic feedback - tactile response confirms the tap registered
     * 2. Loading states - visual feedback that something is happening
     * 3. Disabled states - clear indication when action isn't available
     */
    const handlePress = async (level: BusyLevel) => {
        // Provide immediate tactile feedback
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onCheckIn(level);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.promptText}>How busy is it?</Text>
            <View style={styles.emojiRow}>
                {BUSY_LEVELS.map(({ level, emoji, label }) => (
                    <Pressable
                        key={level}
                        style={({ pressed }) => [
                            styles.emojiButton,
                            disabled && styles.emojiButtonDisabled,
                            pressed && !disabled && styles.emojiButtonPressed,
                        ]}
                        onPress={() => handlePress(level)}
                        disabled={disabled || isLoading}
                        /**
                         * LEARNING POINT: Accessibility
                         *
                         * accessibilityLabel - read by screen readers
                         * accessibilityRole - tells assistive tech how to treat the element
                         * accessibilityState - communicates current state to users
                         *
                         * Always make your apps usable by everyone.
                         */
                        accessibilityLabel={`Rate as ${label}`}
                        accessibilityRole="button"
                        accessibilityState={{ disabled }}
                    >
                        <Text style={styles.emoji}>{emoji}</Text>
                        <Text style={[styles.emojiLabel, disabled && styles.emojiLabelDisabled]}>
                            {label}
                        </Text>
                    </Pressable>
                ))}
            </View>

            {/* Loading overlay */}
            {isLoading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="small" color="#007AFF" />
                </View>
            )}
        </View>
    );
}

/**
 * LEARNING POINT: StyleSheet.create Benefits
 *
 * 1. Performance - styles are processed once, not on every render
 * 2. Validation - catches invalid style properties in development
 * 3. Optimization - React Native can optimize style application
 *
 * Co-locating styles with components keeps everything self-contained.
 */
const styles = StyleSheet.create({
    container: {
        padding: 20,
    },
    promptText: {
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 20,
        color: '#1F2937',
    },
    emojiRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    emojiButton: {
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
        minWidth: 100,
    },
    emojiButtonPressed: {
        backgroundColor: '#E5E7EB',
        transform: [{ scale: 0.95 }],
    },
    emojiButtonDisabled: {
        opacity: 0.5,
    },
    emoji: {
        fontSize: 48,
        marginBottom: 8,
    },
    emojiLabel: {
        fontSize: 14,
        color: '#374151',
        fontWeight: '500',
    },
    emojiLabelDisabled: {
        color: '#9CA3AF',
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
    },
});
