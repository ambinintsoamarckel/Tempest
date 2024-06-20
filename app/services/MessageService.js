const MessagePrive = require('../models/MessagePrive');
const MessageGroupe = require('../models/MessageGroupe');
const Utilisateur = require('../models/Utilisateur');
const Groupe = require('../models/Groupe');

class MessageService {


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

 
}

module.exports = new MessageService();
