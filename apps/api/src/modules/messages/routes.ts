import type { FastifyPluginAsync, FastifyRequest } from "fastify";
import { z } from "zod";
import { encryptedEnvelopeSchema, sendMessageSchema } from "@nocapnet/shared";
import { prisma } from "../../plugins/prisma.js";
import { publishRealtimeMessage } from "./socketHub.js";
import { sendExpoPushNotifications } from "../push/push.service.js";

const requireUserId = async (request: FastifyRequest) => {
  const payload = await request.jwtVerify<{ sub: string }>();
  return payload.sub;
};

const ensureParticipant = async (conversationId: string, userId: string) => {
  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId } }
  });

  return Boolean(participant);
};

export const messageRoutes: FastifyPluginAsync = async (app) => {
  app.get("/conversations", async (request) => {
    const userId = await requireUserId(request);
    const conversations = await prisma.conversation.findMany({
      where: { participants: { some: { userId } } },
      include: {
        participants: {
          include: {
            user: { select: { id: true, handle: true, displayName: true, onlineStatus: true, lastSeenAt: true } }
          }
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1
        }
      },
      orderBy: { updatedAt: "desc" }
    });

    return { conversations };
  });

  app.post("/conversations", async (request) => {
    const userId = await requireUserId(request);
    const input = z.object({ friendId: z.string().uuid() }).parse(request.body);

    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userAId: userId, userBId: input.friendId },
          { userAId: input.friendId, userBId: userId }
        ]
      }
    });

    if (!friendship) {
      throw app.httpErrors.forbidden("You can only start chats with friends.");
    }

    const existing = await prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { userId } } },
          { participants: { some: { userId: input.friendId } } }
        ]
      }
    });

    if (existing) {
      return { conversationId: existing.id };
    }

    const conversation = await prisma.conversation.create({
      data: {
        participants: {
          create: [{ userId }, { userId: input.friendId }]
        }
      }
    });

    return { conversationId: conversation.id };
  });

  app.post("/send", async (request) => {
    const senderUserId = await requireUserId(request);
    const input = sendMessageSchema.parse(request.body);
    const isParticipant = await ensureParticipant(input.conversationId, senderUserId);

    if (!isParticipant) {
      throw app.httpErrors.forbidden("You are not in this conversation.");
    }

    const message = await prisma.message.create({
      data: {
        conversationId: input.conversationId,
        senderUserId,
        kind: input.kind,
        envelope: input.envelope,
        mediaObjectKey: input.mediaObjectKey,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined
      }
    });

    await prisma.conversation.update({
      where: { id: input.conversationId },
      data: { updatedAt: new Date() }
    });

    publishRealtimeMessage(input.conversationId, {
      type: "message.created",
      message
    });

    const recipientDevices = await prisma.device.findMany({
      where: {
        userId: { not: senderUserId },
        pushToken: { not: null },
        user: {
          conversations: {
            some: { conversationId: input.conversationId }
          }
        }
      }
    });

    void sendExpoPushNotifications(
      recipientDevices
        .filter((device) => device.pushToken)
        .map((device) => ({
          to: device.pushToken!,
          sound: "default",
          title: "NoCapNet",
          body: "New encrypted message 🔐",
          data: { conversationId: input.conversationId, messageId: message.id }
        }))
    ).catch((error) => app.log.warn({ error }, "Push notification delivery failed."));

    return {
      ok: true,
      message,
      note: "Server stores encrypted envelopes only; plaintext never belongs here."
    };
  });

  app.get("/conversation/:conversationId", async (request) => {
    const userId = await requireUserId(request);
    const params = z.object({ conversationId: z.string().uuid() }).parse(request.params);
    const isParticipant = await ensureParticipant(params.conversationId, userId);

    if (!isParticipant) {
      throw app.httpErrors.forbidden("You are not in this conversation.");
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: params.conversationId },
      include: {
        participants: {
          include: {
            user: { select: { id: true, handle: true, displayName: true, onlineStatus: true, lastSeenAt: true } }
          }
        },
        messages: {
          orderBy: { createdAt: "asc" },
          take: 100
        }
      }
    });

    return {
      conversationId: params.conversationId,
      participants: conversation?.participants ?? [],
      messages: conversation?.messages ?? []
    };
  });

  app.post("/live-location/start", async (request) => {
    const userId = await requireUserId(request);
    const input = z.object({
      conversationId: z.string().uuid(),
      encryptedPayload: encryptedEnvelopeSchema,
      duration: z.enum(["15m", "1h", "8h"])
    }).parse(request.body);

    const isParticipant = await ensureParticipant(input.conversationId, userId);
    if (!isParticipant) {
      throw app.httpErrors.forbidden("You are not in this conversation.");
    }

    const durationMs = input.duration === "15m" ? 15 * 60_000 : input.duration === "1h" ? 60 * 60_000 : 8 * 60 * 60_000;
    const share = await prisma.liveLocationShare.create({
      data: {
        userId,
        conversationId: input.conversationId,
        encryptedPayload: input.encryptedPayload,
        expiresAt: new Date(Date.now() + durationMs)
      }
    });

    publishRealtimeMessage(input.conversationId, {
      type: "location.started",
      share
    });

    return { ok: true, share };
  });

  app.post("/live-location/:shareId/stop", async (request) => {
    const userId = await requireUserId(request);
    const params = z.object({ shareId: z.string().uuid() }).parse(request.params);
    const share = await prisma.liveLocationShare.findFirst({
      where: { id: params.shareId, userId, stoppedAt: null }
    });

    if (!share) {
      throw app.httpErrors.notFound("Live location share not found.");
    }

    const stopped = await prisma.liveLocationShare.update({
      where: { id: share.id },
      data: { stoppedAt: new Date() }
    });

    publishRealtimeMessage(stopped.conversationId, {
      type: "location.stopped",
      share: stopped
    });

    return { ok: true, share: stopped };
  });
};
