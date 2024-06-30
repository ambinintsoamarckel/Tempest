const Utilisateur = require('../models/Utilisateur');
const MessageService = require('./MessageService');

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
  async getAllUtilisateur() {
    try {
    
      const utilisateurs = await Utilisateur.find().populate('groupes stories');
      const users=[];
      utilisateurs.forEach(utilisateur => {
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
          presence:utilisateur.presence,
          email:utilisateur.email,
          photo:utilisateur.photo,
          stories:utilisateur.stories,
          groupes:groups
        };
        users.push(user);
      })
      
      return users;
    } catch (error) {
      console.error('Erreur lors de la création de l\'utilisateur :', error);
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

  async addStory(utilisateurId,contenu)
  {
    try {
      const utilisateur = await Utilisateur.findById(utilisateurId);
      if (!utilisateur) {
        const error= new Error('Utilisateur non trouvé');
        error.status = 404;
        throw error;
      }
      return await utilisateur.addStory(contenu);
    }   catch (error) {
      console.error('Erreur lors de l\'ajout du story :', error);
      throw error;
    }
  }

  async deleteStory(utilisateurId,storyId)
  {
    try {
      const utilisateur = await Utilisateur.findById(utilisateurId);
      if (!utilisateur) {
        const error= new Error('Utilisateur non trouvé');
        error.status = 404;
        throw error;
      }
      return await utilisateur.deleteStory(storyId);
    }   catch (error) {
      console.error('Erreur lors de l\'ajout du story :', error);
      throw error;
    }
  }
  async voirStory(utilisateurId,storyId)
  {
    try {
      const utilisateur = await Utilisateur.findById(utilisateurId);
      if (!utilisateur) {
        const error= new Error('Utilisateur non trouvé');
        error.status = 404;
        throw error;
      }
      return await utilisateur.voirStory(storyId);
    }   catch (error) {
      console.error('Erreur lors de lecture du story :', error);
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
      const user = await Utilisateur.findById(userId);
      if (!user) {
        const error= new Error('Utilisateur non trouvé.');
        error.status = 401;
        throw error;
      }
      await user.changePhoto(newPhotoUrl,mimetype);
      return user;
    } catch (error) {
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
    try {
      const user = await Utilisateur.findById(userId);
      if (!user) {
        const error= new Error('Utilisateur non trouvé.');
        error.status = 401;
        throw error;
      }
      const result = await user.deleteMessage(messageId);
      return result;
    } catch (error) {
      throw error;
    }
  }
  async searchUtilisateurs(parametre) {
    try {
      const regex = new RegExp(parametre, 'i'); // 'i' pour une recherche insensible à la casse
      const utilisateurs = await Utilisateur.find({
        $or: [
          { nom: { $regex: regex } },
          { email: { $regex: regex } }
        ]
      }).populate('groupes');
      if (!utilisateurs) {
        const error= new Error('Utilisateurs non trouvé.');
        error.status = 404;
        throw error;
      }  const users=[];
      utilisateurs.forEach(utilisateur => {
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
          presence:utilisateur.presence,
          email:utilisateur.email,
          photo:utilisateur.photo,
          stories:utilisateur.stories,
          groupes:groups
        };
        users.push(user);
      })
      
      return users;
    } catch (error) {
      console.error('Erreur lors de la recherche des utilisateurs :', error);
      throw error;
    }
  }
}

module.exports = new UtilisateurService();
