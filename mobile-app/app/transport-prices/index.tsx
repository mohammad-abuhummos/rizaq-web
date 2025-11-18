import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { router } from 'expo-router';
import { ScrollView, Text, TouchableOpacity } from 'react-native';

export default function TransportPricesIndex() {
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <ThemedView style={{ gap: 12 }}>
        <ThemedText type="title">Transport Prices</ThemedText>
        <TouchableOpacity onPress={() => router.push('/transport-prices/official' as any)} style={{ backgroundColor: '#1e293b', paddingVertical: 12, borderRadius: 8, alignItems: 'center' }}>
          <Text style={{ color: 'white', fontWeight: '700' }}>Official Price</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/transport-prices/cheapest' as any)} style={{ backgroundColor: '#334155', paddingVertical: 12, borderRadius: 8, alignItems: 'center' }}>
          <Text style={{ color: 'white', fontWeight: '700' }}>Cheapest Price</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/transport-prices/negotiation' as any)} style={{ backgroundColor: '#0f766e', paddingVertical: 12, borderRadius: 8, alignItems: 'center' }}>
          <Text style={{ color: 'white', fontWeight: '700' }}>Start Negotiation</Text>
        </TouchableOpacity>
      </ThemedView>
    </ScrollView>
  );
}


