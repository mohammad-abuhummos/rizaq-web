import React from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TextStyle,
    TouchableOpacity,
    ViewStyle,
} from 'react-native';

export interface ButtonProps {
    onPress: () => void;
    label: string;
    variant?: 'primary' | 'secondary' | 'outline';
    size?: 'small' | 'medium' | 'large';
    disabled?: boolean;
    loading?: boolean;
    style?: ViewStyle;
    textStyle?: TextStyle;
    icon?: React.ReactNode;
}

const styles = StyleSheet.create({
    button: {
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
        flexDirection: 'row',
        gap: 8,
    },
    text: {
        fontWeight: '600',
    },
    // Variants
    primary: {
        backgroundColor: '#1b6b2f',
    },
    secondary: {
        backgroundColor: '#e0e0e0',
    },
    outline: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: '#1b6b2f',
    },
    primaryText: {
        color: '#fff',
    },
    secondaryText: {
        color: '#333',
    },
    outlineText: {
        color: '#1b6b2f',
    },
    // Sizes
    small: {
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    medium: {
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    large: {
        paddingVertical: 16,
        paddingHorizontal: 24,
    },
    smallText: {
        fontSize: 12,
    },
    mediumText: {
        fontSize: 14,
    },
    largeText: {
        fontSize: 16,
    },
    disabled: {
        opacity: 0.5,
    },
});

export const Button = ({
    onPress,
    label,
    variant = 'primary',
    size = 'medium',
    disabled = false,
    loading = false,
    style,
    textStyle,
    icon,
}: ButtonProps) => {
    const variantStyles = {
        primary: [styles.primary, styles.primaryText],
        secondary: [styles.secondary, styles.secondaryText],
        outline: [styles.outline, styles.outlineText],
    };

    const sizeStyles = {
        small: [styles.small, styles.smallText],
        medium: [styles.medium, styles.mediumText],
        large: [styles.large, styles.largeText],
    };

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled || loading}
            style={[
                styles.button,
                variantStyles[variant][0],
                sizeStyles[size][0],
                disabled && styles.disabled,
                style,
            ]}
            activeOpacity={0.7}>
            {loading ? (
                <ActivityIndicator color={variant === 'primary' ? '#fff' : '#333'} />
            ) : (
                <>
                    {icon}
                    <Text
                        style={[
                            styles.text,
                            variantStyles[variant][1],
                            sizeStyles[size][1],
                            textStyle,
                        ]}>
                        {label}
                    </Text>
                </>
            )}
        </TouchableOpacity>
    );
};
