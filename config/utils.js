const cookie = require('cookie'); // Assurez-vous d'avoir installé ce module
const cookieSignature = require('cookie-signature');
const bucket = require('./firebaseConfig'); // Importation du bucket
const path = require('path'); // Assurez-vous d'avoir installé ce module

const generateSecret = () => {
  return process.env.SESSION_SECRET || 'Mon-secret-qui-tue';
};

const secret = generateSecret();

const generateCookie = (sessionID) => {
  const signedSessionID = 's:' + cookieSignature.sign(sessionID, secret);
  const sessionCookie = cookie.serialize('connect.sid', signedSessionID, {
    httpOnly: true, // Recommandé pour des raisons de sécurité
    maxAge: 1000 * 60 * 60 * 24, // 1 jour
    sameSite: 'None',
    path: '/',
    secure: false // Mettez ceci à `true` si vous utilisez HTTPS
  });
  return sessionCookie;
};

async function prepareMessageData(req) {
  let messageData;

  if (req.file) {
    const fileUrl = await uploadFileToFirebase(req.file, `messages/${req.file.fieldname}-${Date.now()}${path.extname(req.file.originalname)}`);
    let fileType;

    if (req.file.mimetype.startsWith('image/')) {
      fileType = 'image';
    } else if (req.file.mimetype.startsWith('audio/')) {
      fileType = 'audio';
    } else if (req.file.mimetype.startsWith('video/')) {
      fileType = 'video';
    } else {
      fileType = 'fichier';
    }

    messageData = {
      contenu: {
        type: fileType,
        [fileType]: fileUrl
      }
    };

  } else if (req.body.texte) {
    messageData = {
      contenu: {
        type: 'texte',
        texte: req.body.texte
      }
    };
  } else {
    throw new Error('Aucun contenu valide trouvé');
  }

  return messageData;
};

async function prepareStoryData(req) {
  let storyData;

  if (req.file) {
    const fileUrl = await uploadFileToFirebase(req.file, `stories/${req.file.fieldname}-${Date.now()}${path.extname(req.file.originalname)}`);
    let fileType;

    if (req.file.mimetype.startsWith('image/')) {
      fileType = 'image';
    } else if (req.file.mimetype.startsWith('video/')) {
      fileType = 'video';
    }
    storyData = {
      contenu: {
        type: fileType,
        [fileType]: fileUrl
      }
    };
  } else if (req.body.texte) {
    storyData = {
      contenu: {
        type: 'texte',
        texte: req.body.texte
      }
    };
  } else {
    throw new Error('Aucun contenu valide trouvé');
  }

  return storyData;
};

const uploadFileToFirebase = async (file, destination) => {
  return new Promise((resolve, reject) => {
    const blob = bucket.file(destination); // Utilisation du bucket importé
    const blobStream = blob.createWriteStream({
      resumable: false,
      metadata: {
        contentType: file.mimetype,
      },
    });

    blobStream.on('error', (err) => {
      reject(err);
    });

    blobStream.on('finish', () => {
      blob.makePublic().then(() => {
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
        resolve(publicUrl);
      });
    });

    blobStream.end(file.buffer);
  });
};

module.exports = {
  generateCookie,
  prepareMessageData,
  prepareStoryData,
  uploadFileToFirebase
};
