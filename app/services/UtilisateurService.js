const Utilisateur = require('../models/Utilisateur');
const MessageService = require('./MessageService');
const mongoose=require('mongoose');

class UtilisateurService {
  // Créer un nouvel utilisateur
  async createUtilisateur(data) {
    try {
      const utilisateur = new Utilisateur(data);
      utilisateur.setPassword();
      await utilisateur.save();
      return utilisateur;
    } catch (error) {
      console.error('Erreur lors de la création de l\'utilisateur :', error);
      throw error;
    }
  }
  async findUtilisateurById(utilisateurId) {
    try {

      const utilisateur = await Utilisateur.findById(utilisateurId).populate('groupes stories');
      const groups=[];
      utilisateur.groupes.forEach(groupe => {
        const group={
          _id:groupe._id,
          nom:groupe.nom,
          description:groupe.description,
          photo:groupe.photo,
          createur:groupe.createur
        }
        groups.push(group);
      })

      const user={
        _id:utilisateur._id,
        nom:utilisateur.nom,
        email:utilisateur.email,
        presence:utilisateur.presence,
        photo:utilisateur.photo,
        stories:utilisateur.stories,
        groupes:groups
      };
      return user;
    } catch (error) {
      console.error('Erreur lors de la création de l\'utilisateur :', error);
      throw error;
    }
  }
  async findMe(utilisateurId) {
    try {

      const utilisateur = await Utilisateur.findById(utilisateurId).populate('groupes stories archives');
      const groups=[];
      utilisateur.groupes.forEach(groupe => {
        const group={
          _id:groupe._id,
          nom:groupe.nom,
          description:groupe.description,
          photo:groupe.photo,
          createur:groupe.createur
        }
        groups.push(group);
      })

      const user={
        _id:utilisateur._id,
        nom:utilisateur.nom,
        email:utilisateur.email,
        photo:utilisateur.photo,
        presence:utilisateur.presence,
        stories:utilisateur.stories,
        archives:utilisateur.archives,
        groupes:groups
      };
      return user;
    } catch (error) {
      console.error('Erreur lors de la création de l\'utilisateur :', error);
      throw error;
    }
  }
  async  getUtilisateursNonMembresDuGroupe(sessionUserId, groupeId) {
    try {
      const Utilisateur = mongoose.model('Utilisateur');

      // Récupérer tous les utilisateurs qui ne sont pas dans le groupe spécifié
      const utilisateursNonMembres = await Utilisateur.find({
        _id: { $ne: sessionUserId },
        groupes: { $nin: [groupeId] }
      }).populate('stories');

      // Structurer les utilisateurs en tant que contacts
      const contacts = utilisateursNonMembres.map(utilisateur => ({
        _id: utilisateur._id.toString(),
        type: 'utilisateur',
        nom: utilisateur.nom,
        presence: utilisateur.presence,
        photo: utilisateur.photo,
        story: utilisateur.stories.length // Longueur des stories
      }));

      return contacts;
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs non membres du groupe :', error);
      throw error;
    }
  }


  async  getAllUtilisateur(sessionUserId) {
    try {
      const Utilisateur = mongoose.model('Utilisateur');
      const Groupe = mongoose.model('Groupe');

      const contacts = [];

      // Récupérer tous les utilisateurs sauf l'utilisateur en session
      const utilisateurs = await Utilisateur.find({ _id: { $ne: sessionUserId } }).populate('stories');

      utilisateurs.forEach(utilisateur => {
        // Structurer les utilisateurs en tant que contacts
        const userContact = {
          _id: utilisateur._id.toString(),
          type: 'utilisateur',
          nom: utilisateur.nom,
          presence: utilisateur.presence,
          photo: utilisateur.photo,
          story: utilisateur.stories.length // Longueur des stories
        };
        contacts.push(userContact);
      });

      // Récupérer les groupes auxquels l'utilisateur en session appartient
      const groupes = await Groupe.find({ membres: sessionUserId });

      groupes.forEach(groupe => {
        // Structurer les groupes en tant que contacts (sans présence)
        const groupContact = {
          _id: groupe._id.toString(),
          type: 'groupe',
          nom: groupe.nom,
          presence: '', // Pas de présence pour les groupes
          photo: groupe.photo
        };
        contacts.push(groupContact);
      });

      return contacts;
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs et des groupes :', error);
      throw error;
    }
  }
  async  getAllUser() {
    try {
      const Utilisateur = mongoose.model('Utilisateur');
      const contacts = [];
      // Récupérer tous les utilisateurs sauf l'utilisateur en session
      const utilisateurs = await Utilisateur.find().populate('stories');

      utilisateurs.forEach(utilisateur => {
        // Structurer les utilisateurs en tant que contacts
        const userContact = {
          _id: utilisateur._id.toString(),
          type: 'utilisateur',
          nom: utilisateur.nom,
          presence: utilisateur.presence,
          photo: utilisateur.photo,
          story: utilisateur.stories.length // Longueur des stories
        };
        contacts.push(userContact);
      });

      return contacts;
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs et des groupes :', error);
      throw error;
    }
  }



  // Mettre à jour un utilisateur
  async updateUtilisateur(utilisateurId, data) {
    try {

      const utilisateur = await Utilisateur.findByIdAndUpdate(utilisateurId, data, { new: true });
      if (!utilisateur) {
        const error= new Error('Utilisateur non trouvé');
        error.status = 404;
        throw error;
      }
      const user={
        _id:utilisateur._id,
        nom:utilisateur.nom,
        email:utilisateur.email,
        photo:utilisateur.photo,
        stories:utilisateur.stories,
        groupes:utilisateur.groupes
      };
      return user;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'utilisateur :', error);
      throw error;
    }
  }

  // Supprimer un utilisateur
  async deleteUtilisateur(utilisateurId) {
    try {
      const utilisateur = await Utilisateur.findById(utilisateurId);
      if (!utilisateur) {
        const error= new Error('Utilisateur non trouvé');
        error.status = 404;
        throw error;
      }
      return utilisateur.deleteOne();
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'utilisateur :', error);
      throw error;
    }
  }

  // Trouver un utilisateur par email
  async findUtilisateurByEmail(email) {
    try {
      return await Utilisateur.findOne({ email });
    } catch (error) {
      console.error('Erreur lors de la recherche de l\'utilisateur par email :', error);
      throw error;
    }
  }

  // Trouver tous les contacts et les derniers messages d'un utilisateur
  async findContactsAndLastMessages(utilisateurId) {
    try {
      const utilisateur = await Utilisateur.findById(utilisateurId).populate('groupes');
      if (!utilisateur) {
        const error= new Error('Utilisateur non trouvé');
        error.status = 404;
        throw error;
      }
      return await utilisateur.findLastConversations();
    } catch (error) {
      console.error('Erreur lors de la récupération des contacts et des derniers messages :', error);
      throw error;
    }
  }

  // Voir tous les messages échangés avec un autre utilisateur
  async findDiscussionWith(utilisateurId, contactId) {
    try {
      const utilisateur = await Utilisateur.findById(utilisateurId);
      if (!utilisateur) {
        const error= new Error('Utilisateur non trouvé');
        error.status = 404;
        throw error;
      }
      return await utilisateur.findDiscussionWithPerson(contactId);
    } catch (error) {
      console.error('Erreur lors de la récupération de la discussion :', error);
      throw error;
    }
  }
  async findDiscussionWithGroup(utilisateurId, groupId) {
    try {
      const utilisateur = await Utilisateur.findById(utilisateurId);
      if (!utilisateur) {
        const error= new Error('Utilisateur non trouvé');
        error.status = 404;
        throw error;
      }
      return await utilisateur.findDiscussionWithGroup(groupId);
    } catch (error) {
      console.error('Erreur lors de la récupération de la discussion :', error);
      throw error;
    }
  }

  // Envoyer un message privé
  async sendMessageToPerson(expediteurId, destinataireId, contenu) {
    try {
      const utilisateur = await Utilisateur.findById(expediteurId);
      if (!utilisateur) {
        const error= new Error('Utilisateur non trouvé');
        error.status = 404;
        throw error;
      }
      return await utilisateur.sendMessageToPerson(destinataireId,contenu);
    }  catch (error) {
      console.error('Erreur lors de l\'envoi du message privé :', error);
      throw error;
    }
  }

  // Envoyer un message de groupe
  async sendMessageToGroup(expediteurId, groupeId, contenu) {
    try {
      const utilisateur = await Utilisateur.findById(expediteurId);
      if (!utilisateur) {
        const error= new Error('Utilisateur non trouvé');
        error.status = 404;
        throw error;
      }
      return await utilisateur.sendMessageToGroup(groupeId,contenu);
    }   catch (error) {
      console.error('Erreur lors de l\'envoi du message de groupe :', error);
      throw error;
    }
  }
    // Envoyer un message privé
    async transferToPerson(expediteurId, destinataireId, messageId) {
      try {
        const utilisateur = await Utilisateur.findById(expediteurId);
        if (!utilisateur) {
          const error= new Error('Utilisateur non trouvé');
          error.status = 404;
          throw error;
        }
        return await utilisateur.transferToPerson(destinataireId,messageId);
      }  catch (error) {
        console.error('Erreur lors de l\'envoi du message privé :', error);
        throw error;
      }
    }

    // Envoyer un message de groupe
    async transferToGroup(expediteurId, groupeId, messageId) {
      try {
        const utilisateur = await Utilisateur.findById(expediteurId);
        if (!utilisateur) {
          const error= new Error('Utilisateur non trouvé');
          error.status = 404;
          throw error;
        }
        return await utilisateur.transferToGroup(groupeId,messageId);
      }   catch (error) {
        console.error('Erreur lors de l\'envoi du message de groupe :', error);
        throw error;
      }
    }

/**
   * ✅ Ajouter une story avec support des styles et légendes
   * @param {string} userId - ID de l'utilisateur
   * @param {object} storyData - Données de la story
   * @returns {object} Story créée
   */
  async addStory(userId, storyData) {
    try {
      console.log('📤 [UtilisateurService.addStory] Début');
      console.log('   User ID:', userId);
      console.log('   Story Data:', JSON.stringify(storyData, null, 2));

      // Récupérer l'utilisateur
      const user = await Utilisateur.findById(userId);
      if (!user) {
        const error = new Error('Utilisateur non trouvé');
        error.status = 404;
        throw error;
      }

      // Validation des données
      if (!storyData.contenu || !storyData.contenu.type) {
        const error = new Error('Le type de contenu est requis');
        error.status = 400;
        throw error;
      }

      // Validation spécifique selon le type
      const { type, texte, image, video, caption } = storyData.contenu;

      if (type === 'texte' && (!texte || texte.trim().length === 0)) {
        const error = new Error('Le texte est requis pour une story de type texte');
        error.status = 400;
        throw error;
      }

      if (type === 'image' && !image) {
        const error = new Error('L\'image est requise pour une story de type image');
        error.status = 400;
        throw error;
      }

      if (type === 'video' && !video) {
        const error = new Error('La vidéo est requise pour une story de type vidéo');
        error.status = 400;
        throw error;
      }

      // Utiliser la méthode du modèle Utilisateur
      const result = await user.addStory(storyData.contenu);

      console.log('✅ [UtilisateurService.addStory] Story créée');
      console.log('   Story ID:', result.storyId);

      // Retourner la story complète
      return result;
    } catch (error) {
      console.error('❌ [UtilisateurService.addStory] Erreur:', error.message);
      throw error;
    }
  }

  /**
   * Supprimer une story
   * @param {string} userId - ID de l'utilisateur
   * @param {string} storyId - ID de la story
   */
  async deleteStory(userId, storyId) {
    try {
      console.log('🗑️ [UtilisateurService.deleteStory] Début');
      console.log('   User ID:', userId);
      console.log('   Story ID:', storyId);

      const user = await Utilisateur.findById(userId);
      if (!user) {
        const error = new Error('Utilisateur non trouvé');
        error.status = 404;
        throw error;
      }

      // Utiliser la méthode du modèle Utilisateur
      const result = await user.deleteStory(storyId);

      console.log('✅ [UtilisateurService.deleteStory] Story supprimée');
      return result;
    } catch (error) {
      console.error('❌ [UtilisateurService.deleteStory] Erreur:', error.message);
      throw error;
    }
  }

  /**
   * Voir une story (marque comme vue)
   * @param {string} userId - ID de l'utilisateur qui voit
   * @param {string} storyId - ID de la story
   * @returns {object} Story avec vues mises à jour
   */
  async voirStory(userId, storyId) {
    try {
      console.log('👁️ [UtilisateurService.voirStory] Début');
      console.log('   Viewer ID:', userId);
      console.log('   Story ID:', storyId);

      const user = await Utilisateur.findById(userId);
      if (!user) {
        const error = new Error('Utilisateur non trouvé');
        error.status = 404;
        throw error;
      }

      // Utiliser la méthode du modèle Utilisateur
      const story = await user.voirStory(storyId);

      console.log('✅ [UtilisateurService.voirStory] Story vue');
      console.log('   Total vues:', story.vues.length);

      return story;
    } catch (error) {
      console.error('❌ [UtilisateurService.voirStory] Erreur:', error.message);
      throw error;
    }
  }
  async changePassword(userId, oldPassword, newPassword) {
    try {
      const user = await Utilisateur.findById(userId);
      if (!user) {
        const error= new Error('Utilisateur non trouvé.');
        error.status = 401;
        throw error;
      }
      await user.changePassword(oldPassword, newPassword);
      return user;
    } catch (error) {
      throw error;
    }
  }

  async changePhoto(userId, newPhotoUrl,mimetype) {
    try {
      console.log(userId, 'id ito');
      const user = await Utilisateur.findById(userId);
      if (!user) {
        const error= new Error('Utilisateur non trouvé.');
        error.status = 401;
        throw error;
      }
      await user.changePhoto(newPhotoUrl,mimetype);
      return user;
    } catch (error) {
      console.log (error);
      throw error;
    }
  }

  async quitGroup(userId, groupId) {
    try {
      const user = await Utilisateur.findById(userId);
      if (!user) {
        const error= new Error('Utilisateur non trouvé.');
        error.status = 401;
        throw error;
      }
      const result = await user.quitGroup(groupId);
      return result;
    } catch (error) {
      throw error;
    }
  }
  async removeGroup(userId, groupId) {
    try {
      const user = await Utilisateur.findById(userId);
      if (!user) {
        const error= new Error('Utilisateur non trouvé.');
        error.status = 401;
        throw error;
      }
      const result = await user.supprimerGroupe(groupId);
      return result;
    } catch (error) {
      throw error;
    }
  }
  async updateGroup(userId, groupId,data) {
    try {
      const user = await Utilisateur.findById(userId);
      if (!user) {
        const error= new Error('Utilisateur non trouvé.');
        error.status = 401;
        throw error;
      }
      const result = await user.updateGroup(groupId,data);
      return result;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async createGroup(userId,groupe) {
    try {
      const user = await Utilisateur.findById(userId);
      if (!user) {
        const error= new Error('Utilisateur non trouvé.');
        error.status = 401;
        throw error;
      }
      const result = await user.createGroup(groupe);
      return result;
    } catch (error) {
      throw error;
    }
  }

  async changePhotoGroup(userId, groupId,photoPath) {
    try {
      const user = await Utilisateur.findById(userId);
      if (!user) {
        const error= new Error('Utilisateur non trouvé.');
        error.status = 401;
        throw error;
      }
      const result = await user.changePhotoGroup(groupId,photoPath);
      return result;
    } catch (error) {
      throw error;
    }
  }
  async addMember(userId, groupId,membre) {
    try {
      const user = await Utilisateur.findById(userId);
      if (!user) {
        const error= new Error('Utilisateur non trouvé.');
        error.status = 401;
        throw error;
      }
      const result = await user.ajouterAuGroupe(groupId,membre);
      return result;
    } catch (error) {
      throw error;
    }
  }
  async removeMember(userId, groupId,membre) {
    try {
      const user = await Utilisateur.findById(userId);
      if (!user) {
        const error= new Error('Utilisateur non trouvé.');
        error.status = 401;
        throw error;
      }
      const result = await user.supprimerDuGroupe(groupId,membre);
      return result;
    } catch (error) {
      throw error;
    }
  }
  async removeMessage(userId, messageId) {
    console.log('--- removeMessage SERVICE START ---');
    console.log('  User ID:', userId);
    console.log('  Message ID:', messageId);

    try {
      const user = await Utilisateur.findById(userId);
      if (!user) {
        console.error('  ❌ Utilisateur non trouvé:', userId);
        const error = new Error('Utilisateur non trouvé.');
        error.status = 401;
        throw error;
      }

      console.log('  ✓ Utilisateur trouvé:', user._id);
      const result = await user.deleteMessage(messageId);
      console.log('  ✓ Résultat deleteMessage:', result);
      console.log('--- removeMessage SERVICE END ---');
      return result;
    } catch (error) {
      console.error('  ❌ Erreur dans removeMessage SERVICE:', error.message);
      throw error;
    }
  }
  async  searchUtilisateurs(parametre, sessionUserId) {
    try {
      const regex = new RegExp(parametre, 'i'); // 'i' pour une recherche insensible à la casse
      const Utilisateur = mongoose.model('Utilisateur');
      const Groupe = mongoose.model('Groupe');

      // Rechercher les utilisateurs correspondant au paramètre
      const utilisateurs = await Utilisateur.find({
        _id: { $ne: sessionUserId }, // Exclure l'utilisateur en session
        nom: { $regex: regex }
      }).populate('stories'); // Ajouter 'stories' à la population

      // Rechercher les groupes auxquels l'utilisateur en session appartient et correspondant au paramètre
      const groupes = await Groupe.find({
        membres: sessionUserId,
        nom: { $regex: regex }
      });

      const contacts = [];

      utilisateurs.forEach(utilisateur => {
        // Structurer les utilisateurs en tant que contacts
        const userContact = {
          _id: utilisateur._id.toString(),
          type: 'utilisateur',
          nom: utilisateur.nom,
          presence: utilisateur.presence,
          photo: utilisateur.photo,
          story: utilisateur.stories.length // Longueur des stories
        };
        contacts.push(userContact);
      });

      groupes.forEach(groupe => {
        // Structurer les groupes en tant que contacts (sans présence)
        const groupContact = {
          _id: groupe._id.toString(),
          type: 'groupe',
          nom: groupe.nom,
          presence: '', // Pas de présence pour les groupes
          photo: groupe.photo
        };
        contacts.push(groupContact);
      });

      return contacts;
    } catch (error) {
      console.error('Erreur lors de la recherche des utilisateurs et des groupes :', error);
      throw error;
    }
  }
}

module.exports = new UtilisateurService();
