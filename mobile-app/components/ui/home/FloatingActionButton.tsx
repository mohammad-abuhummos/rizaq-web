import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    Animated,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';

interface ActionItem {
    id: string;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
    route: string;
}

const actions: ActionItem[] = [
    {
        id: 'tender',
        label: 'إنشاء مناقصة',
        icon: 'document-text',
        color: '#2563EB',
        route: '/tenders/create',
    },
    {
        id: 'direct',
        label: 'بيع مباشر',
        icon: 'cart',
        color: '#16A34A',
        route: '/direct/new',
    },
    {
        id: 'auction',
        label: 'إنشاء مزاد',
        icon: 'hammer',
        color: '#DC2626',
        route: '/auctions/create',
    },
];

export function FloatingActionButton() {
    const [isExpanded, setIsExpanded] = useState(false);
    const [animation] = useState(new Animated.Value(0));

    const toggleMenu = () => {
        const toValue = isExpanded ? 0 : 1;

        Animated.spring(animation, {
            toValue,
            friction: 5,
            tension: 40,
            useNativeDriver: true,
        }).start();

        setIsExpanded(!isExpanded);
    };

    const handleActionPress = (route: string) => {
        toggleMenu();
        setTimeout(() => {
            router.push(route as any);
        }, 200);
    };

    const rotation = animation.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '45deg'],
    });

    const opacity = animation.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
    });

    return (
        <View style={styles.container}>
            {/* Backdrop */}
            {isExpanded && (
                <Pressable
                    style={styles.backdrop}
                    onPress={toggleMenu}
                />
            )}

            {/* Action Items */}
            {actions.map((action, index) => {
                const translateY = animation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -(76 * (index + 1))],
                });

                const scale = animation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 1],
                });

                return (
                    <Animated.View
                        key={action.id}
                        style={[
                            styles.actionContainer,
                            {
                                transform: [{ translateY }, { scale }],
                                opacity,
                            },
                        ]}
                        pointerEvents={isExpanded ? 'auto' : 'none'}
                    >
                        <Pressable
                            onPress={() => handleActionPress(action.route)}
                            style={[
                                styles.actionButton,
                                { backgroundColor: action.color },
                            ]}
                        >
                            <Ionicons name={action.icon} size={24} color="white" />
                        </Pressable>
                        <View style={styles.labelContainer}>
                            <View style={styles.labelBubble}>
                                <Text style={styles.labelText}>{action.label}</Text>
                            </View>
                        </View>
                    </Animated.View>
                );
            })}

            {/* Main FAB */}
            <Pressable onPress={toggleMenu} style={styles.fab}>
                <Animated.View style={{ transform: [{ rotate: rotation }] }}>
                    <Ionicons name="add" size={32} color="white" />
                </Animated.View>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 24,
        left: 24,
        alignItems: 'flex-start',
        zIndex: 1000,
    },
    backdrop: {
        position: 'absolute',
        top: -1000,
        left: -1000,
        right: -1000,
        bottom: -1000,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        zIndex: 1,
    },
    fab: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#16A34A',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
        zIndex: 3,
    },
    actionContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 2,
        width: 240,
    },
    actionButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    labelContainer: {
        marginLeft: 12,
        flex: 1,
    },
    labelBubble: {
        backgroundColor: 'white',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 24,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    labelText: {
        fontSize: 15,
        fontFamily: 'Cairo-SemiBold',
        color: '#1f2937',
        textAlign: 'right',
    },
});

