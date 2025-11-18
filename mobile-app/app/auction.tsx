import { getApiBaseUrl } from "@/utils/config";
import {
  HubConnection,
  HubConnectionBuilder,
  LogLevel,
} from "@microsoft/signalr";
import { AppState } from "react-native";
import { Stack } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { FlatList } from "react-native-gesture-handler";

type PriceTickPayload = {
  auctionId?: number;
  currentPrice?: number;
  status?: string;
  timestamp?: string;
  [key: string]: any;
};

type GenericPayload = Record<string, any>;

export default function AuctionScreen() {
  const [auctionId, setAuctionId] = useState<string>("46");
  const [userId, setUserId] = useState<string>("6");
  const [bidAmount, setBidAmount] = useState<string>("200");
  const [connected, setConnected] = useState<boolean>(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number | undefined>(
    undefined
  );
  const [auctionStatus, setAuctionStatus] = useState<string | undefined>(
    undefined
  );
  const [joined, setJoined] = useState<boolean>(false);
  const connectionRef = useRef<HubConnection | null>(null);
  const [minIncrement, setMinIncrement] = useState<number | undefined>(
    undefined
  );
  const [bids, setBids] = useState<
    { price: number; minIncrement?: number; status?: string; time: string }[]
  >([]);

  const baseUrl = getApiBaseUrl();
  const hubUrl = useMemo(() => `${baseUrl}/hubs/auctions`, [baseUrl]);

  const appendLog = useCallback((message: string) => {
    setLogs((prev) => {
      const now = new Date().toLocaleTimeString();
      return [...prev, `[${now}] ${message}`];
    });
  }, []);

  const startConnection = useCallback(async () => {
    if (connectionRef.current) return;

    const conn = new HubConnectionBuilder()
      .withUrl(hubUrl)
      .configureLogging(LogLevel.Information)
      .withAutomaticReconnect([0, 2000, 10000, 30000])
      .build();

    // Tune keepAlive/server timeouts for mobile networks
    // @ts-ignore
    conn.serverTimeoutInMilliseconds = 60000;
    // @ts-ignore
    conn.keepAliveIntervalInMilliseconds = 15000;

    conn.onclose(() => {
      setConnected(false);
      setJoined(false);
      setCurrentPrice(undefined);
      setAuctionStatus(undefined);
      appendLog("Connection closed");
    });

    // Event listeners
    conn.on("BidPlaced", (payload: GenericPayload) => {
      appendLog(`New bid placed: ${JSON.stringify(payload)}`);
    });
    // Some servers emit lower/upper-case variants
    conn.on("ReceiveReminder", (p: any) =>
      appendLog(`ReceiveReminder: ${JSON.stringify(p)}`)
    );
    conn.on("receivereminder", (p: any) =>
      appendLog(`receivereminder: ${JSON.stringify(p)}`)
    );

    conn.on("AuctionUpdated", (payload: GenericPayload) => {
      appendLog(`Auction updated: ${JSON.stringify(payload)}`);
    });

    conn.on("BuyNowExecuted", (payload: GenericPayload) => {
      appendLog(`BuyNow executed: ${JSON.stringify(payload)}`);
    });

    conn.on("PriceTick", (payload: PriceTickPayload) => {
      if (typeof payload?.currentPrice === "number") {
        setCurrentPrice(payload.currentPrice);
        setMinIncrement(payload.minIncrement);
        setBids((prev) => [
          ...prev,
          {
            price: payload.currentPrice,
            minIncrement: payload.minIncrement,
            status: payload.status,
            time: new Date().toLocaleTimeString(),
          },
        ]);
      }
      if (typeof payload?.status === "string") {
        setAuctionStatus(payload.status);
      }
      console.log("Price tick: ", payload);
      console.log("payload.minIncrement", payload.minIncrement);

      appendLog(`Price tick: ${JSON.stringify(payload)}`);
    });

    conn.on("Error", (err: any) => {
      console.log(err);
      appendLog(`Error: ${JSON.stringify(err)}`);
    });

    try {
      await conn.start();
      connectionRef.current = conn;
      setConnected(true);
      appendLog("Connected to AuctionsHub");
    } catch (error: any) {
      appendLog(`Connection error: ${error?.message || String(error)}`);
      // Retry after delay
      setTimeout(() => {
        connectionRef.current = null;
        startConnection();
      }, 3000);
    }
  }, [appendLog, hubUrl]);

  useEffect(() => {
    startConnection();
    const sub = AppState.addEventListener("change", (state) => {
      if (state !== "active") {
        const c = connectionRef.current;
        connectionRef.current = null;
        if (c) c.stop().catch(() => {});
      } else {
        startConnection();
      }
    });
    return () => {
      const conn = connectionRef.current;
      connectionRef.current = null;
      if (conn) {
        conn.stop().catch((error: any) => {
          console.log("Stop connection: ", error);
        });
      }
      try {
        sub.remove();
      } catch {}
    };
  }, [startConnection]);

  const joinAuction = useCallback(async () => {
    const conn = connectionRef.current;
    if (!conn) return appendLog("Connection not ready");
    try {
      await conn.invoke(
        "JoinAuction",
        parseInt(auctionId, 10),
        parseInt(userId, 10),
        null
      );

      appendLog(`Joined auction #${auctionId} as user ${userId}`);
      setJoined(true);
    } catch (error: any) {
      appendLog(`Join failed: ${error?.message || String(error)}`);
      Alert.alert("Join failed", error?.message || String(error));
    }
  }, [auctionId, userId, appendLog]);

  // Auto-join once connected
  useEffect(() => {
    if (connected && !joined) {
      joinAuction();
    }
  }, [connected, joined, joinAuction]);

  const placeBid = useCallback(async () => {
    const conn = connectionRef.current;
    if (!conn) return appendLog("Connection not ready");
    try {
      const base = typeof currentPrice === "number" ? currentPrice : 0;
      const increment = parseFloat(bidAmount);
      const finalAmount = base + (isNaN(increment) ? 0 : increment);
      const dto = {
        AuctionId: parseInt(auctionId, 10),
        BidderUserId: parseInt(userId, 10),
        bidAmount: finalAmount,
      };
      await conn.invoke("PlaceBid", dto);
      appendLog(`Bid of ${finalAmount} placed successfully.`);
    } catch (error: any) {
      console.log("Bid failed: ", error);
      appendLog(`Bid failed: ${error?.message || String(error)}`);
      Alert.alert("Bid failed", error?.message || String(error));
    }
  }, [auctionId, userId, bidAmount, currentPrice, appendLog]);

  const getCurrent = useCallback(async () => {
    const conn = connectionRef.current;
    if (!conn) return appendLog("Connection not ready");
    try {
      await conn.invoke("GetCurrentPrice", parseInt(auctionId, 10));
      appendLog(`Requested current price for auction #${auctionId}`);
    } catch (error: any) {
      appendLog(`Failed to get price: ${error?.message || String(error)}`);
      // Alert.alert('Get price failed', error?.message || String(error));
    }
  }, [auctionId, appendLog]);

  // After join, fetch current price to enable bidding
  useEffect(() => {
    if (connected && joined) {
      getCurrent();
    }
  }, [connected, joined, getCurrent]);

  const isAuctionOpen = auctionStatus === "open";
  const parsedIncrement = parseFloat(bidAmount);
  const computedBid =
    typeof currentPrice === "number" && !isNaN(parsedIncrement)
      ? currentPrice + parsedIncrement
      : undefined;
  const isBidDisabled =
    !connected || !joined || !isAuctionOpen || typeof currentPrice !== "number";

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Auction" }} />

      <View style={{ gap: 12 }}>
        <Text style={styles.heading}>Souq AlHal - Auction Socket Test</Text>

        <View
          style={{
            flexDirection: "row",
            gap: 8,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <Text style={styles.label}>Auction ID:</Text>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            value={auctionId}
            onChangeText={setAuctionId}
          />
          <Text style={styles.label}>User ID:</Text>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            value={userId}
            onChangeText={setUserId}
          />
          <TouchableOpacity
            style={[styles.button, { backgroundColor: "#166534" }]}
            onPress={joinAuction}
          >
            <Text style={styles.buttonText}>Join Auction</Text>
          </TouchableOpacity>
        </View>

        <View
          style={{
            flexDirection: "row",
            gap: 8,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <Text style={styles.label}>Bid Amount:</Text>
          <TextInput
            style={styles.input}
            keyboardType="decimal-pad"
            value={bidAmount}
            onChangeText={setBidAmount}
          />
          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor:  bidAmount < minIncrement || isBidDisabled ? "#9ca3af" : "#065f46" },
            ]}

            disabled={bidAmount < minIncrement || isBidDisabled}
            onPress={placeBid}
          >
            <Text style={styles.buttonText}>Place Bid</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: "#0e7490" }]}
            onPress={getCurrent}
          >
            <Text style={styles.buttonText}>Get Current Price</Text>
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
          <Text style={styles.status}>
            Status: {connected ? "Connected" : "Disconnected"}
          </Text>
          <Text style={styles.status}>Hub: {hubUrl}</Text>
          {typeof currentPrice === "number" && (
            <Text style={styles.status}>Current Price: {currentPrice}</Text>
          )}
          {auctionStatus && (
            <Text style={styles.status}>Auction: {auctionStatus}</Text>
          )}
          <Text style={styles.status}>Joined: {joined ? "Yes" : "No"}</Text>
          {typeof computedBid === "number" && (
            <Text style={styles.status}>Computed Bid: {computedBid}</Text>
          )}
        </View>

        <View className="mx-4 mt-6 mb-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-gray-400 text-xs">
              تم التحديث منذ دقيقتين
            </Text>
            <View className="flex-row items-center">
              <View className="w-2 h-2 bg-red-600 rounded-full mr-2 animate-pulse" />
              <Text className="text-red-600 font-bold text-sm">بث مباشر</Text>
              <Text className="text-gray-900 font-bold text-base mr-2">
                المزاد المباشر
              </Text>
            </View>
          </View>
        </View>

        {bids.length === 0 ? (
          <Text className="text-gray-500 text-center">لا يوجد مزايدات بعد</Text>
        ) : (
          <FlatList
            data={bids}
            keyExtractor={(_, index) => index.toString()}
            style={{ maxHeight: 320 }} // نفس max-h-80 تقريبا
            renderItem={({ item, index }) => (
              <View className="bg-white rounded-xl border border-amber-200 p-4 shadow-md mb-2">
                <View className="flex-row items-center justify-between">
                  <View className="w-14 h-14 bg-gradient-to-br from-amber-400 to-amber-500 rounded-xl items-center justify-center shadow-sm">
                    <Text className="text-white text-base font-bold">
                      {index + 1}
                    </Text>
                  </View>

                  <View className="flex-1 items-center">
                    <Text className="text-gray-500 text-xs">المبلغ السابق</Text>
                    <Text className="text-gray-700 font-bold text-sm mt-1">
                      {index > 0 ? bids[index - 1].price : "—"}
                    </Text>
                  </View>

                  <View className="items-end">
                    <Text className="text-gray-500 text-xs mb-1">
                      المبلغ الجديد
                    </Text>
                    <Text className="text-red-600 font-bold text-lg">
                      {item.price} ل.س
                    </Text>
                    <Text className="text-gray-400 text-xs mt-1">
                      {item.time}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          />
        )}
      </View>

      <View style={styles.logBox}>
        <Text style={styles.logTitle}>Log</Text>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingVertical: 8 }}
        >
          {logs.map((line, idx) => (
            <Text key={idx} style={styles.logLine}>
              {line}
            </Text>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 16,
    backgroundColor: "white",
  },
  heading: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  label: {
    fontSize: 14,
    color: "#111827",
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    paddingHorizontal: 10,
    paddingVertical: Platform.select({ ios: 10, android: 6, default: 8 }),
    borderRadius: 8,
    minWidth: 100,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
  },
  status: {
    color: "#065f46",
    fontWeight: "600",
  },
  logBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#f7f7f7",
  },
  logTitle: {
    fontWeight: "700",
    marginBottom: 8,
  },
  logLine: {
    color: "#065f46",
    marginBottom: 4,
  },
});
