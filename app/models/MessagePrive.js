const mongoose = require('mongoose');
const MessageAbstrait = require('./MessageAbstrait');
const path=require('path');
const fs=require('fs');
const bucket = require('../../config/firebaseConfig');

const messagePriveSchema = new mongoose.Schema({
  destinataire: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Utilisateur',
    required: true
  },

  lu: {
    type: Boolean,
    default: false
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
    if (!expediteur.messagesPrivesEnvoyes.includes(message._id)) {
      expediteur.messagesPrivesEnvoyes.push(message._id);
      await expediteur.save();
    }

    // Ajouter le message aux messages reçus du destinataire
    const destinataire = await mongoose.model('Utilisateur').findById(message.destinataire);
    if (!destinataire.messagesPrivesRecus.includes(message._id)) {
      destinataire.messagesPrivesRecus.push(message._id);
      await destinataire.save();
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour des messages reçus et envoyés pour les messages privés :', error);
    throw error;
  }
});

messagePriveSchema.pre('deleteOne', async function(next) {
  console.log('🔥 PRE-DELETE MessagePrive START');

  try {
    const Model = this.model;
    const message = await Model.findOne(this.getFilter());

    // ⚠️ VÉRIFICATION CRITIQUE
    if (!message) {
      console.warn('⚠️  Message non trouvé dans pre-delete');
      return next();
    }

    console.log('Message à supprimer:', {
      id: message._id,
      type: message.contenu?.type,
      expediteur: message.expediteur,
      destinataire: message.destinataire
    });

    // Retirer des messages envoyés de l'expéditeur
    const expediteur = await mongoose.model('Utilisateur').findById(message.expediteur);
    if (expediteur) {
      expediteur.messagesPrivesEnvoyes.pull(message._id);
      await expediteur.save();
      console.log('✓ Retiré des messages envoyés');
    }

    // Retirer des messages reçus du destinataire
    const destinataire = await mongoose.model('Utilisateur').findById(message.destinataire);
    if (destinataire) {
      destinataire.messagesPrivesRecus.pull(message._id);
      await destinataire.save();
      console.log('✓ Retiré des messages reçus');
    }

    // ⚠️ SUPPRESSION FIREBASE (pas local!)
    if (message.contenu && ['image', 'audio', 'video', 'fichier'].includes(message.contenu.type)) {
      const fileType = message.contenu.type;
      const fileUrl = message.contenu[fileType];

      console.log('📎 Fichier détecté:', fileType);
      console.log('   URL:', fileUrl);

      // ⚠️ VÉRIFICATION: L'URL existe-t-elle ?
      if (!fileUrl) {
        console.warn('⚠️  URL de fichier manquante');
        return next();
      }

      try {
        // ✅ Extraire le chemin Firebase depuis l'URL
        // Exemple URL: https://storage.googleapis.com/essai-80556.appspot.com/messages/file-123.jpg
        const bucketName = bucket.name;
        const urlPattern = `https://storage.googleapis.com/${bucketName}/`;

        if (fileUrl.startsWith(urlPattern)) {
          const filePath = fileUrl.replace(urlPattern, '');
          const decodedPath = decodeURIComponent(filePath);

          console.log('   Chemin Firebase:', decodedPath);

          // Vérifier si d'autres messages utilisent ce fichier
          const regex = new RegExp(fileUrl, 'i');
          const query = {};
          query[`contenu.${fileType}`] = { $regex: regex };
          const occurrences = await mongoose.model('MessageAbstrait').find(query);

          console.log('   Occurrences du fichier:', occurrences.length);

          // ⚠️ Supprimer uniquement si c'est la dernière occurrence
          if (occurrences.length === 1) {
            console.log('   → Suppression du fichier Firebase...');
            await bucket.file(decodedPath).delete();
            console.log('   ✓ Fichier Firebase supprimé');
          } else {
            console.log('   ℹ️  Fichier partagé, conservation');
          }
        } else {
          console.warn('⚠️  URL ne correspond pas au bucket:', fileUrl);
        }
      } catch (fileError) {
        console.error('❌ Erreur suppression fichier Firebase:', fileError.message);
        console.error('   Code:', fileError.code);

        // ⚠️ Ne pas bloquer la suppression du message si le fichier n'existe pas
        if (fileError.code === 404) {
          console.log('   ℹ️  Fichier déjà supprimé ou inexistant');
        }
      }
    }

    console.log('🔥 PRE-DELETE MessagePrive END');
    next();
  } catch (error) {
    console.error('❌ Erreur pre-delete MessagePrive:', error);
    next(error); // ⚠️ Passer l'erreur à Mongoose
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
