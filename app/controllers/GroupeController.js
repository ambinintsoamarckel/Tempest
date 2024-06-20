const GroupeService = require('../services/GroupeService');
const UtilisateurService = require('../services/UtilisateurService');

const GroupeController = {


  async getAllGroupes(req, res) {
    try {
      const groupes = await GroupeService.getAllGroupes();
      res.status(200).json(groupes);
    } catch (error) {
      res.status(500).json({ message: error.message });
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
  }
};

module.exports = GroupeController;
