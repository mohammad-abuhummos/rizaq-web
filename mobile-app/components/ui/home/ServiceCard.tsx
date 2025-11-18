import { useAuthGate } from '@/hooks/useAuthGate';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface ServiceCardProps {
  service: {
    id: string;
    title: string;
    icon: React.ReactNode;
  };
}

export default function ServiceCard({ service }: ServiceCardProps) {
  const { withAuth } = useAuthGate();
  return (
    <TouchableOpacity
      onPress={withAuth(() => { })}
      className="w-[23%] aspect-square bg-white rounded-xl p-3 items-center justify-center mb-3 border border-gray-200"
    >
      <View className="mb-2">
        {service.icon}
      </View>
      <Text className="text-[11px] text-gray-800 text-center font-semibold">
        {service.title}
      </Text>
    </TouchableOpacity>
  );
}
