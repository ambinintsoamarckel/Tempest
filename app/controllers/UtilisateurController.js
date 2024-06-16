const utilisateurService = require('../services/UtilisateurService');
const messageService = require('../services/MessageService');

module.exports = {
  async creerUtilisateur(req, res) {
    try {
      const utilisateur = await utilisateurService.createUtilisateur(req.body);
      res.status(201).json(utilisateur);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  async VoirTousUtilisateur(req, res) {
    try {
      const utilisateurs = await utilisateurService.getAllUtilisateur();
      res.status(200).json(utilisateurs);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  async recupererUtilisateur(req, res) {
    try {
      const utilisateur = await utilisateurService.findUtilisateurById(req.params.id);
      res.status(200).json(utilisateur);
    } catch (error) {
      res.status(404).json({ message: error.message });
    }
  },

  async recupererMonCompte(req, res) {
    try {
      const utilisateur = await utilisateurService.findUtilisateurById(req.session.passport.user.id);
      res.status(200).json(utilisateur);
    } catch (error) {
      res.status(404).json({ message: error.message });
    }
  },

  async recupererSession(req, res) {
    try {
      res.status(200).json(req.session.passport.user);
    } catch (error) {
      res.status(404).json({ message: error.message });
    }
  },

  async modifierUtilisateur(req, res) {
    try {
      const utilisateur = await utilisateurService.updateUtilisateur(req.params.id, req.body);
      res.status(200).json(utilisateur);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  async modifierMonCompte(req, res) {
    try {
      const utilisateur = await utilisateurService.updateUtilisateur(req.session.passport.user.id, req.body);
      res.status(200).json(utilisateur);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  async supprimerUtilisateur(req, res) {
    try {
      await utilisateurService.deleteUtilisateur(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  async supprimerMonCompte(req, res) {
    try {
      await utilisateurService.deleteUtilisateur(req.session.passport.user.id);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  async recupererContactsEtMessages(req, res) {
    try {
      const data = await utilisateurService.findContactsAndLastMessages(req.session.passport.user.id);
      res.status(200).json(data);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  async recupererDiscussionAvecContact(req, res) {
    try {
      const data = await utilisateurService.findDiscussionWith(req.session.passport.user.id, req.params.contactId);
      res.status(200).json(data);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  async recupererDiscussionAvecGroupe(req, res) {
    try {
      const data = await utilisateurService.findDiscussionWithGroup(req.session.passport.user.id, req.params.groupeId);
      res.status(200).json(data);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  async envoyerMessageAPersonne(req, res) {
    try {
      const message = await utilisateurService.sendMessageToPerson(req.session.passport.user.id, req.params.contactId, req.body);
      res.status(201).json(message);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  async envoyerMessageAGroupe(req, res) {
    try {
      const message = await utilisateurService.sendMessageToGroup(req.session.passport.user.id, req.params.groupeId, req.body);
      res.status(201).json(message);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  async ajouterStory(req, res) {
    try {
      const story = await utilisateurService.addStory(req.session.passport.user.id, req.body);
      res.status(201).json(story);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  async supprimerStory(req, res) {
    try {
      await utilisateurService.deleteStory(req.session.passport.user.id, req.params.storyId);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
};
