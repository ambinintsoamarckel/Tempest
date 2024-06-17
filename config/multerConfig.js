const multer = require('multer');
const path = require('path');

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
    } else {
      cb(null, 'uploads/messageFiles');
    }
  },
  filename: (req, file, cb) => {
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

// Configurer Multer pour les photos de profil
const uploadProfilePhoto = multer({ storage: profilePhotoStorage });

// Configurer Multer pour les photos de groupe
const uploadGroupPhoto = multer({ storage: groupPhotoStorage });

// Configurer Multer pour les fichiers de message
const uploadMessageFile = multer({ storage: messageFileStorage });

module.exports = {
  uploadProfilePhoto,
  uploadGroupPhoto,
  uploadMessageFile
};
