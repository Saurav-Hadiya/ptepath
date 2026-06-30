import cloudinary from '../config/cloudinary';

/**
 * Deletes a single asset from Cloudinary by its public ID.
 * Audio is stored as resource_type 'video'; images as 'image'; PDFs/docs as 'raw'.
 * Best-effort: failures are swallowed so a failed remote delete never blocks
 * the primary database operation (e.g. deleting a question).
 */
export async function deleteResource(
  publicId: string,
  resourceType: 'image' | 'video' | 'raw'
): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch {
    // Swallow — orphaned assets are preferable to a blocked request.
  }
}

/**
 * Uploads a file buffer to Cloudinary.
 * Use resource_type 'raw' for PDFs and DOCX; 'image' for images.
 */
export async function uploadBuffer(
  buffer: Buffer,
  folder: string,
  resourceType: 'image' | 'raw',
  originalName: string
): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        use_filename: true,
        unique_filename: true,
        // Strip extension from public_id for raw uploads so Cloudinary doesn't
        // double-append it when generating the download URL.
        filename_override: originalName,
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error('Cloudinary upload failed.'));
        } else {
          resolve({ url: result.secure_url, publicId: result.public_id });
        }
      }
    );
    stream.end(buffer);
  });
}
