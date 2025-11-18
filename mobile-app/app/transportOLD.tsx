import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { acceptTransportOffer, createTransportOffer, listTransportOffersByRequest } from '@/services/transportOLD';
import type { TransportOffer } from '@/types/transportOLD';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function TransportScreen() {
  const nowIso = useMemo(() => new Date().toISOString(), []);

  const [transportRequestId, setTransportRequestId] = useState<string>('');
  const [transporterId, setTransporterId] = useState<string>('');
  const [offeredPrice, setOfferedPrice] = useState<string>('');
  const [estimatedPickupDate, setEstimatedPickupDate] = useState<string>(nowIso);
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState<string>(nowIso);
  const [notes, setNotes] = useState<string>('');
  const [status, setStatus] = useState<string>('Pending');
  const [submitting, setSubmitting] = useState(false);

  const [queryRequestId, setQueryRequestId] = useState<string>('');
  const [offers, setOffers] = useState<TransportOffer[] | null>(null);
  const [loadingOffers, setLoadingOffers] = useState(false);

  // Prices moved to separate screens

  const onSubmitOffer = async () => {
    try {
      if (!transportRequestId || !transporterId || !offeredPrice) {
        Alert.alert('Missing fields', 'Please fill transportRequestId, transporterId, and offeredPrice.');
        return;
      }
      setSubmitting(true);
      const dto = {
        transportRequestId: Number(transportRequestId),
        transporterId: Number(transporterId),
        offeredPrice: Number(offeredPrice),
        estimatedPickupDate,
        estimatedDeliveryDate,
        notes: notes || undefined,
        status: status || undefined,
      };
      const res = await createTransportOffer(dto);
      const created = (res as any)?.data || (res as any);
      Alert.alert('Offer sent', `Offer #${created?.offerId ?? ''} submitted successfully.`);
      // reset essential fields
      setOfferedPrice('');
      setNotes('');
      setStatus('Pending');
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to send offer');
    } finally {
      setSubmitting(false);
    }
  };

  const onLoadOffers = async () => {
    try {
      if (!queryRequestId) {
        Alert.alert('Missing id', 'Enter Transport Request ID to load offers.');
        return;
      }
      setLoadingOffers(true);
      const res = await listTransportOffersByRequest(Number(queryRequestId));
      const list = (res as any)?.data || (res as any) || [];
      setOffers(Array.isArray(list) ? list : []);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to load offers');
    } finally {
      setLoadingOffers(false);
    }
  };

  // (prices logic removed)

  const onAcceptOffer = async (offerId: number) => {
    try {
      const res = await acceptTransportOffer(offerId);
      const ok = (res as any)?.success ?? true;
      if (ok) {
        Alert.alert('Accepted', `Offer #${offerId} accepted.`);
        setOffers((prev) => (prev ? prev.map((o) => (o.offerId === offerId ? { ...o, status: 'Accepted' } : o)) : prev));
      } else {
        Alert.alert('Failed', (res as any)?.message || 'Unable to accept offer');
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to accept offer');
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
      <ThemedView style={{ gap: 12 }}>
        <ThemedText type="title">Transport</ThemedText>
        <ThemedText type="subtitle">Send Offer to Transport (Buyer)</ThemedText>

        <LabeledInput label="Transport Request ID" value={transportRequestId} onChangeText={setTransportRequestId} keyboardType="numeric" />
        <LabeledInput label="Transporter ID" value={transporterId} onChangeText={setTransporterId} keyboardType="numeric" />
        <LabeledInput label="Offered Price" value={offeredPrice} onChangeText={setOfferedPrice} keyboardType="numeric" />
        <LabeledInput label="Estimated Pickup (ISO)" value={estimatedPickupDate} onChangeText={setEstimatedPickupDate} />
        <LabeledInput label="Estimated Delivery (ISO)" value={estimatedDeliveryDate} onChangeText={setEstimatedDeliveryDate} />
        <LabeledInput label="Notes" value={notes} onChangeText={setNotes} multiline />
        <LabeledInput label="Status" value={status} onChangeText={setStatus} />

        <TouchableOpacity
          onPress={onSubmitOffer}
          disabled={submitting}
          style={{ backgroundColor: submitting ? '#9ca3af' : '#16a34a', paddingVertical: 12, borderRadius: 8, alignItems: 'center' }}
        >
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={{ color: 'white', fontWeight: '700' }}>Send Offer</Text>}
        </TouchableOpacity>
      </ThemedView>

      <View style={{ height: 1, backgroundColor: '#e5e7eb', marginVertical: 8 }} />

      <ThemedView style={{ gap: 12 }}>
        <ThemedText type="subtitle">Delivery — Offers List</ThemedText>
        <LabeledInput label="Transport Request ID" value={queryRequestId} onChangeText={setQueryRequestId} keyboardType="numeric" />
        <TouchableOpacity
          onPress={onLoadOffers}
          disabled={loadingOffers}
          style={{ backgroundColor: loadingOffers ? '#9ca3af' : '#0ea5e9', paddingVertical: 10, borderRadius: 8, alignItems: 'center' }}
        >
          {loadingOffers ? <ActivityIndicator color="#fff" /> : <Text style={{ color: 'white', fontWeight: '700' }}>Show Offers</Text>}
        </TouchableOpacity>

        {Array.isArray(offers) && (
          offers.length === 0 ? (
            <Text style={{ color: '#6b7280' }}>No offers found.</Text>
          ) : (
            <FlatList
              data={offers}
              keyExtractor={(item) => String(item.offerId)}
              contentContainerStyle={{ gap: 12 }}
              renderItem={({ item }) => (
                <View style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 12, gap: 6 }}>
                  <Text style={{ fontWeight: '700' }}>Offer #{item.offerId}</Text>
                  <Text>Transporter: {item.transporterId}</Text>
                  <Text>Price: {item.offeredPrice}</Text>
                  <Text>Pickup: {item.estimatedPickupDate}</Text>
                  <Text>Delivery: {item.estimatedDeliveryDate}</Text>
                  <Text>Status: {item.status}</Text>
                  <TouchableOpacity
                    onPress={() => onAcceptOffer(item.offerId)}
                    disabled={item.status?.toLowerCase() === 'accepted'}
                    style={{ backgroundColor: '#22c55e', paddingVertical: 8, borderRadius: 6, alignItems: 'center', marginTop: 4 }}
                  >
                    <Text style={{ color: 'white', fontWeight: '700' }}>Accept Offer</Text>
                  </TouchableOpacity>
                </View>
              )}
            />
          )
        )}
      </ThemedView>

      {/* Prices moved to separate screens */}
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

// (LabeledSelect removed)


