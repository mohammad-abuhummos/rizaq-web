import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    Animated,
    Easing,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type SelectOption<T = string> = {
    label: string;
    value: T;
    description?: string;
};

interface BottomSheetSelectProps<T = string> {
    label: string;
    placeholder?: string;
    value: T | null | undefined;
    options: SelectOption<T>[];
    onChange: (value: T) => void;
    searchable?: boolean;
    required?: boolean;
    disabled?: boolean;
    error?: string;
}

export function BottomSheetSelect<T = string>({
    label,
    placeholder = 'اختر',
    value,
    options,
    onChange,
    searchable = false,
    required = false,
    disabled = false,
    error,
}: BottomSheetSelectProps<T>) {
    const insets = useSafeAreaInsets();
    const [visible, setVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const slideAnim = useRef(new Animated.Value(1000)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    const selectedOption = options.find((opt) => opt.value === value);
    const displayText = selectedOption?.label || placeholder;

    const filteredOptions = searchable && searchQuery
        ? options.filter((opt) =>
              opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
              opt.description?.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : options;

    const openSheet = useCallback(() => {
        if (disabled) return;
        setVisible(true);
        setSearchQuery('');
    }, [disabled]);

    const closeSheet = useCallback(() => {
        setVisible(false);
        setSearchQuery('');
    }, []);

    const handleSelect = useCallback(
        (selectedValue: T) => {
            onChange(selectedValue);
            closeSheet();
        },
        [onChange, closeSheet]
    );

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 200,
                    easing: Easing.ease,
                    useNativeDriver: true,
                }),
                Animated.spring(slideAnim, {
                    toValue: 0,
                    tension: 65,
                    friction: 11,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 150,
                    easing: Easing.ease,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 1000,
                    duration: 200,
                    easing: Easing.ease,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible, fadeAnim, slideAnim]);

    return (
        <>
            {/* Trigger Button */}
            <View style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <Text
                        style={{
                            color: '#374151',
                            fontFamily: 'Cairo-SemiBold',
                            fontSize: 15,
                        }}
                    >
                        {label}
                        {required && <Text style={{ color: '#dc2626' }}> *</Text>}
                    </Text>
                </View>

                <TouchableOpacity
                    onPress={openSheet}
                    disabled={disabled}
                    style={{
                        paddingVertical: 14,
                        paddingHorizontal: 16,
                        backgroundColor: disabled ? '#f9fafb' : 'white',
                        borderRadius: 12,
                        borderWidth: error ? 2 : 1,
                        borderColor: error ? '#ef4444' : value ? '#16A34A' : '#d1d5db',
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.05,
                        shadowRadius: 2,
                        elevation: 1,
                    }}
                >
                    <Text
                        style={{
                            flex: 1,
                            fontFamily: value ? 'Cairo-SemiBold' : 'Cairo-Regular',
                            fontSize: 15,
                            textAlign: 'right',
                            color: value ? '#1f2937' : '#9CA3AF',
                        }}
                        numberOfLines={1}
                    >
                        {displayText}
                    </Text>
                    <Ionicons
                        name="chevron-down"
                        size={20}
                        color={disabled ? '#9CA3AF' : value ? '#16A34A' : '#6b7280'}
                        style={{ marginLeft: 8 }}
                    />
                </TouchableOpacity>

                {error && (
                    <Text
                        style={{
                            marginTop: 6,
                            fontSize: 13,
                            color: '#dc2626',
                            fontFamily: 'Cairo-Regular',
                            textAlign: 'right',
                        }}
                    >
                        {error}
                    </Text>
                )}
            </View>

            {/* Bottom Sheet Modal */}
            <Modal
                visible={visible}
                transparent
                animationType="none"
                statusBarTranslucent
                onRequestClose={closeSheet}
            >
                <View style={{ flex: 1 }}>
                    {/* Backdrop */}
                    <Animated.View
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(0, 0, 0, 0.5)',
                            opacity: fadeAnim,
                        }}
                    >
                        <Pressable
                            style={{ flex: 1 }}
                            onPress={closeSheet}
                        />
                    </Animated.View>

                    {/* Bottom Sheet */}
                    <Animated.View
                        style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            maxHeight: '80%',
                            backgroundColor: 'white',
                            borderTopLeftRadius: 24,
                            borderTopRightRadius: 24,
                            paddingBottom: Math.max(insets.bottom, 12),
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: -4 },
                            shadowOpacity: 0.15,
                            shadowRadius: 12,
                            elevation: 24,
                            transform: [{ translateY: slideAnim }],
                        }}
                    >
                        {/* Handle Bar */}
                        <View
                            style={{
                                alignItems: 'center',
                                paddingTop: 12,
                                paddingBottom: 8,
                            }}
                        >
                            <View
                                style={{
                                    width: 40,
                                    height: 4,
                                    backgroundColor: '#d1d5db',
                                    borderRadius: 2,
                                }}
                            />
                        </View>

                        {/* Header */}
                        <View
                            style={{
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                paddingHorizontal: 20,
                                paddingVertical: 12,
                                borderBottomWidth: 1,
                                borderBottomColor: '#f3f4f6',
                            }}
                        >
                            <Pressable
                                onPress={closeSheet}
                                hitSlop={12}
                                style={{
                                    padding: 8,
                                }}
                            >
                                <Ionicons name="close" size={24} color="#6b7280" />
                            </Pressable>

                            <Text
                                style={{
                                    fontSize: 18,
                                    fontFamily: 'Cairo-Bold',
                                    color: '#111827',
                                }}
                            >
                                {label}
                            </Text>

                            <View style={{ width: 40 }} />
                        </View>

                        {/* Search Bar */}
                        {searchable && options.length > 5 && (
                            <View
                                style={{
                                    paddingHorizontal: 20,
                                    paddingTop: 12,
                                    paddingBottom: 8,
                                }}
                            >
                                <View
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        backgroundColor: '#f9fafb',
                                        borderRadius: 12,
                                        paddingHorizontal: 12,
                                        paddingVertical: 10,
                                        borderWidth: 1,
                                        borderColor: '#e5e7eb',
                                    }}
                                >
                                    <Ionicons name="search" size={20} color="#9CA3AF" style={{ marginLeft: 8 }} />
                                    <TextInput
                                        value={searchQuery}
                                        onChangeText={setSearchQuery}
                                        placeholder="ابحث..."
                                        placeholderTextColor="#9CA3AF"
                                        style={{
                                            flex: 1,
                                            fontFamily: 'Cairo-Regular',
                                            fontSize: 15,
                                            color: '#111827',
                                            textAlign: 'right',
                                            padding: 0,
                                        }}
                                    />
                                </View>
                            </View>
                        )}

                        {/* Options List */}
                        <ScrollView
                            style={{
                                maxHeight: 500,
                            }}
                            contentContainerStyle={{
                                paddingHorizontal: 12,
                                paddingTop: 8,
                                paddingBottom: 16,
                            }}
                            showsVerticalScrollIndicator={true}
                            keyboardShouldPersistTaps="handled"
                        >
                            {filteredOptions.length === 0 ? (
                                <View
                                    style={{
                                        paddingVertical: 40,
                                        alignItems: 'center',
                                    }}
                                >
                                    <Ionicons name="search-outline" size={48} color="#d1d5db" />
                                    <Text
                                        style={{
                                            marginTop: 12,
                                            fontSize: 15,
                                            color: '#6b7280',
                                            fontFamily: 'Cairo-Regular',
                                        }}
                                    >
                                        لا توجد نتائج
                                    </Text>
                                </View>
                            ) : (
                                filteredOptions.map((option, index) => {
                                    const isSelected = option.value === value;
                                    return (
                                        <TouchableOpacity
                                            key={`${option.value}-${index}`}
                                            onPress={() => handleSelect(option.value)}
                                            style={{
                                                paddingVertical: 14,
                                                paddingHorizontal: 16,
                                                marginVertical: 4,
                                                borderRadius: 12,
                                                backgroundColor: isSelected ? '#f0fdf4' : 'white',
                                                borderWidth: isSelected ? 2 : 1,
                                                borderColor: isSelected ? '#16A34A' : '#e5e7eb',
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                            }}
                                        >
                                            <View style={{ flex: 1, alignItems: 'flex-end' }}>
                                                <Text
                                                    style={{
                                                        fontSize: 16,
                                                        fontFamily: isSelected ? 'Cairo-Bold' : 'Cairo-SemiBold',
                                                        color: isSelected ? '#15803d' : '#1f2937',
                                                        textAlign: 'right',
                                                    }}
                                                >
                                                    {option.label}
                                                </Text>
                                                {option.description && (
                                                    <Text
                                                        style={{
                                                            fontSize: 13,
                                                            fontFamily: 'Cairo-Regular',
                                                            color: '#6b7280',
                                                            marginTop: 2,
                                                            textAlign: 'right',
                                                        }}
                                                    >
                                                        {option.description}
                                                    </Text>
                                                )}
                                            </View>

                                            {isSelected && (
                                                <View
                                                    style={{
                                                        marginRight: 12,
                                                        width: 24,
                                                        height: 24,
                                                        borderRadius: 12,
                                                        backgroundColor: '#16A34A',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                    }}
                                                >
                                                    <Ionicons name="checkmark" size={16} color="white" />
                                                </View>
                                            )}
                                        </TouchableOpacity>
                                    );
                                })
                            )}
                        </ScrollView>
                    </Animated.View>
                </View>
            </Modal>
        </>
    );
}

