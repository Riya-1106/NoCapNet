import type { FastifyPluginAsync, FastifyRequest } from "fastify";
import { fetchPreKeyBundleParamsSchema, uploadPreKeyBundleSchema } from "@nocapnet/shared";
import { prisma } from "../../plugins/prisma.js";

const requireUserId = async (request: FastifyRequest) => {
  const payload = await request.jwtVerify<{ sub: string }>();
  return payload.sub;
};

export const keyRoutes: FastifyPluginAsync = async (app) => {
  app.post("/upload", async (request) => {
    const userId = await requireUserId(request);
    const input = uploadPreKeyBundleSchema.parse(request.body);

    const existingDevice = input.deviceId
      ? await prisma.device.findFirst({ where: { id: input.deviceId, userId } })
      : null;

    const device = existingDevice
      ? await prisma.device.update({
          where: { id: existingDevice.id },
          data: { platform: input.platform, pushToken: input.pushToken }
        })
      : await prisma.device.create({ data: { userId, platform: input.platform, pushToken: input.pushToken } });

    await prisma.$transaction([
      prisma.publicIdentityKey.upsert({
        where: { deviceId: device.id },
        update: { publicKey: input.publicIdentityKey, signingPublicKey: input.signingPublicKey },
        create: {
          deviceId: device.id,
          publicKey: input.publicIdentityKey,
          signingPublicKey: input.signingPublicKey
        }
      }),
      prisma.signedPreKey.upsert({
        where: { deviceId: device.id },
        update: {
          keyId: input.signedPreKey.keyId,
          publicKey: input.signedPreKey.publicKey,
          signature: input.signedPreKey.signature
        },
        create: {
          deviceId: device.id,
          keyId: input.signedPreKey.keyId,
          publicKey: input.signedPreKey.publicKey,
          signature: input.signedPreKey.signature
        }
      }),
      prisma.oneTimePreKey.deleteMany({ where: { deviceId: device.id, claimedAt: null } }),
      prisma.oneTimePreKey.createMany({
        data: input.oneTimePreKeys.map((preKey) => ({
          deviceId: device.id,
          keyId: preKey.keyId,
          publicKey: preKey.publicKey
        })),
        skipDuplicates: true
      })
    ]);

    return {
      ok: true,
      deviceId: device.id,
      uploadedOneTimePreKeys: input.oneTimePreKeys.length
    };
  });

  app.get("/fetch/:userId", async (request) => {
    await requireUserId(request);
    const params = fetchPreKeyBundleParamsSchema.parse(request.params);

    const device = await prisma.device.findFirst({
      where: {
        userId: params.userId,
        publicIdentityKey: { isNot: null },
        signedPreKey: { isNot: null }
      },
      include: {
        publicIdentityKey: true,
        signedPreKey: true,
        oneTimePreKeys: {
          where: { claimedAt: null },
          orderBy: { createdAt: "asc" },
          take: 1
        }
      },
      orderBy: { updatedAt: "desc" }
    });

    if (!device?.publicIdentityKey || !device.signedPreKey) {
      throw app.httpErrors.notFound("No pre-key bundle available for this user.");
    }

    const oneTimePreKey = device.oneTimePreKeys[0];

    if (oneTimePreKey) {
      await prisma.oneTimePreKey.update({
        where: { id: oneTimePreKey.id },
        data: { claimedAt: new Date() }
      });
    }

    return {
      userId: params.userId,
      deviceId: device.id,
      publicIdentityKey: device.publicIdentityKey.publicKey,
      signingPublicKey: device.publicIdentityKey.signingPublicKey,
      signedPreKey: {
        keyId: device.signedPreKey.keyId,
        publicKey: device.signedPreKey.publicKey,
        signature: device.signedPreKey.signature
      },
      oneTimePreKey: oneTimePreKey
        ? {
            keyId: oneTimePreKey.keyId,
            publicKey: oneTimePreKey.publicKey
          }
        : null
    };
  });
};
