import mongoose, { Schema, Document } from 'mongoose';

export type ResourceFileType = 'pdf' | 'docx' | 'image';

export interface IResource extends Document {
  title: string;
  description: string;
  fileUrl: string;
  filePublicId: string;
  fileType: ResourceFileType;
  /** Original filename shown to students on download (e.g. "PTE-Guide.pdf"). */
  fileName: string;
  /** File size in bytes — stored for display and audit. */
  fileSize: number;
  isActive: boolean;
  createdAt: Date;
}

const resourceSchema = new Schema<IResource>({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  fileUrl: { type: String, required: true },
  filePublicId: { type: String, required: true },
  fileType: { type: String, required: true, enum: ['pdf', 'docx', 'image'] },
  fileName: { type: String, required: true },
  fileSize: { type: Number, required: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

export const Resource = mongoose.model<IResource>('Resource', resourceSchema);
