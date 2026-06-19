import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { prisma } from "../../plugins/prisma.js";

export const pushRoutes: FastifyPluginAsync = async (app) => {
  app.post("/register", async (request) => {
    const payload = await request.jwtVerify<{ sub: string }>();
    const input = z.object({
      deviceId: z.string().uuid().optional(),
      platform: z.enum(["ios", "android", "web"]),
      pushToken: z.string().min(10).max(512)
    }).parse(request.body);

    const existingDevice = input.deviceId
      ? await prisma.device.findFirst({ where: { id: input.deviceId, userId: payload.sub } })
      : null;

    const device = existingDevice
      ? await prisma.device.update({
          where: { id: existingDevice.id },
          data: { platform: input.platform, pushToken: input.pushToken }
        })
      : await prisma.device.create({
          data: { userId: payload.sub, platform: input.platform, pushToken: input.pushToken }
        });

    return {
      ok: true,
      deviceId: device.id
    };
  });
};
