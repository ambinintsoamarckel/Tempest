const GroupeService = require('../services/GroupeService');
const UtilisateurService = require('../services/UtilisateurService');

const GroupeController = {
  async createGroupe(req, res) {
    try {
      const groupe = await GroupeService.createGroupe(req.body);
      res.status(201).json(groupe);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  async getAllGroupes(req, res) {
    try {
      const groupes = await GroupeService.getAllGroupes();
      res.status(200).json(groupes);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  async updateGroupe(req, res) {
    const { id } = req.params;
    const updateData = req.body;

    try {
      const groupe = await GroupeService.updateGroupe(id, updateData);
      res.status(200).json(groupe);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  async getGroupe(req, res) {
    const { id } = req.params;

    try {
      const groupe = await GroupeService.getGroupe(id);
      res.status(200).json(groupe);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  async deleteGroupe(req, res) {
    const { id } = req.params;

    try {
      const groupe = await GroupeService.deleteGroupe(id, req.session.passport.user.id);
      res.status(200).json(groupe);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  async addMember(req, res) {
    const { id, utilisateurId } = req.params;

    try {
      const groupe = await GroupeService.addMember(id, utilisateurId);
      res.status(200).json(groupe);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  async removeMember(req, res) {
    const { id, utilisateurId } = req.params;

    try {
      // Vérifier si l'utilisateur connecté est le créateur du groupe
      const groupe = await GroupeService.getGroupe(id);
      if (groupe.createur.toString() !== req.session.passport.user.id) {
        return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à effectuer cette action.' });
      }

      // Si autorisé, retirer le membre
      const result = await GroupeService.removeMember(id, utilisateurId);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  async changeGroupPhoto(req, res) {
    const { id } = req.params;
    const { newPhotoUrl } = req.body;

    try {
      const groupe = await GroupeService.changeGroupPhoto(id, newPhotoUrl);
      res.status(200).json(groupe);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
};

module.exports = GroupeController;
