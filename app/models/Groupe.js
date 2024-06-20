const mongoose = require('mongoose');
const path=require('path');
const fs=require('fs');

const blockRelationArraysUpdates = async function(next) {
  const update = this.getUpdate();
 
  const immutableKeys = ['_id', 'messages','photo','createur','membres'];

  // Enlever les champs immuables de l'objet de mise à jour
  immutableKeys.forEach(key => {
    if (update.$set && update.$set[key]) {
      delete update.$set[key];
    }
    if (update[key]) {
      delete update[key];
    }
  });
console.log('Mise à jour :', update);

  next();
};
const groupeSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  photo: {
    type: String,
    default: null
  },
  description: {
    type: String,
    trim: true
  },
  createur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Utilisateur',
    required: true
  },
  membres: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Utilisateur'
  }],
  messages: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MessageGroupe' // Référence à MessageGroupe
  }]
});


// Enregistrement du middleware au niveau du modèle
groupeSchema.pre('findOneAndUpdate', blockRelationArraysUpdates);

// Middleware pour ajouter automatiquement les membres lors de la création d'un groupe
groupeSchema.post('save', async function(groupe) {
  try {
    
    // Récupérer les utilisateurs membres du groupe
    const membres = await mongoose.model('Utilisateur').find({ _id: { $in: groupe.membres } });

    // Ajouter l'ID du groupe à la liste des groupes de chaque utilisateur membre
    for (const utilisateur of membres) {
      if (!utilisateur.groupes.includes(groupe._id)) {
        utilisateur.groupes.push(groupe._id);
        await utilisateur.save();
      }
    }

  } catch (error) {
    console.error('Erreur lors de l\'ajout automatique des membres au groupe :', error);
    throw error;
  }
});

// Exemple de méthode pour ajouter un utilisateur à un groupe
groupeSchema.methods.ajouterMembre = async function(utilisateurId) {
  try {
    // Vérifier si l'utilisateur est déjà membre du groupe
    if (this.membres.includes(utilisateurId)) {
      throw new Error('L\'utilisateur est déjà membre du groupe.');
    }

    // Ajouter l'utilisateur à la liste des membres
    this.membres.push(utilisateurId);
    await this.save();


/*     const nouveaumembre = await mongoose.model('Utilisateur').findById(utilisateurId);
    this.messages.forEach(async message => {
          nouveaumembre.messagesGroupesRecus.push(message._id);
          await nouveaumembre.save();
        }); */

    return 'Utilisateur ajouté au groupe avec succès.';
  } catch (error) {
    console.error('Erreur lors de l\'ajout d\'un utilisateur au groupe :', error);
    throw error;
  }
};

// Exemple de méthode pour supprimer un membre d'un groupe
groupeSchema.methods.supprimerMembre = async function(utilisateurId) {
  try {
    // Vérifier si l'utilisateur est membre du groupe
    if (!this.membres.includes(utilisateurId)) {
      throw new Error('L\'utilisateur n\'est pas membre du groupe.');
    }

    // Retirer l'utilisateur de la liste des membres
    this.membres.pull(utilisateurId);
    await this.save();

    // Retirer les messages reçus de l'utilisateur
    const utilisateur = await mongoose.model('Utilisateur').findById(utilisateurId);
    utilisateur.messagesGroupesRecus = utilisateur.messagesGroupesRecus.filter(messageId => !this.messages.includes(messageId));
    await utilisateur.save();

    return 'Utilisateur supprimé du groupe avec succès.';
  } catch (error) {
    console.error('Erreur lors de la suppression d\'un utilisateur du groupe :', error);
    throw error;
  }
};
groupeSchema.methods.changePhoto = async function(newPhotoUrl) {
  try {
    // Mettre à jour le champ photo avec la nouvelle URL de la photo
    if (this.photo) {
      const oldPhotoUrl = this.photo;
      const relativeFilePath = oldPhotoUrl.split('3000/')[1];
      const filePath = path.join(__dirname, '../../', relativeFilePath);

      fs.unlink(filePath, (err) => {
        if (err) {
          console.error(`Erreur lors de la suppression du fichier ${filePath} :`, err);
        }
      });
    }
    this.photo = newPhotoUrl;

    // Enregistrer les modifications
    await this.save();
    return 'Photo de profil mise à jour avec succès.';
  } catch (error) {
    console.error('Erreur lors du changement de photo de profil :', error);
    throw error;
  }
};
groupeSchema.post('remove',  async function(groupe) {
  try {
 
    if (groupe.photo) {
      const oldPhotoUrl = groupe.photo;
      const relativeFilePath = oldPhotoUrl.split('3000/')[1];
      const filePath = path.join(__dirname, '../../', relativeFilePath);

      fs.unlink(filePath, (err) => {
        if (err) {
          console.error(`Erreur lors de la suppression du fichier ${filePath} :`, err);
        }
      });
    }
    // Retirer le groupe de la liste des groupes de chaque utilisateur membre
    await mongoose.model('Utilisateur').updateMany(
      { _id: { $in: groupe.membres } },
      { $pull: { groupes: groupe._id } }
    );

    // Retirer les messages de groupe des collections des utilisateurs
    await mongoose.model('Utilisateur').updateMany(
      { _id: { $in: groupe.membres } },
      { 
        $pull: { 
          messagesGroupesEnvoyes: { $in: groupe.messages },
          messagesGroupesRecus: { $in: groupe.messages }
        }
      }
    );

    // Supprimer les messages de groupe
    await mongoose.model('MessageGroupe').deleteMany({ _id: { $in: groupe.messages } });

  } catch (error) {
    console.error('Erreur lors de la suppression du groupe :', error);
    next(error);
  }
});


module.exports = mongoose.model('Groupe', groupeSchema);
