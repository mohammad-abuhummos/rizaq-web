import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';
import ServiceCard from './ServiceCard';

const services = [
    {
        id: "1",
        title: "خدمات التوصيل",
        icon: <Ionicons name="car-outline" size={28} color="#16A34A" />,
    },
    {
        id: "2",
        title: "خدمات المزارعين",
        icon: <Ionicons name="people-outline" size={28} color="#16A34A" />,
    },
    {
        id: "3",
        title: "خدمات المعايرة",
        icon: <Ionicons name="shield-checkmark-outline" size={28} color="#16A34A" />,
    },
    {
        id: "4",
        title: "خدمات النقل",
        icon: <Ionicons name="cube-outline" size={28} color="#16A34A" />,
    },
    {
        id: "5",
        title: "بذور",
        icon: <Ionicons name="leaf-outline" size={28} color="#16A34A" />
    },
    {
        id: "6",
        title: "زراعية",
        icon: <Ionicons name="hardware-chip-outline" size={28} color="#16A34A" />
    },
    {
        id: "7",
        title: "مبيد حشري",
        icon: <Ionicons name="flask-outline" size={28} color="#16A34A" />
    },
    {
        id: "8",
        title: "السماد",
        icon: <Ionicons name="nutrition-outline" size={28} color="#16A34A" />
    },
];

export default function ServicesCardContainer() {
    return (
        <View className="mb-6 px-4">
            <View className="mb-4">
                <Text className="text-xl font-bold text-gray-900 font-cairo-bold text-left">خدماتنا</Text>
            </View>
            <View className="flex-row flex-wrap justify-between">
                {services.map((service) => (
                    <ServiceCard key={service.id} service={service} />
                ))}
            </View>
        </View>
    );
}
