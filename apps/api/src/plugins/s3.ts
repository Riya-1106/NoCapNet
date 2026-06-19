import { PutObjectCommand } from "@aws-sdk/client-s3";
import { S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "../env.js";

export const s3 = new S3Client({
  region: env.S3_REGION,
  endpoint: env.S3_ENDPOINT,
  forcePathStyle: env.S3_FORCE_PATH_STYLE,
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY,
    secretAccessKey: env.S3_SECRET_KEY
  }
});

export const createPresignedUploadUrl = async (input: {
  objectKey: string;
  contentType: string;
  byteLength: number;
}) => {
  const command = new PutObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: input.objectKey,
    ContentType: input.contentType,
    ContentLength: input.byteLength,
    Metadata: {
      app: "nocapnet",
      encrypted: "true"
    }
  });

  return getSignedUrl(s3, command, { expiresIn: 10 * 60 });
};
