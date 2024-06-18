const express = require('express');
const utilisateurController = require('../controllers/UtilisateurController');
const messageController = require('../controllers/MessageController');
const groupeController = require('../controllers/GroupeController');
const storyController = require('../controllers/StoryController');
const passport = require('passport');
const multer = require('multer');
const { uploadProfilePhoto,uploadMessageFile,uploadGroupPhoto} = require('../../config/multerConfig');

// Middleware pour les routes protégées
const protectedRoutes = require('./protectedRoutes');

module.exports = (app) => {
  // Routes pour l'utilisateur
  app.route('/utilisateurs')
    .post(utilisateurController.creerUtilisateur)
    .get(utilisateurController.VoirTousUtilisateur);

  app.route('/utilisateurs/:id')
    .get( utilisateurController.recupererUtilisateur)
    .put(protectedRoutes, utilisateurController.modifierUtilisateur)
    .delete(protectedRoutes, utilisateurController.supprimerUtilisateur);

  // Routes pour le compte de l'utilisateur connecté
  app.route('/me')
    .get(protectedRoutes, utilisateurController.recupererMonCompte)
    .put(protectedRoutes, utilisateurController.modifierMonCompte)
    .delete(protectedRoutes, utilisateurController.supprimerMonCompte);

  app.route('/me/changePassword')
    .put(protectedRoutes, utilisateurController.changePassword);

  app.route('/me/changePhoto')
    .put(protectedRoutes, uploadProfilePhoto.single('photo'),utilisateurController.changePhoto);

  app.route('/me/quitGroup/:groupId')
    .post(protectedRoutes, utilisateurController.quitGroup);
  app.route('/me/createGroup')
    .post(protectedRoutes, utilisateurController.createGroup);

  app.route('/messages/personne/:contactId')
    .post(protectedRoutes, (req, res, next) => {
      uploadMessageFile.single('file')(req, res, function (err) {
        if (err instanceof multer.MulterError || err) {
          return res.status(400).json({ message: err.message });
        }
        next();
      });
    }, utilisateurController.envoyerMessageAPersonne)
    .get(protectedRoutes, utilisateurController.recupererDiscussionAvecContact);

  app.route('/messages/groupe/:groupeId')
    .post(protectedRoutes, (req, res, next) => {
      uploadMessageFile.single('file')(req, res, function (err) {
        if (err instanceof multer.MulterError || err) {
          return res.status(400).json({ message: err.message });
        }
        next();
      });
    }, utilisateurController.envoyerMessageAGroupe)
    .get(protectedRoutes, utilisateurController.recupererDiscussionAvecGroupe);
  // Route pour récupérer la session de l'utilisateur
  app.route('/session')
    .get(protectedRoutes, utilisateurController.recupererSession);

  // Routes pour les messages
  app.route('/messages')
    .post(protectedRoutes, messageController.creerMessage);

  app.route('/messages/:id')
    .get(protectedRoutes, messageController.recupererMessage)
    .put(protectedRoutes, messageController.modifierMessage)
    .delete(protectedRoutes, messageController.supprimerMessage);

  // Routes pour les groupes
  app.route('/groupes')
    .post(protectedRoutes,utilisateurController.createGroup)
    .get(protectedRoutes, groupeController.getAllGroupes);

  app.route('/groupes/:id')
    .get(protectedRoutes, groupeController.getGroupe)
    .put(protectedRoutes, groupeController.updateGroupe)
    .delete(protectedRoutes, groupeController.deleteGroupe);

  app.route('/groupes/:id/membres/:utilisateurId')
    .post(protectedRoutes, groupeController.addMember)
    .delete(protectedRoutes, groupeController.removeMember);

  app.route('/groupes/:id/changePhoto')
    .put(protectedRoutes, groupeController.changeGroupPhoto);

  // Routes pour les stories
  app.route('/stories')
    .post(protectedRoutes, storyController.creerStory);

  app.route('/stories/:id')
    .get(protectedRoutes, storyController.recupererStory)
    .delete(protectedRoutes, storyController.supprimerStory);

  // Route pour récupérer les dernières conversations
  app.route('/dernierConversation')
    .get(protectedRoutes, utilisateurController.recupererContactsEtMessages);
  
  // Middleware de passport
  app.use(passport.initialize());
};
