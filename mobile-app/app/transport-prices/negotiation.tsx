import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import type { Product } from '@/services/product';
import { listProducts } from '@/services/product';
import { fetchTransportRegions, startNegotiationTransportPrice } from '@/services/transport-prices';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function NegotiationScreen() {
  const [regions, setRegions] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingRegions, setLoadingRegions] = useState<boolean>(false);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(false);

  const [fromRegion, setFromRegion] = useState<string>('');
  const [toRegion, setToRegion] = useState<string>('');
  const [openFrom, setOpenFrom] = useState(false);
  const [openTo, setOpenTo] = useState(false);

  const [requestId, setRequestId] = useState<string>('');
  const [distanceKm, setDistanceKm] = useState<string>('');
  const [weightKg, setWeightKg] = useState<string>('');

  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [openProduct, setOpenProduct] = useState(false);

  const [result, setResult] = useState<string>('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoadingRegions(true);
        const res = await fetchTransportRegions();
        const list = (res as any)?.data || (res as any) || [];
        setRegions(Array.isArray(list) ? list : []);
      } catch (e: any) {
        // ignore, will be retried by user actions
      } finally {
        setLoadingRegions(false);
      }

      try {
        setLoadingProducts(true);
        const pres = await listProducts();
        const plist = (pres as any)?.data || (pres as any) || [];
        setProducts(Array.isArray(plist) ? plist : []);
      } catch (e: any) {
        Alert.alert('Error', e?.message || 'Failed to load products');
      } finally {
        setLoadingProducts(false);
      }
    };
    load();
  }, []);

  const selectedProduct = selectedProductId ? products.find(p => p.productId === selectedProductId) : undefined;
  const productDisplay = (p: Product) => (p.nameAr || p.nameEn) ? `${p.nameAr || ''}${p.nameAr && p.nameEn ? ' | ' : ''}${p.nameEn || ''}` : `#${p.productId}`;

  const onStartNegotiation = async () => {
    try {
      if (!fromRegion || !toRegion) {
        Alert.alert('Missing fields', 'Select From and To regions.');
        return;
      }
      const dto = {
        requestId: requestId ? Number(requestId) : undefined,
        fromRegion,
        toRegion,
        distanceKm: distanceKm ? Number(distanceKm) : undefined,
        productType: selectedProduct ? (selectedProduct.nameEn || selectedProduct.nameAr || undefined) : undefined,
        weightKg: weightKg ? Number(weightKg) : undefined,
      };
      const res = await startNegotiationTransportPrice(dto);
      const data = (res as any)?.data ?? res;
      const msg = (data && typeof data === 'object' && 'message' in data) ? (data as any).message : JSON.stringify(data);
      setResult(String(msg));
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.response?.message || e?.message || 'Failed to start negotiation';
      setResult(String(msg));
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <ThemedView style={{ gap: 12 }}>
        <ThemedText type="title">Start Negotiation</ThemedText>

        <LabeledSelect label="From Region" value={fromRegion} placeholder={loadingRegions ? 'Loading…' : 'Select From'} options={regions} open={openFrom} onToggle={() => setOpenFrom((v) => !v)} onSelect={(v) => { setFromRegion(v); setOpenFrom(false); }} />
        <LabeledSelect label="To Region" value={toRegion} placeholder={loadingRegions ? 'Loading…' : 'Select To'} options={regions} open={openTo} onToggle={() => setOpenTo((v) => !v)} onSelect={(v) => { setToRegion(v); setOpenTo(false); }} />

        <LabeledSelectKV
          label="Product"
          valueLabel={selectedProduct ? productDisplay(selectedProduct) : ''}
          placeholder={loadingProducts ? 'Loading products…' : 'Select Product'}
          options={products.map(p => ({ label: productDisplay(p), value: String(p.productId) }))}
          open={openProduct}
          onToggle={() => setOpenProduct((v) => !v)}
          onSelect={(item) => { setSelectedProductId(Number(item.value)); setOpenProduct(false); }}
        />
        {!!selectedProduct && (
          <Text style={{ color: '#6b7280' }}>{productDisplay(selectedProduct)}</Text>
        )}

        <LabeledInput label="Request ID (optional)" value={requestId} onChangeText={setRequestId} keyboardType="numeric" />
        <LabeledInput label="Distance (km) (optional)" value={distanceKm} onChangeText={setDistanceKm} keyboardType="numeric" />
        <LabeledInput label="Weight (kg) (optional)" value={weightKg} onChangeText={setWeightKg} keyboardType="numeric" />

        <TouchableOpacity onPress={onStartNegotiation} style={{ backgroundColor: '#0f766e', paddingVertical: 12, borderRadius: 8, alignItems: 'center' }}>
          <Text style={{ color: 'white', fontWeight: '700' }}>Start Negotiation</Text>
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

function LabeledSelectKV({ label, valueLabel, placeholder, options, open, onToggle, onSelect }: { label: string; valueLabel?: string; placeholder?: string; options: { label: string; value: string }[]; open: boolean; onToggle: () => void; onSelect: (item: { label: string; value: string }) => void; }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ fontWeight: '600' }}>{label}</Text>
      <TouchableOpacity onPress={onToggle} style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12 }}>
        <Text style={{ color: valueLabel ? '#111827' : '#6b7280' }}>{valueLabel || (placeholder || 'Select')}</Text>
      </TouchableOpacity>
      {open && options?.length > 0 && (
        <View style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8 }}>
          {options.map((opt) => (
            <TouchableOpacity key={opt.value} onPress={() => onSelect(opt)} style={{ paddingVertical: 10, paddingHorizontal: 12 }}>
              <Text>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}


