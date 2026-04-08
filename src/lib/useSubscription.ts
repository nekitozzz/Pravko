"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLogto } from "@logto/react";
import { notifyAuthFailure } from "@/lib/api";

export type TranscodeProgress = { stage: string; percent: number; etaSeconds: number | null };

type WsMessage =
  | { type: "update"; channel: string; data?: unknown }
  | { type: "progress"; channel: string; data: { videoId: string; stage: string; percent: number } }
  | { type: "presence"; channel: string; data: unknown[] }
  | { type: "subscribed"; channel: string }
  | { type: "unsubscribed"; channel: string }
  | { type: "error"; message: string };

const WS_RECONNECT_DELAY = 2000;
const WS_MAX_RECONNECT_DELAY = 30000;

let sharedSocket: WebSocket | null = null;
let connecting = false;
let subscriberCount = 0;
const channelSubscribers = new Map<string, Set<() => void>>();
const channelQueryKeys = new Map<string, string[][]>();

// Progress store — keyed by videoId
// Must replace the Map reference on every mutation so useSyncExternalStore detects changes.
let progressStore = new Map<string, TranscodeProgress>();

// ETA tracking — sliding window of recent progress data points per videoId
const etaHistory = new Map<string, Array<{ t: number; p: number }>>();
const ETA_WINDOW = 30; // ~15 seconds at 500ms throttle

function updateEta(videoId: string, percent: number): number | null {
  const now = Date.now();
  let points = etaHistory.get(videoId);
  if (!points) {
    points = [];
    etaHistory.set(videoId, points);
  }

  points.push({ t: now, p: percent });
  if (points.length > ETA_WINDOW) {
    points.splice(0, points.length - ETA_WINDOW);
  }

  if (points.length < 3) return null;

  const first = points[0];
  const last = points[points.length - 1];
  const dt = last.t - first.t;
  const dp = last.p - first.p;

  if (dt < 2000 || dp <= 0) return null;

  const rate = dp / dt; // percent per ms
  const remaining = 100 - percent;
  const etaSec = Math.round(remaining / rate / 1000);

  return etaSec > 7200 ? null : Math.max(etaSec, 0);
}
const progressListeners = new Set<() => void>();

function notifyProgressListeners() {
  for (const cb of progressListeners) cb();
}

function getProgressSnapshot() {
  return progressStore;
}

// Presence store — keyed by channel (e.g. "presence:videoId")
let presenceStore = new Map<string, unknown[]>();
const presenceListeners = new Set<() => void>();

function notifyPresenceListeners() {
  for (const cb of presenceListeners) cb();
}

function getPresenceSnapshot() {
  return presenceStore;
}

function getWsUrl(token: string): string {
  const base = import.meta.env.VITE_WS_URL ?? import.meta.env.VITE_API_URL ?? "";
  const wsBase = base.replace(/^http/, "ws").replace(/\/api$/, "").replace(/\/ws$/, "");
  return `${wsBase}/ws?token=${token}`;
}

function sendSubscribe(channel: string) {
  if (sharedSocket?.readyState === WebSocket.OPEN) {
    sharedSocket.send(JSON.stringify({ type: "subscribe", channel }));
  }
}

function sendUnsubscribe(channel: string) {
  if (sharedSocket?.readyState === WebSocket.OPEN) {
    sharedSocket.send(JSON.stringify({ type: "unsubscribe", channel }));
  }
}

function handleMessage(event: MessageEvent) {
  let msg: WsMessage;
  try {
    msg = JSON.parse(event.data as string);
  } catch {
    return;
  }

  if (msg.type === "update") {
    const callbacks = channelSubscribers.get(msg.channel);
    callbacks?.forEach((cb) => cb());
  } else if (msg.type === "progress") {
    const { videoId, stage, percent } = msg.data;
    progressStore = new Map(progressStore);
    if (stage === "complete") {
      progressStore.delete(videoId);
      etaHistory.delete(videoId);
    } else {
      const etaSeconds = updateEta(videoId, percent);
      progressStore.set(videoId, { stage, percent, etaSeconds });
    }
    notifyProgressListeners();
  } else if (msg.type === "presence") {
    presenceStore = new Map(presenceStore);
    presenceStore.set(msg.channel, msg.data);
    notifyPresenceListeners();
  }
}

export function useSubscription(
  channel: string | null,
  queryKeys?: string[][],
) {
  const queryClient = useQueryClient();
  const { getAccessToken } = useLogto();
  const reconnectDelayRef = useRef(WS_RECONNECT_DELAY);

  useEffect(() => {
    if (!channel) return;

    if (queryKeys) {
      channelQueryKeys.set(channel, queryKeys);
    }

    const callback = () => {
      const keys = channelQueryKeys.get(channel);
      if (keys) {
        for (const key of keys) {
          queryClient.invalidateQueries({ queryKey: key });
        }
      } else {
        queryClient.invalidateQueries();
      }
    };

    let subs = channelSubscribers.get(channel);
    if (!subs) {
      subs = new Set();
      channelSubscribers.set(channel, subs);
    }
    subs.add(callback);

    subscriberCount++;

    const ensureConnected = async () => {
      if (sharedSocket && sharedSocket.readyState <= WebSocket.OPEN) {
        if (sharedSocket.readyState === WebSocket.OPEN) {
          sendSubscribe(channel);
        }
        return;
      }
      if (connecting) return;
      connecting = true;

      let token: string | undefined;
      try {
        const resource = import.meta.env.VITE_API_URL ?? window.location.origin + "/api";
        token = await getAccessToken(resource);
      } catch (err) {
        const msg = String(err) + JSON.stringify(err);
        if (msg.includes("invalid_grant")) {
          notifyAuthFailure();
        }
      }
      if (!token) { connecting = false; return; }

      const ws = new WebSocket(getWsUrl(token));
      sharedSocket = ws;
      connecting = false;

      ws.onopen = () => {
        reconnectDelayRef.current = WS_RECONNECT_DELAY;
        for (const ch of channelSubscribers.keys()) {
          sendSubscribe(ch);
        }
      };

      ws.onmessage = handleMessage;

      ws.onclose = () => {
        if (subscriberCount > 0) {
          setTimeout(() => {
            if (subscriberCount > 0) {
              void ensureConnected();
            }
          }, reconnectDelayRef.current);
          reconnectDelayRef.current = Math.min(
            reconnectDelayRef.current * 2,
            WS_MAX_RECONNECT_DELAY,
          );
        }
      };
    };

    void ensureConnected();

    return () => {
      subs!.delete(callback);
      if (subs!.size === 0) {
        channelSubscribers.delete(channel);
        channelQueryKeys.delete(channel);
        sendUnsubscribe(channel);
      }

      subscriberCount--;
      if (subscriberCount === 0 && sharedSocket) {
        const ws = sharedSocket;
        sharedSocket = null;
        if (ws.readyState === WebSocket.CONNECTING) {
          ws.addEventListener("open", () => ws.close(), { once: true });
        } else {
          ws.close();
        }
      }
    };
  }, [channel, getAccessToken, queryClient, queryKeys]);
}

export function useTranscodeProgress(videoId: string): TranscodeProgress | null {
  const store = useSyncExternalStore(
    (cb) => {
      progressListeners.add(cb);
      return () => progressListeners.delete(cb);
    },
    getProgressSnapshot,
    getProgressSnapshot,
  );
  return store.get(videoId) ?? null;
}

export function usePresenceData(channel: string | null): unknown[] {
  const store = useSyncExternalStore(
    (cb) => {
      presenceListeners.add(cb);
      return () => presenceListeners.delete(cb);
    },
    getPresenceSnapshot,
    getPresenceSnapshot,
  );
  if (!channel) return [];
  return store.get(channel) ?? [];
}
