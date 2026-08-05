import fs from "fs";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

const spaces_client = new S3Client({
  region:   process.env.DO_SPACES_REGION,
  endpoint: process.env.DO_SPACES_ENDPOINT,
  credentials: {
    accessKeyId:     process.env.DO_SPACES_ACCESS_KEY,
    secretAccessKey: process.env.DO_SPACES_SECRET_KEY,
  },
});

/*
 * Upload a multer temp file to DO Spaces.
 * Returns { key, url }
 */
export const upload_file_to_s3 = async (file, key) => {
  const file_stream = fs.createReadStream(file.path);

  await spaces_client.send(
    new PutObjectCommand({
      Bucket:      process.env.DO_SPACES_BUCKET,
      Key:         key,
      Body:        file_stream,
      ContentType: file.mimetype,
      ACL:         "public-read", // makes the file publicly accessible
    }),
  );

  safe_unlink(file.path);

  return {
    key,
    url: `https://${process.env.DO_SPACES_BUCKET}.${process.env.DO_SPACES_REGION}.digitaloceanspaces.com/${key}`,
  };
};

/*
 * Delete an object from DO Spaces by its key.
 * Silently ignores null / undefined keys.
 */
export const delete_file_from_s3 = async (key) => {
  if (!key) return;

  await spaces_client.send(
    new DeleteObjectCommand({
      Bucket: process.env.DO_SPACES_BUCKET,
      Key:    key,
    }),
  );
};

/*
 * Build a structured Spaces object key.
 *
 * Examples:
 *   build_s3_key("workspace", "abc123", "", "image.png")
 *   → workspace/abc123/image.png
 *
 *   build_s3_key("workspace", "abc123", "vendor/xyz456", "logo.png")
 *   → workspace/abc123/vendor/xyz456/logo.png
 */
export const build_s3_key = (root, workspace_id, sub_folder, filename) => {
  const parts = [root, workspace_id, sub_folder, filename].filter(Boolean);
  return parts.join("/");
};

/*
 * Safely delete a local temp file — never throws.
 */
export const safe_unlink = (file_path) => {
  try {
    if (file_path && fs.existsSync(file_path)) fs.unlinkSync(file_path);
  } catch {}
};

/*
 * Clean up all multer temp files from req.files on early exits / errors.
 */
export const clear_temp_files = (files) => {
  Object.values(files || {})
    .flat()
    .forEach((file) => safe_unlink(file.path));
};