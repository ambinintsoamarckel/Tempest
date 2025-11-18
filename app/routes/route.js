const express = require('express');
const utilisateurController = require('../controllers/UtilisateurController');
const messageController = require('../controllers/MessageController');
const groupeController = require('../controllers/GroupeController');
const storyController = require('../controllers/StoryController');
const passport = require('passport');
const multer = require('multer');
const { uploadProfilePhoto, uploadMessageFile, uploadGroupPhoto,uploadStoryFile } = require('../../config/multerConfig');

// Middleware pour les routes protégées
const protectedRoutes = require('./protectedRoutes');
const UtilisateurController = require('../controllers/UtilisateurController');
function debugMiddleware(req, res, next) {
  console.log('\n🔍 === DEBUG MIDDLEWARE ===');
  console.log('📍 Route:', req.method, req.path);
  console.log('📋 Params:', req.params);
  console.log('📦 Body:', req.body);
  console.log('📎 File:', req.file ? 'OUI' : 'NON');
  console.log('🔐 Session:', req.session?.passport?.user?._id || 'PAS DE SESSION');
  console.log('📊 Headers:', {
    'content-type': req.headers['content-type'],
    'content-length': req.headers['content-length']
  });
  console.log('=========================\n');
  next();
}

// ===================================
// 2. MULTER ERROR HANDLER AMÉLIORÉ
// ===================================
function handleMulterErrors(err, req, res, next) {
  console.log('\n⚠️  === MULTER ERROR HANDLER ===');
  console.log('Erreur détectée:', err);

  if (err instanceof multer.MulterError) {
    console.error('❌ Erreur Multer:', err.code, err.message);
    return res.status(400).json({
      message: err.message,
      code: err.code
    });
  } else if (err) {
    console.error('❌ Erreur personnalisée:', err.message);
    console.error('Stack:', err.stack);
    return res.status(err.status || 500).json({
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }

  console.log('✅ Pas d\'erreur, next()');
  next();
}

module.exports = (app) => {
  // Routes pour l'utilisateur
  app.route('/utilisateurs')
    .post(utilisateurController.creerUtilisateur)
    .get(utilisateurController.VoirTousUtilisateur);
  app.route('/users')
    .get(utilisateurController.getUsers);
  app.route('/utilisateurs/recherche/:valeur')
    .get(utilisateurController.recherche);

  app.route('/utilisateurs/:id')
    .get(utilisateurController.recupererUtilisateur)
    .put(protectedRoutes, utilisateurController.modifierUtilisateur)
    .delete(protectedRoutes, utilisateurController.supprimerUtilisateur);
  app.route('/utilisateurs/nonMembres/:groupId')
    .get(utilisateurController.VoirNonMembres);


  // Routes pour le compte de l'utilisateur connecté
  app.route('/me')
    .get(protectedRoutes, utilisateurController.recupererMonCompte)
    .put(protectedRoutes, utilisateurController.modifierMonCompte)
    .delete(protectedRoutes, utilisateurController.supprimerMonCompte);

  app.route('/me/changePassword')
    .put(protectedRoutes, utilisateurController.changePassword);
  app.route('/me/addStory')
    .post(protectedRoutes,uploadStoryFile.single('file'),handleMulterErrors, utilisateurController.ajouterStory);
  app.route('/me/changePhoto')
    .put(protectedRoutes, uploadProfilePhoto.single('photo'), handleMulterErrors, utilisateurController.changePhoto);

  app.route('/me/quitGroup/:groupId')
    .delete(protectedRoutes, utilisateurController.quitGroup);

  app.route('/me/createGroup')
    .post(protectedRoutes, utilisateurController.createGroup);
  app.route('/messages/personne/:contactId')
    .post(
      debugMiddleware,           // ✅ 1. Log tout ce qui arrive
      protectedRoutes,            // ✅ 2. Vérifie l'auth
      (req, res, next) => {       // ✅ 3. Log après auth
        console.log('✅ Auth OK, user:', req.session?.passport?.user?._id);
        next();
      },
      uploadMessageFile.single('file'),  // ✅ 4. Upload le fichier
      (req, res, next) => {       // ✅ 5. Log après upload
        console.log('✅ Upload OK, file:', req.file?.filename || 'PAS DE FICHIER');
        next();
      },
      handleMulterErrors,         // ✅ 6. Gère les erreurs
      utilisateurController.envoyerMessageAPersonne  // ✅ 7. Controller
    )
    .get(protectedRoutes, utilisateurController.recupererDiscussionAvecContact);

  app.route('/messages/groupe/:groupeId')
    .post(protectedRoutes,uploadMessageFile.single('file'), handleMulterErrors, utilisateurController.envoyerMessageAGroupe)
    .get(protectedRoutes, utilisateurController.recupererDiscussionAvecGroupe);
  app.route('/messages/personne/:contactId/:messageId')
    .post(protectedRoutes, utilisateurController.transfererMessageAPersonne)
  app.route('/messages/groupe/:groupeId/:messageId')
    .post(protectedRoutes, utilisateurController.transfererMessageAGroupe)
  // Route pour récupérer la session de l'utilisateur
  app.route('/session')
    .get(protectedRoutes, utilisateurController.recupererSession);
  app.route('/messages/:id')
    .get(protectedRoutes, messageController.recupererMessage)
    .put(protectedRoutes, messageController.modifierMessage)
    .delete(protectedRoutes,UtilisateurController.supprimerMessage);
  // Routes pour les groupes
  app.route('/groupes')
    .post(protectedRoutes, utilisateurController.createGroup)
    .get(protectedRoutes, groupeController.getAllGroupes);

  app.route('/groupes/:id')
    .get(protectedRoutes, groupeController.getGroupe)
    .put(protectedRoutes, utilisateurController.updategroup)
    .delete(protectedRoutes, utilisateurController.removeGroup);

  app.route('/groupes/:id/membres/:utilisateurId')
    .post(protectedRoutes, utilisateurController.addMember)
    .delete(protectedRoutes, utilisateurController.removeMember);

  app.route('/groupes/:id/changePhoto')
    .put(protectedRoutes,uploadGroupPhoto.single('photo'), handleMulterErrors,utilisateurController.changePhotoGroup);

  // Routes pour les stories
  app.route('/stories')
    .get(protectedRoutes, storyController.getAllStory)
    .post(protectedRoutes, storyController.creerStory);

  app.route('/stories/:id')
    .get(protectedRoutes, utilisateurController.voirStory)
    .delete(protectedRoutes, utilisateurController.supprimerStory);
  app.route('/archives/:id')
    .get(protectedRoutes, storyController.getArchivesById)
  app.route('/story/:userid')
    .get(protectedRoutes, storyController.getStoryById);

  // Route pour récupérer les dernières conversations
  app.route('/dernierConversation')
    .get(protectedRoutes, utilisateurController.recupererContactsEtMessages);

  // Middleware de passport
  app.use(passport.initialize());
};
