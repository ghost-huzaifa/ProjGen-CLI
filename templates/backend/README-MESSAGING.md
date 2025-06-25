# Real-Time Messaging System

This document provides a guide on how to use the real-time messaging system in your Angular frontend application.

## Overview

The messaging system provides the following features:
- Direct (1-on-1) and group conversations
- Real-time message delivery via WebSockets
- Online status indicators
- Read receipts
- Typing indicators
- Cursor-based pagination for conversations and messages
- Message reactions
- File attachments

## Required Dependencies

Install the following packages in your Angular project:

```bash
yarn add socket.io-client ngx-socket-io ng-lazyload-image
```

## Configuration

1. Add Socket.IO to your Angular app module:

```typescript
// app.module.ts
import { SocketIoModule, SocketIoConfig } from 'ngx-socket-io';

const socketConfig: SocketIoConfig = {
  url: 'http://localhost:3000/messages', // Your server URL with namespace
  options: {
    autoConnect: false
  }
};

@NgModule({
  imports: [
    // ...
    SocketIoModule.forRoot(socketConfig)
  ],
  // ...
})
export class AppModule { }
```

## Setup Socket Authentication Service

Create a service to handle WebSocket authentication:

```typescript
// socket.service.ts
import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { AuthService } from './auth.service';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  constructor(
    private socket: Socket,
    private authService: AuthService
  ) {}

  connect(): void {
    if (!this.socket.ioSocket.connected) {
      // Set auth token before connecting
      this.socket.ioSocket.auth = {
        token: this.authService.getAccessToken()
      };
      this.socket.connect();
    }
  }

  disconnect(): void {
    this.socket.disconnect();
  }

  // Generic emit method
  emit(event: string, data: any): void {
    this.socket.emit(event, data);
  }

  // Listen to an event
  on<T>(event: string): Observable<T> {
    return this.socket.fromEvent<T>(event);
  }

  // Join a conversation
  joinConversation(conversationId: string): void {
    this.emit('conversation:join', conversationId);
  }

  // Leave a conversation
  leaveConversation(conversationId: string): void {
    this.emit('conversation:leave', conversationId);
  }

  // Send a message
  sendMessage(message: any): Observable<any> {
    return new Observable(observer => {
      this.socket.emit('message:send', message, (response: any) => {
        if (response.success) {
          observer.next(response.message);
        } else {
          observer.error(response.error);
        }
        observer.complete();
      });
    });
  }

  // Update typing status
  updateTyping(conversationId: string, isTyping: boolean): void {
    this.emit('typing:update', {
      conversationId,
      isTyping,
      userId: this.authService.getCurrentUserId()
    });
  }

  // Mark message as read
  markAsRead(conversationId: string, messageId: string): void {
    this.emit('message:read', {
      conversationId,
      messageId,
      userId: this.authService.getCurrentUserId(),
      readAt: new Date()
    });
  }
}
```

## Create Messaging Service

Create a service to handle messaging API calls:

```typescript
// messaging.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class MessagingService {
  private apiUrl = `${environment.apiUrl}/messaging`;

  constructor(private http: HttpClient) {}

  // Create a new conversation
  createConversation(data: {
    participantIds: string[];
    isGroup?: boolean;
    groupName?: string;
    groupAvatar?: string;
    initialMessage?: string;
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/conversations`, data);
  }

  // Get all conversations for current user
  getConversations(limit?: number, cursor?: string): Observable<any> {
    let url = `${this.apiUrl}/conversations`;
    const params: any = {};
    
    if (limit) params.limit = limit;
    if (cursor) params.cursor = cursor;
    
    return this.http.get(url, { params });
  }

  // Get a conversation by ID
  getConversation(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/conversations/${id}`);
  }

  // Get messages from a conversation
  getMessages(conversationId: string, limit?: number, cursor?: string): Observable<any> {
    let url = `${this.apiUrl}/conversations/${conversationId}/messages`;
    const params: any = {};
    
    if (limit) params.limit = limit;
    if (cursor) params.cursor = cursor;
    
    return this.http.get(url, { params });
  }

  // Send a message through HTTP (as backup for socket)
  sendMessage(conversationId: string, data: {
    content: string;
    contentType?: string;
    replyToId?: string;
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/conversations/${conversationId}/messages`, data);
  }

  // Mark conversation as read
  markConversationAsRead(conversationId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/conversations/${conversationId}/read`, {});
  }

  // Get user online status
  getUserOnlineStatus(userId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/online-status/${userId}`);
  }

  // Get multiple users' online status
  getBulkOnlineStatus(userIds: string[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/online-status/bulk`, { userIds });
  }
}
```

## Using the Messaging Services in Components

Here's an example of a conversation list component:

```typescript
// conversation-list.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { MessagingService } from '../services/messaging.service';
import { SocketService } from '../services/socket.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-conversation-list',
  templateUrl: './conversation-list.component.html',
  styleUrls: ['./conversation-list.component.scss']
})
export class ConversationListComponent implements OnInit, OnDestroy {
  conversations: any[] = [];
  loading = false;
  hasMore = false;
  nextCursor?: string;
  private subscriptions: Subscription[] = [];

  constructor(
    private messagingService: MessagingService,
    private socketService: SocketService
  ) {}

  ngOnInit(): void {
    this.socketService.connect();
    this.loadConversations();
    this.setupSocketListeners();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadConversations(limit = 20): void {
    this.loading = true;
    
    this.messagingService.getConversations(limit, this.nextCursor)
      .subscribe({
        next: (response) => {
          if (this.nextCursor) {
            this.conversations = [...this.conversations, ...response.data];
          } else {
            this.conversations = response.data;
          }
          
          this.hasMore = response.meta.hasMore;
          this.nextCursor = response.meta.nextCursor;
          this.loading = false;
        },
        error: (error) => {
          console.error('Failed to load conversations', error);
          this.loading = false;
        }
      });
  }

  loadMore(): void {
    if (this.hasMore && !this.loading) {
      this.loadConversations();
    }
  }

  setupSocketListeners(): void {
    // Handle new messages
    const messageSub = this.socketService.on<any>('message:new')
      .subscribe(message => {
        // Find the conversation and update it
        const conversation = this.conversations.find(c => c.id === message.conversationId);
        if (conversation) {
          conversation.lastMessage = message;
          conversation.lastMessageAt = message.createdAt;
          
          // Increment unread count if message is not from current user
          if (message.senderId !== this.getCurrentUserId()) {
            conversation.unreadCount = (conversation.unreadCount || 0) + 1;
          }
          
          // Move conversation to top of list
          this.conversations = [
            conversation,
            ...this.conversations.filter(c => c.id !== conversation.id)
          ];
        }
      });
    
    // Handle online status updates
    const statusSub = this.socketService.on<any>('user:status')
      .subscribe(status => {
        // Update status for all affected conversations
        this.conversations.forEach(conv => {
          const participant = conv.participants?.find(p => p.userId === status.userId);
          if (participant) {
            participant.isOnline = status.isOnline;
            participant.lastSeen = status.lastSeen;
          }
        });
      });
    
    // Handle read receipts
    const readSub = this.socketService.on<any>('message:read')
      .subscribe(data => {
        const conversation = this.conversations.find(c => c.id === data.conversationId);
        if (conversation) {
          // If the current user sent the last message and someone else read it
          if (conversation.lastMessage?.senderId === this.getCurrentUserId() 
              && data.userId !== this.getCurrentUserId()) {
            // Update read status
            conversation.lastMessage.readBy = [
              ...(conversation.lastMessage.readBy || []),
              { userId: data.userId, readAt: data.timestamp }
            ];
          }
        }
      });
    
    this.subscriptions.push(messageSub, statusSub, readSub);
  }

  getCurrentUserId(): string {
    // Replace with actual implementation from your auth service
    return 'current-user-id';
  }
}
```

## Conversation Component

Example of a conversation component:

```typescript
// conversation.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MessagingService } from '../services/messaging.service';
import { SocketService } from '../services/socket.service';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-conversation',
  templateUrl: './conversation.component.html',
  styleUrls: ['./conversation.component.scss']
})
export class ConversationComponent implements OnInit, OnDestroy {
  conversationId!: string;
  conversation: any;
  messages: any[] = [];
  loading = false;
  hasMore = false;
  nextCursor?: string;
  messageContent = '';
  typingUsers: Set<string> = new Set();
  private typingSubject = new Subject<boolean>();
  private subscriptions: Subscription[] = [];

  constructor(
    private route: ActivatedRoute,
    private messagingService: MessagingService,
    private socketService: SocketService
  ) {}

  ngOnInit(): void {
    this.conversationId = this.route.snapshot.paramMap.get('id') || '';
    
    this.socketService.connect();
    this.loadConversation();
    this.loadMessages();
    this.setupSocketListeners();
    
    // Handle typing indicator with debounce
    const typingSub = this.typingSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(isTyping => {
      this.socketService.updateTyping(this.conversationId, isTyping);
    });
    
    this.subscriptions.push(typingSub);
  }

  ngOnDestroy(): void {
    // Leave conversation room when component is destroyed
    this.socketService.leaveConversation(this.conversationId);
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadConversation(): void {
    this.messagingService.getConversation(this.conversationId)
      .subscribe({
        next: (data) => {
          this.conversation = data;
          // Join the conversation room
          this.socketService.joinConversation(this.conversationId);
        },
        error: (error) => {
          console.error('Failed to load conversation', error);
        }
      });
  }

  loadMessages(limit = 20): void {
    this.loading = true;
    
    this.messagingService.getMessages(this.conversationId, limit, this.nextCursor)
      .subscribe({
        next: (response) => {
          const newMessages = response.data;
          
          if (this.nextCursor) {
            this.messages = [...this.messages, ...newMessages];
          } else {
            this.messages = newMessages;
          }
          
          this.hasMore = response.meta.hasMore;
          this.nextCursor = response.meta.nextCursor;
          this.loading = false;
          
          // Mark as read
          this.markAsRead();
        },
        error: (error) => {
          console.error('Failed to load messages', error);
          this.loading = false;
        }
      });
  }

  loadMoreMessages(): void {
    if (this.hasMore && !this.loading) {
      this.loadMessages();
    }
  }

  sendMessage(): void {
    if (!this.messageContent.trim()) return;
    
    const message = {
      content: this.messageContent,
      conversationId: this.conversationId
    };
    
    // Reset input
    this.messageContent = '';
    
    // Send via socket
    this.socketService.sendMessage(message)
      .subscribe({
        next: (response) => {
          // The socket will broadcast the message to all participants
          // including the sender, so no need to manually add it here
        },
        error: (error) => {
          console.error('Failed to send message', error);
          // Fallback to HTTP
          this.messagingService.sendMessage(this.conversationId, message)
            .subscribe();
        }
      });
    
    // Clear typing indicator
    this.typingSubject.next(false);
  }

  markAsRead(): void {
    if (this.messages.length > 0) {
      this.messagingService.markConversationAsRead(this.conversationId)
        .subscribe();
      
      // Emit read receipt for last message
      const lastMsg = this.messages[0]; // Messages are ordered newest first
      if (lastMsg) {
        this.socketService.markAsRead(this.conversationId, lastMsg.id);
      }
    }
  }

  onTyping(): void {
    this.typingSubject.next(true);
  }

  setupSocketListeners(): void {
    // Handle new messages
    const messageSub = this.socketService.on<any>('message:new')
      .subscribe(message => {
        if (message.conversationId === this.conversationId) {
          // Add message to the beginning (messages are ordered newest first)
          this.messages = [message, ...this.messages];
          
          // Mark message as read if it's not from current user
          if (message.senderId !== this.getCurrentUserId()) {
            this.socketService.markAsRead(this.conversationId, message.id);
          }
          
          // Clear typing indicator for the sender
          this.typingUsers.delete(message.senderId);
        }
      });
    
    // Handle typing indicators
    const typingSub = this.socketService.on<any>('typing:updated')
      .subscribe(data => {
        if (data.conversationId === this.conversationId && 
            data.userId !== this.getCurrentUserId()) {
          if (data.isTyping) {
            this.typingUsers.add(data.userId);
          } else {
            this.typingUsers.delete(data.userId);
          }
        }
      });
    
    // Handle read receipts
    const readSub = this.socketService.on<any>('message:read')
      .subscribe(data => {
        if (data.conversationId === this.conversationId) {
          // Update read receipts for messages in the conversation
          this.messages.forEach(msg => {
            if (msg.senderId === this.getCurrentUserId() && 
                data.userId !== this.getCurrentUserId()) {
              msg.readBy = [
                ...(msg.readBy || []),
                { userId: data.userId, readAt: data.timestamp }
              ];
            }
          });
        }
      });
    
    this.subscriptions.push(messageSub, typingSub, readSub);
  }

  getCurrentUserId(): string {
    // Replace with actual implementation from your auth service
    return 'current-user-id';
  }

  getTypingDisplayNames(): string {
    if (this.typingUsers.size === 0) return '';
    
    const typingUserIds = Array.from(this.typingUsers);
    const typingParticipants = this.conversation?.participants
      .filter((p: any) => typingUserIds.includes(p.userId)) || [];
    
    const names = typingParticipants.map((p: any) => 
      `${p.firstName || ''} ${p.lastName || ''}`.trim() || 'Someone');
    
    if (names.length === 1) {
      return `${names[0]} is typing...`;
    } else if (names.length === 2) {
      return `${names[0]} and ${names[1]} are typing...`;
    } else {
      return `${names.length} people are typing...`;
    }
  }
}
```

## HTML Templates (Basic Examples)

### Conversation List

```html
<!-- conversation-list.component.html -->
<div class="conversation-list">
  <h2>Messages</h2>
  
  <div class="conversation-items">
    <ng-container *ngIf="conversations.length > 0; else noConversations">
      <div 
        *ngFor="let conv of conversations" 
        class="conversation-item"
        [routerLink]="['/messages', conv.id]"
      >
        <!-- Avatar/Icon -->
        <div class="avatar">
          <img *ngIf="conv.isGroup && conv.groupAvatar" [src]="conv.groupAvatar" alt="Group">
          <img *ngIf="!conv.isGroup && conv.participants[0]?.avatar" [src]="conv.participants[0].avatar" alt="User">
          <div *ngIf="!conv.isGroup && !conv.participants[0]?.avatar" class="avatar-placeholder">
            {{ getInitials(conv.participants[0]) }}
          </div>
          <div *ngIf="conv.isGroup && !conv.groupAvatar" class="avatar-placeholder group">
            <i class="fa fa-users"></i>
          </div>
          <span class="status-indicator" [class.online]="isOtherParticipantOnline(conv)"></span>
        </div>
        
        <!-- Content -->
        <div class="content">
          <div class="header">
            <h3 class="name">{{ getConversationName(conv) }}</h3>
            <span class="time">{{ conv.lastMessageAt | timeAgo }}</span>
          </div>
          <div class="preview">
            <p>{{ conv.lastMessage?.content || 'No messages yet' }}</p>
            <span *ngIf="conv.unreadCount" class="unread-badge">{{ conv.unreadCount }}</span>
          </div>
        </div>
      </div>
      
      <!-- Load more button -->
      <button 
        *ngIf="hasMore" 
        (click)="loadMore()" 
        class="load-more"
        [disabled]="loading"
      >
        {{ loading ? 'Loading...' : 'Load More' }}
      </button>
    </ng-container>
    
    <ng-template #noConversations>
      <div class="empty-state" *ngIf="!loading">
        <p>No conversations yet</p>
        <button routerLink="/messages/new">Start a Conversation</button>
      </div>
    </ng-template>
    
    <div class="loading" *ngIf="loading && conversations.length === 0">
      <p>Loading conversations...</p>
    </div>
  </div>
</div>
```

### Conversation View

```html
<!-- conversation.component.html -->
<div class="conversation-container">
  <!-- Header -->
  <div class="conversation-header">
    <div class="back-button" routerLink="/messages">
      <i class="fa fa-arrow-left"></i>
    </div>
    
    <div class="conversation-info">
      <h2>{{ getConversationName() }}</h2>
      <div class="participants">
        <span *ngIf="conversation?.isGroup">{{ conversation?.participants?.length }} participants</span>
        <span *ngIf="!conversation?.isGroup && isOtherParticipantOnline()">Online</span>
        <span *ngIf="!conversation?.isGroup && !isOtherParticipantOnline()">
          Last seen {{ getOtherParticipant()?.lastSeen | timeAgo }}
        </span>
      </div>
    </div>
    
    <div class="actions">
      <button class="info-button">
        <i class="fa fa-info-circle"></i>
      </button>
    </div>
  </div>
  
  <!-- Messages -->
  <div class="messages-container" #messagesContainer>
    <!-- Load more button -->
    <button 
      *ngIf="hasMore" 
      (click)="loadMoreMessages()" 
      class="load-more-messages"
      [disabled]="loading"
    >
      {{ loading ? 'Loading...' : 'Load Earlier Messages' }}
    </button>
    
    <!-- Messages list -->
    <div class="messages-list">
      <div *ngIf="loading && messages.length === 0" class="loading-messages">
        Loading messages...
      </div>
      
      <div *ngIf="!loading && messages.length === 0" class="no-messages">
        No messages yet. Start the conversation!
      </div>
      
      <div 
        *ngFor="let message of messages" 
        class="message-item"
        [class.own-message]="message.senderId === getCurrentUserId()"
      >
        <!-- Message bubble -->
        <div class="message-bubble">
          <!-- Sender name for group chats -->
          <div *ngIf="conversation?.isGroup && message.senderId !== getCurrentUserId()" class="sender-name">
            {{ getSenderName(message.senderId) }}
          </div>
          
          <!-- Reply reference if this is a reply -->
          <div *ngIf="message.replyToId" class="reply-preview">
            {{ getReplyPreview(message.replyToId) }}
          </div>
          
          <!-- Message content based on type -->
          <ng-container [ngSwitch]="message.contentType">
            <!-- Text message -->
            <div *ngSwitchCase="'TEXT'" class="message-text">
              {{ message.content }}
            </div>
            
            <!-- Image message -->
            <div *ngSwitchCase="'IMAGE'" class="message-image">
              <img [lazyLoad]="message.content" [alt]="'Image sent by ' + getSenderName(message.senderId)">
            </div>
            
            <!-- Other message types... -->
            <div *ngSwitchDefault class="message-text">
              {{ message.content }}
            </div>
          </ng-container>
          
          <!-- Attachments -->
          <div *ngIf="message.attachments && message.attachments.length > 0" class="attachments">
            <div *ngFor="let attachment of message.attachments" class="attachment-item">
              <!-- File attachment preview based on type -->
              <!-- ... -->
            </div>
          </div>
          
          <!-- Message metadata -->
          <div class="message-meta">
            <span class="time">{{ message.createdAt | timeAgo }}</span>
            <span *ngIf="message.isEdited" class="edited-tag">Edited</span>
            
            <!-- Read status indicator -->
            <span 
              *ngIf="message.senderId === getCurrentUserId()" 
              class="read-status"
              [class.read]="isMessageReadByAll(message)"
            >
              <i class="fa" [class.fa-check]="!isMessageReadByAll(message)" [class.fa-check-double]="isMessageReadByAll(message)"></i>
            </span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Typing indicator -->
    <div *ngIf="typingUsers.size > 0" class="typing-indicator">
      {{ getTypingDisplayNames() }}
    </div>
  </div>
  
  <!-- Message input -->
  <div class="message-input-container">
    <div class="attachments-button">
      <i class="fa fa-paperclip"></i>
    </div>
    
    <div class="input-area">
      <textarea 
        [(ngModel)]="messageContent" 
        placeholder="Type a message..."
        (input)="onTyping()"
        (keydown.enter)="$event.preventDefault(); sendMessage()"
      ></textarea>
    </div>
    
    <div class="send-button" (click)="sendMessage()">
      <i class="fa" [class.fa-paper-plane]="messageContent.trim()" [class.fa-microphone]="!messageContent.trim()"></i>
    </div>
  </div>
</div>
```

## Deployment Recommendations

1. **WebSocket Scaling**:
   - Use Redis adapter for Socket.IO when deploying to multiple nodes
   - Configure sticky sessions at the load balancer level

2. **HTTP Fallback**:
   - Socket.IO automatically falls back to long-polling if WebSockets are not available
   - Always provide HTTP API equivalents for critical socket operations

3. **Rate Limiting**:
   - Implement rate limiting for message sending to prevent abuse
   - Configure appropriate timeouts for typing indicators

4. **Error Handling**:
   - Implement proper error handling in the frontend for socket connection issues
   - Provide fallback UI for when real-time features are unavailable 