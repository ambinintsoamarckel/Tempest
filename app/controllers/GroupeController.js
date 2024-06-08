const groupeService = require('../services/GroupeService');

module.exports = {
  async creerGroupe(req, res) {
    try {
      const groupe = await groupeService.createGroupe(req.body);
      res.status(201).json(groupe);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  async recupererGroupe(req, res) {
    try {
      const groupe = await groupeService.findGroupeById(req.params.id);
      res.status(200).json(groupe);
    } catch (error) {
      res.status(404).json({ message: error.message });
    }
  },

  async modifierGroupe(req, res) {
    try {
      const groupe = await groupeService.updateGroupe(req.params.id, req.body);
      res.status(200).json(groupe);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  async supprimerGroupe(req, res) {
    try {
      await groupeService.deleteGroupe(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  async ajouterMembre(req, res) {
    try {
      const groupe = await groupeService.addMember(req.params.id, req.params.utilisateurId);
      res.status(200).json(groupe);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  async retirerMembre(req, res) {
    try {
      await groupeService.removeMember(req.params.id, req.params.utilisateurId);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  async envoyerMessageGroupe(req, res) {
    try {
      const message = await groupeService.sendMessageGroupe(req.params.id, req.body);
      res.status(201).json(message);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  async changerCreateur(req, res) {
    try {
      const groupe = await groupeService.changeCreator(req.params.id, req.body.nouveauCreateurId);
      res.status(200).json(groupe);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  async recupererMessagesGroupe(req, res) {
    try {
      const messages = await groupeService.getMessagesGroupe(req.params.id);
      res.status(200).json(messages);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
};
