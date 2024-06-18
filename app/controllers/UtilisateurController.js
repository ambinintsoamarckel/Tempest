const utilisateurService = require('../services/UtilisateurService');
const messageService = require('../services/MessageService');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

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
      const photoPath = utilisateur.photo;
      const imageData = fs.readFileSync(photoPath);
      const mimeType = utilisateur.mimetype;
      res.writeHead(200, { 'Content-Type': mimeType });
      res.end(imageData); // Chemin de la photo stocké dans la BDD
    } catch (error) {
      console.error(error);
      res.status(400).json({ message: error });
    }
  },
  // Function to determine MIME type (consider using a reliable library)


  async recupererMonCompte(req, res) {
    try {
      const utilisateur = await utilisateurService.findUtilisateurById(req.session.passport.user.id);
      if (!utilisateur) {
        return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }

      // Récupération des informations utilisateur
      const utilisateurData = utilisateur.toObject();

      // Chemin de la photo de profil
      const photoPath = utilisateur.photo;

      // Créer une URL pour la photo de profil
      const photoUrl = photoPath ? `${req.protocol}://192.168.43.20:3000/uploads/profilePhotos/${path.basename(photoPath)}` : null;

      // Ajouter l'URL de la photo de profil aux données utilisateur
      const responseData = {
        ...utilisateurData,
        photoUrl: photoUrl
      };

      res.status(200).json(responseData);
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
      const message = await utilisateurService.sendMessageToPerson(req.session.passport.user.id, req.params.contactId, req.body);
      res.status(201).json(message);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  async envoyerMessageAGroupe(req, res) {
    try {
      const message = await utilisateurService.sendMessageToGroup(req.session.passport.user.id, req.params.groupeId, req.body);
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
    const newPhotoUrl = req.file.path;
    const mimetype = req.file.mimetype; 

    try {
      const result = await utilisateurService.changePhoto(req.session.passport.user.id, newPhotoUrl,mimetype);
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
    const { nom,photo,membres } = req.body;

    try {
      const result = await utilisateurService.createGroup(req.session.passport.user.id, nom,photo,membres);
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
  }
};
