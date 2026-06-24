import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary';

/** Build a 400 error multer's fileFilter can pass to the error handler. */
function rejectFile(message: string): Error {
  return Object.assign(new Error(message), { statusCode: 400 });
}

const imageFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  if (/^image\/(jpe?g|png)$/.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(rejectFile('Only JPG and PNG images are allowed.'));
  }
};

// Browser MediaRecorder produces audio/webm, video/webm, or audio/mp4 — accept
// any audio/* plus the webm/mp4 containers Whisper supports.
const audioFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  if (file.mimetype.startsWith('audio/') || /^video\/(webm|mp4)$/.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(rejectFile('Only audio files are allowed.'));
  }
};

// Listening module: audio stored permanently on Cloudinary (resource_type 'video').
const audioStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'ptepath/listening/audio',
    resource_type: 'video',
    allowed_formats: ['mp3', 'wav', 'm4a', 'webm', 'mp4'],
  } as object,
});

// Speaking module: question images stored on Cloudinary.
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
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: audioFilter,
});

export const uploadImage = multer({
  storage: imageStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFilter,
});

/**
 * In-memory storage for speaking evaluate routes. The audio never touches
 * disk — the buffer is streamed straight to the STT adapter and discarded
 * when the request ends. Student audio is never stored anywhere.
 */
export const uploadAudioMemory = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: audioFilter,
});
