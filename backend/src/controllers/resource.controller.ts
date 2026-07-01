import { Response } from 'express';
import path from 'path';
import { AuthRequest } from '../types';
import { Resource, IResource, ResourceFileType } from '../models/resource.model';
import { uploadBuffer, deleteResource as deleteFromCloudinary } from '../services/cloudinary.service';

/**
 * Resources module.
 *
 * Admin uploads PDF / DOCX / image files to Cloudinary; students browse and
 * download active resources. No per-download tracking. Correct answers and
 * student data are never involved here — this is a pure file-management module.
 *
 * Cloudinary resource_type mapping:
 *   pdf  → 'raw'   (folder: ptepath/resources/pdfs)
 *   docx → 'raw'   (folder: ptepath/resources/docs)
 *   image→ 'image' (folder: ptepath/resources/images)
 */

// ─── MIME → fileType mapping ──────────────────────────────────────────────────

interface FileConfig {
  fileType: ResourceFileType;
  cloudinaryType: 'raw' | 'image';
  folder: string;
  /** Max allowed size in bytes for this file type. */
  maxBytes: number;
}

const MIME_CONFIG: Record<string, FileConfig> = {
  'application/pdf': {
    fileType: 'pdf',
    cloudinaryType: 'raw',
    folder: 'ptepath/resources/pdfs',
    maxBytes: 15 * 1024 * 1024,
  },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
    fileType: 'docx',
    cloudinaryType: 'raw',
    folder: 'ptepath/resources/docs',
    maxBytes: 10 * 1024 * 1024,
  },
  'image/jpeg': {
    fileType: 'image',
    cloudinaryType: 'image',
    folder: 'ptepath/resources/images',
    maxBytes: 5 * 1024 * 1024,
  },
  'image/jpg': {
    fileType: 'image',
    cloudinaryType: 'image',
    folder: 'ptepath/resources/images',
    maxBytes: 5 * 1024 * 1024,
  },
  'image/png': {
    fileType: 'image',
    cloudinaryType: 'image',
    folder: 'ptepath/resources/images',
    maxBytes: 5 * 1024 * 1024,
  },
  'image/webp': {
    fileType: 'image',
    cloudinaryType: 'image',
    folder: 'ptepath/resources/images',
    maxBytes: 5 * 1024 * 1024,
  },
};

const SIZE_LABELS: Record<ResourceFileType, string> = {
  pdf: '15 MB',
  docx: '10 MB',
  image: '5 MB',
};

// ─── Views ────────────────────────────────────────────────────────────────────

function adminView(r: IResource) {
  return {
    id: r._id,
    title: r.title,
    description: r.description,
    fileUrl: r.fileUrl,
    fileType: r.fileType,
    fileName: r.fileName,
    fileSize: r.fileSize,
    isActive: r.isActive,
    createdAt: r.createdAt,
  };
}

function studentView(r: IResource) {
  return {
    id: r._id,
    title: r.title,
    description: r.description,
    fileUrl: r.fileUrl,
    fileType: r.fileType,
    fileName: r.fileName,
    fileSize: r.fileSize,
    createdAt: r.createdAt,
  };
}

// ─── Admin Controllers ────────────────────────────────────────────────────────

export async function addResource(req: AuthRequest, res: Response): Promise<void> {
  if (!req.file) {
    res.status(400).json({ success: false, message: 'A file is required.' });
    return;
  }

  const config = MIME_CONFIG[req.file.mimetype];
  if (!config) {
    res.status(400).json({ success: false, message: 'Unsupported file type.' });
    return;
  }

  // Per-type size enforcement (multer caps at 15 MB globally; this narrows it per type).
  if (req.file.size > config.maxBytes) {
    res.status(400).json({
      success: false,
      message: `File too large. Maximum size for ${config.fileType.toUpperCase()} files is ${SIZE_LABELS[config.fileType]}.`,
    });
    return;
  }

  const originalName = req.file.originalname || `file.${config.fileType}`;
  const baseName = path.parse(originalName).name;

  const { url, publicId } = await uploadBuffer(
    req.file.buffer,
    config.folder,
    config.cloudinaryType,
    baseName
  );

  // title and description already validated + trimmed by createResourceSchema.
  const { title, description } = req.body as { title: string; description: string };

  const created = await Resource.create({
    title,
    description,
    fileUrl: url,
    filePublicId: publicId,
    fileType: config.fileType,
    fileName: originalName,
    fileSize: req.file.size,
  });

  res.status(201).json({
    success: true,
    message: 'Resource uploaded successfully.',
    data: { resource: adminView(created) },
  });
}

export async function getAllResources(req: AuthRequest, res: Response): Promise<void> {
  const resources = await Resource.find().sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    message: 'Resources retrieved successfully.',
    data: { resources: resources.map(adminView), total: resources.length },
  });
}

export async function getOneResource(req: AuthRequest, res: Response): Promise<void> {
  const resource = await Resource.findById(req.params.id);
  if (!resource) {
    res.status(404).json({ success: false, message: 'Resource not found.' });
    return;
  }

  res.status(200).json({
    success: true,
    message: 'Resource retrieved successfully.',
    data: { resource: adminView(resource) },
  });
}

export async function updateResource(req: AuthRequest, res: Response): Promise<void> {
  const resource = await Resource.findById(req.params.id);
  if (!resource) {
    res.status(404).json({ success: false, message: 'Resource not found.' });
    return;
  }

  const { title, description } = req.body as { title?: string; description?: string };

  if (title !== undefined) resource.title = title;
  if (description !== undefined) resource.description = description;

  await resource.save();

  res.status(200).json({
    success: true,
    message: 'Resource updated successfully.',
    data: { resource: adminView(resource) },
  });
}

export async function deleteResource(req: AuthRequest, res: Response): Promise<void> {
  const resource = await Resource.findById(req.params.id);
  if (!resource) {
    res.status(404).json({ success: false, message: 'Resource not found.' });
    return;
  }

  // Determine Cloudinary resource_type from stored fileType.
  const cloudinaryType = resource.fileType === 'image' ? 'image' : 'raw';
  await deleteFromCloudinary(resource.filePublicId, cloudinaryType);

  await resource.deleteOne();

  res.status(200).json({ success: true, message: 'Resource deleted.' });
}

export async function toggleStatus(req: AuthRequest, res: Response): Promise<void> {
  const resource = await Resource.findById(req.params.id);
  if (!resource) {
    res.status(404).json({ success: false, message: 'Resource not found.' });
    return;
  }

  // isActive guaranteed boolean by toggleResourceStatusSchema.
  resource.isActive = req.body.isActive;
  await resource.save();

  res.status(200).json({
    success: true,
    message: resource.isActive ? 'Resource activated.' : 'Resource deactivated.',
    data: { resource: adminView(resource) },
  });
}

// ─── Student Controllers ──────────────────────────────────────────────────────

export async function listResources(req: AuthRequest, res: Response): Promise<void> {
  const resources = await Resource.find({ isActive: true }).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    message: 'Resources retrieved successfully.',
    data: { resources: resources.map(studentView), total: resources.length },
  });
}

export async function getResource(req: AuthRequest, res: Response): Promise<void> {
  const resource = await Resource.findOne({ _id: req.params.id, isActive: true });
  if (!resource) {
    res.status(404).json({ success: false, message: 'Resource not found.' });
    return;
  }

  res.status(200).json({
    success: true,
    message: 'Resource retrieved successfully.',
    data: { resource: studentView(resource) },
  });
}
