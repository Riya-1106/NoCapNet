import { createHash, randomInt } from "node:crypto";
import { env } from "../../env.js";
import { prisma } from "../../plugins/prisma.js";

export class OtpService {
  static hashDestination(destination: string) {
    return createHash("sha256")
      .update(`${destination.trim().toLowerCase()}:${env.OTP_PEPPER}`)
      .digest("hex");
  }

  static hashCode(destinationHash: string, code: string) {
    return createHash("sha256")
      .update(`${destinationHash}:${code}:${env.OTP_PEPPER}`)
      .digest("hex");
  }

  static async generate(destination: string, channel: "phone" | "email") {
    const code = String(randomInt(100000, 999999));
    const destinationHash = this.hashDestination(destination);
    const codeHash = this.hashCode(destinationHash, code);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await prisma.otp.upsert({
      where: { destinationHash_channel: { destinationHash, channel } },
      update: { codeHash, expiresAt, attempts: 0 },
      create: { destinationHash, channel, codeHash, expiresAt }
    });

    return code;
  }

  static async verify(destination: string, channel: "phone" | "email", code: string) {
    const destinationHash = this.hashDestination(destination);
    const record = await prisma.otp.findUnique({
      where: { destinationHash_channel: { destinationHash, channel } }
    });

    if (!record) return false;
    if (record.expiresAt < new Date()) return false;
    if (record.attempts >= 5) return false;

    const isValid = record.codeHash === this.hashCode(destinationHash, code);

    if (isValid) {
      await prisma.otp.delete({ where: { destinationHash_channel: { destinationHash, channel } } });
    } else {
      await prisma.otp.update({
        where: { destinationHash_channel: { destinationHash, channel } },
        data: { attempts: { increment: 1 } }
      });
    }

    return isValid;
  }
}
