// WebSocket reconnection utility with exponential backoff
import { io, Socket } from 'socket.io-client';

interface ReconnectionConfig {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
}

class SocketManager {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isIntentionalDisconnect = false;
  
  private config: Required<ReconnectionConfig> = {
    maxAttempts: 10,
    initialDelay: 1000, // 1 second
    maxDelay: 30000, // 30 seconds
    backoffMultiplier: 1.5
  };

  private listeners: Map<string, ((...args: any[]) => void)[]> = new Map();
  private gameState: any = null;
  private roomCode: string | null = null;

  constructor(config?: ReconnectionConfig) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  connect(url: string, token: string, roomCode?: string): Promise<Socket> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve(this.socket);
        return;
      }

      this.roomCode = roomCode || null;
      this.isIntentionalDisconnect = false;

      this.socket = io(url, {
        auth: { token },
        reconnection: false, // We handle reconnection manually
        transports: ['websocket', 'polling'],
        timeout: 10000
      });

      this.setupEventHandlers();

      this.socket.once('connect', () => {
        this.reconnectAttempts = 0;
        console.log('✅ Connected to server');
        
        // Restore state if reconnecting
        if (this.roomCode && this.gameState) {
          this.restoreGameState();
        }
        
        resolve(this.socket!);
      });

      this.socket.once('connect_error', (error) => {
        console.error('❌ Connection error:', error);
        reject(error);
      });
    });
  }

  private setupEventHandlers() {
    if (!this.socket) return;

    // Handle disconnection
    this.socket.on('disconnect', (reason) => {
      console.warn('🔌 Disconnected:', reason);
      
      // Don't reconnect if disconnect was intentional
      if (this.isIntentionalDisconnect) {
        return;
      }

      // Attempt reconnection for certain disconnect reasons
      if (reason === 'io server disconnect') {
        // Server disconnected us - wait before reconnecting
        this.scheduleReconnection();
      } else if (reason === 'transport close' || reason === 'transport error') {
        // Connection lost - reconnect immediately
        this.scheduleReconnection(0);
      }
    });

    // Handle server shutdown
    this.socket.on('server-shutting-down', (data) => {
      console.warn('⚠️ Server shutting down:', data.message);
      // Show notification to user
      this.emit('system-notification', {
        type: 'warning',
        message: data.message
      });
      // Schedule reconnection after a delay
      this.scheduleReconnection(5000);
    });

    // Save game state periodically for recovery
    this.socket.on('game-state-update', (state) => {
      this.gameState = state;
    });

    // Restore all custom event listeners
    for (const [event, handlers] of this.listeners) {
      handlers.forEach(handler => {
        this.socket!.on(event, handler);
      });
    }
  }

  private scheduleReconnection(delay?: number) {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    if (this.reconnectAttempts >= this.config.maxAttempts) {
      console.error('❌ Max reconnection attempts reached');
      this.emit('max-reconnection-attempts', {
        attempts: this.reconnectAttempts
      });
      return;
    }

    const calculatedDelay = delay !== undefined ? delay : Math.min(
      this.config.initialDelay * Math.pow(this.config.backoffMultiplier, this.reconnectAttempts),
      this.config.maxDelay
    );

    console.log(`🔄 Attempting reconnection ${this.reconnectAttempts + 1}/${this.config.maxAttempts} in ${calculatedDelay}ms`);
    
    this.emit('reconnection-attempt', {
      attempt: this.reconnectAttempts + 1,
      maxAttempts: this.config.maxAttempts,
      delay: calculatedDelay
    });

    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      this.attemptReconnection();
    }, calculatedDelay);
  }

  private async attemptReconnection() {
    if (!this.socket) return;

    try {
      // Get fresh token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('❌ No auth token found');
        this.emit('authentication-required');
        return;
      }

      // Close existing socket
      if (this.socket) {
        this.socket.removeAllListeners();
        this.socket.close();
      }

      // Create new connection
      const url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      await this.connect(url, token, this.roomCode || undefined);
      
      this.emit('reconnected');
      
    } catch (error) {
      console.error('❌ Reconnection failed:', error);
      this.scheduleReconnection();
    }
  }

  private restoreGameState() {
    if (!this.socket || !this.roomCode) return;

    console.log('♻️ Restoring game state for room:', this.roomCode);
    
    // Rejoin the room
    this.socket.emit('join-room', { roomCode: this.roomCode });
    
    // Request game state update
    this.socket.emit('request-game-state', { roomCode: this.roomCode });
  }

  // Public API
  on(event: string, handler: (...args: any[]) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(handler);
    
    if (this.socket) {
      this.socket.on(event, handler);
    }
  }

  off(event: string, handler?: (...args: any[]) => void) {
    if (handler) {
      const handlers = this.listeners.get(event);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
      if (this.socket) {
        this.socket.off(event, handler);
      }
    } else {
      this.listeners.delete(event);
      if (this.socket) {
        this.socket.off(event);
      }
    }
  }

  emit(event: string, ...args: any[]) {
    if (this.socket?.connected) {
      this.socket.emit(event, ...args);
    } else {
      console.warn('⚠️ Socket not connected, cannot emit:', event);
    }
  }

  disconnect() {
    this.isIntentionalDisconnect = true;
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.close();
      this.socket = null;
    }

    this.reconnectAttempts = 0;
    this.gameState = null;
    this.roomCode = null;
  }

  get connected(): boolean {
    return this.socket?.connected || false;
  }

  get id(): string | undefined {
    return this.socket?.id;
  }
}

// Singleton instance
let socketManager: SocketManager | null = null;

export const getSocketManager = (config?: ReconnectionConfig): SocketManager => {
  if (!socketManager) {
    socketManager = new SocketManager(config);
  }
  return socketManager;
};

export default SocketManager;
