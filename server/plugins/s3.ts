import { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { S3Client } from "@aws-sdk/client-s3";

declare module "fastify" {
  interface FastifyInstance {
    s3: S3Client;
    s3Bucket: string;
    s3PublicUrl: string;
  }
}

export default fp(async (fastify: FastifyInstance) => {
  const s3 = new S3Client({
    region: process.env.S3_REGION || "ru-1",
    endpoint: process.env.S3_ENDPOINT,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY || "",
      secretAccessKey: process.env.S3_SECRET_KEY || "",
    },
    forcePathStyle: true,
  });

  const bucket = process.env.S3_BUCKET || "pravko-videos";
  const publicUrl = process.env.S3_PUBLIC_URL || `${process.env.S3_ENDPOINT}/${bucket}`;

  fastify.decorate("s3", s3);
  fastify.decorate("s3Bucket", bucket);
  fastify.decorate("s3PublicUrl", publicUrl);

  fastify.addHook("onClose", async () => {
    s3.destroy();
  });
});
