# Firebase Cloud Messaging (FCM) Integration Guide

This guide explains how Firebase Cloud Messaging (FCM) has been integrated into the application for push notifications.

## Overview

The notification system includes:

1. **Firebase Integration**: Set up to receive push notifications
2. **Messaging Service**: Handles token management, permissions, and notification processing
3. **Notification UI Components**: 
   - Notification Bell in navbar
   - Dedicated Notifications page
4. **Service Worker**: Handles background notifications when app is not in focus

## Configuration

Before using in production:

1. **Get FCM Credentials**:
   - Replace `REPLACE_WITH_YOUR_VAPID_KEY` in `environment.ts` with your actual VAPID key from Firebase Console
   - Generate this key in Firebase Console > Project Settings > Cloud Messaging > Web Push certificates

2. **Create App Icons**:
   - Add app icons in `src/assets/icons/` following the sizes specified in `manifest.json`

## Usage Guide

### Requesting Permission

Notification permission is automatically requested when the NotificationBellComponent initializes. You can also manually request it:

```typescript
// Inject the messaging service
constructor(private messagingService: MessagingService) {}

// Request permission
this.messagingService.requestPermission().subscribe({
  next: (token) => {
    console.log('Permission granted! Token:', token);
    // Send this token to your backend to associate with the user
  },
  error: (err) => console.error('Permission denied:', err)
});
```

### Managing Notifications

```typescript
// Get all notifications
this.messagingService.notifications$.subscribe(notifications => {
  // Process notifications
});

// Get unread count
this.messagingService.unreadCount$.subscribe(count => {
  // Update UI based on count
});

// Add a test notification
this.messagingService.sendTestNotification();

// Mark notification as read
this.messagingService.markAsRead('notification-id');

// Mark all as read
this.messagingService.markAllAsRead();

// Delete a notification
this.messagingService.deleteNotification('notification-id');

// Clear all notifications
this.messagingService.clearAllNotifications();

// Unsubscribe from notifications
this.messagingService.unsubscribe().subscribe({
  next: (success) => console.log('Unsubscribed successfully'),
  error: (err) => console.error('Failed to unsubscribe', err)
});
```

## Backend Implementation (NestJS Example)

```typescript
// notifications.service.ts
import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class NotificationsService {
  constructor() {
    // Initialize Firebase Admin
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });
    }
  }

  async sendNotification(token: string, title: string, body: string, data = {}) {
    try {
      const message = {
        token,
        notification: {
          title,
          body,
        },
        data,
      };

      const response = await admin.messaging().send(message);
      return { success: true, response };
    } catch (error) {
      console.error('Error sending notification:', error);
      return { success: false, error };
    }
  }

  async sendNotificationToTopic(topic: string, title: string, body: string, data = {}) {
    try {
      const message = {
        topic,
        notification: {
          title,
          body,
        },
        data,
      };

      const response = await admin.messaging().send(message);
      return { success: true, response };
    } catch (error) {
      console.error('Error sending notification to topic:', error);
      return { success: false, error };
    }
  }
}
```

## Subscribing to Topics

If you want to implement topic-based notifications:

```typescript
// Add this method to the messaging service
public subscribeToTopic(topic: string): Observable<boolean> {
  return new Observable<boolean>(observer => {
    const token = this.tokenSubject.value;
    if (!token) {
      observer.error('No FCM token available');
      return;
    }

    // This requires a server endpoint to subscribe the token to a topic
    // using Firebase Admin SDK
    this.http.post('/api/notifications/subscribe', { token, topic })
      .subscribe({
        next: () => {
          observer.next(true);
          observer.complete();
        },
        error: (err) => observer.error(err)
      });
  });
}
```

## Troubleshooting

1. **No Permission Dialog**: Check if the site is using HTTPS, as notifications require secure context
2. **Service Worker Not Working**: Ensure the service worker file is accessible at the root of the site
3. **Token Generation Fails**: Verify your Firebase configuration and VAPID key
4. **No Background Notifications**: Verify the service worker is registered properly

## Best Practices

1. **Token Storage**: Store FCM tokens securely and associate them with user accounts
2. **Permission UX**: Explain why notifications are useful before requesting permission
3. **Notification Content**: Keep notifications concise and actionable
4. **Frequency**: Don't overwhelm users with too many notifications
5. **Security**: Validate notification data on your server before sending 