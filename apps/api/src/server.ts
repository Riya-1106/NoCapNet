import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import jwt from "@fastify/jwt";
import rateLimit from "@fastify/rate-limit";
import sensible from "@fastify/sensible";
import websocket from "@fastify/websocket";
import Fastify from "fastify";
import { env } from "./env.js";
import { authRoutes } from "./modules/auth/routes.js";
import { friendRoutes } from "./modules/friends/routes.js";
import { mediaRoutes } from "./modules/media/routes.js";
import { messageRoutes } from "./modules/messages/routes.js";
import { keyRoutes } from "./modules/keys/routes.js";
import { realtimeRoutes } from "./modules/realtime/routes.js";
import { pushRoutes } from "./modules/push/routes.js";

const app = Fastify({
  logger: {
    level: env.NODE_ENV === "production" ? "info" : "debug"
  }
});

await app.register(helmet);
await app.register(cors, {
  origin: env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN.split(",").map((origin) => origin.trim()),
  credentials: true
});
await app.register(sensible);
await app.register(rateLimit, { max: 120, timeWindow: "1 minute" });
await app.register(jwt, { secret: env.JWT_ACCESS_SECRET });
await app.register(websocket);

app.get("/health", async () => ({
  ok: true,
  service: "nocapnet-api",
  vibe: "locked in, no cap"
}));

await app.register(authRoutes, { prefix: "/auth" });
await app.register(friendRoutes, { prefix: "/friends" });
await app.register(messageRoutes, { prefix: "/messages" });
await app.register(mediaRoutes, { prefix: "/media" });
await app.register(keyRoutes, { prefix: "/keys" });
await app.register(realtimeRoutes, { prefix: "/realtime" });
await app.register(pushRoutes, { prefix: "/push" });

await app.listen({ host: "0.0.0.0", port: env.API_PORT });
