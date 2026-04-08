"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import api from "./api";
import { useSubscription, usePresenceData } from "./useSubscription";

const STORAGE_KEY_CLIENT_ID = "pravko.presence.client_id";
const DEFAULT_HEARTBEAT_INTERVAL_MS = 15_000;

export type VideoWatcher = {
  userId: string;
  online: boolean;
  kind: "member" | "guest";
  displayName: string;
  avatarUrl?: string;
};

function getOrCreateClientId(): string {
  const existing = window.localStorage.getItem(STORAGE_KEY_CLIENT_ID);
  if (existing && existing.trim().length > 0) return existing;
  const clientId = crypto.randomUUID().replace(/-/g, "");
  window.localStorage.setItem(STORAGE_KEY_CLIENT_ID, clientId);
  return clientId;
}

export function useVideoPresence(input: {
  videoId?: string;
  enabled?: boolean;
  shareToken?: string;
  intervalMs?: number;
}) {
  const {
    videoId,
    enabled = true,
    shareToken,
    intervalMs = DEFAULT_HEARTBEAT_INTERVAL_MS,
  } = input;

  const [clientId, setClientId] = useState<string | null>(null);
  const sessionTokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setClientId(getOrCreateClientId());
  }, []);

  const channel = enabled && videoId ? `presence:${videoId}` : null;

  // Subscribe to presence channel via the shared authenticated WebSocket
  useSubscription(channel);

  // Get presence data from the shared store
  const rawPresence = usePresenceData(channel);

  const watchers = useMemo<VideoWatcher[]>(() => {
    if (!rawPresence || rawPresence.length === 0) return [];
    return (rawPresence as { userId: string; name: string; avatarUrl?: string }[]).map(
      (entry) => ({
        userId: entry.userId,
        online: true,
        kind: entry.userId.startsWith("guest:") ? "guest" : "member",
        displayName: entry.name,
        avatarUrl: entry.avatarUrl,
      }),
    );
  }, [rawPresence]);

  // REST heartbeat to keep presence alive on the server
  useEffect(() => {
    if (!enabled || !videoId || !clientId) return;

    let active = true;
    const sessionId = crypto.randomUUID();

    const runHeartbeat = async () => {
      try {
        const result = await api.presence.heartbeat({
          videoId,
          sessionId,
          clientId,
          interval: intervalMs,
          shareToken,
        });
        if (!active) return;
        sessionTokenRef.current = result.sessionToken;
      } catch {
        // Heartbeat failures should not crash the UI.
      }
    };

    const handleBeforeUnload = () => {
      const sessionToken = sessionTokenRef.current;
      if (!sessionToken) return;
      const apiUrl = import.meta.env.VITE_API_URL ?? "/api";
      const blob = new Blob(
        [JSON.stringify({ sessionToken })],
        { type: "application/json" },
      );
      navigator.sendBeacon(`${apiUrl}/presence/disconnect`, blob);
    };

    void runHeartbeat();
    const heartbeatIntervalId = window.setInterval(() => {
      void runHeartbeat();
    }, intervalMs);

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      active = false;
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.clearInterval(heartbeatIntervalId);

      const sessionToken = sessionTokenRef.current;
      sessionTokenRef.current = null;
      if (sessionToken) {
        api.presence.disconnect({ sessionToken }).catch(() => {});
      }
    };
  }, [clientId, enabled, intervalMs, shareToken, videoId]);

  return {
    watchers,
    isLoading: false,
  };
}
