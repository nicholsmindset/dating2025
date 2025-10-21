/**
 * Service Worker for Progressive Web App
 * Provides offline support and push notifications
 */

const CACHE_NAME = 'islamic-dating-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/static/css/main.css',
  '/static/js/main.js',
  '/manifest.json',
  '/logo192.png',
  '/logo512.png'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching files');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting()) // Activate immediately
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Clearing old cache');
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim()) // Take control immediately
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http(s) requests
  if (!request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        // Return cached version if available
        if (cachedResponse) {
          // Update cache in background (stale-while-revalidate)
          fetchAndCache(request);
          return cachedResponse;
        }

        // Not in cache, fetch from network
        return fetchAndCache(request);
      })
      .catch(() => {
        // Network failed, return offline page if available
        if (request.headers.get('accept').includes('text/html')) {
          return caches.match('/offline.html');
        }
      })
  );
});

/**
 * Fetch from network and update cache
 */
function fetchAndCache(request) {
  return fetch(request)
    .then((response) => {
      // Check if valid response
      if (!response || response.status !== 200 || response.type === 'error') {
        return response;
      }

      // Clone the response
      const responseToCache = response.clone();

      // Update cache
      caches.open(CACHE_NAME)
        .then((cache) => {
          // Only cache GET requests
          if (request.method === 'GET') {
            cache.put(request, responseToCache);
          }
        });

      return response;
    });
}

// Push notification event
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received');

  const options = {
    body: event.data ? event.data.text() : 'You have a new notification',
    icon: '/logo192.png',
    badge: '/badge.png',
    vibrate: [200, 100, 200],
    tag: 'notification',
    requireInteraction: false,
    actions: [
      {
        action: 'open',
        title: 'Open App',
        icon: '/icons/open.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/close.png'
      }
    ]
  };

  // Try to parse data if it's JSON
  if (event.data) {
    try {
      const data = event.data.json();
      options.body = data.message || options.body;
      options.title = data.title || 'Islamic Dating';
      options.tag = data.tag || 'notification';
      options.data = data;
    } catch (e) {
      console.log('Push data is not JSON');
    }
  }

  event.waitUntil(
    self.registration.showNotification(
      options.title || 'Islamic Dating',
      options
    )
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked');

  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  // Open the app or focus existing window
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Try to focus existing window
        for (let client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }

        // No existing window, open new one
        if (clients.openWindow) {
          const urlToOpen = event.notification.data?.url || '/dashboard';
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Background sync event (for offline actions)
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered');

  if (event.tag === 'sync-messages') {
    event.waitUntil(syncMessages());
  }
});

/**
 * Sync offline messages when back online
 */
async function syncMessages() {
  try {
    // Get offline messages from IndexedDB
    const db = await openDB();
    const messages = await getOfflineMessages(db);

    // Send each message
    for (const message of messages) {
      try {
        const response = await fetch('/api/chat/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': message.token
          },
          body: JSON.stringify(message.data)
        });

        if (response.ok) {
          // Remove from offline storage
          await removeOfflineMessage(db, message.id);
        }
      } catch (error) {
        console.error('Failed to sync message:', error);
      }
    }
  } catch (error) {
    console.error('Sync error:', error);
  }
}

/**
 * Open IndexedDB
 */
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('IslamicDatingDB', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('offlineMessages')) {
        db.createObjectStore('offlineMessages', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

/**
 * Get offline messages
 */
function getOfflineMessages(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['offlineMessages'], 'readonly');
    const store = transaction.objectStore('offlineMessages');
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

/**
 * Remove synced message
 */
function removeOfflineMessage(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['offlineMessages'], 'readwrite');
    const store = transaction.objectStore('offlineMessages');
    const request = store.delete(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

// Periodic background sync (Chrome only)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-new-matches') {
    event.waitUntil(checkNewMatches());
  }
});

/**
 * Check for new matches in background
 */
async function checkNewMatches() {
  try {
    const response = await fetch('/api/matches?limit=1');
    if (response.ok) {
      const data = await response.json();
      if (data.newMatches > 0) {
        self.registration.showNotification('New Match!', {
          body: `You have ${data.newMatches} new match${data.newMatches > 1 ? 'es' : ''}!`,
          icon: '/logo192.png',
          badge: '/badge.png',
          tag: 'new-matches'
        });
      }
    }
  } catch (error) {
    console.error('Background match check failed:', error);
  }
}

// Message event (communication with main thread)
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(CACHE_NAME)
        .then((cache) => cache.addAll(event.data.urls))
    );
  }
});

console.log('Service Worker: Loaded');
