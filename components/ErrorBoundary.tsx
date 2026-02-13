/**
 * LEARNING POINT: Error Boundaries Must Be Class Components
 *
 * React's error boundary API (componentDidCatch, getDerivedStateFromError)
 * is only available on class components — there's no hook equivalent.
 * This is one of the few cases where class components are still necessary.
 *
 * An error boundary catches JavaScript errors anywhere in its child
 * component tree, logs them, and renders a fallback UI instead of
 * crashing the entire app.
 *
 * What it DOES catch: rendering errors, lifecycle errors, hook errors.
 * What it DOES NOT catch: event handlers, async code (setTimeout/promises),
 * or errors in the error boundary itself.
 */
import React, { Component, type ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, FONTS, FONT_SIZES, SPACING, RADIUS } from '@/constants/theme';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(): State {
        return { hasError: true };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        // This is where you'd send to Sentry or a logging service
        console.error('ErrorBoundary caught:', error, info.componentStack);
    }

    private handleRetry = () => {
        this.setState({ hasError: false });
    };

    render() {
        if (this.state.hasError) {
            return (
                <View style={styles.container}>
                    <Text style={styles.title}>Something went wrong</Text>
                    <Text style={styles.subtitle}>
                        The app ran into an unexpected error.
                    </Text>
                    <TouchableOpacity
                        style={styles.button}
                        onPress={this.handleRetry}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.buttonText}>Try Again</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.neutral[50],
        padding: SPACING[5],
    },
    title: {
        fontFamily: FONTS.display.semiBold,
        fontSize: FONT_SIZES['2xl'],
        color: COLORS.neutral[900],
        marginBottom: SPACING[3],
    },
    subtitle: {
        fontFamily: FONTS.body.regular,
        fontSize: FONT_SIZES.md,
        color: COLORS.neutral[500],
        textAlign: 'center',
        marginBottom: SPACING[6],
    },
    button: {
        backgroundColor: COLORS.primary[500],
        paddingVertical: SPACING[4],
        paddingHorizontal: SPACING[6],
        borderRadius: RADIUS.lg,
    },
    buttonText: {
        fontFamily: FONTS.body.semiBold,
        fontSize: FONT_SIZES.md,
        color: COLORS.neutral[0],
    },
});
