import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import fp from "fastify-plugin";
import { createRemoteJWKSet, jwtVerify, JWTPayload } from "jose";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

declare module "fastify" {
  interface FastifyRequest {
    user?: AuthUser;
  }
}

export default fp(async (fastify: FastifyInstance) => {
  const logtoEndpoint = process.env.LOGTO_ENDPOINT || "http://localhost:4001";
  const jwksUrl = new URL(`/oidc/jwks`, logtoEndpoint);
  const jwks = createRemoteJWKSet(jwksUrl);

  fastify.decorate("verifyJwt", async (token: string): Promise<JWTPayload> => {
    const { payload } = await jwtVerify(token, jwks, {
      issuer: `${logtoEndpoint}/oidc`,
    });
    return payload;
  });

  fastify.decorateRequest("user", undefined);

  fastify.addHook("onRequest", async (request: FastifyRequest, reply: FastifyReply) => {
    // Skip auth for public routes
    const publicPaths = [
      "/api/health",
      "/api/share/",
      "/api/yookassa/webhook",
      "/api/videos/public/",
      "/api/presence/",
      "/api/teams/invites/",
    ];
    if (publicPaths.some((p) => request.url.startsWith(p))) {
      return;
    }
    if (!request.url.startsWith("/api/")) {
      return;
    }

    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      reply.code(401).send({ error: "Missing authorization token" });
      return;
    }

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
      reply.code(401).send({ error: "Invalid token" });
    }
  });
});
