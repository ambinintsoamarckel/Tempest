const mongoose = require('mongoose');

const blockRelationArraysUpdates = async (req, res, next) => {
  const update = req.body;
  const blockedKeys = ['membres', 'messages'];

  for (const key of blockedKeys) {
    if (update.$set && update.$set[key]) {
      throw new Error(`La modification du tableau "${key}" n'est pas autorisée.`);
    }

    if (update.$addToSet && update.$addToSet[key]) {
      throw new Error(`L'ajout d'éléments au tableau "${key}" n'est pas autorisé.`);
    }
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


    const nouveaumembre = await mongoose.model('Utilisateur').findById(utilisateurId);
    this.messages.forEach(async message => {
          nouveaumembre.messagesGroupesRecus.push(message._id);
          await nouveaumembre.save();
        });

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



module.exports = mongoose.model('Groupe', groupeSchema);
