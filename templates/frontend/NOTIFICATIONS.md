# Firebase Cloud Messaging (FCM) Notifications Implementation

This document provides a comprehensive overview of the Firebase Cloud Messaging (FCM) notifications implementation in this Angular application.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Components and Files](#components-and-files)
3. [Configuration](#configuration)
4. [Code Implementation Details](#code-implementation-details)
5. [Persistence Mechanism](#persistence-mechanism)
6. [Real-Time Communication](#real-time-communication)
7. [Usage Guide](#usage-guide)
8. [Testing with Firebase Console](#testing-with-firebase-console)
9. [Troubleshooting](#troubleshooting)

## Architecture Overview

The notification system is built using Firebase Cloud Messaging (FCM) and consists of:

- **Data Model**: TypeScript interface defining notification structure
- **Messaging Service**: Core service that handles FCM token generation, permission requests, and message processing
- **UI Components**: 
  - Notification Bell in the navbar
  - Dedicated Notifications Page for viewing all notifications
- **Service Worker**: Handles background notifications when the app isn't in focus
- **Persistence Layer**: 
  - IndexedDB for cross-context storage (service worker & main app)
  - Local Storage for backward compatibility
- **Real-Time Communication**:
  - BroadcastChannel API for instant notification delivery
  - Visibility & focus event detection as backup mechanisms

The implementation follows a reactive approach using RxJS Observables for real-time updates across the application.

## Components and Files

| File/Component | Purpose |
|----------------|---------|
| `src/app/shared/models/notification.model.ts` | Defines the notification data structure |
| `src/app/core/services/messaging.service.ts` | Core service for handling FCM and notifications |
| `src/app/shared/components/notification-bell/notification-bell.component.ts` | UI component shown in navbar |
| `src/app/features/notifications/notifications.component.ts` | Full page for viewing/managing notifications |
| `src/firebase-messaging-sw.js` | Service worker for background notifications |
| `src/manifest.json` | Web app manifest for PWA support |
| `src/environments/environment.ts` | Contains Firebase config including VAPID key |

## Configuration

### Firebase Configuration in environment.ts

```typescript
export const environment = {
  production: false,
  apiUrl: 'https://usman-stable.cognitivehealthintl.com',
  firebase: {
    apiKey: "AIzaSyDbIv3q8VmphMuwFCNDHxo82xfj4ETa158",
    authDomain: "chi-proj.firebaseapp.com",
    projectId: "chi-proj",
    storageBucket: "chi-proj.firebasestorage.app",
    messagingSenderId: "736918829959",
    appId: "1:736918829959:web:7bd7c09296ae80fbeef122",
    measurementId: "G-EG7F7FSJTR",
    vapidKey: "REPLACE_WITH_YOUR_VAPID_KEY" // Add your VAPID key here
  }
};
```

### Service Worker (firebase-messaging-sw.js)

```javascript
// Give the service worker access to Firebase Messaging
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize the Firebase app
firebase.initializeApp({
  apiKey: "AIzaSyDbIv3q8VmphMuwFCNDHxo82xfj4ETa158",
  authDomain: "chi-proj.firebaseapp.com",
  projectId: "chi-proj",
  storageBucket: "chi-proj.firebasestorage.app",
  messagingSenderId: "736918829959",
  appId: "1:736918829959:web:7bd7c09296ae80fbeef122",
  measurementId: "G-EG7F7FSJTR"
});

// Initialize the database
const dbName = 'fcm-notifications-db';
const storeName = 'notifications';
let db;

// Open/create the database
const openDatabase = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, 1);
    
    request.onerror = (event) => {
      console.error('IndexedDB error:', event.target.error);
      reject('Error opening database');
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName, { keyPath: 'id' });
        console.log('Created notifications store');
      }
    };
    
    request.onsuccess = (event) => {
      db = event.target.result;
      console.log('Database opened successfully');
      resolve(db);
    };
  });
};

// Save notification to IndexedDB
const saveNotification = (notification) => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject('Database not initialized');
      return;
    }
    
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    
    const request = store.put(notification);
    
    request.onsuccess = () => {
      console.log('Notification saved to IndexedDB');
      resolve();
    };
    
    request.onerror = (event) => {
      console.error('Error saving notification:', event.target.error);
      reject('Error saving notification');
    };
  });
};

// Initialize the database when service worker starts
openDatabase();

// Retrieve Firebase Messaging
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage(async (payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification.title || 'New Notification';
  const notificationOptions = {
    body: payload.notification.body || '',
    icon: payload.notification.image || '/assets/icons/icon-72x72.png',
    badge: '/assets/icons/icon-72x72.png',
    data: payload.data || {},
    actions: [
      { action: 'view', title: 'View' }
    ],
    vibrate: [200, 100, 200],
    requireInteraction: true
  };

  // Create notification object for persistent storage
  const notification = {
    id: Date.now().toString(),
    title: notificationTitle,
    body: payload.notification.body || '',
    image: payload.notification.image,
    data: payload.data || {},
    read: false,
    createdAt: Date.now()
  };
  
  // Save to IndexedDB
  try {
    await saveNotification(notification);
    console.log('Successfully saved notification to IndexedDB for persistence');
  } catch (error) {
    console.error('Failed to save notification:', error);
  }

  // Show the notification
  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  // Focus on or open the app when notification is clicked
  event.waitUntil(
    clients.matchAll({type: 'window'}).then(clientList => {
      // If a window client is already open, focus it
      for (const client of clientList) {
        if (client.url.includes('/dashboard') && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow('/dashboard/notifications');
      }
    })
  );
});
```

## Persistence Mechanism

The notification system uses a dual persistence mechanism to ensure notifications are never lost and are available across browser contexts:

### 1. IndexedDB for Cross-Context Storage

IndexedDB is used as the primary storage mechanism for notifications because:
- It's accessible by both the service worker and the main application
- It provides persistent storage that survives browser restarts
- It can store larger amounts of data than localStorage
- It supports structured querying and transaction management

#### Notification Flow with IndexedDB:

1. When a notification is received in the background:
   - The service worker saves it to IndexedDB
   - The notification is displayed to the user

2. When the application starts or regains focus:
   - The messaging service loads notifications from IndexedDB
   - Notifications are displayed in the UI
   - IndexedDB is cleared after successful loading

### 2. Real-time Notification Updates

To ensure notifications appear in real-time when the app is minimized or the tab isn't active:

1. **Visibility Change Detection**: Listens for tab visibility changes to reload notifications
   ```typescript
   document.addEventListener('visibilitychange', () => {
     if (document.visibilityState === 'visible') {
       this.loadNotificationsFromIndexedDB();
     }
   });
   ```

2. **Window Focus Detection**: Detects when a minimized window is restored
   ```typescript
   window.addEventListener('focus', () => {
     this.loadNotificationsFromIndexedDB();
   });
   ```

3. **Background Polling**: Periodically checks for new notifications as a fallback
   ```typescript
   interval(30000).subscribe(() => {
     if (document.visibilityState === 'visible') {
       this.loadNotificationsFromIndexedDB();
     }
   });
   ```

4. **Local Storage**: Used as a backup and for backward compatibility
   ```typescript
   private saveNotifications(notifications: Notification[]): void {
     localStorage.setItem('notifications', JSON.stringify(notifications));
     this.notificationsSubject.next(notifications);
     this.updateUnreadCount();
   }
   ```

## Real-Time Communication

The notification system uses multiple mechanisms to ensure real-time notification delivery:

### 1. BroadcastChannel API

The primary mechanism for instant notification delivery is the BroadcastChannel API, which provides:

- **Direct communication** between the service worker and the application
- **Immediate notification delivery** without polling or delay
- **Cross-context messaging** in the same origin
- **Simple, event-based API** that's easy to implement

#### Implementation in Service Worker:

```javascript
// Create BroadcastChannel for real-time communication with the app
const notificationChannel = new BroadcastChannel('fcm-notifications');

// Inside background message handler
messaging.onBackgroundMessage(async (payload) => {
  // Create notification object
  const notification = { /* notification data */ };
  
  // Save to IndexedDB for reliability
  await saveNotification(notification);
  
  // Broadcast to any open instances of the app for instant delivery
  notificationChannel.postMessage(notification);
  
  // Show the notification
  return self.registration.showNotification(/* ... */);
});
```

#### Implementation in Messaging Service:

```typescript
// Set up BroadcastChannel to receive instant notifications from service worker
private setupBroadcastChannel(): void {
  if ('BroadcastChannel' in window) {
    this.notificationChannel = new BroadcastChannel('fcm-notifications');
    
    this.notificationChannel.onmessage = (event) => {
      if (event.data) {
        // Add notification directly to our list
        this.addNotification(event.data);
      }
    };
  }
}
```

### 2. Fallback Mechanisms

For browsers that don't support BroadcastChannel API or when the app is restarted, additional fallback mechanisms ensure reliable notification delivery:

1. **IndexedDB Storage**: Notifications are persisted in IndexedDB to survive browser restarts
2. **Visibility Change Detection**: Loads notifications when tabs become active
3. **Window Focus Events**: Detects when minimized windows are restored
4. **Background Polling**: Periodically checks for new notifications

This multi-layered approach ensures notifications are always delivered, regardless of browser support or user interaction patterns.

## Code Implementation Details

### 1. Notification Model

```typescript
// src/app/shared/models/notification.model.ts
export interface Notification {
  id?: string;
  title: string;
  body: string;
  image?: string;
  link?: string;
  data?: {[key: string]: string};
  read?: boolean;
  createdAt?: Date | string | number;
  userId?: string;
}
```

### 2. Messaging Service

This is the core service that handles:
- FCM token management
- Permission requests
- Foreground message handling
- Local and IndexedDB notification storage & management
- Real-time notification updates

```typescript
// Key methods from src/app/core/services/messaging.service.ts
@Injectable({
  providedIn: 'root'
})
export class MessagingService implements OnDestroy {
  private firebaseApp = initializeApp(environment.firebase);
  private messaging: Messaging;
  
  // Observable for current FCM token
  private tokenSubject = new BehaviorSubject<string | null>(null);
  public token$ = this.tokenSubject.asObservable();
  
  // Notifications storage
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();
  
  // Unread notifications count
  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  // IndexedDB configuration
  private dbName = 'fcm-notifications-db';
  private storeName = 'notifications';
  
  // Polling configuration
  private pollingSubscription: Subscription | null = null;
  private readonly POLLING_INTERVAL = 30000; // 30 seconds

  constructor() {
    this.messaging = getMessaging(this.firebaseApp);
    this.loadStoredNotifications(); // Load from localStorage (backward compatibility)
    this.loadNotificationsFromIndexedDB(); // Load from IndexedDB
    this.setupForegroundMessageHandler();
    this.setupVisibilityChangeListener();
    this.startPollingForNotifications();
  }

  // Load notifications from IndexedDB
  private loadNotificationsFromIndexedDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      
      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        try {
          const transaction = db.transaction([this.storeName], 'readwrite');
          const store = transaction.objectStore(this.storeName);
          
          const getAllRequest = store.getAll();
          
          getAllRequest.onsuccess = () => {
            const notifications = getAllRequest.result;
            if (notifications && notifications.length > 0) {
              try {
                // Add each notification to our list
                let allAdded = true;
                notifications.forEach(notification => {
                  try {
                    this.addNotification(notification);
                  } catch(error) {
                    allAdded = false;
                  }
                });
                
                // Only clear if all notifications were successfully added
                if (allAdded) {
                  store.clear();
                }
              } catch (error) {
                console.error('Error processing notifications', error);
              }
            }
            
            resolve();
          };
        } catch (error) {
          reject(error);
        }
      };
    });
  }

  // Setup real-time notification updates  
  private setupVisibilityChangeListener(): void {
    // Tab visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.loadNotificationsFromIndexedDB();
      }
    });
    
    // Window focus events (minimized window restored)
    window.addEventListener('focus', () => {
      this.loadNotificationsFromIndexedDB();
    });
  }

  // Fallback polling mechanism
  private startPollingForNotifications(): void {
    this.pollingSubscription = interval(this.POLLING_INTERVAL).subscribe(() => {
      if (document.visibilityState === 'visible') {
        this.loadNotificationsFromIndexedDB();
      }
    });
  }

  // ... other methods remain the same ...
}
```

### 3. Notification Bell Component

UI component that shows unread count and recent notifications:

```typescript
// Key parts from src/app/shared/components/notification-bell/notification-bell.component.ts
@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [/* ... */],
  template: `
    <button mat-icon-button [matMenuTriggerFor]="notificationMenu" aria-label="Notifications">
      <mat-icon [matBadge]="unreadCount" 
                [matBadgeHidden]="unreadCount === 0" 
                matBadgeColor="warn"
                matBadgeSize="small">
        notifications
      </mat-icon>
    </button>

    <mat-menu #notificationMenu="matMenu" xPosition="before" class="notification-menu">
      <!-- Header with actions -->
      <div class="notification-header" *ngIf="notifications.length > 0">
        <span>Notifications</span>
        <button mat-button color="primary" (click)="markAllAsRead($event)">
          Mark all as read
        </button>
      </div>
      
      <!-- Empty state -->
      <div class="no-notifications" *ngIf="notifications.length === 0">
        <mat-icon>notifications_off</mat-icon>
        <span>No notifications</span>
      </div>
      
      <!-- Notification list -->
      <div class="notification-list">
        <div *ngFor="let notification of notifications" 
             class="notification-item"
             [class.unread]="!notification.read"
             (click)="onNotificationClick(notification)">
          <!-- Notification content -->
        </div>
      </div>
      
      <!-- Footer with actions -->
      <div class="notification-footer" *ngIf="notifications.length > 0">
        <button mat-button color="warn" (click)="clearAll($event)">
          Clear all
        </button>
        <button mat-button color="primary" routerLink="/dashboard/notifications" (click)="$event.stopPropagation()">
          View all
        </button>
      </div>
    </mat-menu>
  `,
})
export class NotificationBellComponent implements OnInit {
  notifications: Notification[] = [];
  unreadCount = 0;

  constructor(private messagingService: MessagingService) {}

  ngOnInit(): void {
    // Subscribe to notifications
    this.messagingService.notifications$.subscribe(notifications => {
      this.notifications = notifications.slice(0, 10); // Show only the 10 most recent
    });

    // Subscribe to unread count
    this.messagingService.unreadCount$.subscribe(count => {
      this.unreadCount = count;
    });

    // Request notification permission when component initializes
    this.requestPermission();
  }

  // Request permission for notifications
  requestPermission(): void {
    if ('Notification' in window) {
      this.messagingService.requestPermission().subscribe({
        next: (token) => console.log('Permission granted! Token:', token),
        error: (err) => console.error('Permission denied:', err)
      });
    }
  }

  // Handle notification click
  onNotificationClick(notification: Notification): void {
    if (!notification.read) {
      this.messagingService.markAsRead(notification.id!);
    }
    
    // Handle navigation if the notification has a link
    if (notification.link) {
      // You can use the router to navigate
      // this.router.navigateByUrl(notification.link);
    }
  }

  // More event handlers...
}
```

### 4. Notifications Page Component

```typescript
// Key parts from src/app/features/notifications/notifications.component.ts
@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [/* ... */],
  template: `
    <div class="notifications-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Notifications</mat-card-title>
          <div class="header-actions">
            <button mat-button color="primary" (click)="markAllAsRead()" 
                    [disabled]="!hasUnreadNotifications()">
              Mark all as read
            </button>
            <button mat-button color="warn" (click)="clearAll()" 
                    [disabled]="notifications.length === 0">
              Clear all
            </button>
            <button mat-button color="accent" (click)="requestPermission()" 
                    matTooltip="Request notifications permission">
              <mat-icon>notifications_active</mat-icon>
              Enable notifications
            </button>
            <button mat-raised-button color="primary" (click)="sendTestNotification()">
              Send test notification
            </button>
          </div>
        </mat-card-header>
        
        <mat-card-content>
          <!-- Notification list or empty state -->
        </mat-card-content>
      </mat-card>
    </div>
  `,
})
export class NotificationsComponent implements OnInit {
  notifications: Notification[] = [];

  constructor(private messagingService: MessagingService) {}

  ngOnInit(): void {
    this.messagingService.notifications$.subscribe(notifications => {
      this.notifications = notifications;
    });
  }

  // Various notification management methods...

  // Test method to create a notification without server involvement
  sendTestNotification(): void {
    this.messagingService.sendTestNotification();
  }
}
```

## Usage Guide

### 1. Setup in Your Project

1. Install dependencies:
   ```bash
   yarn add firebase @angular/fire
   ```

2. Get your VAPID key from Firebase Console:
   - Go to Project Settings > Cloud Messaging > Web Push certificates
   - Generate a new key pair if one doesn't exist
   - Replace `REPLACE_WITH_YOUR_VAPID_KEY` in `environment.ts`

3. Add icons:
   - Create icons in the sizes specified in `manifest.json`
   - Place them in `src/assets/icons/`

### 2. Integrate the Notification Bell

Add the component to your navbar:

```html
<!-- In your navbar template -->
<app-notification-bell></app-notification-bell>
```

### 3. Request Permission Programmatically

```typescript
// Inject the messaging service
constructor(private messagingService: MessagingService) {}

// Request permission
requestPermission(): void {
  this.messagingService.requestPermission().subscribe({
    next: (token) => {
      console.log('FCM Token:', token);
      // If you have a backend, send this token to associate with the user
    },
    error: (err) => console.error('Error:', err)
  });
}
```

### 4. Working with Notifications

```typescript
// Subscribe to all notifications
this.messagingService.notifications$.subscribe(notifications => {
  // Do something with the notifications
});

// Add a notification manually (for testing)
this.messagingService.addNotification({
  title: 'Test Notification',
  body: 'This is a test notification',
  createdAt: new Date(),
  read: false
});

// Mark a notification as read
this.messagingService.markAsRead('notification-id');

// Clear all notifications
this.messagingService.clearAllNotifications();
```

## Testing with Firebase Console

You can test the notification system using Firebase Console without setting up a backend:

1. **Log in to Firebase Console**:
   - Go to https://console.firebase.google.com
   - Select your project (chi-proj)

2. **Navigate to Cloud Messaging**:
   - In the left sidebar, click on "Messaging" under "Engagement"

3. **Create a new campaign**:
   - Click on "Create your first campaign" or "New campaign"
   - Select "Notification message" as the campaign type

4. **Set up your notification**:
   - Add a title and message
   - You can also add an image if desired

5. **Choose your target audience**:
   - For testing to a single device, select "User segment" or "Single device"
   - For a single device, enter the FCM token that was logged to the console
     (This token appears in the console after `requestPermission()` is called successfully)

6. **Schedule and publish**:
   - You can send it immediately or schedule it for later
   - Review your settings and click "Publish"

The notification should appear in your application:
- If the app is in the foreground, it will be processed by the `MessagingService`
- If the app is in the background or closed, the service worker will handle it

## Troubleshooting

### Common Issues

1. **Permission Denied**:
   - Check if your site is using HTTPS (required for notifications)
   - The user might have blocked notifications in browser settings
   - Solution: Provide a UI to guide users to enable notifications in browser settings

2. **No FCM Token**:
   - Check browser console for errors
   - Verify your Firebase configuration is correct
   - Make sure your VAPID key is set correctly
   - Solution: Double-check all Firebase credentials in `environment.ts`

3. **Service Worker Not Working**:
   - Verify `firebase-messaging-sw.js` is accessible at the root of your site
   - Check for errors in browser console or Application tab > Service Workers
   - Solution: Ensure the file is being copied to the build output correctly in `angular.json`

4. **Notifications Not Appearing**:
   - If the app is in the foreground, check the implementation of `setupForegroundMessageHandler`
   - If the app is in the background, ensure the service worker is registered
   - Solution: Test with the built-in test notification feature

### Debugging Tips

1. **Log FCM Tokens**:
   - After permission is granted, the FCM token is logged to the console
   - Save this token for testing with Firebase Console

2. **Monitor Local Storage**:
   - Notifications are stored in localStorage under the key 'notifications'
   - You can inspect this in DevTools > Application > Storage > Local Storage

3. **Test Foreground vs. Background**:
   - Use the built-in test function for foreground notifications
   - Use Firebase Console for testing background notifications

4. **Check Service Worker Registration**:
   - In DevTools > Application > Service Workers, verify that firebase-messaging-sw.js is registered 