import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";

const s3 = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  endpoint: process.env.AWS_S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true,
});

const BUCKET = process.env.AWS_S3_BUCKET || "tal";

export async function uploadCvToS3(
  buffer: Buffer | Uint8Array,
  originalFileName: string
): Promise<string> {
  const suffix = crypto.randomBytes(8).toString("hex");
  const ext = originalFileName.split(".").pop() || "pdf";
  const baseName = originalFileName
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-zA-Z0-9_-]/g, "_");
  const key = `cvs/${baseName}_${suffix}.${ext}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: Buffer.from(buffer),
      ContentType: "application/pdf",
    })
  );

  // Return the S3 key (not public URL) — use getPresignedCvUrl to get a temporary URL
  return key;
}

export async function getPresignedCvUrl(s3Key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: s3Key,
  });
  // URL expires in 1 hour
  return getSignedUrl(s3, command, { expiresIn: 3600 });
}
