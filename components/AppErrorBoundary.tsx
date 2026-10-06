import React, { Component, type ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, FONTS, FONT_SIZES, SPACING, RADIUS } from '@/constants/theme-tokens';

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
