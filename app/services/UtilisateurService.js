const Utilisateur = require('../models/Utilisateur');
const MessageService = require('./MessageService');

class UtilisateurService {
  // Créer un nouvel utilisateur
  async createUtilisateur(data) {
    try {
      console.log('exemple',data);
      const utilisateur = new Utilisateur(data);
      console.log('essai',utilisateur);
      utilisateur.setPassword();
      await utilisateur.save();
      return utilisateur;
    } catch (error) {
      console.error('Erreur lors de la création de l\'utilisateur :', error);
      throw error;
    }
  }
  async getAllUtilisateur() {
    try {
    
      const utilisateur = await Utilisateur.find().populate('messagesEnvoyes groupes messagesRecus');
      return utilisateur;
    } catch (error) {
      console.error('Erreur lors de la création de l\'utilisateur :', error);
      throw error;
    }
  }


  // Mettre à jour un utilisateur
  async updateUtilisateur(utilisateurId, data) {
    try {
      const userModif= new Utilisateur(data);
      userModif.setPassword();
      const utilisateur = await Utilisateur.findByIdAndUpdate(utilisateurId, userModif, { new: true });
      if (!utilisateur) {
        throw new Error('Utilisateur non trouvé');
      }
      return utilisateur;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'utilisateur :', error);
      throw error;
    }
  }

  // Supprimer un utilisateur
  async deleteUtilisateur(utilisateurId) {
    try {
      const utilisateur = await Utilisateur.findByIdAndDelete(utilisateurId);
      if (!utilisateur) {
        throw new Error('Utilisateur non trouvé');
      }
      return utilisateur;
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'utilisateur :', error);
      throw error;
    }
  }

  // Trouver un utilisateur par email
  async findUtilisateurByEmail(email) {
    try {
      return await Utilisateur.findOne({ email });
    } catch (error) {
      console.error('Erreur lors de la recherche de l\'utilisateur par email :', error);
      throw error;
    }
  }

  // Trouver tous les contacts et les derniers messages d'un utilisateur
  async findContactsAndLastMessages(utilisateurId) {
    try {
      const utilisateur = await Utilisateur.findById(utilisateurId).populate('groupes');
      if (!utilisateur) {
        throw new Error('Utilisateur non trouvé');
      }
      return await utilisateur.findContactsAndLastMessages();
    } catch (error) {
      console.error('Erreur lors de la récupération des contacts et des derniers messages :', error);
      throw error;
    }
  }

  // Voir tous les messages échangés avec un autre utilisateur
  async findDiscussionWith(utilisateurId, contactId) {
    try {
      const utilisateur = await Utilisateur.findById(utilisateurId);
      if (!utilisateur) {
        throw new Error('Utilisateur non trouvé');
      }
      return await utilisateur.findDiscussionWith(contactId);
    } catch (error) {
      console.error('Erreur lors de la récupération de la discussion :', error);
      throw error;
    }
  }

  // Ajouter un ami
  async addFriend(utilisateurId, amiId) {
    try {
      const utilisateur = await Utilisateur.findById(utilisateurId);
      const ami = await Utilisateur.findById(amiId);
      if (!utilisateur || !ami) {
        throw new Error('Utilisateur ou ami non trouvé');
      }
      utilisateur.amis.push(amiId);
      ami.amis.push(utilisateurId);
      await utilisateur.save();
      await ami.save();
      return utilisateur;
    } catch (error) {
      console.error('Erreur lors de l\'ajout d\'un ami :', error);
      throw error;
    }
  }

  // Envoyer un message privé
  async sendMessageTo(expediteurId, destinataireId, contenu) {
    try {
      return await MessageService.sendPrivateMessage(expediteurId, destinataireId, contenu);
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message privé :', error);
      throw error;
    }
  }

  // Envoyer un message de groupe
  async sendMessageToGroup(expediteurId, groupeId, contenu) {
    try {
      return await MessageService.sendGroupMessage(expediteurId, groupeId, contenu);
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message de groupe :', error);
      throw error;
    }
  }
}

module.exports = new UtilisateurService();
