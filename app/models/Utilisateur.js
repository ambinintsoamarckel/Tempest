const mongoose = require('mongoose');
const crypto = require('crypto');
const path=require('path');
const fs=require('fs');
// Middleware pour bloquer les modifications des tableaux relationnels
const blockRelationArraysUpdates = async function(next) {
  const update = this.getUpdate();
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
  archives: [{
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
utilisateurSchema.pre('deleteOne',  async function(next) {
  try {
    const Model = this.model;
    const utilisateur =  await Model.findOne(this.getFilter());
 
    if (utilisateur.photo) {
      const oldPhotoUrl = utilisateur.photo;
      const relativeFilePath = oldPhotoUrl.split('3000/')[1];
      const filePath = path.join(__dirname, '../../', relativeFilePath);

      fs.unlink(filePath, (err) => {
        if (err) {
          console.error(`Erreur lors de la suppression du fichier ${filePath} :`, err);
        }
      });
      next();
    }
  } catch (error) {
    console.error('Erreur lors de la suppression du l\'utilisateur :', error);
    next(error);
  }
});
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
      const error= new Error('Le destinataire spécifié n\'existe pas.');
      error.status = 404;
      throw error;
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
      const error= new Error('Le groupe spécifié n\'existe pas.');
      error.status = 404;
      throw error;
    }
    if (!groupe.membres.includes(this._id)) {
      const error= new Error('Vous n\'êtes pas membre de ce groupe.');
      error.status = 403;
      throw error;
    }
    const message = new mongoose.model('MessageGroupe')({
      ...contenu,
      expediteur: this._id,
      groupe: groupeId
    });
    await message.save();
    return message.populate('groupe');
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
      const error= new Error('L\'utilisateur spécifié n\'existe pas.');
      error.status = 404;
      throw error;
      
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
      const error= new Error('Le groupe spécifié n\'existe pas.');
      error.status = 404;
      throw error;
    }
    if (!groupe.membres.includes(this._id)) {
      const error= new Error('Vous n\'êtes pas membre de ce groupe.');
      error.status = 403;
      throw error;
    }

    const messages = await mongoose.model('MessageGroupe').find({ groupe: groupeId }).sort({ dateEnvoi: 1 }).populate('expediteur');

    // Marquer tous les messages non lus comme lus pour l'utilisateur actuel
    for (const message of messages) {
      const isUserMember = message.luPar.some(entry => entry.utilisateur.equals(this._id));
      const ExpId = message.expediteur._id;
      if (!isUserMember&&!ExpId.equals(this._id)) {
        message.luPar.push({ utilisateur: this._id, dateLecture: Date.now() });
        await message.save();
      }
    }

    const messagesSimplifies = messages.map(message => ({
      _id: message._id,
      contenu:message.contenu,
      expediteur: {
        _id: message.expediteur._id,
        nom: message.expediteur.nom,
        email: message.expediteur.email,
        photo: message.expediteur.photo
      },
      notification: message.notification,
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
    const Story= mongoose.model('Story');
    const story=await Story.findById(storyId);
    if (!story) {
      const error= new Error('la story n\'existe pas.');
      error.status = 404;
      throw error;
    }


    const index = this.stories.indexOf(storyId);
    if (index === -1) {
      const error= new Error('L\'utilisateur n\'a pas créé cette story.');
      error.status = 403;
      throw error;
    }

    await story.deleteOne();
    
    // Supprimer l'ID de la story du tableau stories
    this.stories.splice(index, 1);
    await this.save();



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
      const contactPresence= isEnvoye ? message.destinataire.presence :  message.expediteur.presence;
      const contactNom = isEnvoye ? message.destinataire.nom : message.expediteur.nom;
      const contactPhoto = isEnvoye ? message.destinataire.photo : message.expediteur.photo;
      const dernierMessage = {
        _id: message._id,
        contenu: message.contenu,
        expediteur:message.expediteur._id,
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
            presence: contactPresence,
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
            _id: dernierMessage._id,
            contenu: dernierMessage.contenu,
            expediteur:dernierMessage.expediteur._id,
            luPar: dernierMessage.luPar,
            dateEnvoi: dernierMessage.dateEnvoi,
            notification: dernierMessage.notification
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
      const error= new Error('L\'ancien mot de passe est incorrect.');
      error.status = 401;
      throw error;
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

utilisateurSchema.methods.changePhoto = async function(newPhotoUrl, mimetype) {
  try {
    await this.UpdatePresence();

    // Si l'utilisateur a déjà une photo, supprimer l'ancien fichier
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

    // Mettre à jour le champ photo avec la nouvelle URL de la photo
    this.photo = newPhotoUrl;
    this.mimetype = mimetype;

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
      const error= new Error('Le groupe spécifié n\'existe pas.');
      error.status = 404;
      throw error;
    }

    const memberIndex = groupe.membres.indexOf(this._id);
    if (memberIndex === -1) {
      const error= new Error('Vous n\'êtes pas membre de ce groupe.');
      error.status = 403;
      throw error;
    }
    
    if (groupe.createur.equals(this._id)) {
      const error= new Error('Vous ne pouvez pas quitté ce groupe vous êtes le créateur.');
      error.status = 403;
      throw error;
    }
    const message={
      contenu:{
        type:'texte',
        texte: this.nom+' a quitté le groupe'
      },
      notification:true
    };
    await this.sendMessageToGroup(groupe._id,message);
    await groupe.supprimerMembre(this._id);
    return this;

  } catch (error) {
    console.error('Erreur lors de la sortie du groupe :', error);
    throw error;
  }
};
utilisateurSchema.methods.createGroup = async function(groupe) {
  try {
    await this.UpdatePresence();
    const Groupe = mongoose.model('Groupe');

    // Vérifier que le nombre minimum de membres est respecté
    if (!groupe.membres || groupe.membres.length < 2) {
      const error= new Error('Un groupe doit avoir au moins trois membres, y compris le créateur.');
      error.status = 403;
      throw error;
    }

    // Créer une nouvelle instance de Groupe
    const nouveauGroupe = new Groupe({
      nom: groupe.nom,
      photo: groupe.photo || null,
      description: groupe.description || null,
      membres: [this._id, ...groupe.membres],
      createur:this._id
    });

    // Sauvegarder le nouveau groupe
    await nouveauGroupe.save();
    const message={
      contenu:{
        type:'texte',
        texte:'créé le groupe'
      },
      notification:true
    };
    await this.sendMessageToGroup(nouveauGroupe._id,message);
    return nouveauGroupe;
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
    }

      // Mettre à jour l'horodatage de la dernière activité
      this.lastActivity = Date.now();

      // Enregistrer les modifications dans la base de données
      await this.save();
    
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

utilisateurSchema.methods.deleteMessage = async function(messageId) {
  try {
   
    await this.UpdatePresence();
    const MessageAbstrait = mongoose.model('MessageAbstrait');
    const message = await MessageAbstrait.findById(messageId);

    if (!message) {
      const error= new Error('Le message spécifié n\'existe pas.');
      error.status = 404;
      throw error;
    }

    const discriminatorKey = message.type;
    

    let isAuthorized = false;
    let groupe;

    if (discriminatorKey === 'MessagePrive') {
      await message.populate('expediteur destinataire');
      if (message.expediteur.equals(this._id) || message.destinataire.equals(this._id)) {
        isAuthorized = true;
      }
    } else if (discriminatorKey === 'MessageGroupe') {
      await message.populate('expediteur groupe');
      groupe = await mongoose.model('Groupe').findById(message.groupe);
      if (message.expediteur.equals(this._id) || groupe.createur.equals(this._id)) {
        isAuthorized = true;
      }
    } else {
      const error= new Error('Type de message invalide.');
      error.status = 400;
      throw error;
    }

    if (!isAuthorized) {
      const error= new Error('Vous n\'êtes pas autorisé à supprimer ce message.');
      error.status = 403;
      throw error;
    }


    // Supprimer le message de la base de données
    await message.deleteOne();

    // Les références dans les collections appropriées seront mises à jour par les middlewares
    return 'Message supprimé avec succès.';
  } catch (error) {
    console.error('Erreur lors de la suppression du message :', error);
    throw error;
  }
};

// Méthode d'instance pour ajouter un utilisateur à un groupe
utilisateurSchema.methods.ajouterAuGroupe = async function(groupeId, utilisateurId) {
  try {
    await this.UpdatePresence();
    const Groupe = mongoose.model('Groupe');
    const User= mongoose.model('Utilisateur');
    const groupe = await Groupe.findById(groupeId);
    const user= await User.findById(utilisateurId);

    if (!groupe) {
      const error= new Error('Groupe non trouvé');
      error.status = 404;
      throw error;
    }

    // Vérifier si l'utilisateur est membre du groupe
    if (!groupe.membres.includes(this._id)) {
      const error= new Error('Vous devez être membre du groupe pour ajouter un utilisateur.');
      error.status = 403;
      throw error;
    }
    
    await groupe.ajouterMembre(utilisateurId);
    const message={
      contenu:{
        type:'texte',
        texte:'ajouté '+user.nom+' au groupe'
      },
      notification:true
    };
    await this.sendMessageToGroup(groupe._id,message);
    return groupe;
  } catch (error) {
    console.error('Erreur lors de l\'ajout de l\'utilisateur au groupe :', error);
    throw error;
  }
};

// Méthode d'instance pour supprimer un utilisateur d'un groupe
utilisateurSchema.methods.supprimerDuGroupe = async function(groupeId, utilisateurId) {
  try {
    await this.UpdatePresence();
    const Groupe = mongoose.model('Groupe');
    const User= mongoose.model('Utilisateur');
    const groupe = await Groupe.findById(groupeId);
    const user= await User.findById(utilisateurId);


    if (!groupe) {
      const error= new Error('Groupe non trouvé');
      error.status = 404;
      throw error;
    }

    // Vérifier si l'utilisateur est le créateur du groupe
    if (!groupe.createur.equals(this._id)) {
      const error= new Error('Vous devez être le créateur du groupe pour supprimer un utilisateur.');
      error.status = 403;
      throw error;
    }
    await groupe.supprimerMembre(utilisateurId);
    const message={
      contenu:{
        type:'texte',
        texte:'supprimé '+user.nom+' du groupe'
      },
      notification:true
    };
    await this.sendMessageToGroup(groupe._id,message);
    return groupe;
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'utilisateur du groupe :', error);
    throw error;
  }
};

// Méthode d'instance pour changer la photo du groupe
utilisateurSchema.methods.changePhotoGroup = async function(groupeId, newPhotoUrl) {
  try {
    await this.UpdatePresence();
    const Groupe = mongoose.model('Groupe');
    const groupe = await Groupe.findById(groupeId);

    if (!groupe) {
      const error= new Error('Groupe non trouvé');
      error.status = 404;
      throw error;
    }

    // Vérifier si l'utilisateur est membre du groupe
    if (!groupe.membres.includes(this._id)) {
      const error= new Error('Vous devez être membre du groupe pour changer la photo.');
      error.status = 403;
      throw error;
    }

    // Appeler la méthode du groupe pour changer la photo
    await groupe.changePhoto(newPhotoUrl);
    const message={
      contenu:{
        type:'texte',
        texte:'changé la photo de groupe'
      },
      notification:true
    };
    await this.sendMessageToGroup(groupe._id,message);;

    return groupe;
  } catch (error) {
    console.error('Erreur lors du changement de la photo du groupe :', error);
    throw error;
  }
};
utilisateurSchema.methods.voirStory =async function(storyId) {
  try {
    await this.UpdatePresence();
    const Story = mongoose.model('Story');
    const story = await Story.findOne({ _id: storyId, active: true }).populate('utilisateur');
    if (!story) {
      const error= new Error('story non trouvé');
      error.status = 404;
      throw error;
    }
    
    const dejavu = story.vues.some(entry => entry.equals(this._id));
    if (!dejavu&&!story.utilisateur._id.equals(this._id)) {
            story.vues.push(this._id );
            await story.save();
          }

    return story;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// Méthode d'instance pour supprimer un groupe
utilisateurSchema.methods.supprimerGroupe = async function(groupeId) {
  try {
    await this.UpdatePresence();
    const Groupe = mongoose.model('Groupe');
    const groupe = await Groupe.findById(groupeId);

    if (!groupe) {
      const error= new Error('Groupe non trouvé');
      error.status = 404;
      throw error;
    }

    // Vérifier si l'utilisateur est le créateur du groupe
    if (!groupe.createur.equals(this._id)) {
      const error= new Error('Vous devez être le créateur du groupe pour le supprimer.');
      error.status = 403;
      throw error;
    }

    // Supprimer le groupe
    await groupe.deleteOne();

    return 'Groupe supprimé avec succès.';
  } catch (error) {
    console.error('Erreur lors de la suppression du groupe :', error);
    throw error;
  }
};
utilisateurSchema.methods.transferToPerson = async function( destinataireId,originalMessageId) {
  try {
    await this.UpdatePresence(); // Assure que la présence de l'utilisateur est mise à jour
  

    // Trouve le message original par son ID
    const originalMessage = await mongoose.model('MessageAbstrait').findById(originalMessageId);
    if (!originalMessage) {
      const error= new Error('Le message original spécifié n\'existe pas.');
      error.status = 404;
      throw error;
    }

    const discriminatorKey = originalMessage.type;

    let isAuthorized = false;

    if (discriminatorKey === 'MessagePrive') {
      await originalMessage.populate('expediteur destinataire');
      if (originalMessage.expediteur.equals(this._id) || originalMessage.destinataire.equals(this._id)) {
        isAuthorized = true;
      }
    } else if (discriminatorKey === 'MessageGroupe') {
      await originalMessage.populate('expediteur groupe');
      const groupe = await mongoose.model('Groupe').findById(originalMessage.groupe);
      if (originalMessage.expediteur.equals(this._id) || groupe.createur.equals(this._id)) {
        isAuthorized = true;
      }
    } else {
      const error= new Error('Type de message invalide.');
      error.status = 400;
      throw error;
    }

    if (!isAuthorized) {
      const error= new Error('Vous n\'êtes pas autorisé à transférer ce message.');
      error.status = 403;
      throw error;
    }

    // Prépare le contenu du message à transférer
    const contenu ={contenu:originalMessage.contenu};

    // Envoie le message à la personne spécifiée et récupère le message transféré
    const transferredMessage = await this.sendMessageToPerson(destinataireId, contenu);
    return transferredMessage;
  } catch (error) {
    console.error('Erreur lors du transfert du message à la personne :', error);
    throw error;
  }
};
utilisateurSchema.methods.transferToGroup = async function( groupeId,originalMessageId) {
  try {
    await this.UpdatePresence(); // Assure que la présence de l'utilisateur est mise à jour

    // Trouve le groupe par son ID
    const Groupe = mongoose.model('Groupe');
    const groupe = await Groupe.findById(groupeId);
    const originalMessage = await mongoose.model('MessageAbstrait').findById(originalMessageId);
    if (!originalMessage) {
      const error= new Error('Le message original spécifié n\'existe pas.');
      error.status = 404;
      throw error;
    }

    const discriminatorKey = originalMessage.type;

    let isAuthorized = false;

    if (discriminatorKey === 'MessagePrive') {
      await originalMessage.populate('expediteur destinataire');
      if (originalMessage.expediteur.equals(this._id) || originalMessage.destinataire.equals(this._id)) {
        isAuthorized = true;
      }
    } else if (discriminatorKey === 'MessageGroupe') {
      await originalMessage.populate('expediteur groupe');
      const groupe = await mongoose.model('Groupe').findById(originalMessage.groupe);
      if (originalMessage.expediteur.equals(this._id) || groupe.createur.equals(this._id)) {
        isAuthorized = true;
      }
    } else {
      const error= new Error('Type de message invalide.');
      error.status = 400;
      throw error;
    }

    if (!isAuthorized) {
      const error= new Error('Vous n\'êtes pas autorisé à transférer ce message.');
      error.status = 403;
      throw error;
    }
    if (!groupe) {
      const error= new Error('Groupe non trouvé');
      error.status = 404;
      throw error;
    }

    // Vérifie si l'utilisateur est membre du groupe
    if (!groupe.membres.includes(this._id)) {
      const error= new Error('Vous devez être membre du groupe pour transférer le message.');
      error.status = 403;
      throw error;
    }



    // Prépare le contenu du message à transférer
    const contenu =  {contenu:originalMessage.contenu};

    // Envoie le message au groupe spécifié et récupère le message transféré
    const transferredMessage = await this.sendMessageToGroup(groupeId, contenu);
    return transferredMessage;
  } catch (error) {
    console.error('Erreur lors du transfert du message au groupe :', error);
    throw error;
  }
};

utilisateurSchema.methods.updateGroup = async function(groupeId, updateData) {
  try {
    await this.UpdatePresence();
    const Groupe = mongoose.model('Groupe');
    const groupe = await Groupe.findById(groupeId);

    if (!groupe) {
      const error= new Error('Groupe non trouvé');
      error.status = 404;
      throw error;
    }

    // Vérifier si l'utilisateur est membre du groupe
    if (!groupe.membres.includes(this._id)) {
      const error= new Error('Vous devez être membre du groupe pour changer la photo.');
      error.status = 403;
      throw error;
    }
    console.log(updateData);
    { 
      if(updateData.nom)
        {
          groupe.nom=updateData.nom;

        }
      if(updateData.description)
        {
          groupe.description=updateData.description;
        }
      await groupe.save();

    }


    return groupe;
  } catch (error) {
    console.error('Erreur lors de la mise à jour du groupe :', error);
    throw error;
  }
};

module.exports = mongoose.model('Utilisateur', utilisateurSchema);
