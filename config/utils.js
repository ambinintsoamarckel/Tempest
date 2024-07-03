
const cookie = require('cookie'); // Assurez-vous d'avoir installé ce module
const cookieSignature = require('cookie-signature');


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
function prepareMessageData(req) {
  let messageData;

  if (req.file) {
    const newFileUrl = req.file.path;
    const fileUrl = `${req.protocol}://mahm.tempest.dov:3000/${newFileUrl}`;
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
    console.log('filetype dadanlah ',req.file.mimetype);
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
function prepareStoryData(req) {
  let messageData;

  if (req.file) {
    const newFileUrl = req.file.path;
    const fileUrl = `${req.protocol}://mahm.tempest.dov:3000/${newFileUrl}`;
    let fileType;

    if (req.file.mimetype.startsWith('image/')) {
      fileType = 'image';
    } else if (req.file.mimetype.startsWith('video/')) {
      fileType = 'video';
    } 
    storyData= {
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

module.exports = {
  generateCookie,
  prepareMessageData,
  prepareStoryData

};
