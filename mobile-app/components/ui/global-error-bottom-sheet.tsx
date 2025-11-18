import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Animated,
    Easing,
    Platform,
    Pressable,
    StyleSheet,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { ApiErrorEvent, subscribeApiErrors } from '@/utils/api-error-events';

const AUTO_DISMISS_MS = 6000;
const HIDDEN_POSITION = 420;

function extractDetailFromResponse(event?: ApiErrorEvent) {
    if (!event?.response || typeof event.response !== 'object') return undefined;
    const payload = event.response as Record<string, unknown>;

    const errorField = payload?.error;
    if (typeof errorField === 'string') {
        return errorField;
    }
    if (errorField && typeof errorField === 'object') {
        const errorObject = errorField as Record<string, unknown>;
        const detail = errorObject.detail ?? errorObject.message ?? errorObject.title;
        if (typeof detail === 'string' && detail.trim().length) {
            return detail;
        }
    }

    const dataField = payload?.data;
    if (typeof dataField === 'string') {
        return dataField;
    }
    if (Array.isArray(dataField)) {
        const stringItem = dataField.find((item) => typeof item === 'string');
        if (typeof stringItem === 'string') {
            return stringItem;
        }
    }

    return undefined;
}

export function GlobalErrorBottomSheet() {
    const insets = useSafeAreaInsets();
    const [currentError, setCurrentError] = useState<ApiErrorEvent | null>(null);
    const [visible, setVisible] = useState(false);
    const translateY = useRef(new Animated.Value(HIDDEN_POSITION)).current;
    const backgroundColor = useThemeColor(
        { light: '#fee2e2', dark: '#7f1d1d' },
        'background'
    );
    const borderColor = useThemeColor({ light: '#fecaca', dark: '#b91c1c' }, 'background');
    const textMutedColor = useThemeColor({ light: '#4b5563', dark: '#d1d5db' }, 'text');
    const dismissColor = useThemeColor({ light: '#7f1d1d', dark: '#fca5a5' }, 'tint');

    const hideSheet = useCallback(() => {
        setVisible(false);
    }, []);

    useEffect(() => {
        const unsubscribe = subscribeApiErrors((event: ApiErrorEvent) => {
            if (event.status !== 400 && event.status !== 404) {
                return;
            }
            setCurrentError(event);
            setVisible(true);
        });

        return unsubscribe;
    }, []);

    useEffect(() => {
        const toValue = visible ? 0 : HIDDEN_POSITION;
        Animated.timing(translateY, {
            toValue,
            duration: visible ? 230 : 180,
            easing: visible ? Easing.out(Easing.ease) : Easing.in(Easing.ease),
            useNativeDriver: true,
        }).start(({ finished }) => {
            if (!visible && finished) {
                setCurrentError(null);
            }
        });
    }, [visible, translateY]);

    useEffect(() => {
        if (!visible) return;

        const timeout = setTimeout(() => {
            hideSheet();
        }, AUTO_DISMISS_MS);

        return () => clearTimeout(timeout);
    }, [visible, hideSheet, currentError]);

    const detailText = useMemo(() => {
        const detail = extractDetailFromResponse(currentError ?? undefined);
        if (!detail) return undefined;
        if (currentError?.message && currentError.message === detail) {
            return undefined;
        }
        return detail;
    }, [currentError]);

    if (!visible && !currentError) {
        return null;
    }

    const statusLabel = currentError ? `Error ${currentError.status}` : 'Error';

    return (
        <Animated.View
            pointerEvents={visible ? 'auto' : 'none'}
            style={[
                styles.overlay,
                {
                    paddingBottom: Math.max(insets.bottom, 12) + 12,
                    transform: [{ translateY }],
                },
            ]}
        >
            <View
                style={[
                    styles.sheet,
                    {
                        backgroundColor,
                        borderColor,
                        shadowColor: Platform.OS === 'ios' ? '#000' : 'rgba(0,0,0,0.25)',
                    },
                ]}
            >
                <View style={styles.header}>
                    <ThemedText style={styles.status} type="defaultSemiBold">
                        {statusLabel}
                    </ThemedText>
                    <Pressable onPress={hideSheet} hitSlop={12}>
                        <ThemedText style={[styles.dismiss, { color: dismissColor }]} type="defaultSemiBold">
                            اغلاق
                        </ThemedText>
                    </Pressable>
                </View>
                <ThemedText style={styles.message}>
                    {currentError?.message ?? 'Something went wrong. Please try again.'}
                </ThemedText>
                {detailText ? (
                    <ThemedText style={[styles.detail, { color: textMutedColor }]}>
                        {detailText}
                    </ThemedText>
                ) : null}
                {currentError?.path ? (
                    <ThemedText
                        style={[styles.meta, { color: textMutedColor }]}
                        numberOfLines={1}
                    >
                        {currentError.method ? `${currentError.method} · ` : ''}
                        {currentError.path}
                    </ThemedText>
                ) : null}
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        paddingHorizontal: 16,
        zIndex: 1000,
    },
    sheet: {
        borderRadius: 16,
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
        borderWidth: 1,
        shadowOpacity: 0.25,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: -2 },
        elevation: 12,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    status: {
        fontSize: 18,
    },
    dismiss: {
        fontSize: 14,
    },
    message: {
        fontSize: 16,
        marginBottom: 4,
    },
    detail: {
        fontSize: 14,
        marginBottom: 6,
    },
    meta: {
        fontSize: 12,
        marginTop: 6,
    },
});

export default GlobalErrorBottomSheet;


