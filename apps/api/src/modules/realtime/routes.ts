import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { prisma } from "../../plugins/prisma.js";
import { joinConversationRoom } from "../messages/socketHub.js";

export const realtimeRoutes: FastifyPluginAsync = async (app) => {
  app.get("/conversation/:conversationId", { websocket: true }, async (socket, request) => {
    const params = z.object({ conversationId: z.string().uuid() }).parse(request.params);
    const token = z.object({ token: z.string().min(10) }).parse(request.query).token;
    const payload = app.jwt.verify<{ sub: string }>(token);

    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId: params.conversationId,
          userId: payload.sub
        }
      }
    });

    if (!participant) {
      socket.close(1008, "Not a participant.");
      return;
    }

    const leave = joinConversationRoom(params.conversationId, {
      send: (message) => socket.send(message)
    });

    socket.send(JSON.stringify({ type: "socket.ready", conversationId: params.conversationId }));
    socket.on("close", leave);
  });
};
