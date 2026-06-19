import type { FastifyPluginAsync, FastifyRequest } from "fastify";
import { customAlphabet } from "nanoid";
import { z } from "zod";
import { friendCodeSchema } from "@nocapnet/shared";
import { prisma } from "../../plugins/prisma.js";

const alphabet = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 8);

const requireUserId = async (request: FastifyRequest) => {
  const payload = await request.jwtVerify<{ sub: string }>();
  return payload.sub;
};

const orderedPair = (userId: string, friendId: string) =>
  userId < friendId ? { userAId: userId, userBId: friendId } : { userAId: friendId, userBId: userId };

export const friendRoutes: FastifyPluginAsync = async (app) => {
  app.get("/code", async (request) => {
    const userId = await requireUserId(request);
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

    return {
      code: user.friendCode,
      shareText: `Add me on NoCapNet with ${user.friendCode} — private chats, zero weird energy.`
    };
  });

  app.get("/requests", async (request) => {
    const userId = await requireUserId(request);
    const requests = await prisma.friendRequest.findMany({
      where: { receiverId: userId, status: "PENDING" },
      include: { sender: { select: { id: true, handle: true, displayName: true, avatarObjectKey: true } } },
      orderBy: { createdAt: "desc" }
    });

    return { requests };
  });

  app.get("/list", async (request) => {
    const userId = await requireUserId(request);
    const friendships = await prisma.friendship.findMany({
      where: { OR: [{ userAId: userId }, { userBId: userId }] },
      include: {
        userA: { select: { id: true, handle: true, displayName: true, onlineStatus: true, lastSeenAt: true } },
        userB: { select: { id: true, handle: true, displayName: true, onlineStatus: true, lastSeenAt: true } }
      },
      orderBy: { createdAt: "desc" }
    });

    return {
      friends: friendships.map((friendship) => (friendship.userAId === userId ? friendship.userB : friendship.userA))
    };
  });

  app.post("/request", async (request) => {
    const senderId = await requireUserId(request);
    const input = z.object({ code: friendCodeSchema }).parse(request.body);
    const receiver = await prisma.user.findUnique({ where: { friendCode: input.code } });

    if (!receiver) {
      throw app.httpErrors.notFound("No user found for that NoCapNet code.");
    }

    if (receiver.id === senderId) {
      throw app.httpErrors.badRequest("You cannot add yourself, main character.");
    }

    const pair = orderedPair(senderId, receiver.id);
    const existingFriendship = await prisma.friendship.findUnique({
      where: { userAId_userBId: pair }
    });

    if (existingFriendship) {
      return { ok: true, status: "already_friends", friendId: receiver.id };
    }

    const existingRequest = await prisma.friendRequest.findFirst({
      where: {
        OR: [
          { senderId, receiverId: receiver.id },
          { senderId: receiver.id, receiverId: senderId }
        ],
        status: "PENDING"
      }
    });

    if (existingRequest) {
      return { ok: true, status: "pending", requestId: existingRequest.id };
    }

    const friendRequest = await prisma.friendRequest.create({
      data: { senderId, receiverId: receiver.id }
    });

    return {
      ok: true,
      status: "pending",
      requestId: friendRequest.id,
      message: "Friend request sent. Ball is in their court."
    };
  });

  app.post("/requests/:requestId/accept", async (request) => {
    const userId = await requireUserId(request);
    const params = z.object({ requestId: z.string().uuid() }).parse(request.params);
    const friendRequest = await prisma.friendRequest.findFirst({
      where: { id: params.requestId, receiverId: userId, status: "PENDING" }
    });

    if (!friendRequest) {
      throw app.httpErrors.notFound("Friend request not found.");
    }

    const pair = orderedPair(friendRequest.senderId, friendRequest.receiverId);
    const [updatedRequest, friendship, conversation] = await prisma.$transaction([
      prisma.friendRequest.update({
        where: { id: friendRequest.id },
        data: { status: "ACCEPTED" }
      }),
      prisma.friendship.upsert({
        where: { userAId_userBId: pair },
        update: {},
        create: pair
      }),
      prisma.conversation.create({
        data: {
          participants: {
            create: [{ userId: friendRequest.senderId }, { userId: friendRequest.receiverId }]
          }
        }
      })
    ]);

    return {
      ok: true,
      request: updatedRequest,
      friendship,
      conversationId: conversation.id
    };
  });

  app.post("/requests/:requestId/reject", async (request) => {
    const userId = await requireUserId(request);
    const params = z.object({ requestId: z.string().uuid() }).parse(request.params);
    const friendRequest = await prisma.friendRequest.findFirst({
      where: { id: params.requestId, receiverId: userId, status: "PENDING" }
    });

    if (!friendRequest) {
      throw app.httpErrors.notFound("Friend request not found.");
    }

    const updatedRequest = await prisma.friendRequest.update({
      where: { id: params.requestId },
      data: { status: "REJECTED" }
    });

    return { ok: true, request: updatedRequest };
  });

  app.post("/connection-link", async (request) => {
    const userId = await requireUserId(request);
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

    return {
      url: `https://nocap.net/add/${user.friendCode}`,
      code: user.friendCode,
      expiresIn: "24h",
      nonce: alphabet()
    };
  });
};
