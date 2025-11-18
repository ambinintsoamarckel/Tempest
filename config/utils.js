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
  console.log('--- prepareMessageData START ---');
  let messageData;

  if (req.file) {
    console.log('Fichier détecté:');
    console.log('  - Nom original:', req.file.originalname);
    console.log('  - MIME type:', req.file.mimetype);
    console.log('  - Taille:', req.file.size, 'bytes');
    console.log('  - Field name:', req.file.fieldname);

    try {
      const destination = `messages/${req.file.fieldname}-${Date.now()}${path.extname(req.file.originalname)}`;
      console.log('  - Destination Firebase:', destination);

      const fileUrl = await uploadFileToFirebase(req.file, destination);
      console.log('  - URL Firebase:', fileUrl);

      let fileType;
      if (req.file.mimetype.startsWith('image/')) {
        fileType = 'image';
      } else if (req.file.mimetype.startsWith('audio/')) {
        fileType = 'audio';
      } else if (req.file.mimetype.startsWith('video/')) {
        fileType = 'video';
      } else {
        fileType = 'fichier';
        console.log('  ⚠️  Type de fichier générique détecté:', req.file.mimetype);
      }

      console.log('  - Type déterminé:', fileType);

      messageData = {
        contenu: {
          type: fileType,
          [fileType]: fileUrl
        }
      };

      console.log('Message data (fichier):', JSON.stringify(messageData, null, 2));
    } catch (uploadError) {
      console.error('❌ Erreur lors de l\'upload Firebase:');
      console.error('  - Message:', uploadError.message);
      console.error('  - Stack:', uploadError.stack);
      throw uploadError;
    }

  } else if (req.body.texte) {
    console.log('Message texte détecté:', req.body.texte.substring(0, 50) + '...');
    messageData = {
      contenu: {
        type: 'texte',
        texte: req.body.texte
      }
    };
    console.log('Message data (texte):', JSON.stringify(messageData, null, 2));

  } else {
    console.error('❌ Aucun contenu valide trouvé');
    console.error('  - req.file:', req.file);
    console.error('  - req.body:', req.body);
    throw new Error('Aucun contenu valide trouvé');
  }

  console.log('--- prepareMessageData END ---');
  return messageData;
}

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
  console.log('  >> Upload Firebase START');
  console.log('     Destination:', destination);

  return new Promise((resolve, reject) => {
    const blob = bucket.file(destination);
    const blobStream = blob.createWriteStream({
      resumable: false,
      metadata: {
        contentType: file.mimetype,
      },
    });

    blobStream.on('error', (err) => {
      console.error('  ❌ Erreur blobStream:', err.message);
      reject(err);
    });

    blobStream.on('finish', () => {
      console.log('  ✓ Upload terminé, création de l\'URL publique...');
      blob.makePublic()
        .then(() => {
          const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
          console.log('  ✓ URL publique créée:', publicUrl);
          console.log('  >> Upload Firebase END (SUCCESS)');
          resolve(publicUrl);
        })
        .catch((err) => {
          console.error('  ❌ Erreur makePublic:', err.message);
          reject(err);
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
