const multer = require('multer');
const path = require('path');

// Constantes
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 Mo

// Storage en mémoire
const storage = multer.memoryStorage();

// Fonctions de filtrage (conservées pour les autres uploads)
const filterImageFile = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    const error = new Error('Seules les images sont autorisées');
    error.status = 403;
    cb(error, false);
  }
};

const filterAudioFile = (req, file, cb) => {
  if (file.mimetype.startsWith('audio/')) {
    cb(null, true);
  } else {
    const error = new Error('Seuls les fichiers audio sont autorisés');
    error.status = 403;
    cb(error, false);
  }
};

const filterVideoFile = (req, file, cb) => {
  if (file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    const error = new Error('Seuls les fichiers vidéo sont autorisés');
    error.status = 403;
    cb(error, false);
  }
};

const filterStoryFile = (req, file, cb) => {
  if (file.mimetype.startsWith('video/') || file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    const error = new Error('Seuls les fichiers vidéo ou images sont autorisés');
    error.status = 403;
    cb(error, false);
  }
};

// Uploads spécifiques
const uploadProfilePhoto = multer({
  storage: storage,
  fileFilter: filterImageFile,
  limits: { fileSize: MAX_FILE_SIZE }
});

const uploadGroupPhoto = multer({
  storage: storage,
  fileFilter: filterImageFile,
  limits: { fileSize: MAX_FILE_SIZE }
});

// ✅ UPLOAD MESSAGES - ACCEPTE TOUS LES TYPES
const uploadMessageFile = multer({
  storage: storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    console.log('📎 Upload message file:', {
      name: file.originalname,
      type: file.mimetype,
      size: file.size
    });

    // ✅ Accepte TOUS les types de fichiers
    // (images, audio, vidéo, PDF, DOCX, ZIP, etc.)
    cb(null, true);
  }
});

const uploadStoryFile = multer({
  storage: storage,
  fileFilter: filterStoryFile,
  limits: { fileSize: MAX_FILE_SIZE }
});

module.exports = {
  uploadProfilePhoto,
  uploadGroupPhoto,
  uploadMessageFile,
  uploadStoryFile
};
