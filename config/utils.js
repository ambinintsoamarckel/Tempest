
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
module.exports = {
  generateCookie

};
