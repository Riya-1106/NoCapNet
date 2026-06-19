import { env } from "../../env.js";

type DeliveryInput = {
  channel: "phone" | "email";
  destination: string;
  code: string;
};

const sendConsoleOtp = async (input: DeliveryInput) => ({
  provider: "console",
  message: `VIBE-CHECK OTP for ${input.destination}: ${input.code}`
});

const sendTwilioOtp = async (input: DeliveryInput) => {
  if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN || !env.TWILIO_FROM_PHONE) {
    throw new Error("Twilio OTP delivery selected but TWILIO_* env vars are missing.");
  }

  if (input.channel !== "phone") {
    throw new Error("Twilio delivery only supports phone OTPs.");
  }

  const auth = Buffer.from(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`).toString("base64");
  const body = new URLSearchParams({
    To: input.destination,
    From: env.TWILIO_FROM_PHONE,
    Body: `Your NoCapNet vibe-check code is ${input.code}. It expires in 5 minutes.`
  });

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body
    }
  );

  if (!response.ok) {
    throw new Error(`Twilio OTP delivery failed with ${response.status}.`);
  }

  return { provider: "twilio", message: "OTP delivered by Twilio." };
};

const sendResendOtp = async (input: DeliveryInput) => {
  if (!env.RESEND_API_KEY || !env.RESEND_FROM_EMAIL) {
    throw new Error("Resend OTP delivery selected but RESEND_* env vars are missing.");
  }

  if (input.channel !== "email") {
    throw new Error("Resend delivery only supports email OTPs.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: env.RESEND_FROM_EMAIL,
      to: input.destination,
      subject: "Your NoCapNet vibe-check code",
      text: `Your NoCapNet code is ${input.code}. It expires in 5 minutes.`
    })
  });

  if (!response.ok) {
    throw new Error(`Resend OTP delivery failed with ${response.status}.`);
  }

  return { provider: "resend", message: "OTP delivered by Resend." };
};

export const deliveryService = {
  async sendOtp(input: DeliveryInput) {
    if (env.OTP_DELIVERY_DRIVER === "twilio") {
      return sendTwilioOtp(input);
    }

    if (env.OTP_DELIVERY_DRIVER === "resend") {
      return sendResendOtp(input);
    }

    return sendConsoleOtp(input);
  }
};
