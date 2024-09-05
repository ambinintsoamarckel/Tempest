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
const filterStoryFile = (req, file, cb) => {
  if (file.mimetype.startsWith('video/')) {
    cb(null, true);
  }
  else if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    const error = new Error('Seuls les fichiers vidéo ou images sont autorisés');
    error.status = 403;
    cb(error, false);
  }
};
const storage = multer.memoryStorage();
// Définir le stockage pour les photos de profil
// Configurer Multer pour utiliser MemoryStorage
const uploadProfilePhoto = multer({
  storage: storage,
  fileFilter: filterImageFile,
  limits: {
    fileSize: MAX_FILE_SIZE
  }
});

const uploadGroupPhoto = multer({
  storage: storage,
  fileFilter: filterImageFile,
  limits: {
    fileSize: MAX_FILE_SIZE
  }
});

const uploadMessageFile = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      filterImageFile(req, file, cb);
    } else if (file.mimetype.startsWith('audio/')) {
      filterAudioFile(req, file, cb);
    } else if (file.mimetype.startsWith('video/')) {
      filterVideoFile(req, file, cb);
    } else {
      cb(new Error('Type de fichier non autorisé'), false);
    }
  },
  limits: {
    fileSize: MAX_FILE_SIZE
  }
});

const uploadStoryFile = multer({
  storage: storage,
  fileFilter: filterStoryFile,
  limits: {
    fileSize: MAX_FILE_SIZE
  }
});


module.exports = {
  uploadProfilePhoto,
  uploadGroupPhoto,
  uploadMessageFile,
  uploadStoryFile
};
