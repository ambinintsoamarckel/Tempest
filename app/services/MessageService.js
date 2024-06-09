const MessagePrive = require('../models/MessagePrive');
const MessageGroupe = require('../models/MessageGroupe');
const Utilisateur = require('../models/Utilisateur');
const Groupe = require('../models/Groupe');

class MessageService {
  // Envoyer un message privé
  async sendMessagePrive(data) {
    try {
      const messagePrive = new MessagePrive(data);
      await messagePrive.save();

      const expediteur = await Utilisateur.findById(messagePrive.expediteur);
      const destinataire = await Utilisateur.findById(messagePrive.destinataire);

      expediteur.messagesEnvoyes.push(messagePrive._id);
      destinataire.messagesRecus.push(messagePrive._id);

      await expediteur.save();
      await destinataire.save();

      return messagePrive;
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message privé :', error);
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

  // Récupérer tous les messages privés d'un utilisateur
  async getMessagesPrives(utilisateurId) {
    try {
      const utilisateur = await Utilisateur.findById(utilisateurId).populate({
        path: 'messagesEnvoyes messagesRecus',
        populate: { path: 'expediteur destinataire' }
      });
      if (!utilisateur) {
        throw new Error('Utilisateur non trouvé');
      }
      const messages = [...utilisateur.messagesEnvoyes, ...utilisateur.messagesRecus].sort((a, b) => b.dateEnvoi - a.dateEnvoi);
      return messages;
    } catch (error) {
      console.error('Erreur lors de la récupération des messages privés :', error);
      throw error;
    }
  }

  // Récupérer tous les messages de groupe d'un utilisateur
  async getMessagesGroupes(utilisateurId) {
    try {
      const utilisateur = await Utilisateur.findById(utilisateurId).populate('groupes');
      if (!utilisateur) {
        throw new Error('Utilisateur non trouvé');
      }

      const groupes = utilisateur.groupes.map(groupe => groupe._id);
      const messagesGroupe = await MessageGroupe.find({ groupe: { $in: groupes } }).populate('expediteur groupe');

      return messagesGroupe.sort((a, b) => b.dateEnvoi - a.dateEnvoi);
    } catch (error) {
      console.error('Erreur lors de la récupération des messages de groupe :', error);
      throw error;
    }
  }
  async  getAllMessagesPrives() {
    try {
      const messagesPrives = await MessageAbstrait.find({ type: 'MessagePrive' }).populate('expediteur destinataire reponseA');
      return messagesPrives;
    } catch (error) {
      console.error('Erreur lors de la récupération des messages privés :', error);
    }
  }
  async  getAllMessagesDeGroupe() {
    try {
      const messagesDeGroupe = await MessageAbstrait.find({ type: 'MessageGroupe' }).populate('expediteur groupe reponseA');
      return messagesDeGroupe;
    } catch (error) {
      console.error('Erreur lors de la récupération des messages de groupe :', error);
    }
  }


  // Voir tous les messages échangés avec un autre utilisateur
  async getDiscussionWith(utilisateurId, contactId) {
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
 
}

module.exports = new MessageService();
