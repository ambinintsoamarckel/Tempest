const utilisateurService = require('../services/UtilisateurService');
const messageService = require('../services/MessageService');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

function getMimeType(imageData) {
  // Option 1: Leverage a reliable MIME type detection library
  // (Recommended approach for accuracy and flexibility)
  const mime = require('mime-types'); // Example library
//  return mime.lookup(imageData);

  // Option 2: Basic MIME type detection based on header bytes (less reliable)
  // Use with caution as it might not always be accurate
  const header = imageData.slice(0, 4).toString('hex');
  switch (header) {
    case '89504e47': return 'image/png';
    case 'ffd8ffe0': return 'image/jpeg';
    case '47494638': return 'image/gif';
    default: return 'application/octet-stream'; // Unknown type, send as binary
  }
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

      // Préparez les données utilisateur
      const utilisateurData = utilisateur.toObject();
      const form = new FormData();

      // Ajoutez les propriétés de l'utilisateur au form-data
/*       for (const key in utilisateurData) {
        if (Object.prototype.hasOwnProperty.call(utilisateurData, key)) {
          form.append(key, utilisateurData[key].toString());
        }
      }
 */
      // Ajoutez la photo de profil au form-data
      const photoPath = utilisateur.photo;
      const imageData = fs.readFileSync(photoPath);
      const mimeType = getMimeType(imageData);
       // Call a function to determine MIME type
      console.log(mimeType);
      // Set the Content-Type header with the determined MIME type
      res.writeHead(200, { 'Content-Type': mimeType });

      res.end(imageData); // Chemin de la photo stocké dans la BDD
/*       if (photoPath && fs.existsSync(photoPath)) {
        form.append('photo', fs.readFileSync(photoPath), {
          filename: path.basename(photoPath)// ou 'image/png' selon le type de votre image
        });
      } else {
        form.append('photo', '');
      }

      // Envoyez la réponse avec form-data
      form.pipe(res); */
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

      // Préparez les données utilisateur
      const utilisateurData = utilisateur.toObject();
      const form = new FormData();

      // Ajoutez les propriétés de l'utilisateur au form-data
/*       for (const key in utilisateurData) {
        if (Object.prototype.hasOwnProperty.call(utilisateurData, key)) {
          form.append(key, utilisateurData[key].toString());
        }
      } */

      // Ajoutez la photo de profil au form-data
      const photoPath = utilisateur.photo; // Chemin de la photo stocké dans la BDD
      if (photoPath && fs.existsSync(photoPath)) {
        form.append('photo', fs.createReadStream(photoPath), {
          filename: path.basename(photoPath)
        });
      } else {
        form.append('photo', '');
      }

      // Envoyez la réponse avec form-data
      form.pipe(res);
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
    const newPhotoUrl = req.file.path; // Obtenir le chemin du fichier téléchargé

    try {
      const result = await utilisateurService.changePhoto(req.session.passport.user.id, newPhotoUrl);
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
