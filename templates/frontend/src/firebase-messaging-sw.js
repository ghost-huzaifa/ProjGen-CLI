// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here.
// Other Firebase libraries are not available in the service worker.
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in the
// messagingSenderId.
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

// Create BroadcastChannel for real-time communication with the app
const notificationChannel = new BroadcastChannel('fcm-notifications');

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
  
  // Customize notification here
  const notificationTitle = payload.notification.title || 'New Notification';
  const notificationOptions = {
    body: payload.notification.body || '',
    icon: payload.notification.image || '/assets/icons/icon-72x72.png',
    badge: '/assets/icons/icon-72x72.png',
    data: payload.data || {},
    // Actions can be added here if needed
    actions: [
      { action: 'view', title: 'View' }
    ],
    // Notification appearance settings
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
  
  // Save to IndexedDB for reliability (in case the app is closed)
  try {
    await openDatabase(); // Make sure DB is open
    await saveNotification(notification);
    console.log('Successfully saved notification to IndexedDB for persistence');
  } catch (error) {
    console.error('Failed to save notification:', error);
  }

  // Broadcast the notification to any open instances of the app
  // This provides instant notification delivery when the app is running
  try {
    notificationChannel.postMessage(notification);
    console.log('Notification broadcasted to app via BroadcastChannel');
  } catch (error) {
    console.error('Failed to broadcast notification:', error);
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