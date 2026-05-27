// Object storage backed by Cloudflare R2 via the S3-compatible API.
// Same exported surface as before — callers in stage2.ts don't need to change.
//
// Env required (set in .env.local for dev, Wrangler secrets for prod):
//   R2_ACCOUNT_ID       — Cloudflare account ID (visible in `wrangler whoami`)
//   R2_BUCKET           — bucket name (e.g. "ikf-pathway-uploads")
//   R2_ACCESS_KEY_ID    — S3 API key (from R2 dashboard → API Tokens)
//   R2_SECRET_ACCESS_KEY — S3 API secret
//   R2_PUBLIC_BASE_URL  — (optional) public r2.dev or custom-domain URL for signed-less reads

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  type S3ClientConfig,
} from "@aws-sdk/client-s3";
import { extname } from "node:path";
import { randomBytes } from "node:crypto";

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_BUCKET = process.env.R2_BUCKET;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;

export const ALLOWED_MIME = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
]);

export const MAX_FILE_SIZE = 15 * 1024 * 1024;

const EXT_BY_MIME: Record<string, string> = {
  "application/pdf": ".pdf",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
  "image/jpeg": ".jpg",
  "image/png": ".png",
};

export type StoredFile = {
  path: string;
  size: number;
};

let _client: S3Client | null = null;
function getClient(): S3Client {
  if (_client) return _client;
  if (!R2_ACCOUNT_ID || !R2_BUCKET || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    throw new Error(
      "R2 storage not configured. Set R2_ACCOUNT_ID, R2_BUCKET, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY in env."
    );
  }
  const config: S3ClientConfig = {
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  };
  _client = new S3Client(config);
  return _client;
}

export async function storeFile(profileId: string, assessmentKey: string, file: File): Promise<StoredFile> {
  if (!ALLOWED_MIME.has(file.type)) {
    throw new Error(`Unsupported file type: ${file.type}. Allowed: PDF, DOC, DOCX, JPG, PNG.`);
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max ${MAX_FILE_SIZE / 1024 / 1024} MB.`);
  }

  const ext = EXT_BY_MIME[file.type] ?? extname(file.name) ?? "";
  const stem = randomBytes(8).toString("hex");
  const fileName = `${assessmentKey}-${stem}${ext}`;
  const key = `${profileId}/${fileName}`;

  const buf = Buffer.from(await file.arrayBuffer());

  await getClient().send(new PutObjectCommand({
    Bucket: R2_BUCKET!,
    Key: key,
    Body: buf,
    ContentType: file.type,
    ContentLength: buf.length,
  }));

  return { path: key, size: buf.length };
}

export async function deleteFile(relativePath: string): Promise<void> {
  try {
    await getClient().send(new DeleteObjectCommand({
      Bucket: R2_BUCKET!,
      Key: relativePath,
    }));
  } catch (err) {
    // R2 DELETE is idempotent — a 404 here is fine. Re-throw anything else.
    const status = (err as { $metadata?: { httpStatusCode?: number } })?.$metadata?.httpStatusCode;
    if (status && status !== 404) throw err;
  }
}

export async function readStoredFile(relativePath: string): Promise<{ buffer: Buffer; size: number }> {
  const res = await getClient().send(new GetObjectCommand({
    Bucket: R2_BUCKET!,
    Key: relativePath,
  }));
  if (!res.Body) throw new Error(`Object body missing for key ${relativePath}`);
  const bytes = await res.Body.transformToByteArray();
  return { buffer: Buffer.from(bytes), size: bytes.length };
}
