"use client";

import { useEffect, useRef, useCallback } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useChatStore } from "@/store/chatStore";
import { useAuthStore } from "@/store/authStore";

export function useChat() {
  const stompClientRef = useRef<Client | null>(null);
  const { accessToken } = useAuthStore();
  const { setConnected, addMessage, activeConversationId } = useChatStore();

  useEffect(() => {
    if (!accessToken) return;

    const client = new Client({
      webSocketFactory: () =>
        new SockJS(`${process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "")}/ws`),
      connectHeaders: {
        Authorization: `Bearer ${accessToken}`,
      },
      onConnect: () => {
        setConnected(true);
        // Subscribe to personal messages
        client.subscribe("/user/queue/messages", (frame) => {
          const message = JSON.parse(frame.body);
          addMessage(message.senderId, message);
        });
      },
      onDisconnect: () => setConnected(false),
      reconnectDelay: 5000,
    });

    client.activate();
    stompClientRef.current = client;

    return () => {
      client.deactivate();
    };
  }, [accessToken]);

  const sendMessage = useCallback(
    (receiverId: number, content: string) => {
      if (!stompClientRef.current?.connected) return;
      stompClientRef.current.publish({
        destination: "/app/chat.send",
        body: JSON.stringify({ receiverId, content }),
      });
    },
    []
  );

  return { sendMessage };
}
