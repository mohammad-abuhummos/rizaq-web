import { listOpenTenders } from '@/services/tender';
import type { Tender } from '@/types/tender';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, Text, View } from 'react-native';

export default function TendersTabScreen() {
    const [tenders, setTenders] = useState<Tender[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await listOpenTenders();
                const data = (res as any)?.data ?? (res as any);
                setTenders((data as any[]) || []);
            } catch (e: any) {
                setError(e?.message || 'Failed to load tenders');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const renderItem = ({ item }: { item: Tender }) => (
        <View style={{ backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', padding: 12, marginBottom: 12 }}>
            <Text style={{ fontWeight: '700', fontSize: 16 }}>{item.title || 'Tender'}</Text>
            <Text style={{ color: '#6b7280', marginTop: 4 }}>{item.deliveryLocation || '-'}</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                <Text>
                    Qty: {item.quantity ?? '-'} {item.unit || ''}
                </Text>
                <Text>Max: {item.maxBudget ?? '-'}</Text>
            </View>
            <View style={{ flexDirection: 'row', marginTop: 12 }}>
                <Pressable onPress={() => router.push({ pathname: '/tenders/[id]', params: { id: String((item as any).tenderId || (item as any).id) } })} style={{ backgroundColor: '#2563eb', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8 }}>
                    <Text style={{ color: 'white', fontWeight: '600' }}>Details</Text>
                </Pressable>
            </View>
        </View>
    );

    return (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={{ fontSize: 20, fontWeight: '700' }}>Tenders (المناقصة)</Text>
                <View style={{ flexDirection: 'row' }}>
                    <Pressable onPress={() => router.push('/tenders/create')} style={{ marginRight: 8, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#16a34a' }}>
                        <Text style={{ color: 'white', fontWeight: '600' }}>New Tender</Text>
                    </Pressable>
                </View>
            </View>
            {loading && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                    <ActivityIndicator />
                    <Text style={{ marginLeft: 8 }}>Loading…</Text>
                </View>
            )}
            {!!error && (
                <View style={{ backgroundColor: '#FEF2F2', borderColor: '#FCA5A5', borderWidth: 1, padding: 12, borderRadius: 8, marginBottom: 16 }}>
                    <Text style={{ color: '#991B1B' }}>{error}</Text>
                </View>
            )}
            <FlatList
                data={tenders}
                keyExtractor={(x, idx) => String((x as any).tenderId || (x as any).id || idx)}
                renderItem={renderItem}
                scrollEnabled={false}
            />
        </ScrollView>
    );
}


