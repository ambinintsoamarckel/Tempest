const mongoose = require('mongoose');
const crypto = require('crypto');
const path=require('path');
const fs=require('fs');
const bucket = require('../../config/firebaseConfig');


/* socket */
const { getIo } = require('../../config/socketConfig');

//const 0 = getIo();


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
utilisateurSchema.pre('deleteOne', async function(next) {
  console.log('🔥 PRE-DELETE Utilisateur START');

  try {
    const Model = this.model;
    const Groupe = mongoose.model('Groupe');
    const utilisateur = await Model.findOne(this.getFilter());

    // ⚠️ VÉRIFICATION CRITIQUE
    if (!utilisateur) {
      console.warn('⚠️  Utilisateur non trouvé dans pre-delete');
      return next();
    }

    console.log('Utilisateur à supprimer:', {
      id: utilisateur._id,
      nom: utilisateur.nom,
      photo: utilisateur.photo
    });

    // Retirer l'utilisateur de tous les groupes
    await Groupe.updateMany(
      { membres: utilisateur._id },
      { $pull: { membres: utilisateur._id } }
    );
    console.log('✓ Retiré de tous les groupes');

    // ⚠️ SUPPRESSION FIREBASE (pas local!)
    if (utilisateur.photo) {
      const photoUrl = utilisateur.photo;
      console.log('📸 Photo de profil détectée:', photoUrl);

      // ⚠️ VÉRIFICATION: C'est bien une URL Firebase ?
      if (!photoUrl.startsWith('http')) {
        console.warn('⚠️  Photo URL invalide, skip suppression');
        return next();
      }

      try {
        // ✅ Extraire le chemin Firebase depuis l'URL
        const bucketName = bucket.name;
        const urlPattern = `https://storage.googleapis.com/${bucketName}/`;

        if (photoUrl.startsWith(urlPattern)) {
          const filePath = photoUrl.replace(urlPattern, '');
          const decodedPath = decodeURIComponent(filePath);

          console.log('   Chemin Firebase:', decodedPath);
          console.log('   → Suppression de la photo Firebase...');

          await bucket.file(decodedPath).delete();
          console.log('   ✓ Photo Firebase supprimée');
        } else {
          console.warn('⚠️  URL ne correspond pas au bucket:', photoUrl);
        }
      } catch (photoError) {
        console.error('❌ Erreur suppression photo Firebase:', photoError.message);
        console.error('   Code:', photoError.code);

        // ⚠️ Ne pas bloquer la suppression de l'utilisateur
        if (photoError.code === 404) {
          console.log('   ℹ️  Photo déjà supprimée ou inexistante');
        }
      }
    }

    console.log('🔥 PRE-DELETE Utilisateur END');
    next();
  } catch (error) {
    console.error('❌ Erreur pre-delete Utilisateur:', error);
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
    await message.populate('expediteur destinataire');
    destinataire.messagesPrivesRecus.push(message._id);
    await destinataire.save();
    this.messagesPrivesEnvoyes.push(message._id);
    await this.save();

    const io = getIo();
    io.emit('message_envoye_personne', message);

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
    await message.populate('expediteur groupe');
    await groupe.populate('createur membres');
    const membres=[];
      groupe.membres.forEach(utilisateur => {
        const user={
          _id:utilisateur._id,
          nom:utilisateur.nom,
          email:utilisateur.email,
          photo:utilisateur.photo,
          stories:utilisateur.stories,

          groupes:utilisateur.groupes
        };
        membres.push(user);
      })
      const group={
        _id:groupe._id,
        nom:groupe.nom,
        description:groupe.description,
        photo:groupe.photo,
        createur:{_id:groupe.createur._id,
                  nom:groupe.createur.nom,
                  email:groupe.createur.email,
                  photo:groupe.createur.photo,
                  stories:groupe.createur.stories
        },
        membres:membres
      }


    const messagesSimplifies ={
      _id: message._id,
      contenu:message.contenu,
      groupe:group,
      expediteur: {
        _id: message.expediteur._id,
        nom: message.expediteur.nom,
        email: message.expediteur.email,
        photo: message.expediteur.photo
      },
      notification: message.notification,
      dateEnvoi: message.dateEnvoi,
      luPar: message.luPar
    };

    const io = getIo();
    io.emit('message_envoye_groupe', messagesSimplifies);

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

        const io = getIo();
        io.emit('message_lu_personne', {expediteur:message.expediteur._id,destinataire:message.destinataire._id});

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

    const messages = await mongoose.model('MessageGroupe').find({ groupe: groupeId }).sort({ dateEnvoi: 1 }).populate('expediteur groupe');

    // Marquer tous les messages non lus comme lus pour l'utilisateur actuel
    for (const message of messages) {
      const isUserMember = message.luPar.some(entry => entry.utilisateur.equals(this._id));
      const ExpId = message.expediteur? message.expediteur._id : 'utilisateur';
      if (!isUserMember&&!ExpId.equals(this._id)) {
        message.luPar.push({ utilisateur: this._id, dateLecture: Date.now() });
        await message.save();

        const io = getIo();
       io.emit('message_lu_groupe', {groupe:message.groupe._id,membres:message.groupe.membres,vu:this._id});
      }
    }
    await groupe.populate('createur membres');
    const membres=[];
      groupe.membres.forEach(utilisateur => {
        const user={
          _id:utilisateur._id  ,
          nom:utilisateur.nom,
          email:utilisateur.email,
          photo:utilisateur.photo,
          stories:utilisateur.stories,

          groupes:utilisateur.groupes
        };
        membres.push(user);
      })
      const group={
        _id:groupe._id,
        nom:groupe.nom,
        description:groupe.description,
        photo:groupe.photo,
        createur:{
          _id:groupe.createur ? groupe.createur._id : 'utilisateur',
          nom:groupe.createur ? groupe.createur.nom : 'utilisateur',
          email:groupe.createur ? groupe.createur.email : 'utilisateur',
          photo:groupe.createur ? groupe.createur.photo :'utilisateur',
        },
        membres:membres
      }


    const messagesSimplifies = messages.map(message => ({
      _id: message._id,
      contenu:message.contenu,
      groupe:group,
      expediteur: {
        _id: message.expediteur ? message.expediteur._id : 'utilisateur',
        nom: message.expediteur ? message.expediteur.nom : 'utilisateur',
        email: message.expediteur ? message.expediteur.email :'utilisateur' ,
        photo: message.expediteur ? message.expediteur.photo : ''
      },
      notification: message.notification,
      dateEnvoi: message.dateEnvoi,
      luPar: message.luPar
    }));

    return messagesSimplifies;
  } catch (error) {
    console.error('Erreur lors de la récupération de la discussion de groupe :', error);
    throw error;
  }
};

/**
 * ✅ Méthode améliorée pour ajouter une story
 * Supporte maintenant les stories texte stylisées et les légendes d'images
 */
utilisateurSchema.methods.addStory = async function(contenu) {
  try {
    await this.UpdatePresence();

    // Validation des données selon le type
    if (!contenu || !contenu.type) {
      throw new Error('Le type de contenu est requis');
    }

    // Validation pour story texte
    if (contenu.type === 'texte') {
      if (!contenu.texte || contenu.texte.trim().length === 0) {
        throw new Error('Le texte est requis pour une story de type texte');
      }

      // Logs pour le debug
      console.log('📝 Création story texte avec styles:', {
        texte: contenu.texte,
        backgroundColor: contenu.backgroundColor,
        textColor: contenu.textColor,
        textAlign: contenu.textAlign,
        fontSize: contenu.fontSize,
        fontWeight: contenu.fontWeight
      });
    }

    // Validation pour story image/vidéo
    if (contenu.type === 'image' && !contenu.image) {
      throw new Error('L\'URL de l\'image est requise pour une story de type image');
    }

    if (contenu.type === 'video' && !contenu.video) {
      throw new Error('L\'URL de la vidéo est requise pour une story de type vidéo');
    }

    // Log pour légende si présente
    if (contenu.caption) {
      console.log('💬 Story avec légende:', contenu.caption);
    }

    // Créer une nouvelle instance de Story
    const nouvelleStory = new mongoose.model('Story')({
      utilisateur: this._id,
      contenu: {
        type: contenu.type,
        texte: contenu.texte || null,
        image: contenu.image || null,
        video: contenu.video || null,
        // ✅ Champs de style pour texte
        backgroundColor: contenu.backgroundColor || null,
        textColor: contenu.textColor || null,
        textAlign: contenu.textAlign || 'center',
        fontSize: contenu.fontSize || null,
        fontWeight: contenu.fontWeight || null,
        // ✅ Légende pour image/vidéo
        caption: contenu.caption || null
      }
    });

    // Sauvegarder la nouvelle story
    await nouvelleStory.save();

    // Ajouter l'ID de la nouvelle story au tableau stories de l'utilisateur
    this.stories.push(nouvelleStory._id);
    await this.save();

    console.log('✅ Story créée avec succès:', nouvelleStory._id);

    return {
      message: 'Story ajoutée avec succès.',
      storyId: nouvelleStory._id,
      story: nouvelleStory
    };
  } catch (error) {
    console.error(`❌ Erreur lors de l'ajout de la story pour l'utilisateur ${this._id}:`, error);
    throw error;
  }
};

utilisateurSchema.methods.deleteStory = async function(storyId) {
  try {
    await this.UpdatePresence();

    // Vérifier si l'utilisateur a créé la story
    const Story = mongoose.model('Story');
    const story = await Story.findById(storyId);

    if (!story) {
      const error = new Error('La story n\'existe pas.');
      error.status = 404;
      throw error;
    }

    const index = this.stories.indexOf(storyId);
    if (index === -1) {
      const error = new Error('L\'utilisateur n\'a pas créé cette story.');
      error.status = 403;
      throw error;
    }

    await story.deleteOne();

    // Supprimer l'ID de la story du tableau stories
    this.stories.splice(index, 1);
    await this.save();

    console.log('✅ Story supprimée avec succès:', storyId);

    return 'Story supprimée avec succès.';
  } catch (error) {
    console.error(`❌ Erreur lors de la suppression de la story pour l'utilisateur ${this._id}:`, error);
    throw error;
  }
};

utilisateurSchema.methods.findLastConversations = async function() {
  try {
    await this.UpdatePresence();
    const lastConversations = [];

    // Récupérer les messages privés envoyés et reçus par l'utilisateur en une seule requête
    const MessagePrive = mongoose.model('MessagePrive');
    const privateMessages = await MessagePrive.find({
      $or: [
        { expediteur: this._id },
        { destinataire: this._id }
      ]
    }).populate('expediteur destinataire').sort({ dateEnvoi: -1 });

    // Utiliser Map pour stocker les contacts uniques et leurs derniers messages
    const privateContactsMap = new Map();
    privateMessages.forEach(message => {
      if (message.expediteur !=null && message.expediteur._id != null)
        {
          const isEnvoye = message.expediteur._id.equals(this._id);
          const contactId = isEnvoye ? message.destinataire._id : message.expediteur._id;
          const contact = isEnvoye ? message.destinataire : message.expediteur;
          const dernierMessage = {
            _id: message._id,
            contenu: message.contenu,
            expediteur: message.expediteur._id,
            lu: message.lu,
            dateEnvoi: message.dateEnvoi,
            dateLecture: message.dateLecture
          };

          if (!privateContactsMap.has(contactId.toString())) {
            privateContactsMap.set(contactId.toString(), {
              contact: {
                _id: contact._id,
                type: 'utilisateur',
                nom: contact.nom,
                presence: contact.presence,
                photo: contact.photo,
                stories: contact.stories
              },
              dernierMessage
            });
          }
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
      const dernierMessage = await MessageGroupe.findOne({ groupe: groupe._id }).sort({ dateEnvoi: -1 }).populate('expediteur');
      if (dernierMessage) {
        return {
          contact: {
            _id: groupe._id,
            type: 'groupe',
            nom: groupe.nom,
            photo: groupe.photo
          },
          dernierMessage: {
            _id: dernierMessage._id,
            contenu: dernierMessage.contenu,
            expediteur: dernierMessage.expediteur ? dernierMessage.expediteur._id: 'utilisateur',
            luPar: dernierMessage.luPar,
            dateEnvoi: dernierMessage.dateEnvoi,
            notification: dernierMessage.notification
          }
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
  console.log('📸 changePhoto START');
  console.log('   User:', this._id);
  console.log('   Ancienne photo:', this.photo);
  console.log('   Nouvelle photo:', newPhotoUrl);

  try {
    await this.UpdatePresence();

    // ⚠️ Si l'utilisateur a déjà une photo, supprimer l'ancien fichier de FIREBASE
    if (this.photo) {
      const oldPhotoUrl = this.photo;
      console.log('   → Suppression de l\'ancienne photo...');

      // ⚠️ VÉRIFICATION: C'est bien une URL Firebase ?
      if (!oldPhotoUrl.startsWith('http')) {
        console.warn('   ⚠️  Ancienne photo URL invalide, skip suppression');
      } else {
        try {
          // ✅ Extraire le chemin Firebase depuis l'URL
          const bucketName = bucket.name;
          const urlPattern = `https://storage.googleapis.com/${bucketName}/`;

          if (oldPhotoUrl.startsWith(urlPattern)) {
            const filePath = oldPhotoUrl.replace(urlPattern, '');
            const decodedPath = decodeURIComponent(filePath);

            console.log('   Chemin Firebase:', decodedPath);

            await bucket.file(decodedPath).delete();
            console.log('   ✓ Ancienne photo Firebase supprimée');
          } else {
            console.warn('   ⚠️  URL ne correspond pas au bucket:', oldPhotoUrl);
          }
        } catch (deleteError) {
          console.error('   ❌ Erreur suppression ancienne photo:', deleteError.message);
          console.error('   Code:', deleteError.code);

          // ⚠️ Ne pas bloquer le changement de photo si l'ancienne n'existe plus
          if (deleteError.code === 404) {
            console.log('   ℹ️  Ancienne photo déjà supprimée ou inexistante');
          }
        }
      }
    }

    console.log('   → Mise à jour avec nouvelle photo');
    // Mettre à jour le champ photo avec la nouvelle URL
    this.photo = newPhotoUrl;
    this.mimetype = mimetype;

    // Enregistrer les modifications
    await this.save();
    console.log('   ✓ Photo mise à jour avec succès');
    console.log('📸 changePhoto END');

    return this;
  } catch (error) {
    console.error('❌ Erreur changePhoto:', error);
    throw error;
  }
};// Nouvelle méthode pour quitter un groupe
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
        texte:' a quitté le groupe'
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
    let bool=false;
    if (this.presence === 'inactif') {
      // Mettre à jour la présence à "en ligne"
      this.presence = 'en ligne';
      bool=true;


    }

      // Mettre à jour l'horodatage de la dernière activité
      this.lastActivity = Date.now();

      // Enregistrer les modifications dans la base de données
      await this.save();
      if(bool)
        {
          const io = getIo();
          io.emit('utilisateur_modifie');
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

utilisateurSchema.methods.deleteMessage = async function(messageId) {
  console.log('    >>> deleteMessage METHOD START');
  console.log('        User:', this._id);
  console.log('        Message ID:', messageId);

  try {
    await this.UpdatePresence();
    console.log('        ✓ Présence mise à jour');

    const MessageAbstrait = mongoose.model('MessageAbstrait');
    const message = await MessageAbstrait.findById(messageId);

    if (!message) {
      console.error('        ❌ Message non trouvé:', messageId);
      const error = new Error('Le message spécifié n\'existe pas.');
      error.status = 404;
      throw error;
    }

    console.log('        ✓ Message trouvé');
    console.log('        Type:', message.type);
    const discriminatorKey = message.type;

    let isAuthorized = false;
    let groupe;

    if (discriminatorKey === 'MessagePrive') {
      console.log('        → Message privé détecté');
      await message.populate('expediteur destinataire');
      console.log('        Expéditeur:', message.expediteur?._id);
      console.log('        Destinataire:', message.destinataire?._id);

      if (message.expediteur.equals(this._id) || message.destinataire.equals(this._id)) {
        isAuthorized = true;
        console.log('        ✓ Autorisation accordée (expéditeur ou destinataire)');
      }

    } else if (discriminatorKey === 'MessageGroupe') {
      console.log('        → Message de groupe détecté');
      await message.populate('expediteur groupe');
      groupe = await mongoose.model('Groupe').findById(message.groupe);

      console.log('        Expéditeur:', message.expediteur?._id);
      console.log('        Groupe:', groupe?._id);
      console.log('        Créateur du groupe:', groupe?.createur);

      if (message.expediteur.equals(this._id) || groupe.createur.equals(this._id)) {
        isAuthorized = true;
        console.log('        ✓ Autorisation accordée (expéditeur ou créateur)');
      }

    } else {
      console.error('        ❌ Type de message invalide:', discriminatorKey);
      const error = new Error('Type de message invalide.');
      error.status = 400;
      throw error;
    }

    if (!isAuthorized) {
      console.error('        ❌ Non autorisé à supprimer ce message');
      const error = new Error('Vous n\'êtes pas autorisé à supprimer ce message.');
      error.status = 403;
      throw error;
    }

    console.log('        → Suppression du message de la base de données...');
    await message.deleteOne();
    console.log('        ✓ Message supprimé de la base de données');
    console.log('    >>> deleteMessage METHOD END (SUCCESS)');

    return 'Message supprimé avec succès.';
  } catch (error) {
    console.error('    ❌ Erreur dans la méthode de suppression de message');
    console.error('        Message:', error.message);
    console.error('        Stack:', error.stack);
    console.error('    >>> deleteMessage METHOD END (ERROR)');
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
    await groupe.populate('createur membres');
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
    await groupe.populate('createur membres');
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

    await groupe.populate('createur membres');

    return groupe;
  } catch (error) {
    console.error('Erreur lors du changement de la photo du groupe :', error);
    throw error;
  }
};
utilisateurSchema.methods.voirStory = async function(storyId) {
  try {
    await this.UpdatePresence();

    const Story = mongoose.model('Story');
    const story = await Story.findOne({ _id: storyId, active: true }).populate('utilisateur');

    if (!story) {
      const error = new Error('Story non trouvée');
      error.status = 404;
      throw error;
    }

    const dejavu = story.vues.some(entry => entry.equals(this._id));

    if (!dejavu && !story.utilisateur._id.equals(this._id)) {
      story.vues.push(this._id);
      await story.save();

      const io = getIo();
      io.emit('story_vue', story.utilisateur._id);

      console.log('👁️ Nouvelle vue sur story:', {
        storyId: story._id,
        viewer: this._id
      });
    }

    await story.populate('vues');
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
      error.status = 401;
      throw error;
    }

      if(updateData.nom)
        {
          groupe.nom=updateData.nom;

        }
      if(updateData.description)
        {
          groupe.description=updateData.description;
        }
      await groupe.save();


    await groupe.populate('createur membres');


    return groupe;
  } catch (error) {
    console.error('Erreur lors de la mise à jour du groupe :', error);
    throw error;
  }
};

module.exports = mongoose.model('Utilisateur', utilisateurSchema);
