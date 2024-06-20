const Groupe = require('../models/Groupe');
const Utilisateur = require('../models/Utilisateur');
const MessageGroupe = require('../models/MessageGroupe');

class GroupeService {


  async getAllGroupes() {
    try {
      const groupes = await Groupe.find().populate('membres createur');
      return groupes;
    } catch (error) {
      console.error('Erreur lors de la récupération des groupes :', error);
      throw error;
    }
  }
  async getGroupe(id) {
    try {
      const groupes = await Groupe.findById(id).populate('membres createur');
      return groupes;
    } catch (error) {
      console.error('Erreur lors de la récupération des groupes :', error);
      throw error;
    }
  }

}

module.exports = new GroupeService();
