const mongoose = require('mongoose');
const MessageAbstrait = mongoose.model('MessageAbstrait');
const path=require('path');
const fs=require('fs');

const messageGroupeSchema = new mongoose.Schema({
  groupe: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Groupe',
    required: true
  },
  notification:{
    default :false,
    type: mongoose.Schema.Types.Boolean

  },

  luPar: [{
      utilisateur: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Utilisateur'
      },
      dateLecture: Date,
      _id: false
    }],

});
messageGroupeSchema.post('save', async function(message) {
  try {
    // Ajouter le message aux messages envoyés de l'expéditeur
    const expediteur = await mongoose.model('Utilisateur').findById(message.expediteur);
    expediteur.messagesGroupesEnvoyes.push(message._id);
    await expediteur.save();

    // Ajouter le message aux messages reçus de tous les membres du groupe sauf l'expéditeur
    const groupe = await mongoose.model('Groupe').findById(message.groupe);
    const membres = await mongoose.model('Utilisateur').find({ _id: { $in: groupe.membres } });
    groupe.messages.push(message._id);
    await groupe.save();

    membres.forEach(async utilisateur => {
      if (!message.expediteur.equals(utilisateur._id)) {
        utilisateur.messagesGroupesRecus.push(message._id);
        await utilisateur.save();
      }
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour des messages reçus et envoyés pour les messages de groupe :', error);
    throw error;
  }
});
// Middleware pour la suppression de messages de groupe
messageGroupeSchema.post('remove', async function(message) {
  try {
    // Retirer le message des messages envoyés de l'expéditeur
    const expediteur = await mongoose.model('Utilisateur').findById(message.expediteur);
    expediteur.messagesGroupesEnvoyes.pull(message._id);
    await expediteur.save();
        // Supprimer les fichiers associés si nécessaire
    if (message.contenu && ['image', 'audio', 'video', 'fichier'].includes(message.contenu.type)) {
      const filePath = path.join(__dirname, '../../', message.contenu[message.contenu.type].split('3000/')[1]);
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error(`Erreur lors de la suppression du fichier ${filePath} :`, err);
        }
      });
    }
    
    // Retirer le message des messages reçus de tous les membres du groupe sauf l'expéditeur
    const groupe = await mongoose.model('Groupe').findById(message.groupe);
    const membres = await mongoose.model('Utilisateur').find({ _id: { $in: groupe.membres } });

    membres.forEach(async utilisateur => {
      if (!message.expediteur.equals(utilisateur._id)) {
        utilisateur.messagesGroupesRecus.pull(message._id);
        await utilisateur.save();
      }
    });
  } catch (error) {
    console.error('Erreur lors de la suppression des messages reçus et envoyés pour les messages de groupe :', error);
    throw error;
  }
});

// Middleware pour la mise à jour de messages de groupe
messageGroupeSchema.post('findOneAndUpdate', async function(result) {
  try {
    const updatedMessage = await mongoose.model('MessageGroupe').findById(result._id);
    
    // Vérifier si l'expéditeur a été modifié
    if (result.expediteur && !updatedMessage.expediteur.equals(result.expediteur)) {
      const ancienExpediteur = await mongoose.model('Utilisateur').findById(updatedMessage.expediteur);
      ancienExpediteur.messagesGroupesEnvoyes.pull(updatedMessage._id);
      await ancienExpediteur.save();

      const nouveauExpediteur = await mongoose.model('Utilisateur').findById(result.expediteur);
      nouveauExpediteur.messagesGroupesEnvoyes.push(updatedMessage._id);
      await nouveauExpediteur.save();
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour des messages de groupe après modification :', error);
    throw error;
  }
});

const MessageGroupe = MessageAbstrait.discriminator('MessageGroupe', messageGroupeSchema);

module.exports = MessageGroupe;
