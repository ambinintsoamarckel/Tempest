const passport = require('passport');

module.exports = function(req, res, next) {
  // Vérifier si l'utilisateur est connecté
  req.session.reload(function(err) {
    // session updated
    console.log(req.session,'essai middleware');
  console.log(res.session,'essai middleware 235');
  if (req.session.passport && req.session.passport.user) {
    // Utilisateur connecté, passer au middleware suivant
    next();
  } else {
    // Utilisateur non connecté, renvoyer une erreur 401
    return res.status(401).json({ message: 'Non autorisé' });
  }
  })
  
};
