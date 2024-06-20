const utilisateurService = require('../services/UtilisateurService');
const messageService = require('../services/MessageService');
const fs = require('fs');
const path = require('path');

function prepareMessageData(req) {
  let messageData;

  if (req.file) {
    const newFileUrl = req.file.path;
    const fileUrl = `${req.protocol}://mahm.tempest.dov:3000/${newFileUrl}`;
    let fileType;

    if (req.file.mimetype.startsWith('image/')) {
      fileType = 'image';
    } else if (req.file.mimetype.startsWith('audio/')) {
      fileType = 'audio';
    } else if (req.file.mimetype.startsWith('video/')) {
      fileType = 'video';
    } else {
      fileType = 'fichier';
    }

    messageData = {
      contenu: {
        type: fileType,
        [fileType]: fileUrl
      }
    };
  } else if (req.body.texte) {
    messageData = {
      contenu: {
        type: 'texte',
        texte: req.body.texte
      }
    };
  } else {
    throw new Error('Aucun contenu valide trouvé');
  }

  return messageData;
}

module.exports = {
  async creerUtilisateur(req, res) {
    try {
      const utilisateur = await utilisateurService.createUtilisateur(req.body);
      res.status(201).json(utilisateur);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  async VoirTousUtilisateur(req, res) {
    try {
      const utilisateurs = await utilisateurService.getAllUtilisateur();
      res.status(200).json(utilisateurs);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  async recupererUtilisateur(req, res) {
    try {
      const utilisateur = await utilisateurService.findUtilisateurById(req.params.id);
      if (!utilisateur) {
        return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }
      res.status(200).json(utilisateur);
    } catch (error) {
      console.error(error);
      res.status(400).json({ message: error });
    }
  },

  async recupererMonCompte(req, res) {
    try {
      const utilisateur = await utilisateurService.findUtilisateurById(req.session.passport.user.id);
      if (!utilisateur) {
        return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }

      res.status(200).json(utilisateur);
    } catch (error) {
      console.error(error);
      res.status(400).json({ message: error.message });
    }
  },

  async recupererSession(req, res) {
    try {
      res.status(200).json(req.session.passport.user);
    } catch (error) {
      res.status(404).json({ message: error.message });
    }
  },

  async modifierUtilisateur(req, res) {
    try {
      const utilisateur = await utilisateurService.updateUtilisateur(req.params.id, req.body);
      res.status(200).json(utilisateur);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  async modifierMonCompte(req, res) {
    try {
      const utilisateur = await utilisateurService.updateUtilisateur(req.session.passport.user.id, req.body);
      res.status(200).json(utilisateur);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  async supprimerUtilisateur(req, res) {
    try {
      await utilisateurService.deleteUtilisateur(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  async supprimerMonCompte(req, res) {
    try {
      await utilisateurService.deleteUtilisateur(req.session.passport.user.id);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  async recupererContactsEtMessages(req, res) {
    try {
      const data = await utilisateurService.findContactsAndLastMessages(req.session.passport.user.id);
      res.status(200).json(data);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  async recupererDiscussionAvecContact(req, res) {
    try {
      const data = await utilisateurService.findDiscussionWith(req.session.passport.user.id, req.params.contactId);
      res.status(200).json(data);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  async recupererDiscussionAvecGroupe(req, res) {
    try {
      const data = await utilisateurService.findDiscussionWithGroup(req.session.passport.user.id, req.params.groupeId);
      res.status(200).json(data);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  async envoyerMessageAPersonne(req, res) {
    try {
      const messageData = prepareMessageData(req);
      const message = await utilisateurService.sendMessageToPerson(req.session.passport.user.id, req.params.contactId, messageData);
      res.status(201).json(message);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  async envoyerMessageAGroupe(req, res) {
    try {
      const messageData = prepareMessageData(req);
      const message = await utilisateurService.sendMessageToGroup(req.session.passport.user.id, req.params.groupeId, messageData);
      res.status(201).json(message);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  async transfererMessageAPersonne(req, res) {
    try {
      const messageData = prepareMessageData(req);
      const message = await utilisateurService.transferToPerson(req.session.passport.user.id, req.params.contactId, req.params.messageId);
      res.status(201).json(message);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  async transfererMessageAGroupe(req, res) {
    try {
      const messageData = prepareMessageData(req);
      const message = await utilisateurService.transferToGroup(req.session.passport.user.id, req.params.groupeId, req.params.messageId);
      res.status(201).json(message);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  async ajouterStory(req, res) {
    try {
      const story = await utilisateurService.addStory(req.session.passport.user.id, req.body);
      res.status(201).json(story);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  async changePassword(req, res) {
    const { oldPassword, newPassword } = req.body;

    try {
      const result = await utilisateurService.changePassword(req.session.passport.user.id, oldPassword, newPassword);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  async changePhoto(req, res) {
    const file = req.file;
    if (!file) {
      return res.status(400).send('Aucun fichier uploadé');
    }
  
    if (file.error) {
      console.error(file.error);
      return res.status(400).send(file.error.message);
    }
    const newPhotoUrl = req.file.path;
    const photo = `${req.protocol}://mahm.tempest.dov:3000/${newPhotoUrl}`;
    const mimetype = req.file.mimetype; 
    try {
      const result = await utilisateurService.changePhoto(req.session.passport.user.id, photo, mimetype);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  async quitGroup(req, res) {
    const { groupId } = req.params;

    try {
      const result = await utilisateurService.quitGroup(req.session.passport.user.id, groupId);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  async createGroup(req, res) {
    const { nom, photo, membres } = req.body;

    try {
      const result = await utilisateurService.createGroup(req.session.passport.user.id, nom, photo, membres);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  async supprimerStory(req, res) {
    try {
      await utilisateurService.deleteStory(req.session.passport.user.id, req.params.storyId);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  // New Functions
  async removeGroup(req, res) {
    const { groupId } = req.params;

    try {
      const result = await utilisateurService.removeGroup(req.session.passport.user.id, groupId);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  async changePhotoGroup(req, res) {
    const { groupId } = req.params;
    const file = req.file;
    if (!file) {
      return res.status(400).send('Aucun fichier uploadé');
    }
  
    if (file.error) {
      console.error(file.error);
      return res.status(400).send(file.error.message);
    }
    const newPhotoUrl = req.file.path;
    const photo = `${req.protocol}://mahm.tempest.dov:3000/${newPhotoUrl}`;
    const mimetype = req.file.mimetype; 

    try {
      const result = await utilisateurService.changePhotoGroup(req.session.passport.user.id, groupId,photo);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  async addMember(req, res) {
    const { groupId } = req.params;
    const { membre } = req.body;

    try {
      const result = await utilisateurService.addMember(req.session.passport.user.id, groupId, membre);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  async removeMember(req, res) {
    const { groupId } = req.params;
    const { membre } = req.body;

    try {
      const result = await utilisateurService.removeMember(req.session.passport.user.id, groupId, membre);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },
  async updategroup(req, res) {
    const { groupId } = req.params;
    const { data } = req.body;

    try {
      const result = await utilisateurService.updateGroup(req.session.passport.user.id, groupId, data);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  async supprimerMessage(req, res) {
    try {
      await utilisateurService.removeMessage(req.session.passport.user.id, req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },
  

};
