const mongoose = require('mongoose');
const MessageAbstrait = require('./MessageAbstrait');


const messagePriveSchema = new mongoose.Schema({
  destinataire: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Utilisateur',
    required: true
  },

  lu: {
    type: Boolean,
    default: null
  },
  dateLecture: {
    type: Date,
    default: null
  }
});

messagePriveSchema.post('save', async function(message) {
  try {
    // Ajouter le message aux messages envoyés de l'expéditeur
    const expediteur = await mongoose.model('Utilisateur').findById(message.expediteur);
    expediteur.messagesPrivesEnvoyes.push(message._id);
    await expediteur.save();

    // Ajouter le message aux messages reçus du destinataire
    const destinataire = await mongoose.model('Utilisateur').findById(message.destinataire);
    destinataire.messagesPrivesRecus.push(message._id);
    await destinataire.save();
  } catch (error) {
    console.error('Erreur lors de la mise à jour des messages reçus et envoyés pour les messages privés :', error);
    throw error;
  }
});

messagePriveSchema.post('findOneAndDelete', async function(message) {
  try {
    // Retirer le message des messages envoyés de l'expéditeur
    const expediteur = await mongoose.model('Utilisateur').findById(message.expediteur);
    expediteur.messagesPrivesEnvoyes.pull(message._id);
    await expediteur.save();

    // Retirer le message des messages reçus du destinataire
    const destinataire = await mongoose.model('Utilisateur').findById(message.destinataire);
    destinataire.messagesPrivesRecus.pull(message._id);
    await destinataire.save();
  } catch (error) {
    console.error('Erreur lors de la suppression des messages reçus et envoyés pour les messages privés :', error);
    throw error;
  }
});

messagePriveSchema.post('findOneAndUpdate', async function(result) {
  try {
    const updatedMessage = await MessagePrive.findById(result._id);
    
    // Vérifier si l'expéditeur a été modifié
    if (result.expediteur && !updatedMessage.expediteur.equals(result.expediteur)) {
      const ancienExpediteur = await mongoose.model('Utilisateur').findById(updatedMessage.expediteur);
      ancienExpediteur.messagesPrivesEnvoyes.pull(updatedMessage._id);
      await ancienExpediteur.save();

      const nouveauExpediteur = await mongoose.model('Utilisateur').findById(result.expediteur);
      nouveauExpediteur.messagesPrivesEnvoyes.push(updatedMessage._id);
      await nouveauExpediteur.save();
    }

    // Vérifier si le destinataire a été modifié
    if (result.destinataire && !updatedMessage.destinataire.equals(result.destinataire)) {
      const ancienDestinataire = await mongoose.model('Utilisateur').findById(updatedMessage.destinataire);
      ancienDestinataire.messagesPrivesRecus.pull(updatedMessage._id);
      await ancienDestinataire.save();

      const nouveauDestinataire = await mongoose.model('Utilisateur').findById(result.destinataire);
      nouveauDestinataire.messagesPrivesRecus.push(updatedMessage._id);
      await nouveauDestinataire.save();
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour des messages privés après modification :', error);
    throw error;
  }
});

const MessagePrive = MessageAbstrait.discriminator('MessagePrive', messagePriveSchema);

module.exports = MessagePrive;
