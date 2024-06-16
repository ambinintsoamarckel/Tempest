const Groupe = require('../models/Groupe');
const Utilisateur = require('../models/Utilisateur');
const MessageGroupe = require('../models/MessageGroupe');

class GroupeService {
  async createGroupe(data) {
    try {
      const groupe = new Groupe(data);
      await groupe.save();
      return groupe;
    } catch (error) {
      console.error('Erreur lors de la création du groupe :', error);
      throw error;
    }
  }

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
  async updateGroupe(groupeId, data) {
    try {
      const { messages, membres, createur, ...updateData } = data; // Exclure les champs sensibles
      const groupe = await Groupe.findByIdAndUpdate(groupeId, updateData, { new: true });
      if (!groupe) {
        throw new Error('Groupe non trouvé');
      }
      return groupe;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du groupe :', error);
      throw error;
    }
  }

  async deleteGroupe(req, res) {
    const { id } = req.params;

    try {
      // Vérifier si l'utilisateur connecté est le créateur du groupe
      const groupe = await GroupeService.getGroupe(id);
      if (groupe.createur.toString() !== req.session.passport.user.id) {
        return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à effectuer cette action.' });
      }

      // Si autorisé, supprimer le groupe
      const result = await GroupeService.deleteGroupe(id);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  async addMember(groupeId, utilisateurId) {
    try {
      const groupe = await Groupe.findById(groupeId);
      if (!groupe) {
        throw new Error('Groupe non trouvé');
      }
      await groupe.ajouterMembre(utilisateurId); // Utilisation de la méthode addMembre du modèle Groupe
      return groupe;
    } catch (error) {
      console.error('Erreur lors de l\'ajout d\'un membre au groupe :', error);
      throw error;
    }
  }

  async removeMember(groupeId, utilisateurId) {
    try {
      const groupe = await Groupe.findById(groupeId);
      if (!groupe) {
        throw new Error('Groupe non trouvé');
      }
      await groupe.supprimerMembre(utilisateurId); // Utilisation de la méthode removeMembre du modèle Groupe
      return groupe;
    } catch (error) {
      console.error('Erreur lors du retrait d\'un membre du groupe :', error);
      throw error;
    }
  }

  async changeGroupPhoto(groupeId, newPhotoUrl) {
    try {
      const groupe = await Groupe.findById(groupeId);
      if (!groupe) {
        throw new Error('Groupe non trouvé');
      }
      groupe.changeGroupPhoto(newPhotoUrl);
      return groupe;
    } catch (error) {
      console.error('Erreur lors du changement de la photo du groupe :', error);
      throw error;
    }
  }
}

module.exports = new GroupeService();
