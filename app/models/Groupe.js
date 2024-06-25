const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// Middleware to block updates to immutable fields
const blockRelationArraysUpdates = async function(next) {
  const update = this.getUpdate();
  const immutableKeys = ['_id', 'messages', 'photo', 'createur', 'membres'];

  // Enlever les champs immuables de l'objet de mise à jour
  if (update) {
    if (update.$set) {
      immutableKeys.forEach(key => {
        if (update.$set[key]) {
          delete update.$set[key];
        }
      });
    }

    immutableKeys.forEach(key => {
      if (update[key]) {
        delete update[key];
      }
    });
  }

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
    ref: 'MessageGroupe'
  }]
});

// Register middleware to block updates to immutable fields
groupeSchema.pre('findOneAndUpdate', blockRelationArraysUpdates);

// Middleware to automatically add members when a group is created
groupeSchema.post('save', async function(groupe) {
  try {
    // Retrieve the user members of the group
    const membres = await mongoose.model('Utilisateur').find({ _id: { $in: groupe.membres } });

    // Add the group ID to the list of groups for each member user
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

// Method to add a user to a group
groupeSchema.methods.ajouterMembre = async function(utilisateurId) {
  try {
    // Check if the user is already a member of the group
    if (this.membres.includes(utilisateurId)) {
      throw new Error('L\'utilisateur est déjà membre du groupe.');
    }

    // Add the user to the list of members
    this.membres.push(utilisateurId);
    await this.save();

    // Retrieve the new member and update their messages
    const nouveaumembre = await mongoose.model('Utilisateur').findById(utilisateurId);
    for (const message of this.messages) {
      nouveaumembre.messagesGroupesRecus.push(message._id);
      const msg = await mongoose.model('MessageGroupe').findById(message._id);
      msg.luPar.push({ utilisateur: nouveaumembre._id, dateLecture: Date.now() });
      await msg.save();
    }
    await nouveaumembre.save();

    return 'Utilisateur ajouté au groupe avec succès.';
  } catch (error) {
    console.error('Erreur lors de l\'ajout d\'un utilisateur au groupe :', error);
    throw error;
  }
};

// Method to remove a member from a group
groupeSchema.methods.supprimerMembre = async function(utilisateurId) {
  try {
    // Check if the user is a member of the group
    if (!this.membres.includes(utilisateurId)) {
      throw new Error('L\'utilisateur n\'est pas membre du groupe.');
    }

    // Remove the user from the list of members
    this.membres.pull(utilisateurId);
    await this.save();

    // Remove received messages from the user
    const utilisateur = await mongoose.model('Utilisateur').findById(utilisateurId);
    utilisateur.messagesGroupesRecus = utilisateur.messagesGroupesRecus.filter(messageId => !this.messages.includes(messageId));
    await utilisateur.save();

    return 'Utilisateur supprimé du groupe avec succès.';
  } catch (error) {
    console.error('Erreur lors de la suppression d\'un utilisateur du groupe :', error);
    throw error;
  }
};

// Method to change the group's photo
groupeSchema.methods.changePhoto = async function(newPhotoUrl) {
  try {
    // Update the photo field with the new URL
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
    await this.save();

    return 'Photo de profil mise à jour avec succès.';
  } catch (error) {
    console.error('Erreur lors du changement de photo de profil :', error);
    throw error;
  }
};

// Middleware to handle group deletion
groupeSchema.pre('findByIdAndDelete', async function(groupe) {
  try {
    // Remove the photo file if it exists
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

    // Remove the group from the list of groups for each member user
    await mongoose.model('Utilisateur').updateMany(
      { _id: { $in: groupe.membres } },
      { $pull: { groupes: groupe._id } }
    );

    // Remove group messages from users' collections
    await mongoose.model('Utilisateur').updateMany(
      { _id: { $in: groupe.membres } },
      {
        $pull: {
          messagesGroupesEnvoyes: { $in: groupe.messages },
          messagesGroupesRecus: { $in: groupe.messages }
        }
      }
    );

    // Delete the group's messages
    await mongoose.model('MessageGroupe').deleteMany({ _id: { $in: groupe.messages } });

  } catch (error) {
    console.error('Erreur lors de la suppression du groupe :', error);
    throw error;
  }
});

module.exports = mongoose.model('Groupe', groupeSchema);
