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
