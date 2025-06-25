export interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  timestamp: number;
  read: boolean;
  readAt?: number;
  attachments?: Attachment[];
  isDeleted?: boolean;
}

export interface Attachment {
  id: string;
  type: 'image' | 'document' | 'audio' | 'video';
  url: string;
  name: string;
  size: number;
  mimeType: string;
  thumbnailUrl?: string;
}

export interface ChatRoom {
  id: string;
  participants: string[];
  lastMessage?: Message;
  unreadCount: number;
  updatedAt: number;
  createdAt: number;
  isGroup: boolean;
  groupName?: string;
  groupAvatar?: string;
}

export interface ChatParticipant {
  id: string;
  name: string;
  avatar?: string;
  status: 'online' | 'offline' | 'away' | 'busy';
  lastSeen?: number;
}

export interface MessageReaction {
  messageId: string;
  userId: string;
  reaction: '👍' | '❤️' | '😂' | '😮' | '😢' | '😡';
  timestamp: number;
}

export interface MessageStatus {
  sent: boolean;
  delivered: boolean;
  read: boolean;
  sentAt?: number;
  deliveredAt?: number;
  readAt?: number;
} 