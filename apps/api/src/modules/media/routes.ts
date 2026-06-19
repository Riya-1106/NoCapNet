import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { createPresignedUploadUrl } from "../../plugins/s3.js";

export const mediaRoutes: FastifyPluginAsync = async (app) => {
  app.post("/presign-upload", async (request) => {
    await request.jwtVerify();
    const input = z.object({
      kind: z.enum(["image", "video", "audio"]),
      contentType: z.enum([
        "image/jpeg",
        "image/png",
        "image/webp",
        "video/mp4",
        "video/quicktime",
        "audio/mpeg",
        "audio/mp4",
        "audio/aac",
        "audio/wav"
      ]),
      byteLength: z.number().int().positive().max(250 * 1024 * 1024)
    }).parse(request.body);

    const contentKind = input.contentType.split("/")[0];
    if (contentKind !== input.kind) {
      throw app.httpErrors.badRequest("Media kind must match the content type.");
    }

    const objectKey = `${input.kind}/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}`;
    const uploadUrl = await createPresignedUploadUrl({
      objectKey,
      contentType: input.contentType,
      byteLength: input.byteLength
    });

    return {
      kind: input.kind,
      objectKey,
      uploadUrl,
      expiresIn: "10m"
    };
  });
};
