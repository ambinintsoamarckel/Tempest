const multer = require('multer');
const path = require('path');

// Définir les constantes pour les limites et les types de fichiers autorisés
const MAX_FILE_SIZE = 40 * 1024 * 1024; // 20 Mo pour les fichiers audio et vidéo

// Fonction de filtrage pour les photos de profil et de groupe
const filterImageFile = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    const error = new Error('Seules les images sont autorisées');
    error.status = 403;
    cb(error, false);
  }
};

// Fonction de filtrage pour les fichiers audio
const filterAudioFile = (req, file, cb) => {
  if (file.mimetype.startsWith('audio/')) {
    cb(null, true);
  } else {
    const error = new Error('Seuls les fichiers audio sont autorisés');
    error.status = 403;
    cb(error, false);
  }
};

// Fonction de filtrage pour les fichiers vidéo
const filterVideoFile = (req, file, cb) => {
  if (file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    const error = new Error('Seuls les fichiers vidéo sont autorisés');
    error.status = 403;
    cb(error, false);
  }
};

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
  fileFilter: filterImageFile,
  limits: {
    fileSize: MAX_FILE_SIZE
  }
});

// Configurer Multer pour les photos de groupe avec filtre
const uploadGroupPhoto = multer({
  storage: groupPhotoStorage,
  fileFilter: filterImageFile,
  limits: {
    fileSize: MAX_FILE_SIZE
  }
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
  },
  limits: {
    fileSize: MAX_FILE_SIZE
  }
});

module.exports = {
  uploadProfilePhoto,
  uploadGroupPhoto,
  uploadMessageFile
};
