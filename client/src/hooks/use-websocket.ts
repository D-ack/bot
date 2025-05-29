import { useEffect, useState, useRef } from "react";
import { queryClient } from "@/lib/queryClient";

interface WebSocketMessage {
  type: 'stats_update' | 'new_message' | 'platform_status' | 'ml_update' | 'log_update';
  data: any;
}

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    const connect = () => {
      try {
        ws.current = new WebSocket(wsUrl);

        ws.current.onopen = () => {
          console.log('WebSocket connected');
          setIsConnected(true);
        };

        ws.current.onclose = () => {
          console.log('WebSocket disconnected');
          setIsConnected(false);
          
          // Attempt to reconnect after 3 seconds
          setTimeout(connect, 3000);
        };

        ws.current.onerror = (error) => {
          console.error('WebSocket error:', error);
          setIsConnected(false);
        };

        ws.current.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            handleWebSocketMessage(message);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };
      } catch (error) {
        console.error('Failed to create WebSocket connection:', error);
        setTimeout(connect, 3000);
      }
    };

    connect();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  const handleWebSocketMessage = (message: WebSocketMessage) => {
    switch (message.type) {
      case 'stats_update':
        // Invalidate stats queries
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
        break;
      
      case 'new_message':
        // Invalidate message queries
        queryClient.invalidateQueries({ queryKey: ['/api/messages/recent'] });
        queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
        break;
      
      case 'platform_status':
        // Invalidate platform queries
        queryClient.invalidateQueries({ queryKey: ['/api/platforms'] });
        break;
      
      case 'ml_update':
        // Invalidate ML model queries
        queryClient.invalidateQueries({ queryKey: ['/api/ml/model'] });
        break;
      
      case 'log_update':
        // Invalidate log queries
        queryClient.invalidateQueries({ queryKey: ['/api/logs'] });
        break;
      
      default:
        console.warn('Unknown WebSocket message type:', message.type);
    }
  };

  return {
    isConnected,
    sendMessage: (message: any) => {
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify(message));
      }
    }
  };
}
