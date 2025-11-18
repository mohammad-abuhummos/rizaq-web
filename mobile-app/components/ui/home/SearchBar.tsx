import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    TextInput,
    TouchableOpacity,
    View,
    ViewStyle,
} from 'react-native';

export interface SearchBarProps {
    onSearch: (text: string) => void;
    placeholder?: string;
    style?: ViewStyle;
    onSearchPress?: () => void;
}

// Using Tailwind (NativeWind) classes for layout and styling

export const SearchBar = ({
    onSearch,
    placeholder = 'ابحث عن الصنف',
    style,
    onSearchPress,
}: SearchBarProps) => {
    const [searchText, setSearchText] = useState('');

    const handleChangeText = (text: string) => {
        setSearchText(text);
        onSearch(text);
    };

    const handleSearchPress = () => {
        if (onSearchPress) {
            onSearchPress();
        }
        onSearch(searchText);
    };

    return (
        <View className="flex-row items-center gap-3 px-4 py-2" style={style}>

            {/* Right: Search input */}
            <View className="flex-1 h-12 flex-row-reverse items-center bg-white border border-gray-300 rounded-xl px-3">
                <TextInput
                    className="flex-1 text-right font-cairo text-[15px] text-gray-800"
                    placeholder={placeholder}
                    placeholderTextColor="#6B7280"
                    value={searchText}
                    onChangeText={handleChangeText}
                    returnKeyType="search"
                    onSubmitEditing={handleSearchPress}
                />
                <Ionicons name="search" size={18} color="#6B7280" />
            </View>
            {/* Left: Menu/List button */}

            <TouchableOpacity
                onPress={handleSearchPress}
                activeOpacity={0.7}
                className="bg-emerald-700 w-11 h-11 rounded-xl items-center justify-center ring-2 ring-cyan-300">
                <Ionicons name="list" size={22} color="#fff" />
            </TouchableOpacity>

        </View>
    );
};
