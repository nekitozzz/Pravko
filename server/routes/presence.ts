import { FastifyInstance } from "fastify";
import { randomUUID } from "node:crypto";

interface HeartbeatBody {
  videoId: string;
  sessionId: string;
  clientId: string;
  interval: number;
  shareToken?: string;
}

interface DisconnectBody {
  sessionToken: string;
}

// In-memory session store: sessionToken -> { videoId, userId, clientId }
const sessions = new Map<
  string,
  { videoId: string; userId: string; clientId: string }
>();

export default async function presenceRoutes(fastify: FastifyInstance) {
  // Try to parse JWT for presence routes (auth is optional — guests allowed)
  fastify.addHook("onRequest", async (request) => {
    if (!request.url.startsWith("/api/presence/")) return;
    if (request.user) return; // Already parsed by auth plugin

    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) return;

    const token = authHeader.slice(7);
    try {
      const payload = await (fastify as any).verifyJwt(token);
      request.user = {
        id: payload.sub!,
        email: (payload as any).email || "",
        name: (payload as any).name || (payload as any).email || "Unknown",
        avatarUrl: (payload as any).picture,
      };
    } catch {
      // Ignore — treat as guest
    }
  });

  fastify.post<{ Body: HeartbeatBody }>(
    "/api/presence/heartbeat",
    async (request) => {
      const { videoId, clientId } = request.body;

      let userId = `guest:${clientId}`;
      let userName = "Guest";
      let avatarUrl: string | undefined;

      if (request.user) {
        userId = request.user.id;
        userName = request.user.name;
        avatarUrl = request.user.avatarUrl;
      }

      // Find existing session for this client+video or create new one
      let sessionToken: string | undefined;
      for (const [token, session] of sessions) {
        if (session.clientId === clientId && session.videoId === videoId) {
          sessionToken = token;
          break;
        }
      }
      if (!sessionToken) {
        sessionToken = randomUUID();
        sessions.set(sessionToken, { videoId, userId, clientId });
      }

      // Update the WS presence map so all WebSocket subscribers see this user
      const channel = `presence:${videoId}`;
      let presenceMap = fastify.wsPresence.get(channel);
      if (!presenceMap) {
        presenceMap = new Map();
        fastify.wsPresence.set(channel, presenceMap);
      }

      const wasPresent = presenceMap.has(userId);
      presenceMap.set(userId, {
        userId,
        name: userName,
        avatarUrl,
        lastSeen: Date.now(),
      });

      if (!wasPresent) {
        const users = Array.from(presenceMap.values());
        const message = JSON.stringify({
          type: "presence",
          channel,
          data: users,
        });
        for (const client of fastify.wsClients.values()) {
          if (
            client.channels.has(channel) &&
            client.ws.readyState === 1 /* OPEN */
          ) {
            client.ws.send(message);
          }
        }
      }

      const roomToken = `room:${videoId}`;
      return { sessionToken, roomToken };
    },
  );

  fastify.post<{ Body: DisconnectBody }>(
    "/api/presence/disconnect",
    async (request, reply) => {
      const { sessionToken } = request.body;
      const session = sessions.get(sessionToken);
      if (!session) {
        reply.code(204);
        return;
      }

      sessions.delete(sessionToken);

      const channel = `presence:${session.videoId}`;
      const presenceMap = fastify.wsPresence.get(channel);
      if (presenceMap) {
        presenceMap.delete(session.userId);

        const users = Array.from(presenceMap.values());
        const message = JSON.stringify({
          type: "presence",
          channel,
          data: users,
        });
        for (const client of fastify.wsClients.values()) {
          if (
            client.channels.has(channel) &&
            client.ws.readyState === 1 /* OPEN */
          ) {
            client.ws.send(message);
          }
        }

        if (presenceMap.size === 0) {
          fastify.wsPresence.delete(channel);
        }
      }

      reply.code(204);
    },
  );
}
