import { getConversationMessages, openConversation } from '@/services/chat';
import { listBuyerOrders, listSellerOrders } from '@/services/direct';
import { getAuthUser } from '@/storage/auth-storage';
import { getApiBaseUrl } from '@/utils/config';
import * as signalR from '@microsoft/signalr';
import { useEffect, useRef, useState } from 'react';
import { Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function ChatHubTesterScreen() {
  const [baseUrl, setBaseUrl] = useState(getApiBaseUrl());
  const [jwt, setJwt] = useState('');
  const [connected, setConnected] = useState(false);
  const [conversationId, setConversationId] = useState<string>('');
  const [senderUserId, setSenderUserId] = useState<string>('');
  const [body, setBody] = useState('Hello');
  const [logLines, setLogLines] = useState<string[]>([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const logRef = useRef<ScrollView | null>(null);

  // REST helpers
  const [ctxType, setCtxType] = useState('order');
  const [ctxId, setCtxId] = useState('');
  const [buyerUserId, setBuyerUserId] = useState('');
  const [sellerUserId, setSellerUserId] = useState('');

  const connectionRef = useRef<signalR.HubConnection | null>(null);

  const hubUrl = `${(baseUrl || '').replace(/\/$/, '')}/hubs/chat`;

  const log = (msg: string, cls?: 'ok' | 'err') => {
    const prefix = cls === 'ok' ? '' : cls === 'err' ? '[ERR] ' : '';
    const line = `[${new Date().toLocaleTimeString()}] ${prefix}${msg}`;
    setLogLines((prev) => [...prev, line]);
    try { console.log('[ChatTester]', line); } catch {}
  };

  const connect = async () => {
    if (connectionRef.current?.state === signalR.HubConnectionState.Connected) {
      log('Already connected', 'ok');
      return;
    }

    try {
      const conn = new signalR.HubConnectionBuilder()
        .withUrl(hubUrl, jwt ? { accessTokenFactory: () => jwt } : undefined)
        .withAutomaticReconnect()
        .build();

      conn.on('MessageCreated', (evt: any) => log(`MessageCreated: ${JSON.stringify(evt)}`, 'ok'));
      conn.on('MessagesRead', (evt: any) => log(`MessagesRead: ${JSON.stringify(evt)}`, 'ok'));
      conn.on('ConversationCreated', (evt: any) => log(`ConversationCreated: ${JSON.stringify(evt)}`, 'ok'));
      conn.on('Error', (err: any) => log(`Error: ${JSON.stringify(err)}`, 'err'));

      conn.onreconnecting((err) => log(`Reconnecting... ${err?.message ?? ''}`));
      conn.onreconnected((id) => log(`Reconnected. ConnId=${id}`, 'ok'));
      conn.onclose((err) => log(`Connection closed${err ? ': ' + err.message : ''}`));

      await conn.start();
      connectionRef.current = conn;
      setConnected(true);
      log('Connected to ChatHub', 'ok');
    } catch (e: any) {
      log(`Connect failed: ${e?.message || String(e)}`, 'err');
      setConnected(false);
    }
  };

  const disconnect = async () => {
    try {
      if (connectionRef.current) {
        await connectionRef.current.stop();
      }
      log('Disconnected', 'ok');
    } catch (e: any) {
      log(`Disconnect failed: ${e?.message || String(e)}`, 'err');
    } finally {
      connectionRef.current = null;
      setConnected(false);
    }
  };

  const joinConv = async () => {
    const convId = Number(conversationId);
    if (!connectionRef.current || connectionRef.current.state !== signalR.HubConnectionState.Connected) return log('Not connected', 'err');
    if (!convId) return log('conversationId required', 'err');
    try {
      await connectionRef.current.invoke('JoinConversation', convId);
      log(`Joined conversation ${convId}`, 'ok');
    } catch (e: any) {
      log(`Join failed: ${e?.message || String(e)}`, 'err');
    }
  };

  const leaveConv = async () => {
    const convId = Number(conversationId);
    if (!connectionRef.current || connectionRef.current.state !== signalR.HubConnectionState.Connected) return log('Not connected', 'err');
    if (!convId) return log('conversationId required', 'err');
    try {
      await connectionRef.current.invoke('LeaveConversation', convId);
      log(`Left conversation ${convId}`, 'ok');
    } catch (e: any) {
      log(`Leave failed: ${e?.message || String(e)}`, 'err');
    }
  };

  const sendMsg = async () => {
    const convId = Number(conversationId);
    const sender = Number(senderUserId);
    if (!connectionRef.current || connectionRef.current.state !== signalR.HubConnectionState.Connected) return log('Not connected', 'err');
    if (!convId || !sender || !body) return log('conversationId, senderUserId, body required', 'err');
    try {
      await connectionRef.current.invoke('SendMessage', { conversationId: convId, senderUserId: sender, body });
      log(`Sent: ${body}`, 'ok');
    } catch (e: any) {
      log(`Send failed: ${e?.message || String(e)}`, 'err');
    }
  };

  const markRead = async () => {
    const convId = Number(conversationId);
    if (!connectionRef.current || connectionRef.current.state !== signalR.HubConnectionState.Connected) return log('Not connected', 'err');
    if (!convId) return log('conversationId required', 'err');
    try {
      await connectionRef.current.invoke('MarkAsRead', convId);
      log(`MarkAsRead sent for conversation ${convId}`, 'ok');
    } catch (e: any) {
      log(`MarkAsRead failed: ${e?.message || String(e)}`, 'err');
    }
  };

  const quickStart = async () => {
    await connect();
    await joinConv();
    await sendMsg();
  };

  const autofillFromLatestOrder = async () => {
    try {
      const me = await getAuthUser<any>();
      const myId = me?.userId || me?.id;
      if (!myId) {
        log('Not logged in: cannot determine user id', 'err');
        return;
      }
      // Prefer buyer orders first
      let ordersRes: any = null;
      try { ordersRes = await listBuyerOrders(myId); } catch {}
      let orders = (ordersRes as any)?.data ?? ordersRes;
      if (!Array.isArray(orders) || orders.length === 0) {
        // Try as seller
        try {
          ordersRes = await listSellerOrders(myId);
          orders = (ordersRes as any)?.data ?? ordersRes;
        } catch {}
      }
      if (!Array.isArray(orders) || orders.length === 0) {
        log('No direct orders found for your account', 'err');
        return;
      }
      orders.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      const latest = orders[0];
      const orderId = latest.orderId;
      const buyer = latest.buyerUserId;
      const seller = latest.sellerUserId || latest.sellerId || latest.listing?.sellerUserId;
      setCtxType('order');
      setCtxId(String(orderId));
      if (buyer) setBuyerUserId(String(buyer));
      if (seller) setSellerUserId(String(seller));
      log(`Auto-filled from latest order: orderId=${orderId}, buyer=${buyer}, seller=${seller}`, 'ok');
    } catch (e: any) {
      log(`Autofill failed: ${e?.message || String(e)}`, 'err');
    }
  };

  const openJoinSendFromContext = async () => {
    await restOpenConversation();
    await joinConv();
    await sendMsg();
  };

  const restOpenConversation = async () => {
    try {
      const ctxIdNum = Number(ctxId);
      if (!ctxType || !ctxIdNum) {
        log('Enter contextType and contextId to open conversation');
        return;
      }
      const buyer = buyerUserId ? Number(buyerUserId) : undefined;
      const seller = sellerUserId ? Number(sellerUserId) : undefined;
      const res = await openConversation(ctxType, ctxIdNum, { buyerUserId: buyer, sellerUserId: seller });
      const data = (res as any)?.data ?? res;
      const newId = data?.conversationId || data?.id || data?.conversation?.id || data?.conversation?.conversationId;
      if (newId) {
        setConversationId(String(newId));
        log(`Opened conversation id=${newId}`, 'ok');
      } else {
        log(`Open conversation response: ${JSON.stringify(data)}`);
      }
    } catch (e: any) {
      log(`Open conversation failed: ${e?.message || String(e)}`, 'err');
    }
  };

  const restGetMessages = async () => {
    try {
      const convId = Number(conversationId);
      if (!convId) return log('Enter conversationId');
      const res = await getConversationMessages(convId, { take: 50 });
      const data = (res as any)?.data ?? res;
      log(`Messages[${Array.isArray(data) ? data.length : 'unknown'}]: ${JSON.stringify(data)}`);
    } catch (e: any) {
      log(`Get messages failed: ${e?.message || String(e)}`, 'err');
    }
  };

  useEffect(() => {
    // Prefill sender with current auth user id if available
    getAuthUser<any>().then((u) => {
      const uid = u?.userId || u?.id;
      if (uid) setSenderUserId(String(uid));
    }).catch(() => {});
    return () => {
      const conn = connectionRef.current;
      connectionRef.current = null;
      if (conn) conn.stop().catch(() => {});
    };
  }, []);

  useEffect(() => {
    if (!autoScroll) return;
    // Scroll to bottom when logs change
    requestAnimationFrame(() => {
      logRef.current?.scrollToEnd({ animated: true });
    });
  }, [logLines, autoScroll]);

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 24 }} keyboardShouldPersistTaps="handled" nestedScrollEnabled>
      <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 4 }}>ChatHub Tester</Text>

      {/* Connection */}
      <View style={{ gap: 8 }}>
        <TextInput
          placeholder="Base URL (e.g. https://alhal.awnak.net)"
          value={baseUrl}
          onChangeText={setBaseUrl}
          autoCapitalize="none"
          style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10 }}
        />
        <TextInput
          placeholder="JWT (optional)"
          value={jwt}
          onChangeText={setJwt}
          autoCapitalize="none"
          style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10 }}
        />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity onPress={connect} disabled={connected} style={{ flex: 1, backgroundColor: connected ? '#94a3b8' : '#16a34a', padding: 10, borderRadius: 8 }}>
            <Text style={{ color: 'white', textAlign: 'center', fontWeight: '600' }}>Connect</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={disconnect} disabled={!connected} style={{ flex: 1, backgroundColor: !connected ? '#94a3b8' : '#dc2626', padding: 10, borderRadius: 8 }}>
            <Text style={{ color: 'white', textAlign: 'center', fontWeight: '600' }}>Disconnect</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Conversation */}
      <View style={{ gap: 8 }}>
        <TextInput
          placeholder="Conversation Id"
          keyboardType="numeric"
          value={conversationId}
          onChangeText={setConversationId}
          style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10 }}
        />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity onPress={joinConv} style={{ flex: 1, backgroundColor: '#3b82f6', padding: 10, borderRadius: 8 }}>
            <Text style={{ color: 'white', textAlign: 'center', fontWeight: '600' }}>Join Conversation</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={leaveConv} style={{ flex: 1, backgroundColor: '#ef4444', padding: 10, borderRadius: 8 }}>
            <Text style={{ color: 'white', textAlign: 'center', fontWeight: '600' }}>Leave Conversation</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={quickStart} style={{ backgroundColor: '#16a34a', padding: 10, borderRadius: 8 }}>
          <Text style={{ color: 'white', textAlign: 'center', fontWeight: '700' }}>Quick Start: Connect → Join → Send</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={autofillFromLatestOrder} style={{ backgroundColor: '#2563eb', padding: 10, borderRadius: 8 }}>
          <Text style={{ color: 'white', textAlign: 'center', fontWeight: '700' }}>Autofill from my latest direct order</Text>
        </TouchableOpacity>
      </View>

      {/* Send Message */}
      <View style={{ gap: 8 }}>
        <TextInput
          placeholder="Sender User Id"
          keyboardType="numeric"
          value={senderUserId}
          onChangeText={setSenderUserId}
          style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10 }}
        />
        <TextInput
          placeholder="Body"
          value={body}
          onChangeText={setBody}
          style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10 }}
        />
        <TouchableOpacity onPress={sendMsg} style={{ backgroundColor: '#6366f1', padding: 10, borderRadius: 8 }}>
          <Text style={{ color: 'white', textAlign: 'center', fontWeight: '600' }}>Send</Text>
        </TouchableOpacity>
      </View>

      {/* Read */}
      <View style={{ gap: 8 }}>
        <TouchableOpacity onPress={markRead} style={{ backgroundColor: '#0ea5e9', padding: 10, borderRadius: 8 }}>
          <Text style={{ color: 'white', textAlign: 'center', fontWeight: '600' }}>Mark As Read</Text>
        </TouchableOpacity>
      </View>

      {/* REST helpers */}
      <View style={{ gap: 8 }}>
        <Text style={{ fontSize: 16, fontWeight: '700' }}>REST</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TextInput
            placeholder="contextType (e.g. order|logistics)"
            value={ctxType}
            onChangeText={setCtxType}
            autoCapitalize="none"
            style={{ flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10 }}
          />
          <TextInput
            placeholder="contextId"
            value={ctxId}
            onChangeText={setCtxId}
            keyboardType="numeric"
            style={{ width: 120, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10 }}
          />
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TextInput
            placeholder="buyerUserId (optional)"
            value={buyerUserId}
            onChangeText={setBuyerUserId}
            keyboardType="numeric"
            style={{ flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10 }}
          />
          <TextInput
            placeholder="sellerUserId (optional)"
            value={sellerUserId}
            onChangeText={setSellerUserId}
            keyboardType="numeric"
            style={{ flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10 }}
          />
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity onPress={restOpenConversation} style={{ flex: 1, backgroundColor: '#0d9488', padding: 10, borderRadius: 8 }}>
            <Text style={{ color: 'white', textAlign: 'center', fontWeight: '600' }}>Open Conversation (REST)</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={restGetMessages} style={{ flex: 1, backgroundColor: '#0ea5e9', padding: 10, borderRadius: 8 }}>
            <Text style={{ color: 'white', textAlign: 'center', fontWeight: '600' }}>Get Messages (REST)</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={openJoinSendFromContext} style={{ backgroundColor: '#16a34a', padding: 10, borderRadius: 8 }}>
          <Text style={{ color: 'white', textAlign: 'center', fontWeight: '700' }}>Open + Join + Send (from REST context)</Text>
        </TouchableOpacity>
      </View>

      {/* Log */}
      <View style={{ gap: 8, height: 300 }}>
        <Text style={{ fontSize: 16, fontWeight: '700' }}>Log</Text>
        <ScrollView ref={logRef} nestedScrollEnabled style={{ flex: 1, borderWidth: 1, borderColor: '#eee', borderRadius: 8, padding: 8 }} onContentSizeChange={() => { if (autoScroll) logRef.current?.scrollToEnd({ animated: true }); }}>
          {logLines.map((line, idx) => (
            <Text key={idx} style={{ color: '#374151', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', marginBottom: 2 }}>{line}</Text>
          ))}
        </ScrollView>
        <TouchableOpacity onPress={() => logRef.current?.scrollToEnd({ animated: true })} style={{ alignSelf: 'flex-end', backgroundColor: '#9ca3af', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 }}>
          <Text style={{ color: 'white', fontWeight: '600' }}>Scroll to bottom</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}


