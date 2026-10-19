import "server-only";
import {
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "./env";

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: env.R2_ACCESS_KEY_ID, secretAccessKey: env.R2_SECRET_ACCESS_KEY },
  // SDK default signs a CRC32 of the (empty) body into presigned PUT URLs; browsers send the real file.
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
});
const Bucket = env.R2_BUCKET;

export const albumPrefix = (albumId: string) => `albums/${albumId}/`;
export const originalKey = (albumId: string, assetId: string) => `albums/${albumId}/o/${assetId}`;
export const thumbKey = (albumId: string, assetId: string) => `albums/${albumId}/t/${assetId}.jpg`;

export function presignPut(key: string, contentType: string, contentLength: number) {
  // ContentLength is signed, so the client can't upload more than it declared.
  return getSignedUrl(
    s3,
    new PutObjectCommand({ Bucket, Key: key, ContentType: contentType, ContentLength: contentLength }),
    { expiresIn: 3600 },
  );
}

export function presignGet(key: string, opts: { filename?: string; expiresIn?: number } = {}) {
  return getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket,
      Key: key,
      ResponseContentDisposition: opts.filename
        ? `attachment; filename*=UTF-8''${encodeURIComponent(opts.filename)}`
        : undefined,
    }),
    { expiresIn: opts.expiresIn ?? 300 },
  );
}

export async function getObjectStream(key: string) {
  const res = await s3.send(new GetObjectCommand({ Bucket, Key: key }));
  return res.Body!.transformToWebStream();
}

/** Map of key -> size for every object under prefix. */
export async function listObjects(prefix: string) {
  const out = new Map<string, number>();
  let ContinuationToken: string | undefined;
  do {
    const res = await s3.send(new ListObjectsV2Command({ Bucket, Prefix: prefix, ContinuationToken }));
    for (const o of res.Contents ?? []) out.set(o.Key!, o.Size ?? 0);
    ContinuationToken = res.NextContinuationToken;
  } while (ContinuationToken);
  return out;
}

/** Delete everything under prefix. Idempotent: safe to re-run after partial failure. */
export async function deletePrefix(prefix: string) {
  const keys = [...(await listObjects(prefix)).keys()];
  for (let i = 0; i < keys.length; i += 1000) {
    const res = await s3.send(
      new DeleteObjectsCommand({
        Bucket,
        Delete: { Objects: keys.slice(i, i + 1000).map((Key) => ({ Key })), Quiet: true },
      }),
    );
    if (res.Errors?.length) throw new Error(`R2 delete failed for ${res.Errors.length} objects`);
  }
  return keys.length;
}
