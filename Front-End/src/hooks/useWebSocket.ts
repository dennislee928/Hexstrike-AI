'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: number;
}

export interface UseWebSocketOptions {
  reconnectAttempts?: number;
  reconnectInterval?: number;
  heartbeatInterval?: number;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
  onMessage?: (message: WebSocketMessage) => void;
}

export interface UseWebSocketReturn {
  socket: WebSocket | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  sendMessage: (type: string, data: any) => void;
  reconnect: () => void;
  disconnect: () => void;
}

export function useWebSocket(
  url: string,
  options: UseWebSocketOptions = {}
): UseWebSocketReturn {
  const {
    reconnectAttempts = 5,
    reconnectInterval = 3000,
    heartbeatInterval = 30000,
    onOpen,
    onClose,
    onError,
    onMessage
  } = options;

  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const heartbeatTimeoutRef = useRef<NodeJS.Timeout>();
  const shouldReconnectRef = useRef(true);

  const startHeartbeat = useCallback(() => {
    if (heartbeatTimeoutRef.current) {
      clearTimeout(heartbeatTimeoutRef.current);
    }

    heartbeatTimeoutRef.current = setTimeout(() => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
        startHeartbeat();
      }
    }, heartbeatInterval);
  }, [socket, heartbeatInterval]);

  const connect = useCallback(() => {
    if (socket && socket.readyState === WebSocket.CONNECTING) {
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const ws = new WebSocket(url);

      ws.onopen = () => {
        setIsConnected(true);
        setIsConnecting(false);
        setError(null);
        reconnectAttemptsRef.current = 0;
        startHeartbeat();
        onOpen?.();
      };

      ws.onclose = () => {
        setIsConnected(false);
        setIsConnecting(false);
        
        if (heartbeatTimeoutRef.current) {
          clearTimeout(heartbeatTimeoutRef.current);
        }

        onClose?.();

        // Attempt to reconnect if enabled and not manually disconnected
        if (shouldReconnectRef.current && reconnectAttemptsRef.current < reconnectAttempts) {
          reconnectAttemptsRef.current++;
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        }
      };

      ws.onerror = (event) => {
        setError('WebSocket connection error');
        setIsConnecting(false);
        onError?.(event);
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          
          // Handle pong responses
          if (message.type === 'pong') {
            return;
          }

          onMessage?.(message);
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      setSocket(ws);
    } catch (err) {
      setError('Failed to create WebSocket connection');
      setIsConnecting(false);
    }
  }, [url, reconnectAttempts, reconnectInterval, startHeartbeat, onOpen, onClose, onError, onMessage]);

  const sendMessage = useCallback((type: string, data: any) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      const message: WebSocketMessage = {
        type,
        data,
        timestamp: Date.now()
      };
      socket.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected. Cannot send message.');
    }
  }, [socket]);

  const reconnect = useCallback(() => {
    shouldReconnectRef.current = true;
    reconnectAttemptsRef.current = 0;
    
    if (socket) {
      socket.close();
    }
    
    connect();
  }, [socket, connect]);

  const disconnect = useCallback(() => {
    shouldReconnectRef.current = false;
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (heartbeatTimeoutRef.current) {
      clearTimeout(heartbeatTimeoutRef.current);
    }
    
    if (socket) {
      socket.close();
    }
    
    setSocket(null);
    setIsConnected(false);
    setIsConnecting(false);
  }, [socket]);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, []);

  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (heartbeatTimeoutRef.current) {
        clearTimeout(heartbeatTimeoutRef.current);
      }
    };
  }, []);

  return {
    socket,
    isConnected,
    isConnecting,
    error,
    sendMessage,
    reconnect,
    disconnect
  };
}

// Hook for process monitoring via WebSocket
export function useProcessMonitor() {
  const [processes, setProcesses] = useState<any[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<any>(null);

  const { isConnected, sendMessage } = useWebSocket(
    `ws://${window.location.host}/ws/processes`,
    {
      onMessage: (message) => {
        switch (message.type) {
          case 'process_update':
            setProcesses(message.data);
            break;
          case 'system_metrics':
            setSystemMetrics(message.data);
            break;
          case 'process_started':
            setProcesses(prev => [...prev, message.data]);
            break;
          case 'process_completed':
            setProcesses(prev => 
              prev.map(p => p.id === message.data.id ? { ...p, ...message.data } : p)
            );
            break;
          case 'process_error':
            setProcesses(prev => 
              prev.map(p => p.id === message.data.id ? { ...p, status: 'error', error: message.data.error } : p)
            );
            break;
        }
      }
    }
  );

  const startProcess = useCallback((command: string, args: any) => {
    sendMessage('start_process', { command, args });
  }, [sendMessage]);

  const stopProcess = useCallback((processId: string) => {
    sendMessage('stop_process', { processId });
  }, [sendMessage]);

  return {
    processes,
    systemMetrics,
    isConnected,
    startProcess,
    stopProcess
  };
}