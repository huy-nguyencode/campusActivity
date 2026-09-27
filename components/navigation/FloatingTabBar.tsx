/**
 * Custom floating pill tab bar — reworked tab bar that sits as a rounded pill
 * above the bottom safe area with horizontal margin for an edge-to-edge content feel.
 */
import type { ComponentProps } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { CommonActions } from 'expo-router/react-navigation';
import {
    COLORS,
    FONTS,
    FONT_SIZES,
    SPACING,
    RADIUS,
    SHADOWS,
    SEMANTIC_COLORS,
} from '@/constants/theme';

type FloatingTabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

const TAB_ICON_SIZE = 24;
const PILL_HORIZONTAL_MARGIN = 24;
const PILL_VERTICAL_MARGIN = 12;

export function FloatingTabBar({
    state,
    descriptors,
    navigation,
    insets,
}: FloatingTabBarProps) {
    const routes = state.routes;

    return (
        <View
            style={[
                styles.wrapper,
                {
                    paddingBottom: insets.bottom + PILL_VERTICAL_MARGIN,
                    paddingLeft: Math.max(insets.left, PILL_HORIZONTAL_MARGIN),
                    paddingRight: Math.max(insets.right, PILL_HORIZONTAL_MARGIN),
                },
            ]}
            pointerEvents="box-none"
        >
            <View style={styles.pill}>
                {routes.map((route, index) => {
                    const focused = index === state.index;
                    const { options } = descriptors[route.key];

                    const onPress = () => {
                        const event = navigation.emit({
                            type: 'tabPress',
                            target: route.key,
                            canPreventDefault: true,
                        });
                        if (!focused && !event.defaultPrevented) {
                            navigation.dispatch({
                                ...CommonActions.navigate(route),
                                target: state.key,
                            });
                        }
                    };

                    const label =
                        options.tabBarLabel !== undefined
                            ? options.tabBarLabel
                            : options.title ?? route.name;
                    const labelString =
                        typeof label === 'string' ? label : route.name;

                    const color = focused
                        ? (options.tabBarActiveTintColor ?? COLORS.primary[500])
                        : (options.tabBarInactiveTintColor ?? COLORS.neutral[400]);

                    const IconComponent = options.tabBarIcon;
                    const icon =
                        IconComponent != null ? (
                            <IconComponent
                                focused={focused}
                                color={color}
                                size={TAB_ICON_SIZE}
                            />
                        ) : null;

                    return (
                        <Pressable
                            key={route.key}
                            onPress={onPress}
                            style={({ pressed }) => [
                                styles.tab,
                                focused && styles.tabActive,
                                pressed && styles.tabPressed,
                            ]}
                            accessibilityRole="button"
                            accessibilityState={{ selected: focused }}
                            accessibilityLabel={labelString}
                        >
                            <View style={styles.iconWrap}>{icon}</View>
                            <Text
                                style={[
                                    styles.label,
                                    { color },
                                    focused && styles.labelActive,
                                ]}
                                numberOfLines={1}
                            >
                                {labelString}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'center',
    },
    pill: {
        flexDirection: 'row',
        backgroundColor: SEMANTIC_COLORS.background.card,
        borderRadius: RADIUS.full,
        paddingVertical: SPACING[2],
        paddingHorizontal: SPACING[1],
        minHeight: 56,
        alignItems: 'center',
        justifyContent: 'center',
        ...SHADOWS.lg,
        ...(Platform.OS === 'android' && { elevation: 6 }),
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING[2],
        paddingVertical: SPACING[2],
        paddingHorizontal: SPACING[4],
        borderRadius: RADIUS.xl,
    },
    tabActive: {
        backgroundColor: COLORS.primary[50],
    },
    tabPressed: {
        opacity: 0.85,
    },
    iconWrap: {
        width: TAB_ICON_SIZE,
        height: TAB_ICON_SIZE,
        alignItems: 'center',
        justifyContent: 'center',
    },
    label: {
        fontSize: FONT_SIZES.sm,
        fontFamily: FONTS.body.semiBold,
        maxWidth: 100,
    },
    labelActive: {
        fontFamily: FONTS.body.bold,
    },
});
