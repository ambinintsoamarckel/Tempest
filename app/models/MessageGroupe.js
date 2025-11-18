const mongoose = require('mongoose');
const MessageAbstrait = mongoose.model('MessageAbstrait');
const path=require('path');
const fs=require('fs');
const bucket = require('../../config/firebaseConfig');

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
messageGroupeSchema.post('save', async function(message) {
  try {
    const expediteur = await mongoose.model('Utilisateur').findById(message.expediteur);
    expediteur.messagesGroupesEnvoyes.push(message._id);
    await expediteur.save();

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
    console.error('Erreur post-save MessageGroupe:', error);
    throw error;
  }
});

// ⚠️ PRE-DELETE MIDDLEWARE - CORRIGÉ
messageGroupeSchema.pre('deleteOne', async function(next) {
  console.log('🔥 PRE-DELETE MessageGroupe START');

  try {
    const Model = this.model;
    const message = await Model.findOne(this.getFilter());

    // ⚠️ VÉRIFICATION CRITIQUE
    if (!message) {
      console.warn('⚠️  Message non trouvé dans pre-delete');
      return next();
    }

    console.log('Message groupe à supprimer:', {
      id: message._id,
      type: message.contenu?.type,
      expediteur: message.expediteur,
      groupe: message.groupe
    });

    // Retirer des messages envoyés de l'expéditeur
    const expediteur = await mongoose.model('Utilisateur').findById(message.expediteur);
    if (expediteur) {
      expediteur.messagesGroupesEnvoyes.pull(message._id);
      await expediteur.save();
      console.log('✓ Retiré des messages envoyés');
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

        if (fileError.code === 404) {
          console.log('   ℹ️  Fichier déjà supprimé ou inexistant');
        }
      }
    }

    // Retirer du groupe et des messages reçus
    const groupe = await mongoose.model('Groupe').findById(message.groupe);
    if (groupe) {
      groupe.messages.pull(message._id);
      await groupe.save(); // ⚠️ CORRECTION: await groupe.save() au lieu de groupe.save
      console.log('✓ Retiré du groupe');

      const membres = await mongoose.model('Utilisateur').find({ _id: { $in: groupe.membres } });
      for (const utilisateur of membres) {
        if (!message.expediteur.equals(utilisateur._id)) {
          utilisateur.messagesGroupesRecus.pull(message._id);
          await utilisateur.save();
        }
      }
      console.log('✓ Retiré des messages reçus des membres');
    }

    console.log('🔥 PRE-DELETE MessageGroupe END');
    next();
  } catch (error) {
    console.error('❌ Erreur pre-delete MessageGroupe:', error);
    next(error);
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
