const Utilisateur = require('../models/Utilisateur');
const MessageService = require('./MessageService');

class UtilisateurService {
  // Créer un nouvel utilisateur
  async createUtilisateur(data) {
    try {
      const utilisateur = new Utilisateur(data);
      utilisateur.setPassword();
      await utilisateur.save();
      return utilisateur;
    } catch (error) {
      console.error('Erreur lors de la création de l\'utilisateur :', error);
      throw error;
    }
  }
  async findUtilisateurById(utilisateurId) {
    try {
    
      const utilisateur = await Utilisateur.findById(utilisateurId).populate('messagesPrivesEnvoyes messagesPrivesRecus messagesGroupesEnvoyes messagesGroupesRecus groupes');
      return utilisateur;
    } catch (error) {
      console.error('Erreur lors de la création de l\'utilisateur :', error);
      throw error;
    }
  }
  async getAllUtilisateur() {
    try {
    
      const utilisateur = await Utilisateur.find().populate('messagesPrivesEnvoyes messagesPrivesRecus messagesGroupesEnvoyes messagesGroupesRecus groupes');
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
      return await utilisateur.findLastConversations();
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
      return await utilisateur.findDiscussionWithPerson(contactId);
    } catch (error) {
      console.error('Erreur lors de la récupération de la discussion :', error);
      throw error;
    }
  }
  async findDiscussionWithGroup(utilisateurId, groupId) {
    try {
      const utilisateur = await Utilisateur.findById(utilisateurId);
      if (!utilisateur) {
        throw new Error('Utilisateur non trouvé');
      }
      return await utilisateur.findDiscussionWithGroup(groupId);
    } catch (error) {
      console.error('Erreur lors de la récupération de la discussion :', error);
      throw error;
    }
  }

  // Envoyer un message privé
  async sendMessageToPerson(expediteurId, destinataireId, contenu) {
    try {
      const utilisateur = await Utilisateur.findById(expediteurId);
      if (!utilisateur) {
        throw new Error('Utilisateur non trouvé');
      }
      return await utilisateur.sendMessageToPerson(destinataireId,contenu);
    }  catch (error) {
      console.error('Erreur lors de l\'envoi du message privé :', error);
      throw error;
    }
  }

  // Envoyer un message de groupe
  async sendMessageToGroup(expediteurId, groupeId, contenu) {
    try {
      const utilisateur = await Utilisateur.findById(expediteurId);
      if (!utilisateur) {
        throw new Error('Utilisateur non trouvé');
      }
      return await utilisateur.sendMessageToGroup(groupeId,contenu);
    }   catch (error) {
      console.error('Erreur lors de l\'envoi du message de groupe :', error);
      throw error;
    }
  }

  async addStory(utilisateurId,contenu)
  {
    try {
      const utilisateur = await Utilisateur.findById(utilisateurId);
      if (!utilisateur) {
        throw new Error('Utilisateur non trouvé');
      }
      return await utilisateur.addStory(contenu);
    }   catch (error) {
      console.error('Erreur lors de l\'ajout du story :', error);
      throw error;
    }
  }

  async deleteStory(utilisateurId,storyId)
  {
    try {
      const utilisateur = await Utilisateur.findById(utilisateurId);
      if (!utilisateur) {
        throw new Error('Utilisateur non trouvé');
      }
      return await utilisateur.deleteStory(storyId);
    }   catch (error) {
      console.error('Erreur lors de l\'ajout du story :', error);
      throw error;
    }
  }
}

module.exports = new UtilisateurService();
