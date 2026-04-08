import { FastifyInstance } from "fastify";

export function notifyChannel(fastify: FastifyInstance, channel: string, data?: unknown) {
  fastify.wsBroadcast(channel, data ?? { updated: true });
}

export function notifyVideoList(fastify: FastifyInstance, projectId: string) {
  notifyChannel(fastify, `videos:list:${projectId}`);
}

export function notifyVideo(fastify: FastifyInstance, videoId: string) {
  notifyChannel(fastify, `video:${videoId}`);
}

export function notifyComments(fastify: FastifyInstance, videoId: string) {
  notifyChannel(fastify, `comments:${videoId}`);
}
