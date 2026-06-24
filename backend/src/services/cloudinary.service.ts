import cloudinary from '../config/cloudinary';

/**
 * Deletes a single asset from Cloudinary by its public ID.
 * Audio is stored as resource_type 'video'; images as 'image'.
 * Best-effort: failures are swallowed so a failed remote delete never blocks
 * the primary database operation (e.g. deleting a question).
 */
export async function deleteResource(
  publicId: string,
  resourceType: 'image' | 'video'
): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch {
    // Swallow — orphaned assets are preferable to a blocked request.
  }
}
