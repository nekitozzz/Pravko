import { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import Redis from "ioredis";

declare module "fastify" {
  interface FastifyInstance {
    redis: Redis;
    redisSub: Redis;
  }
}

export default fp(async (fastify: FastifyInstance) => {
  const redisUrl = process.env.REDIS_URL || "redis://localhost:4380";

  const redis = new Redis(redisUrl, { maxRetriesPerRequest: 3 });
  const redisSub = new Redis(redisUrl, { maxRetriesPerRequest: 3 });

  fastify.decorate("redis", redis);
  fastify.decorate("redisSub", redisSub);

  fastify.addHook("onClose", async () => {
    await redis.quit();
    await redisSub.quit();
  });
});
