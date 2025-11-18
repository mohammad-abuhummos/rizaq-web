import { http } from '../utils/http';

export type SendMessageDto = {
  conversationId: number;
  senderUserId: number;
  body: string;
};

export type ChatConversationSummary = {
  conversationId: number;
  contextType: string;
  contextId: number;
  status: string;
  openedAt: string;
  updatedAt?: string;
  lastMessageBody?: string | null;
  lastMessageAt?: string | null;
  unreadCount?: number;
  counterpartName?: string | null;
  counterpartUserId?: number;
  buyerUserId?: number;
  sellerUserId?: number;
};

export type ChatConversation = {
  conversationId: number;
  contextType: string;
  contextId: number;
  status: string;
  openedAt: string;
  updatedAt?: string;
  closedAt?: string;
  transportAssigned?: boolean;
};

export type ChatMessage = {
  messageId: number;
  conversationId: number;
  senderUserId: number;
  body: string;
  isSystem: boolean;
  sentAt: string;
  attachments?: any[];
};

export type ChatMessagesPage = {
  items: ChatMessage[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
};

export async function openConversation(
  contextType: string,
  contextId: number,
  opts?: { buyerUserId?: number; sellerUserId?: number }
) {
  const query: string[] = [];
  if (opts?.buyerUserId) query.push(`buyerUserId=${encodeURIComponent(String(opts.buyerUserId))}`);
  if (opts?.sellerUserId) query.push(`sellerUserId=${encodeURIComponent(String(opts.sellerUserId))}`);
  const q = query.length ? `?${query.join('&')}` : '';
  return http.post<any>(`/api/chat/open/${encodeURIComponent(contextType)}/${encodeURIComponent(String(contextId))}${q}`);
}

export async function sendMessage(dto: SendMessageDto) {
  return http.post<any>('/api/chat/messages', dto);
}

export async function getConversationMessages(
  conversationId: number,
  params?: { afterMessageId?: number; take?: number; page?: number; pageSize?: number }
) {
  const query: string[] = [];
  if (params?.afterMessageId !== undefined) query.push(`afterMessageId=${encodeURIComponent(String(params.afterMessageId))}`);
  if (params?.take !== undefined) query.push(`take=${encodeURIComponent(String(params.take))}`);
  if (params?.page !== undefined) query.push(`page=${encodeURIComponent(String(params.page))}`);
  if (params?.pageSize !== undefined) query.push(`pageSize=${encodeURIComponent(String(params.pageSize))}`);
  const q = query.length ? `?${query.join('&')}` : '';
  return http.get<ChatMessagesPage>(`/api/chat/conversations/${encodeURIComponent(String(conversationId))}/messages${q}`);
}

export async function getByAuction(auctionId: number) {
  return http.get<any>(`/api/chat/by-auction/${encodeURIComponent(String(auctionId))}`);
}

export async function getConversation(conversationId: number) {
  return http.get<ChatConversation>(`/api/chat/conversations/${encodeURIComponent(String(conversationId))}`, {
    headers: { accept: '*/*' },
  });
}

export async function listUserConversations(
  userId: number,
  params?: { status?: string }
) {
  const query: string[] = [];
  if (userId) {
    query.push(`userId=${encodeURIComponent(String(userId))}`);
  }
  if (params?.status) {
    query.push(`status=${encodeURIComponent(params.status)}`);
  }
  const q = query.length ? `?${query.join('&')}` : '';
  return http.get<ChatConversationSummary[]>(`/api/chat/conversations${q}`, {
    headers: { accept: '*/*' },
  });
}

