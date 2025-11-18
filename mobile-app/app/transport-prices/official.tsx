import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { fetchTransportRegions, getOfficialTransportPrice } from '@/services/transport-prices';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function OfficialPriceScreen() {
  const [regions, setRegions] = useState<string[]>([]);
  const [loadingRegions, setLoadingRegions] = useState<boolean>(false);
  const [fromRegion, setFromRegion] = useState<string>('');
  const [toRegion, setToRegion] = useState<string>('');
  const [distanceKm, setDistanceKm] = useState<string>('');
  const [result, setResult] = useState<string>('');
  const [openFrom, setOpenFrom] = useState(false);
  const [openTo, setOpenTo] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoadingRegions(true);
        const res = await fetchTransportRegions();
        const list = (res as any)?.data || (res as any) || [];
        setRegions(Array.isArray(list) ? list : []);
      } catch (e: any) {
        Alert.alert('Error', e?.message || 'Failed to load regions');
      } finally {
        setLoadingRegions(false);
      }
    };
    load();
  }, []);

  const onOfficial = async () => {
    try {
      if (!fromRegion || !toRegion) {
        Alert.alert('Missing fields', 'Select From and To regions.');
        return;
      }
      const dto = { fromRegion, toRegion, distanceKm: distanceKm ? Number(distanceKm) : undefined };
      const res = await getOfficialTransportPrice(dto);
      const data = (res as any)?.data ?? res;
      const msg = (data && typeof data === 'object' && 'message' in data) ? (data as any).message : JSON.stringify(data);
      setResult(String(msg));
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.response?.message || e?.message || 'Failed to fetch official price';
      setResult(String(msg));
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <ThemedView style={{ gap: 12 }}>
        <ThemedText type="title">Official Transport Price</ThemedText>
        <LabeledSelect label="From Region" value={fromRegion} placeholder={loadingRegions ? 'Loading…' : 'Select From'} options={regions} open={openFrom} onToggle={() => setOpenFrom((v) => !v)} onSelect={(v) => { setFromRegion(v); setOpenFrom(false); }} />
        <LabeledSelect label="To Region" value={toRegion} placeholder={loadingRegions ? 'Loading…' : 'Select To'} options={regions} open={openTo} onToggle={() => setOpenTo((v) => !v)} onSelect={(v) => { setToRegion(v); setOpenTo(false); }} />
        <LabeledInput label="Distance (km) - optional" value={distanceKm} onChangeText={setDistanceKm} keyboardType="numeric" />
        <TouchableOpacity onPress={onOfficial} style={{ backgroundColor: '#1e293b', paddingVertical: 12, borderRadius: 8, alignItems: 'center' }}>
          <Text style={{ color: 'white', fontWeight: '700' }}>Get Official Price</Text>
        </TouchableOpacity>
        {!!result && (
          <View style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 12 }}>
            <Text style={{ fontWeight: '700', marginBottom: 6 }}>Result</Text>
            <Text style={{ fontFamily: 'monospace' }}>{result}</Text>
          </View>
        )}
      </ThemedView>
    </ScrollView>
  );
}

function LabeledInput({ label, multiline, ...props }: { label: string } & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ fontWeight: '600' }}>{label}</Text>
      <TextInput
        {...props}
        style={{
          borderWidth: 1,
          borderColor: '#d1d5db',
          borderRadius: 8,
          paddingHorizontal: 12,
          paddingVertical: multiline ? 10 : 8,
          minHeight: multiline ? 80 : 44,
        }}
      />
    </View>
  );
}

function LabeledSelect({ label, value, placeholder, options, open, onToggle, onSelect }: { label: string; value?: string; placeholder?: string; options: string[]; open: boolean; onToggle: () => void; onSelect: (value: string) => void; }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ fontWeight: '600' }}>{label}</Text>
      <TouchableOpacity onPress={onToggle} style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12 }}>
        <Text style={{ color: value ? '#111827' : '#6b7280' }}>{value || (placeholder || 'Select')}</Text>
      </TouchableOpacity>
      {open && options?.length > 0 && (
        <View style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8 }}>
          {options.map((opt) => (
            <TouchableOpacity key={opt} onPress={() => onSelect(opt)} style={{ paddingVertical: 10, paddingHorizontal: 12 }}>
              <Text>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}


