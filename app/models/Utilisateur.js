const mongoose = require('mongoose');

const utilisateurSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  motDePasse: {
    type: String,
    required: true,
    trim: true
  },
  photo: {
    type: String,
    default: null
  },
  presence: {
    type: String,
    enum: ['en ligne', 'inactif'],
    default: 'inactif'
  },
  amis: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Utilisateur'
  }],
  groupes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Groupe'
  }],
  messagesEnvoyes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MessageAbstrait' // Référence à MessageAbstrait
  }],
  messagesRecus: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MessageAbstrait' // Référence à MessageAbstrait
  }]
});

// Méthode d'instance pour trouver les contacts et le dernier message avec chaque contact
// Méthode pour trouver tous les contacts et les groupes avec les derniers messages d'un utilisateur
utilisateurSchema.methods.findContactsAndLastMessages = async function() {
  try {
    const contactsAndMessages = [];

    // Récupérer les messages envoyés et reçus par l'utilisateur
    const messagesEnvoyes = await MessageAbstrait.find({ _id: { $in: this.messagesEnvoyes } }).populate('expediteur destinataire');
    const messagesRecus = await MessageAbstrait.find({ _id: { $in: this.messagesRecus } }).populate('expediteur destinataire');

    // Combiner et trier les messages par date d'envoi en ordre décroissant
    const messages = [...messagesEnvoyes, ...messagesRecus].sort((a, b) => b.dateEnvoi - a.dateEnvoi);

    // Parcourir les messages pour identifier les contacts uniques et le dernier message échangé
    const contactsMap = new Map();
    messages.forEach(message => {
      const contactId = message.expediteur._id.equals(this._id) ? message.destinataire._id : message.expediteur._id;
      if (!contactsMap.has(contactId.toString())) {
        contactsMap.set(contactId.toString(), {
          contact: message.expediteur._id.equals(this._id) ? message.destinataire : message.expediteur,
          dernierMessage: message
        });
      }
    });

    // Convertir les contacts en tableau et trier par date de dernier message
    const contacts = Array.from(contactsMap.values()).sort((a, b) => b.dernierMessage.dateEnvoi - a.dernierMessage.dateEnvoi);

    contactsAndMessages.push(...contacts);

    // Ajouter les groupes avec les derniers messages à la liste des contacts
    this.groupes.forEach(groupe => {
      if (groupe.messages.length > 0) {
        const dernierMessage = groupe.messages[0];
        contactsAndMessages.push({
          contact: groupe,
          dernierMessage
        });
      }
    });

    // Trier les contacts par date de dernier message en ordre décroissant
    contactsAndMessages.sort((a, b) => b.dernierMessage.dateEnvoi - a.dernierMessage.dateEnvoi);

    return contactsAndMessages;
  } catch (error) {
    console.error('Erreur lors de la récupération des contacts et des derniers messages :', error);
    throw error;
  }
};
// Méthode d'instance pour voir tous les messages échangés avec un autre utilisateur
utilisateurSchema.methods.findDiscussionWith = async function(contactId) {
  const MessageAbstrait = mongoose.model('MessageAbstrait');
  const userId = this._id;

  // Rechercher tous les messages où l'utilisateur actuel est soit l'expéditeur, soit le destinataire,
  // et où l'autre utilisateur est l'autre partie
  const messages = await MessageAbstrait.find({
    $or: [
      { expediteur: userId, destinataire: contactId },
      { expediteur: contactId, destinataire: userId }
    ]
  }).sort({ dateEnvoi: 1 }).populate('expediteur destinataire');

  return messages;
};
module.exports = mongoose.model('Utilisateur', utilisateurSchema);
