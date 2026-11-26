
export interface Conversation {
  id: string;
  participants: string[];
  createdAt: string;
}

export interface ConversationResponse {
  success: boolean;
  message: string;
  conversation: Conversation;
}

export interface ChatMessage {
  id: string;
  conversationId: string;

  sender: {
    id: string;
    name: string;
  };

  receiver: {
    id: string;
    name: string;
  };

  content: string;
  readAt: string | null;
  createdAt: string;
}

export interface MessagesResponse {
  success: boolean;
  message: string;
  count: number;
  messages: ChatMessage[];
}

export interface SendMessagePayload {
  conversationId: string;
  content: string;
}

export interface SocketAck {
  success: boolean;
  message?: string | ChatMessage;
  conversationId?: string;
}
