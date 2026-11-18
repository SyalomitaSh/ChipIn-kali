
import multer from 'multer';
import { AppError } from '../utils/AppError.js';

const allowedMimeTypes = [
  'image/jpeg',
  'image/png',
  'image/webp',
];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // Maksimal 5 MB
    files: 1,
  },
  fileFilter: (_req, file, callback) => {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return callback(
        new AppError(
          400,
          'INVALID_FILE_TYPE',
          'Format foto harus JPG, PNG, atau WebP'
        )
      );
    }

    callback(null, true);
  },
});

export const uploadAvatar = (req, res, next) => {
  upload.single('avatar')(req, res, (error) => {
    if (!error) return next();

    if (error instanceof AppError) {
      return next(error);
    }

    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return next(
          new AppError(
            400,
            'FILE_TOO_LARGE',
            'Ukuran foto maksimal 5 MB'
          )
        );
      }

      return next(
        new AppError(
          400,
          'INVALID_UPLOAD',
          'Upload foto tidak valid'
        )
      );
    }

    next(error);
  });
};