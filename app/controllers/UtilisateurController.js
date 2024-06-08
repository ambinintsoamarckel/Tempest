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

  async seConnecter(req, res) {
    try {
      const { email, motDePasse } = req.body;
      const utilisateur = await utilisateurService.login(email, motDePasse);
      res.status(200).json(utilisateur);
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

  async modifierUtilisateur(req, res) {
    try {
      const utilisateur = await utilisateurService.updateUtilisateur(req.params.id, req.body);
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

  async recupererContactsEtMessages(req, res) {
    try {
      const data = await utilisateurService.findContactsAndLastMessages(req.params.id);
      res.status(200).json(data);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  async recupererDiscussionAvecContact(req, res) {
    try {
      const data = await utilisateurService.findDiscussionWith(req.params.id, req.params.contactId);
      res.status(200).json(data);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  async ajouterAmi(req, res) {
    try {
      const utilisateur = await utilisateurService.addFriend(req.params.id, req.params.amiId);
      res.status(200).json(utilisateur);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  async envoyerMessage(req, res) {
    try {
      const message = await messageService.createMessage(req.body);
      res.status(201).json(message);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
};
