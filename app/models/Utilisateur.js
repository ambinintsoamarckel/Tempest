const mongoose = require('mongoose');
const crypto = require('crypto');
const fs=require('fs');
const { formatPhotoPath } = require('../../config/utils');

// Middleware pour bloquer les modifications des tableaux relationnels
const blockRelationArraysUpdates = async function(next) {
  const update = this.getUpdate();
  const blockedKeys = ['groupes', 'stories', 'messagesPrivesEnvoyes', 'messagesPrivesRecus', 'messagesGroupesEnvoyes', 'messagesGroupesRecus'];
  const immutableKeys = ['_id', 'password','groupes', 'stories', 'messagesPrivesEnvoyes', 'messagesPrivesRecus', 'messagesGroupesEnvoyes', 'messagesGroupesRecus','photo'];

  // Enlever les champs immuables de l'objet de mise à jour
  immutableKeys.forEach(key => {
    if (update.$set && update.$set[key]) {
      delete update.$set[key];
    }
    if (update[key]) {
      delete update[key];
    }
  });
  next();
};
/* const addPhotoToUtilisateur = async (utilisateurObject, req, next) => {
  const photoPath = utilisateurObject.photo; // URL de la photo de profil

  if (photoPath) {
    try {
      const photoBuffer = await fs.promises.readFile(photoPath);
      utilisateurObject.photo = photoBuffer.toString('base64'); // Convertir le tampon en base64
    } catch (error) {
      // Gérer l'erreur de lecture du fichier photo
      console.error(`Erreur lors de la lecture de la photo de l'utilisateur ${utilisateurObject._id} :`, error);
      utilisateurObject.photo = null; // Définir la photo à null si une erreur se produit
    }
  } else {
    // Cas où la propriété photo est absente ou null
    utilisateurObject.photo = null; // Définir la photo à null par défaut
  }

  next();
}; */

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
  lastActivity: {
    type: Date,
    default: Date.now
  },
  password: {
    type: String,
    required: true,
    trim: true
  },
  salt: {
    type: String,
    required: true
  },
  photo: {
    type: String,
    default: null
  },
  mimetype: {
    type: String,
    default: null
  
  },
  presence: {
    type: String,
    enum: ['en ligne', 'inactif'],
    default: 'inactif'
  },
  groupes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Groupe'
  }],
  stories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Story'
  }],
  messagesPrivesEnvoyes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MessagePrive'
  }],
  messagesPrivesRecus: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MessagePrive'
  }],
  messagesGroupesEnvoyes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MessageGroupe'
  }],
  messagesGroupesRecus: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MessageGroupe'
  }]
}, { timestamps: true });



// Enregistrement du middleware au niveau du modèle
utilisateurSchema.pre('findOneAndUpdate', blockRelationArraysUpdates);
/* utilisateurSchema.post('toJSON', addPhotoToUtilisateur); */
utilisateurSchema.methods.setPassword = function() {
  this.salt = crypto.randomBytes(16).toString('hex');
  this.password = crypto.pbkdf2Sync(this.password, this.salt, 310000, 32, 'sha256').toString('hex');
};

utilisateurSchema.methods.validatePassword = function(password) {
  const hashedPassword = crypto.pbkdf2Sync(password, this.salt, 310000, 32, 'sha256').toString('hex');
  return this.password === hashedPassword;
};

utilisateurSchema.methods.sendMessageToPerson = async function(destinataireId, contenu) {
  try {
    await this.UpdatePresence();
    const destinataire = await mongoose.model('Utilisateur').findById(destinataireId);
    if (!destinataire) {
      throw new Error('Le destinataire spécifié n\'existe pas.');
    }
    const message = new mongoose.model('MessagePrive')({
      ...contenu,
      expediteur: this._id,
      destinataire: destinataireId
    });
    await message.save();
    destinataire.messagesPrivesRecus.push(message._id);
    await destinataire.save();
    this.messagesPrivesEnvoyes.push(message._id);
    await this.save();
    return message;
  } catch (error) {
    console.error('Erreur lors de l\'envoi du message privé :', error);
    throw error;
  }
};

utilisateurSchema.methods.sendMessageToGroup = async function(groupeId, contenu) {
  try {
    await this.UpdatePresence();
    const groupe = await mongoose.model('Groupe').findById(groupeId);
    if (!groupe) {
      throw new Error('Le groupe spécifié n\'existe pas.');
    }
    if (!groupe.membres.includes(this._id)) {
      throw new Error('Vous n\'êtes pas membre de ce groupe.');
    }
    const message = new mongoose.model('MessageGroupe')({
      ...contenu,
      expediteur: this._id,
      groupe: groupeId
    });
    await message.save();
    return message;
  } catch (error) {
    console.error('Erreur lors de l\'envoi du message au groupe :', error);
    throw error;
  }
};

utilisateurSchema.methods.findDiscussionWithPerson = async function(contactId) {
  try {
    await this.UpdatePresence();
    const user = await mongoose.model('Utilisateur').findById(contactId);
    if (!user) {
      throw new Error('L\'utilisateur spécifié n\'existe pas.');
    }
    const messages = await mongoose.model('MessagePrive').find({
      $or: [
        { expediteur: this._id, destinataire: contactId },
        { expediteur: contactId, destinataire: this._id }
      ]
    }).sort({ dateEnvoi: 1 }).populate('expediteur destinataire');


    // Marquer tous les messages non lus comme lus pour l'utilisateur actuel
    messages.forEach(async message => {
      if (message.lu === false && message.destinataire.equals(this._id)) {
        message.lu = true;
        message.dateLecture = Date.now();
        await message.save();
      }
    });
    // Exemple de données simplifiées pour répondre uniquement avec les informations essentielles
      const messagesSimplifies = messages.map(message => ({
        contenu:message.contenu,
        _id: message._id,
        expediteur: {
            _id: message.expediteur._id,
            nom: message.expediteur.nom,
            email: message.expediteur.email,
            photo: message.expediteur.photo
        },
        destinataire: {
            _id: message.destinataire._id,
            nom: message.destinataire.nom,
            email: message.destinataire.email,
            photo: message.destinataire.photo
        },
        lu: message.lu,
        dateLecture: message.dateLecture,
        dateEnvoi: message.dateEnvoi
      }));




    return messagesSimplifies;
  } catch (error) {
    console.error('Erreur lors de la récupération de la discussion :', error);
    throw error;
  }
};


utilisateurSchema.methods.findDiscussionWithGroup = async function(groupeId) {
  try {
    await this.UpdatePresence();
    const groupe = await mongoose.model('Groupe').findById(groupeId);
    if (!groupe) {
      throw new Error('Le groupe spécifié n\'existe pas.');
    }
    if (!groupe.membres.includes(this._id)) {
      throw new Error('Vous n\'êtes pas membre de ce groupe.');
    }

    const messages = await mongoose.model('MessageGroupe').find({ groupe: groupeId }).sort({ dateEnvoi: 1 }).populate('expediteur');

    // Marquer tous les messages non lus comme lus pour l'utilisateur actuel
    for (const message of messages) {
      const isUserMember = message.luPar.some(entry => entry.utilisateur.equals(this._id));
      const ExpId = message.expediteur._id;
      if (!isUserMember&&!ExpId.equals(this._id)) {
        message.luPar.push({ utilisateur: this._id, dateLecture: Date.now() });
        console.log(message.luPar);
        await message.save();
      }
    }

    const messagesSimplifies = messages.map(message => ({
      
      contenu:message.contenu,
      expediteur: {
        _id: message.expediteur._id,
        nom: message.expediteur.nom,
        email: message.expediteur.email,
        photo: message.expediteur.photo
      },
      luPar: message.luPar
    }));

    return messagesSimplifies;
  } catch (error) {
    console.error('Erreur lors de la récupération de la discussion de groupe :', error);
    throw error;
  }
};

utilisateurSchema.methods.addStory = async function(contenu) {
  try {
    await this.UpdatePresence();
    // Créer une nouvelle instance de Story
    const nouvelleStory = new mongoose.model('Story')({
      utilisateur: this._id,
      ...contenu,
    });

    // Sauvegarder la nouvelle story
    await nouvelleStory.save();

    // Ajouter l'ID de la nouvelle story au tableau stories de l'utilisateur
    this.stories.push(nouvelleStory._id);
    await this.save();

    return 'Story ajoutée avec succès.';
  } catch (error) {
    console.error(`Erreur lors de l'ajout de la story pour l'utilisateur ${this._id} :`, error);
    throw error;
  }
};

utilisateurSchema.methods.deleteStory = async function(storyId) {
  try {
    await this.UpdatePresence();
    // Vérifier si l'utilisateur a créé la story
    const index = this.stories.indexOf(storyId);
    if (index === -1) {
      throw new Error('L\'utilisateur n\'a pas créé cette story.');
    }

    // Supprimer l'ID de la story du tableau stories
    this.stories.splice(index, 1);
    await this.save();

    // Supprimer la story de la base de données
    await Story.findByIdAndDelete(storyId);

    return 'Story supprimée avec succès.';
  } catch (error) {
    console.error(`Erreur lors de la suppression de la story pour l'utilisateur ${this._id} :`, error);
    throw error;
  }
};


utilisateurSchema.methods.findLastConversations = async function() {
  try {
    await this.UpdatePresence();
    const lastConversations = [];

    // Récupérer les messages privés envoyés et reçus par l'utilisateur
    const MessagePrive = mongoose.model('MessagePrive');
    const messagesEnvoyes = await MessagePrive.find({ expediteur: this._id }).populate('destinataire').sort({ dateEnvoi: -1 });
    const messagesRecus = await MessagePrive.find({ destinataire: this._id }).populate('expediteur').sort({ dateEnvoi: -1 });

    // Combiner et trier les messages privés par date d'envoi en ordre décroissant
    const privateMessages = [...messagesEnvoyes, ...messagesRecus].sort((a, b) => b.dateEnvoi - a.dateEnvoi);

    // Parcourir les messages privés pour identifier les contacts uniques et les derniers messages échangés
    const privateContactsMap = new Map();
    privateMessages.forEach(message => {
      const isEnvoye = message.expediteur._id.equals(this._id);
      const contactId = isEnvoye ? message.destinataire._id : message.expediteur._id;
      const contactType = isEnvoye ? 'utilisateur' : 'utilisateur';
      const contactNom = isEnvoye ? message.destinataire.nom : message.expediteur.nom;
      const contactPhoto = isEnvoye ? message.destinataire.photo : message.expediteur.photo;
      const dernierMessage = {
        contenu: message.contenu,
        lu: message.lu,
        dateEnvoi: message.dateEnvoi,
        dateLecture: message.dateLecture
      };

      if (!privateContactsMap.has(contactId.toString())) {
        privateContactsMap.set(contactId.toString(), {
          contact: {
            _id: contactId,
            type: contactType,
            nom: contactNom,
            photo: contactPhoto
          },
          dernierMessage
        });
      }
    });

    // Convertir les contacts privés en tableau et trier par date de dernier message
    const privateContacts = Array.from(privateContactsMap.values()).sort((a, b) => b.dernierMessage.dateEnvoi - a.dernierMessage.dateEnvoi);

    // Ajouter les contacts privés à la liste des dernières conversations
    lastConversations.push(...privateContacts);

    // Récupérer les groupes auxquels l'utilisateur appartient
    const Groupe = mongoose.model('Groupe');
    const groupes = await Groupe.find({ membres: this._id });

    // Récupérer les messages de groupe pour chaque groupe
    const MessageGroupe = mongoose.model('MessageGroupe');
    const groupMessagesPromises = groupes.map(async groupe => {
      if (groupe.messages.length > 0) {
        const dernierMessage = await MessageGroupe.findOne({ groupe: groupe._id }).sort({ dateEnvoi: -1 }).populate('expediteur');
        return {
          contact: {
            _id: groupe._id,
            type: 'groupe',
            nom: groupe.nom,
            photo: groupe.photo
          },
          dernierMessage: dernierMessage ? {
            contenu: dernierMessage.contenu,
            luPar: dernierMessage.luPar,
            dateEnvoi: dernierMessage.dateEnvoi
          } : null
        };
      }
    });

    // Attendre toutes les promesses de messages de groupe
    const groupMessages = await Promise.all(groupMessagesPromises);

    // Filtrer les groupMessages pour supprimer les valeurs null (groupes sans messages)
    const filteredGroupMessages = groupMessages.filter(Boolean);

    // Ajouter les groupMessages à la liste des dernières conversations
    lastConversations.push(...filteredGroupMessages);

    // Trier toutes les conversations par date de dernier message en ordre décroissant
    lastConversations.sort((a, b) => b.dernierMessage.dateEnvoi - a.dernierMessage.dateEnvoi);


    return lastConversations;
  } catch (error) {
    console.error('Erreur lors de la récupération des dernières conversations :', error);
    throw error;
  }
};
utilisateurSchema.methods.changePassword = async function(oldPassword, newPassword) {
  try {
    await this.UpdatePresence();
    // Vérifier si l'ancien mot de passe est correct
    if (!this.validatePassword(oldPassword)) {
      throw new Error('L\'ancien mot de passe est incorrect.');
    }

    // Générer un nouveau hash pour le nouveau mot de passe
    this.salt = crypto.randomBytes(16).toString('hex');
    this.password = crypto.pbkdf2Sync(newPassword, this.salt, 310000, 32, 'sha256').toString('hex');

    // Enregistrer le nouvel utilisateur avec le mot de passe mis à jour
    await this.save();

    return this;
  } catch (error) {
    console.error('Erreur lors du changement de mot de passe :', error);
    throw error;
  }
};

  utilisateurSchema.methods.changePhoto = async function(newPhotoUrl,mimetype) {
    try {
      await this.UpdatePresence();
      // Mettre à jour le champ photo avec la nouvelle URL de la photo
      this.photo = newPhotoUrl;
      this.mimetype=mimetype;

      // Enregistrer les modifications
      await this.save();
 
      return this;
    } catch (error) {
      console.error('Erreur lors du changement de photo de profil :', error);
      throw error;
    }
  };
// Nouvelle méthode pour quitter un groupe
utilisateurSchema.methods.quitGroup = async function(groupeId) {
  try {
    await this.UpdatePresence();
    const groupe = await mongoose.model('Groupe').findById(groupeId);
    if (!groupe) {
      throw new Error('Le groupe spécifié n\'existe pas.');
    }

    const memberIndex = groupe.membres.indexOf(this._id);
    if (memberIndex === -1) {
      throw new Error('Vous n\'êtes pas membre de ce groupe.');
    }

    groupe.membres.splice(memberIndex, 1);
    await groupe.save();

    const groupIndex = this.groupes.indexOf(groupeId);
    if (groupIndex > -1) {
      this.groupes.splice(groupIndex, 1);
      await this.save();
    }

   
    return this;

  } catch (error) {
    console.error('Erreur lors de la sortie du groupe :', error);
    throw error;
  }
};
utilisateurSchema.methods.createGroup = async function(nomGroupe, photoGroupe, membresIds) {
  try {
    await this.UpdatePresence();
    const Groupe = mongoose.model('Groupe');

    // Vérifier que le nombre minimum de membres est respecté
    if (!membresIds || membresIds.length < 2) {
      throw new Error('Un groupe doit avoir au moins trois membres, y compris le créateur.');
    }

    // Créer une nouvelle instance de Groupe
    const nouveauGroupe = new Groupe({
      nom: nomGroupe,
      photo: photoGroupe || null,
      membres: [this._id, ...membresIds],
      createur:this._id
    });

    // Sauvegarder le nouveau groupe
    await nouveauGroupe.save();

    // Ajouter l'ID du nouveau groupe au tableau groupes de l'utilisateur
/*     this.groupes.push(nouveauGroupe._id);
    await this.save(); */

    return 'Groupe créé avec succès.';
  } catch (error) {
    console.error('Erreur lors de la création du groupe :', error);
    throw error;
  }
};
utilisateurSchema.methods.UpdatePresence = async function() {
  try {
    // Vérifier si la présence est actuellement "inactif"
    if (this.presence === 'inactif') {
      // Mettre à jour la présence à "en ligne"
      this.presence = 'en ligne';

      // Mettre à jour l'horodatage de la dernière activité
      this.lastActivity = Date.now();

      // Enregistrer les modifications dans la base de données
      await this.save();
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la présence :', error);
  }
};
utilisateurSchema.methods.setInactif = async function() {
  try {
      this.presence = 'inactif';
      await this.save();
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la présence :', error);
  }
};
utilisateurSchema.methods.deleteMessage = async function(messageId, messageType) {
  try {
    await this.UpdatePresence();
    const MessagePrive = mongoose.model('MessagePrive'); // Assurez-vous de pointer vers le bon fichier de modèle
    const MessageGroupe = mongoose.model('MessageGroupe');

    let message;
    if (messageType === 'prive') {
      message = await MessagePrive.findById(messageId);
    } else if (messageType === 'groupe') {
      message = await MessageGroupe.findById(messageId);
    } else {
      throw new Error('Type de message invalide.');
    }

    if (!message) {
      throw new Error('Le message spécifié n\'existe pas.');
    }

    // Vérifier si l'utilisateur est l'expéditeur du message
    if (!message.expediteur.equals(this._id)) {
      throw new Error('Vous n\'êtes pas autorisé à supprimer ce message.');
    }

    // Supprimer les fichiers associés si nécessaire
    if (message.contenu && ['image', 'audio', 'video', 'fichier'].includes(message.contenu.type)) {
      const filePath = path.join(__dirname, '../../', message.contenu[message.contenu.type].split('3000/')[1]);
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error(`Erreur lors de la suppression du fichier ${filePath} :`, err);
        }
      });
    }

    // Supprimer le message de la base de données
    await message.remove();

    // Les références dans les collections appropriées seront mises à jour par les middlewares

    return 'Message supprimé avec succès.';
  } catch (error) {
    console.error('Erreur lors de la suppression du message :', error);
    throw error;
  }
};




module.exports = mongoose.model('Utilisateur', utilisateurSchema);
