const Groupe = require('../models/Groupe');
const Utilisateur = require('../models/Utilisateur');
const MessageGroupe = require('../models/MessageGroupe');

class GroupeService {
  // Créer un nouveau groupe
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

  async getAllGroupe() {
    try {
       
      const groupe= await Groupe.find().populate('membres createur');
      return groupe;
    } catch (error) {
      console.error('Erreur lors de la récupération du groupe :', error);
      throw error;
    }
  }

  // Mettre à jour un groupe
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
  

  // Supprimer un groupe
  async deleteGroupe(groupeId) {
    try {
      const groupe = await Groupe.findByIdAndDelete(groupeId);
      if (!groupe) {
        throw new Error('Groupe non trouvé');
      }
      // Supprimer le groupe des utilisateurs membres
      await Utilisateur.updateMany({ groupes: groupeId }, { $pull: { groupes: groupeId } });
      return groupe;
    } catch (error) {
      console.error('Erreur lors de la suppression du groupe :', error);
      throw error;
    }
  }

  // Ajouter un membre au groupe
  async addMember(groupeId, utilisateurId) {
    try {
      const groupe = await Groupe.findById(groupeId);
      const utilisateur = await Utilisateur.findById(utilisateurId);
      if (!groupe || !utilisateur) {
        throw new Error('Groupe ou utilisateur non trouvé');
      }
      groupe.membres.push(utilisateurId);
      utilisateur.groupes.push(groupeId);
      await groupe.save();
      await utilisateur.save();
      return groupe;
    } catch (error) {
      console.error('Erreur lors de l\'ajout d\'un membre au groupe :', error);
      throw error;
    }
  }

  // Retirer un membre du groupe
  async removeMember(groupeId, utilisateurId) {
    try {
      const groupe = await Groupe.findById(groupeId);
      const utilisateur = await Utilisateur.findById(utilisateurId);
      if (!groupe || !utilisateur) {
        throw new Error('Groupe ou utilisateur non trouvé');
      }
      groupe.membres.pull(utilisateurId);
      utilisateur.groupes.pull(groupeId);
      await groupe.save();
      await utilisateur.save();
      return groupe;
    } catch (error) {
      console.error('Erreur lors du retrait d\'un membre du groupe :', error);
      throw error;
    }
  }

  // Envoyer un message de groupe
  async sendMessageGroupe(data) {
    try {
      const messageGroupe = new MessageGroupe(data);
      await messageGroupe.save();

      const groupe = await Groupe.findById(messageGroupe.groupe);
      groupe.messages.push(messageGroupe._id);
      await groupe.save();

      return messageGroupe;
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message de groupe :', error);
      throw error;
    }
  }

  // Récupérer tous les messages d'un groupe
  async getMessagesGroupe(groupeId) {
    try {
      const groupe = await Groupe.findById(groupeId).populate({
        path: 'messages',
        populate: { path: 'expediteur' }
      });
      if (!groupe) {
        throw new Error('Groupe non trouvé');
      }
      return groupe.messages;
    } catch (error) {
      console.error('Erreur lors de la récupération des messages de groupe :', error);
      throw error;
    }
  }
}

module.exports = new GroupeService();
