import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { getToken } from "./api";

/**
 * Connects to the backend's STOMP endpoint and subscribes to a single board's
 * live-update topic. Returns a function to tear down the connection.
 *
 * onEvent receives the parsed BoardEvent: { type, payload }
 */
export function subscribeToBoard(boardId, onEvent) {
  const client = new Client({
    webSocketFactory: () => new SockJS(import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/ws` : "/ws"),
    connectHeaders: {
      Authorization: `Bearer ${getToken() || ""}`,
    },
    reconnectDelay: 3000,
    onConnect: () => {
      client.subscribe(`/topic/board/${boardId}`, (message) => {
        try {
          const event = JSON.parse(message.body);
          onEvent(event);
        } catch (err) {
          console.error("Failed to parse board event", err);
        }
      });
    },
  });

  client.activate();

  return () => {
    client.deactivate();
  };
}
