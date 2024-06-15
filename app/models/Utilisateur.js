const mongoose = require('mongoose');
const crypto = require('crypto');

const blockRelationArraysUpdates = async (req, res, next) => {
  const update = req.body;
  const blockedKeys = ['groupes', 'stories', 'messagesPrivesEnvoyes', 'messagesPrivesRecus', 'messagesGroupesEnvoyes', 'messagesGroupesRecus'];

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

    return messages;
  } catch (error) {
    console.error('Erreur lors de la récupération de la discussion :', error);
    throw error;
  }
};


utilisateurSchema.methods.findDiscussionWithGroup = async function(groupeId) {
  try {
    const groupe = await mongoose.model('Groupe').findById(groupeId);
    if (!groupe) {
      throw new Error('Le groupe spécifié n\'existe pas.');
    }
    if (!groupe.membres.includes(this._id)) {
      throw new Error('Vous n\'êtes pas membre de ce groupe.');
    }

    const messages = await mongoose.model('MessageGroupe').find({ groupe: groupeId }).sort({ dateEnvoi: 1 }).populate('expediteur');

    // Marquer tous les messages non lus comme lus pour l'utilisateur actuel
    messages.forEach(async message => {
      const isUserMember = message.luPar.some(entry =>
        entry.utilisateur.equals(this._id) && entry.lu
      );
      if (!isUserMember) {
        message.luPar.push({ utilisateur: this._id, dateLecture: Date.now(), lu: true });
        await message.save();
      }
    });

    return messages;
  } catch (error) {
    console.error('Erreur lors de la récupération de la discussion de groupe :', error);
    throw error;
  }
};
utilisateurSchema.methods.addStory = async function(contenu) {
  try {
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
    const lastConversations = [];

    // Récupérer les messages privés envoyés et reçus par l'utilisateur
    const messagesEnvoyes = await mongoose.model('MessagePrive').find({ expediteur: this._id }).populate('destinataire').sort({ dateEnvoi: -1 });
    const messagesRecus = await mongoose.model('MessagePrive').find({ destinataire: this._id }).populate('expediteur').sort({ dateEnvoi: -1 });

    // Combiner et trier les messages privés par date d'envoi en ordre décroissant
    const privateMessages = [...messagesEnvoyes, ...messagesRecus].sort((a, b) => b.dateEnvoi - a.dateEnvoi);

    // Parcourir les messages privés pour identifier les contacts uniques et les derniers messages échangés
    const privateContactsMap = new Map();
    privateMessages.forEach(message => {
      const contactId = message.expediteur._id.equals(this._id) ? message.destinataire._id : message.expediteur._id;
      if (!privateContactsMap.has(contactId.toString())) {
        privateContactsMap.set(contactId.toString(), {
          contact: message.expediteur._id.equals(this._id) ? message.destinataire : message.expediteur,
          dernierMessage: message
        });
      }
    });

    // Convertir les contacts privés en tableau et trier par date de dernier message
    const privateContacts = Array.from(privateContactsMap.values()).sort((a, b) => b.dernierMessage.dateEnvoi - a.dernierMessage.dateEnvoi);

    // Ajouter les contacts privés à la liste des dernières conversations
    lastConversations.push(...privateContacts);

    // Récupérer les groupes auxquels l'utilisateur appartient
    const groupes = await mongoose.model('Groupe').find({ membres: this._id });

    // Récupérer les messages de groupe pour chaque groupe
    const groupMessagesPromises = groupes.map(async groupe => {
      if (groupe.messages.length > 0) {
        const dernierMessage = await mongoose.model('MessageGroupe').findOne({ groupe: groupe._id }).sort({ dateEnvoi: -1 }).populate('expediteur');
        return {
          contact: groupe,
          dernierMessage
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


module.exports = mongoose.model('Utilisateur', utilisateurSchema);
