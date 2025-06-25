export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  FILE = 'FILE',
  LOCATION = 'LOCATION',
  CONTACT = 'CONTACT',
  SYSTEM = 'SYSTEM',
}

export interface Message {
  id: string;
  content: string;
  contentType: MessageType;
  senderId: string;
  senderName: string;
  conversationId: string;
  createdAt: Date;
  replyToId?: string;
  attachments?: Attachment[];
  isEdited: boolean;
  isDeleted?: boolean;
  readBy?: ReadReceipt[];
}

export interface Attachment {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  filePath: string;
  thumbnailPath?: string;
}

export interface ReadReceipt {
  userId: string;
  readAt: Date;
}

export interface Conversation {
  id: string;
  participants: ConversationParticipant[];
  lastMessage?: Message;
  lastMessageAt: Date;
  unreadCount: number;
  isGroup: boolean;
  groupName?: string;
  groupAvatar?: string;
}

export interface ConversationParticipant {
  id: string;
  userId: string;
  firstName?: string;
  lastName?: string;
  isAdmin: boolean;
  isOnline: boolean;
  lastSeen?: Date;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    hasMore: boolean;
    nextCursor?: string;
  };
}

// DTOs
export interface CreateConversationDto {
  participantIds: string[];
  isGroup: boolean;
  groupName?: string;
  groupAvatar?: string;
  initialMessage?: string;
}

export interface CreateMessageDto {
  content: string;
  contentType?: MessageType;
  conversationId: string;
  replyToId?: string;
  attachments?: any[]; // For file uploads
}

// Real-time events
export interface TypingEvent {
  userId: string;
  conversationId: string;
  isTyping: boolean;
}

export interface OnlineStatusEvent {
  userId: string;
  isOnline: boolean;
  lastSeen?: Date;
} 