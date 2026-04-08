import { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { db, Db } from "../db/index.js";

declare module "fastify" {
  interface FastifyInstance {
    db: Db;
  }
}

export default fp(async (fastify: FastifyInstance) => {
  fastify.decorate("db", db);
});
