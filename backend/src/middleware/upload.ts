import path from 'path';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary';

const audioStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'ptepath/listening/audio',
    resource_type: 'video',
    allowed_formats: ['mp3', 'wav', 'm4a', 'webm', 'mp4'],
  } as object,
});

const imageStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'ptepath/speaking/images',
    resource_type: 'image',
    allowed_formats: ['jpg', 'jpeg', 'png'],
  } as object,
});

export const uploadAudio = multer({
  storage: audioStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

export const uploadImage = multer({
  storage: imageStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Disk storage for speaking evaluate routes. The audio file is temporary —
// it is sent to Groq for transcription and then deleted. Never permanently stored.
const tempStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(process.cwd(), 'tmp'));
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}${path.extname(file.originalname)}`);
  },
});

export const uploadAudioTemp = multer({
  storage: tempStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
});
