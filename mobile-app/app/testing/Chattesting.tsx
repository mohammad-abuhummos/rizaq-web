import { router, Stack } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';

export default function TestingTabScreen() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={{ flex: 1, backgroundColor: 'white' }}>
        <View style={{ paddingTop: 56, paddingBottom: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
          <Text style={{ fontSize: 22, fontWeight: '700', textAlign: 'center', color: '#111827' }}>Testing</Text>
          <Text style={{ fontSize: 13, textAlign: 'center', color: '#6b7280', marginTop: 4 }}>Quick tools for debugging</Text>
        </View>

        <View style={{ flex: 1, gap: 12, padding: 20 }}>
          <TouchableOpacity
            onPress={() => router.push('/testing/chat' as any)}
            style={{ backgroundColor: '#111827', paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12 }}
          >
            <Text style={{ color: 'white', fontWeight: '700', textAlign: 'center' }}>Chat Tester</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/direct/orders' as any)}
            style={{ backgroundColor: '#0ea5e9', paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12 }}
          >
            <Text style={{ color: 'white', fontWeight: '700', textAlign: 'center' }}>My Direct Orders</Text>
          </TouchableOpacity>

          <View style={{ marginTop: 8, gap: 6 }}>
            <Text style={{ color: '#111827', fontWeight: '700' }}>How to test Chat quickly</Text>
            <Text style={{ color: '#6b7280' }}>1) Tap Chat Tester.</Text>
            <Text style={{ color: '#6b7280' }}>2) Enter conversationId and Sender User Id (auto-filled if logged in).</Text>
            <Text style={{ color: '#6b7280' }}>3) Tap Quick Start to connect → join → send your message.</Text>
            <Text style={{ color: '#6b7280' }}>Optional: use REST section to open a conversation by context and fetch messages.</Text>
          </View>
        </View>
      </View>
    </>
  );
}


