const multer = require('multer');
const path = require('path');

// Définir les constantes pour les limites et les types de fichiers autorisés
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 Mo pour les fichiers audio et vidéo
const ALLOWED_IMAGE_MIMETYPES = ['image/jpeg', 'image/png', 'image/gif'];
const ALLOWED_AUDIO_MIMETYPES = ['audio/mpeg', 'audio/wav'];
const ALLOWED_VIDEO_MIMETYPES = ['video/mp4', 'video/mpeg'];

// Fonction de filtrage pour les photos de profil et de groupe
function filterImageFile(req, file, cb) {
  if (file.size > MAX_FILE_SIZE) {
    return cb(null, false, new Error('Fichier trop volumineux (maximum 20 Mo)'));
  }

  if (!ALLOWED_IMAGE_MIMETYPES.includes(file.mimetype)) {
    return cb(null, false, new Error('Format de fichier non autorisé (JPEG, PNG, GIF uniquement)'));
  }
  return cb(null, true);
}

// Fonction de filtrage pour les fichiers audio
function filterAudioFile(req, file, cb) {
  if (file.size > MAX_FILE_SIZE) {
    return cb(null, false, new Error('Fichier trop volumineux (maximum 20 Mo)'));
  }

  if (!ALLOWED_AUDIO_MIMETYPES.includes(file.mimetype)) {
    return cb(null, false, new Error('Format de fichier non autorisé (MP3, WAV uniquement)'));
  }
  return cb(null, true);
}

// Fonction de filtrage pour les fichiers vidéo
function filterVideoFile(req, file, cb) {
  if (file.size > MAX_FILE_SIZE) {
    return cb(null, false, new Error('Fichier trop volumineux (maximum 20 Mo)'));
  }

  if (!ALLOWED_VIDEO_MIMETYPES.includes(file.mimetype)) {
    return cb(null, false, new Error('Format de fichier non autorisé (MP4, MPEG uniquement)'));
  }
  return cb(null, true);
}

// Définir le stockage pour les photos de profil
const profilePhotoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/profilePhotos');
  },
  filename: (req, file, cb) => {
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

// Définir le stockage pour les photos de groupe
const groupPhotoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/groupPhotos');
  },
  filename: (req, file, cb) => {
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

// Définir le stockage pour les fichiers de message
const messageFileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, 'uploads/messageImages');
    } else if (file.mimetype.startsWith('audio/')) {
      cb(null, 'uploads/messageAudios');
    } else if (file.mimetype.startsWith('video/')) {
      cb(null, 'uploads/messageVideos');
    } else {
      cb(null, 'uploads/messageFiles');
    }
  },
  filename: (req, file, cb) => {
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

// Configurer Multer pour les photos de profil avec filtre
const uploadProfilePhoto = multer({
  storage: profilePhotoStorage,
  fileFilter: filterImageFile
});

// Configurer Multer pour les photos de groupe avec filtre
const uploadGroupPhoto = multer({
  storage: groupPhotoStorage,
  fileFilter: filterImageFile
});

// Configurer Multer pour les fichiers de message avec filtres spécifiques
const uploadMessageFile = multer({
  storage: messageFileStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      filterImageFile(req, file, cb);
    } else if (file.mimetype.startsWith('audio/')) {
      filterAudioFile(req, file, cb);
    } else if (file.mimetype.startsWith('video/')) {
      filterVideoFile(req, file, cb);
    } else {
      cb(null, true);
    }
  }
});

module.exports = {
  uploadProfilePhoto,
  uploadGroupPhoto,
  uploadMessageFile
};
