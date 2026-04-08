import { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { WebSocketServer, WebSocket } from "ws";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { URL } from "node:url";

interface WsClient {
  ws: WebSocket;
  userId: string;
  channels: Set<string>;
}

declare module "fastify" {
  interface FastifyInstance {
    wsClients: Map<WebSocket, WsClient>;
    wsBroadcast: (channel: string, data: unknown) => void;
    wsPresence: Map<string, Map<string, { userId: string; name: string; avatarUrl?: string; lastSeen: number }>>;
  }
}

export default fp(async (fastify: FastifyInstance) => {
  const logtoEndpoint = process.env.LOGTO_ENDPOINT || "http://localhost:4001";
  const jwksUrl = new URL("/oidc/jwks", logtoEndpoint);
  const jwks = createRemoteJWKSet(jwksUrl);

  const clients = new Map<WebSocket, WsClient>();
  const presence = new Map<string, Map<string, { userId: string; name: string; avatarUrl?: string; lastSeen: number }>>();

  fastify.decorate("wsClients", clients);
  fastify.decorate("wsPresence", presence);

  fastify.decorate("wsBroadcast", (channel: string, data: unknown) => {
    const message = JSON.stringify({ type: "update", channel, data });
    for (const client of clients.values()) {
      if (client.channels.has(channel) && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(message);
      }
    }
  });

  const wss = new WebSocketServer({ noServer: true });

  fastify.server.on("upgrade", async (request, socket, head) => {
    if (!request.url?.startsWith("/ws")) {
      socket.destroy();
      return;
    }

    const url = new URL(request.url, `http://${request.headers.host}`);
    const token = url.searchParams.get("token");
    if (!token) {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }

    try {
      const { payload } = await jwtVerify(token, jwks, {
        issuer: `${logtoEndpoint}/oidc`,
      });

      wss.handleUpgrade(request, socket, head, (ws) => {
        const client: WsClient = {
          ws,
          userId: payload.sub!,
          channels: new Set(),
        };
        clients.set(ws, client);

        ws.on("message", (rawData) => {
          try {
            const msg = JSON.parse(rawData.toString());
            handleMessage(client, msg);
          } catch {
            // ignore malformed messages
          }
        });

        ws.on("close", () => {
          // Remove from presence channels
          for (const channel of client.channels) {
            if (channel.startsWith("presence:")) {
              const presenceMap = presence.get(channel);
              if (presenceMap) {
                presenceMap.delete(client.userId);
                broadcastPresence(channel);
                if (presenceMap.size === 0) presence.delete(channel);
              }
            }
          }
          clients.delete(ws);
        });

        ws.send(JSON.stringify({ type: "connected", userId: payload.sub }));
      });
    } catch (err) {
      fastify.log.error(err, "WebSocket JWT verification failed");
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
    }
  });

  function handleMessage(client: WsClient, msg: { type: string; channel?: string; name?: string; avatarUrl?: string }) {
    switch (msg.type) {
      case "subscribe":
        if (msg.channel) {
          client.channels.add(msg.channel);
        }
        break;

      case "unsubscribe":
        if (msg.channel) {
          client.channels.delete(msg.channel);
          if (msg.channel.startsWith("presence:")) {
            const presenceMap = presence.get(msg.channel);
            if (presenceMap) {
              presenceMap.delete(client.userId);
              broadcastPresence(msg.channel);
            }
          }
        }
        break;

      case "heartbeat":
        if (msg.channel?.startsWith("presence:")) {
          let presenceMap = presence.get(msg.channel);
          if (!presenceMap) {
            presenceMap = new Map();
            presence.set(msg.channel, presenceMap);
          }
          const wasPresent = presenceMap.has(client.userId);
          presenceMap.set(client.userId, {
            userId: client.userId,
            name: msg.name || "Unknown",
            avatarUrl: msg.avatarUrl,
            lastSeen: Date.now(),
          });
          client.channels.add(msg.channel);
          if (!wasPresent) {
            broadcastPresence(msg.channel);
          }
        }
        break;
    }
  }

  function broadcastPresence(channel: string) {
    const presenceMap = presence.get(channel);
    const users = presenceMap ? Array.from(presenceMap.values()) : [];
    const message = JSON.stringify({ type: "presence", channel, data: users });
    for (const client of clients.values()) {
      if (client.channels.has(channel) && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(message);
      }
    }
  }

  // Presence cleanup: remove stale entries every 30s
  const presenceCleanupInterval = setInterval(() => {
    const staleThreshold = Date.now() - 45_000; // 45s timeout
    for (const [channel, presenceMap] of presence) {
      let changed = false;
      for (const [userId, entry] of presenceMap) {
        if (entry.lastSeen < staleThreshold) {
          presenceMap.delete(userId);
          changed = true;
        }
      }
      if (changed) broadcastPresence(channel);
      if (presenceMap.size === 0) presence.delete(channel);
    }
  }, 30_000);

  fastify.addHook("onClose", async () => {
    clearInterval(presenceCleanupInterval);
    wss.close();
  });
});
