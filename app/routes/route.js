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
function handleMulterErrors(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    // Gérer les erreurs spécifiques à Multer
    return res.status(400).json({ message: err.message });
  } else if (err) {
    // Gérer les erreurs personnalisées du filtre de fichier
    return res.status(err.status || 500).json({ message: err.message });
  }
  next();
}

module.exports = (app) => {
  // Routes pour l'utilisateur
  app.route('/utilisateurs')
    .post(utilisateurController.creerUtilisateur)
    .get(utilisateurController.VoirTousUtilisateur);
  app.route('/utilisateurs/recherche/:valeur')
    .get(utilisateurController.recherche);

  app.route('/utilisateurs/:id')
    .get(utilisateurController.recupererUtilisateur)
    .put(protectedRoutes, utilisateurController.modifierUtilisateur)
    .delete(protectedRoutes, utilisateurController.supprimerUtilisateur);

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
    .post(protectedRoutes, utilisateurController.quitGroup);

  app.route('/me/createGroup')
    .post(protectedRoutes, utilisateurController.createGroup);

  app.route('/messages/personne/:contactId')
    .post(protectedRoutes,uploadMessageFile.single('file'), handleMulterErrors, utilisateurController.envoyerMessageAPersonne)
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
    .post(protectedRoutes, storyController.creerStory);

  app.route('/stories/:id')
    .get(protectedRoutes, utilisateurController.voirStory)
    .delete(protectedRoutes, utilisateurController.supprimerStory);

  // Route pour récupérer les dernières conversations
  app.route('/dernierConversation')
    .get(protectedRoutes, utilisateurController.recupererContactsEtMessages);

  // Middleware de passport
  app.use(passport.initialize());
};
