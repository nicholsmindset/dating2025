import Pusher from 'pusher-js';

class PusherService {
  constructor() {
    this.pusher = null;
    this.channels = new Map();
    this.isConnected = false;
  }

  // Initialize Pusher connection
  init(userId) {
    if (this.pusher) {
      this.disconnect();
    }

    this.pusher = new Pusher(process.env.REACT_APP_PUSHER_KEY, {
      cluster: process.env.REACT_APP_PUSHER_CLUSTER,
      encrypted: true,
      authEndpoint: `${process.env.REACT_APP_API_URL}/api/pusher/auth`,
      auth: {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      },
      authorizer: (channel, options) => {
        return {
          authorize: (socketId, callback) => {
            const endpoint = channel.name.startsWith('presence-') 
              ? `${process.env.REACT_APP_API_URL}/api/pusher/auth/presence`
              : `${process.env.REACT_APP_API_URL}/api/pusher/auth`;
            
            fetch(endpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              },
              body: JSON.stringify({
                socket_id: socketId,
                channel_name: channel.name
              })
            })
            .then(response => response.json())
            .then(data => callback(null, data))
            .catch(error => callback(error, null));
          }
        };
      }
    });

    this.pusher.connection.bind('connected', () => {
      console.log('Pusher connected');
      this.isConnected = true;
    });

    this.pusher.connection.bind('disconnected', () => {
      console.log('Pusher disconnected');
      this.isConnected = false;
    });

    this.pusher.connection.bind('error', (error) => {
      console.error('Pusher connection error:', error);
    });

    // Subscribe to user's personal channel for notifications
    if (userId) {
      this.subscribeToUserChannel(userId);
    }
  }

  // Subscribe to user's personal channel
  subscribeToUserChannel(userId) {
    const channelName = `private-user-${userId}`;
    if (this.channels.has(channelName)) {
      return this.channels.get(channelName);
    }

    const channel = this.pusher.subscribe(channelName);
    this.channels.set(channelName, channel);
    return channel;
  }

  // Subscribe to chat channel
  subscribeToChatChannel(chatId) {
    const channelName = `private-chat-${chatId}`;
    if (this.channels.has(channelName)) {
      return this.channels.get(channelName);
    }

    const channel = this.pusher.subscribe(channelName);
    this.channels.set(channelName, channel);
    return channel;
  }

  // Subscribe to presence channel for online status
  subscribeToPresenceChannel() {
    const channelName = 'presence-users';
    if (this.channels.has(channelName)) {
      return this.channels.get(channelName);
    }

    const channel = this.pusher.subscribe(channelName);
    this.channels.set(channelName, channel);
    return channel;
  }

  // Unsubscribe from a channel
  unsubscribeFromChannel(channelName) {
    if (this.channels.has(channelName)) {
      this.pusher.unsubscribe(channelName);
      this.channels.delete(channelName);
    }
  }

  // Get channel by name
  getChannel(channelName) {
    return this.channels.get(channelName);
  }

  // Disconnect from Pusher
  disconnect() {
    if (this.pusher) {
      this.channels.forEach((channel, channelName) => {
        this.pusher.unsubscribe(channelName);
      });
      this.channels.clear();
      this.pusher.disconnect();
      this.pusher = null;
      this.isConnected = false;
    }
  }

  // Check if connected
  getConnectionState() {
    return this.isConnected;
  }
}

// Create singleton instance
const pusherService = new PusherService();
export default pusherService;