import React from 'react';
import { Text, View } from 'react-native';

export async function fetchDataTab(): Promise<void> {
    // TODO: implement API call
    return Promise.resolve();
}

export const DataTab = () => {
    return (
        <View className="py-6">
            <Text className="font-cairo text-gray-500">محتوى البيانات سيظهر هنا</Text>
        </View>
    );
};

export default DataTab;


