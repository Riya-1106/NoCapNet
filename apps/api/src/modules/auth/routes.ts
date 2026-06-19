import type { FastifyPluginAsync } from "fastify";
import { OAuth2Client } from "google-auth-library";
import { z } from "zod";
import { requestOtpSchema, verifyOtpSchema } from "@nocapnet/shared";
import { OtpService } from "./otp.service.js";
import { deliveryService } from "./delivery.service.js";
import { prisma } from "../../plugins/prisma.js";
import { env } from "../../env.js";

const createFriendCodeCandidate = () => {
  const chunk = () => Math.random().toString(36).replace(/[^a-z0-9]/gi, "").slice(2, 6).toUpperCase().padEnd(4, "X");
  return `NCN-${chunk()}-${chunk()}`;
};

const createUniqueFriendCode = async () => {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const friendCode = createFriendCodeCandidate();
    const existing = await prisma.user.findUnique({ where: { friendCode } });

    if (!existing) {
      return friendCode;
    }
  }

  throw new Error("Unable to generate a unique friend code.");
};

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

export const authRoutes: FastifyPluginAsync = async (app) => {
  app.post("/otp/request", async (request) => {
    const input = requestOtpSchema.parse(request.body);
    const code = await OtpService.generate(input.destination, input.channel);
    const delivery = await deliveryService.sendOtp({
      channel: input.channel,
      destination: input.destination,
      code
    });

    app.log.warn(
      { destination: input.destination, channel: input.channel, provider: delivery.provider, code },
      delivery.message
    );

    return {
      ok: true,
      message: input.channel === "phone" ? "OTP sent to your phone." : "OTP sent to your email."
    };
  });

  app.post("/otp/verify", async (request, reply) => {
    const input = verifyOtpSchema.parse(request.body);
    const isValid = await OtpService.verify(input.destination, input.channel, input.code);

    if (!isValid) {
      throw app.httpErrors.unauthorized("Invalid or expired OTP.");
    }

    const field = input.channel === "phone" ? "phoneHash" : "emailHash";
    const destinationHash = OtpService.hashDestination(input.destination);

    let user = await prisma.user.findUnique({
      where: { [field]: destinationHash } as any
    });

    const profileSetupRequired = !user;

    if (!user) {
      // Create minimal profile foundation
      user = await prisma.user.create({
        data: {
          displayName: input.channel === "email" ? input.destination.split("@")[0] : "NoCap Bestie",
          handle: `ncn_${Math.random().toString(36).substring(2, 8)}`,
          [field]: destinationHash,
          friendCode: await createUniqueFriendCode(),
          onlineStatus: "ONLINE",
          lastSeenAt: new Date()
        }
      });
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { onlineStatus: "ONLINE", lastSeenAt: new Date() }
      });
    }

    const accessToken = await reply.jwtSign(
      { sub: user.id, authChannel: input.channel },
      { expiresIn: "7d" }
    );

    return {
      ok: true,
      accessToken,
      profileSetupRequired,
      user: {
        id: user.id,
        handle: user.handle,
        displayName: user.displayName
      }
    };
  });

  app.post("/google", async (request, reply) => {
    if (!env.GOOGLE_CLIENT_ID) {
      throw app.httpErrors.serviceUnavailable("Google OAuth is not configured.");
    }

    const input = z.object({ idToken: z.string().min(20) }).parse(request.body);
    const ticket = await googleClient.verifyIdToken({
      idToken: input.idToken,
      audience: env.GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();

    if (!payload?.email) {
      throw app.httpErrors.unauthorized("Google account did not provide an email.");
    }

    const emailHash = OtpService.hashDestination(payload.email);
    let user = await prisma.user.findUnique({ where: { emailHash } });
    const profileSetupRequired = !user;

    if (!user) {
      user = await prisma.user.create({
        data: {
          displayName: payload.name ?? payload.email.split("@")[0],
          handle: `ncn_${Math.random().toString(36).substring(2, 8)}`,
          emailHash,
          friendCode: await createUniqueFriendCode(),
          onlineStatus: "ONLINE",
          lastSeenAt: new Date()
        }
      });
    }

    const accessToken = await reply.jwtSign({ sub: user.id, authChannel: "google" }, { expiresIn: "7d" });

    return {
      ok: true,
      accessToken,
      profileSetupRequired,
      user: {
        id: user.id,
        handle: user.handle,
        displayName: user.displayName
      }
    };
  });
};
