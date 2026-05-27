import { mkdir, writeFile, unlink, readFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, extname } from "node:path";
import { randomBytes } from "node:crypto";

const UPLOAD_ROOT = join(process.cwd(), "uploads");

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

async function ensureDir(dir: string) {
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }
}

export async function storeFile(profileId: string, assessmentKey: string, file: File): Promise<StoredFile> {
  if (!ALLOWED_MIME.has(file.type)) {
    throw new Error(`Unsupported file type: ${file.type}. Allowed: PDF, DOC, DOCX, JPG, PNG.`);
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max ${MAX_FILE_SIZE / 1024 / 1024} MB.`);
  }

  const dir = join(UPLOAD_ROOT, profileId);
  await ensureDir(dir);

  const ext = EXT_BY_MIME[file.type] ?? extname(file.name) ?? "";
  const stem = randomBytes(8).toString("hex");
  const fileName = `${assessmentKey}-${stem}${ext}`;
  const fullPath = join(dir, fileName);

  const buf = Buffer.from(await file.arrayBuffer());
  await writeFile(fullPath, buf);

  const relativePath = `${profileId}/${fileName}`;
  return { path: relativePath, size: buf.length };
}

export async function deleteFile(relativePath: string): Promise<void> {
  const fullPath = join(UPLOAD_ROOT, relativePath);
  try {
    await unlink(fullPath);
  } catch (err) {
    if ((err as NodeJS.ErrnoException)?.code !== "ENOENT") throw err;
  }
}

export async function readStoredFile(relativePath: string): Promise<{ buffer: Buffer; size: number }> {
  const fullPath = join(UPLOAD_ROOT, relativePath);
  const buffer = await readFile(fullPath);
  const stats = await stat(fullPath);
  return { buffer, size: stats.size };
}
