/**
 * AdminOverridePanel — lets admins manually set a place's busy level
 *
 * LEARNING POINT: Visual Differentiation for Admin Controls
 *
 * Admin panels need to feel distinct from regular user UI so admins
 * know they're using elevated privileges. Techniques used here:
 *
 * 1. Dashed border — universally signals "special/different" in UI
 * 2. Accent-50 background tint — warm but clearly distinct from white cards
 * 3. Shield emoji (🛡️) — instant "admin mode" recognition
 *
 * The BusyLevel-to-percentage mapping (1→0%, 2→50%, 3→100%) matches
 * the Cloud Function's LEVEL_TO_PERCENT config.
 */

import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { AdminOverride, BusyLevel } from '@/types';
import { LEVEL_TO_PERCENT } from '@/constants/config';
import {
    COLORS,
    FONTS,
    FONT_SIZES,
    SPACING,
    RADIUS,
    SHADOWS,
    SEMANTIC_COLORS,
} from '@/constants/theme';

const BUSY_LEVELS: {
    level: BusyLevel;
    emoji: string;
    label: string;
    bgColor: string;
    textColor: string;
}[] = [
    {
        level: 1,
        emoji: '😴',
        label: 'Not Busy',
        bgColor: COLORS.status.greenLight,
        textColor: COLORS.status.green,
    },
    {
        level: 2,
        emoji: '🙂',
        label: 'Moderate',
        bgColor: COLORS.accent[100],
        textColor: COLORS.accent[700],
    },
    {
        level: 3,
        emoji: '🤬',
        label: 'Very Busy',
        bgColor: COLORS.status.redLight,
        textColor: COLORS.status.red,
    },
];

interface AdminOverridePanelProps {
    placeId: string;
    currentOverride: AdminOverride | null;
    onApply: (placeId: string, busyPercent: number) => Promise<void>;
    onRemove: (placeId: string) => Promise<void>;
}

export function AdminOverridePanel({ placeId, currentOverride, onApply, onRemove }: AdminOverridePanelProps) {
    const [isApplying, setIsApplying] = useState(false);
    const [isRemoving, setIsRemoving] = useState(false);
    const isBusy = isApplying || isRemoving;

    const isOverrideActive = currentOverride?.active === true;

    const handleSelect = async (level: BusyLevel) => {
        const percent = LEVEL_TO_PERCENT[level];
        setIsApplying(true);
        try {
            await onApply(placeId, percent);
        } catch (err) {
            console.error('Failed to set override:', err);
            Alert.alert('Error', 'Failed to apply override. Check your permissions.');
        } finally {
            setIsApplying(false);
        }
    };

    const handleRemove = async () => {
        setIsRemoving(true);
        try {
            await onRemove(placeId);
        } catch (err) {
            console.error('Failed to remove override:', err);
            Alert.alert('Error', 'Failed to remove override.');
        } finally {
            setIsRemoving(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Header with shield emoji */}
            <View style={styles.header}>
                <Text style={styles.title}>🛡️ Admin Override</Text>
                {isOverrideActive && (
                    <View style={styles.activeBadge}>
                        <Text style={styles.activeBadgeText}>Active</Text>
                    </View>
                )}
            </View>

            <Text style={styles.prompt}>Set busy level:</Text>

            {/* Emoji buttons — same as check-in UI */}
            <View style={styles.emojiRow}>
                {BUSY_LEVELS.map(({ level, emoji, label, bgColor, textColor }) => {
                    const isCurrentLevel = isOverrideActive
                        && currentOverride.busyPercent === LEVEL_TO_PERCENT[level];

                    return (
                        <Pressable
                            key={level}
                            style={[
                                styles.emojiButton,
                                { backgroundColor: bgColor },
                                isCurrentLevel && styles.emojiButtonActive,
                                isBusy && styles.disabled,
                            ]}
                            onPress={() => handleSelect(level)}
                            disabled={isBusy}
                            accessibilityLabel={`Override as ${label}`}
                            accessibilityRole="button"
                        >
                            <Text style={styles.emoji}>{emoji}</Text>
                            <Text style={[styles.emojiLabel, { color: textColor }]}>
                                {label}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>

            {/* Loading indicator */}
            {isApplying && (
                <View style={styles.loadingRow}>
                    <ActivityIndicator size="small" color={COLORS.primary[500]} />
                    <Text style={styles.loadingText}>Applying...</Text>
                </View>
            )}

            {/* Remove override button */}
            {isOverrideActive && (
                <Pressable
                    style={[styles.removeButton, isBusy && styles.disabled]}
                    onPress={handleRemove}
                    disabled={isBusy}
                    accessibilityRole="button"
                    accessibilityLabel="Remove busy level override"
                >
                    {isRemoving ? (
                        <ActivityIndicator size="small" color={COLORS.status.red} />
                    ) : (
                        <Text style={styles.removeButtonText}>Remove Override</Text>
                    )}
                </Pressable>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        margin: SPACING[4],
        padding: SPACING[5],
        backgroundColor: COLORS.accent[50],
        borderRadius: RADIUS.xl,
        borderWidth: 1.5,
        borderColor: COLORS.accent[300],
        borderStyle: 'dashed',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: SPACING[3],
    },
    title: {
        fontSize: FONT_SIZES.lg,
        fontFamily: FONTS.display.bold,
        color: SEMANTIC_COLORS.text.primary,
    },
    activeBadge: {
        backgroundColor: COLORS.status.greenLight,
        paddingHorizontal: SPACING[2],
        paddingVertical: SPACING[1],
        borderRadius: RADIUS.full,
    },
    activeBadgeText: {
        fontSize: FONT_SIZES.xs,
        fontFamily: FONTS.body.bold,
        color: COLORS.status.green,
    },
    prompt: {
        fontSize: FONT_SIZES.md,
        fontFamily: FONTS.body.semiBold,
        color: SEMANTIC_COLORS.text.secondary,
        marginBottom: SPACING[3],
    },
    emojiRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        gap: SPACING[2],
        marginBottom: SPACING[3],
    },
    emojiButton: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: SPACING[3],
        paddingHorizontal: SPACING[2],
        borderRadius: RADIUS.lg,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    emojiButtonActive: {
        borderColor: COLORS.primary[500],
    },
    emoji: {
        fontSize: 36,
        marginBottom: SPACING[1],
    },
    emojiLabel: {
        fontSize: FONT_SIZES.sm,
        fontFamily: FONTS.body.semiBold,
    },
    loadingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING[2],
        marginBottom: SPACING[3],
    },
    loadingText: {
        fontSize: FONT_SIZES.sm,
        fontFamily: FONTS.body.regular,
        color: SEMANTIC_COLORS.text.tertiary,
    },
    removeButton: {
        paddingVertical: SPACING[3],
        borderRadius: RADIUS.lg,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.status.redLight,
        minHeight: 48,
    },
    removeButtonText: {
        color: COLORS.status.red,
        fontFamily: FONTS.body.bold,
        fontSize: FONT_SIZES.md,
    },
    disabled: {
        opacity: 0.6,
    },
});
