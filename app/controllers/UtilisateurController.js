const utilisateurService = require('../services/UtilisateurService');
const messageService = require('../services/MessageService');
const fs = require('fs');
const path = require('path');
const {generateCookie, prepareMessageData,prepareStoryData,uploadFileToFirebase}=require('../../config/utils');

/*socket*/
const { getIo } = require('../../config/socketConfig');

const io = getIo();


module.exports = {
  async creerUtilisateur(req, res) {
    try {
      const utilisateur = await utilisateurService.createUtilisateur(req.body);
      
      io.emit('utilisateur_cree', utilisateur); 

      res.status(201).json(utilisateur);
    } catch (error) {
      res.status(error.status||500).json({ message: error.message });
    }
  },

  async VoirTousUtilisateur(req, res) {
    try {
      const utilisateurs = await utilisateurService.getAllUtilisateur(req.session.passport.user._id);
      res.status(200).json(utilisateurs);
    } catch (error) {
      res.status(error.status||500).json({ message: error.message });
    }
  },
  async VoirNonMembres(req, res) {
    try {
      const utilisateurs = await utilisateurService.getUtilisateursNonMembresDuGroupe(req.session.passport.user._id,req.params.groupId);
      res.status(200).json(utilisateurs);
    } catch (error) {
      res.status(error.status||500).json({ message: error.message });
    }
  },
  async getUsers(req, res) {
    try {
      const utilisateurs = await utilisateurService.getAllUser();
      res.status(200).json(utilisateurs);
    } catch (error) {
      res.status(error.status||500).json({ message: error.message });
    }
  },
  async recupererUtilisateur(req, res) {
    try {
      const utilisateur = await utilisateurService.findUtilisateurById(req.params.id);
      res.status(200).json(utilisateur);
    } catch (error) {
      console.error(error);
      res.status(400).json({ message: error });
    }
  },

  async recupererMonCompte(req, res) {
    try {
      const utilisateur = await utilisateurService.findMe(req.session.passport.user._id);
      res.status(200).json(utilisateur);
    } catch (error) {
      console.error(error);
      res.status(error.status||500).json({ message: error.message });
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
      
      io.emit('utilisateur_modifie', utilisateur);

      
      res.status(200).json(utilisateur);
    } catch (error) {
      res.status(error.status||500).json({ message: error.message });
    }
  },

  async modifierMonCompte(req, res) {
    try {
      const result = await utilisateurService.updateUtilisateur(req.session.passport.user._id, req.body);
      req.logout(async (err) => {
        if (err) {
            return res.status(500).json({ message: 'Erreur lors de la déconnexion après le changement de mot de l\'utilisateur.' });
        }

        // Reconnecter l'utilisateur
        req.login(result, (err) => {
            if (err) {
                return res.status(500).json({ message: 'Erreur lors de la reconnexion après le changement de l\'utilisateur.' });
            }
            
            io.emit('utilisateur_modifie', result);

            return res.status(200).json({ message: 'Utilisateur changé avec succès', user: result,'Set-Cookie': generateCookie(req.sessionID) });

        });
    });
    } catch (error) {
      res.status(error.status||500).json({ message: error.message });
    }
  },

  async supprimerUtilisateur(req, res) {
    try {
      await utilisateurService.deleteUtilisateur(req.params.id);

      io.emit('utilisateur_supprime', req.params.id); 

      res.status(204).send();
    } catch (error) {
      res.status(error.status||500).json({ message: error.message });
    }
  },

  async supprimerMonCompte(req, res) {
    try {
      await utilisateurService.deleteUtilisateur(req.session.passport.user._id);
      
      io.emit('utilisateur_supprime', req.session.passport.user._id);
      
      res.status(204).send();
    } catch (error) {
      res.status(error.status||500).json({ message: error.message });
    }
  },

  async recupererContactsEtMessages(req, res) {
    try {
      const data = await utilisateurService.findContactsAndLastMessages(req.session.passport.user._id);
      res.status(200).json(data);
    } catch (error) {
      res.status(error.status||500).json({ message: error.message });
    }
  },

  async recupererDiscussionAvecContact(req, res) {
    try {
      const data = await utilisateurService.findDiscussionWith(req.session.passport.user._id, req.params.contactId);
      res.status(200).json(data);
    } catch (error) {
      res.status(error.status||500).json({ message: error.message });
    }
  },

  async recupererDiscussionAvecGroupe(req, res) {
    try {
      const data = await utilisateurService.findDiscussionWithGroup(req.session.passport.user._id, req.params.groupeId);
      res.status(200).json(data);
    } catch (error) {
      res.status(error.status||500).json({ message: error.message });
    }
  },

  async envoyerMessageAPersonne(req, res) {
    try {
      const messageData = await prepareMessageData(req);
      const message = await utilisateurService.sendMessageToPerson(req.session.passport.user._id, req.params.contactId, messageData);
      res.status(201).json(message);  
    } catch (error) {
      res.status(error.status||500).json({ message: error.message });
    }
  },

  async envoyerMessageAGroupe(req, res) {
    try {
      const messageData = await prepareMessageData(req);
      const message = await utilisateurService.sendMessageToGroup(req.session.passport.user._id, req.params.groupeId, messageData);
      res.status(201).json(message);
    } catch (error) {
      res.status(error.status||500).json({ message: error.message });
    }
  },

  async transfererMessageAPersonne(req, res) {
    try {

      const message = await utilisateurService.transferToPerson(req.session.passport.user._id, req.params.contactId, req.params.messageId);
      res.status(201).json(message);
    } catch (error) {
    console.log(error);
      res.status(error.status||500).json({ message: error.message });
    }
  },

  async transfererMessageAGroupe(req, res) {
    try {

      const message = await utilisateurService.transferToGroup(req.session.passport.user._id, req.params.groupeId, req.params.messageId);
      res.status(201).json(message);
    } catch (error) {
      console.log(error);
      res.status(error.status||500).json({ message: error.message });
    }
  },

  async ajouterStory(req, res) {
    try {
      const data = await prepareStoryData(req);
      const story = await utilisateurService.addStory(req.session.passport.user._id, data);
            
      io.emit('story_ajoutee', story);
      
      res.status(201).json(story);
    } catch (error) {
      console.error(error);
      res.status(error.status||500).json({ message: error.message });
    }
  },

  async changePassword(req, res) {
    const { oldPassword, newPassword } = req.body;

    try {
        const userId = req.session.passport.user._id;
        const result = await utilisateurService.changePassword(userId, oldPassword, newPassword);
        
        req.logout(async (err) => {
            if (err) {
                return res.status(500).json({ message: 'Erreur lors de la déconnexion après le changement de mot de passe.' });
            }

            // Reconnecter l'utilisateur
            req.login(result, (err) => {
                if (err) {
                    return res.status(500).json({ message: 'Erreur lors de la reconnexion après le changement de mot de passe.' });
                }

                io.emit('mot_de_passe_change', result);

                return res.status(200).json({ message: 'Mot de passe changé avec succès', user: req.user,'Set-Cookie': generateCookie(req.sessionID) });
            });
        });
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
},

async changePhoto(req, res) {
  const file = req.file;
  if (!file) {
    return res.status(400).send('Aucun fichier uploadé');
  }

  try {
    const destination = `profilePhotos/${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`;
    const photoUrl = await uploadFileToFirebase(file, destination);
    
    const result = await utilisateurService.changePhoto(req.session.passport.user._id, photoUrl, file.mimetype);
    req.logout(async (err) => {
      if (err) {
        return res.status(500).json({ message: 'Erreur lors de la déconnexion après le changement de photo de profil.' });
      }

      req.login(result, (err) => {
        if (err) {
          return res.status(500).json({ message: 'Erreur lors de la reconnexion après le changement de photo de profil.' });
        }

        io.emit('photo_changee', result);
        return res.status(200).json({ message: 'Photo de profil changée avec succès', user: result, 'Set-Cookie': generateCookie(req.sessionID) });
      });
    });
  } catch (error) {
    console.error(error);
    res.status(error.status || 500).json({ message: error.message });
  }
},


  async quitGroup(req, res) {
    const { groupId } = req.params;

    try {
      const result = await utilisateurService.quitGroup(req.session.passport.user._id, groupId);
            
      io.emit('groupe_quitte', result);
      
      res.status(204).json(result);
    } catch (error) {
      res.status(error.status||500).json({ message: error.message });
    }
  },

  async createGroup(req, res) {


    try {
      const result = await utilisateurService.createGroup(req.session.passport.user._id, req.body);
      
      io.emit('groupe_cree', result);
      
      res.status(201).json(result);
    } catch (error) {
      res.status(error.status||500).json({ message: error.message });
    }
  },

  async supprimerStory(req, res) {
    try {
      await utilisateurService.deleteStory(req.session.passport.user._id, req.params.id);
      
      io.emit('story_supprimee', req.params.id);
      
      res.status(204).send();
    } catch (error) {
      res.status(error.status||500).json({ message: error.message });
    }
  },
  async voirStory(req, res) {
    try {
     const story= await utilisateurService.voirStory(req.session.passport.user._id, req.params.id);      
     res.status(200).json(story);
    } catch (error) {
      res.status(error.status||500).json({ message: error.message });
    }
  },

  // New Functions
  async removeGroup(req, res) {
    const { id } = req.params;

    try {
      const result = await utilisateurService.removeGroup(req.session.passport.user._id, id);
            
      io.emit('groupe_supprime', result);
      
      res.status(204).json(result);
    } catch (error) {
      res.status(error.status||500).json({ message: error.message });
    }
  },

  async changePhotoGroup(req, res) {
    const { id } = req.params;
    const file = req.file;
    if (!file) {
      return res.status(400).send('Aucun fichier uploadé');
    }
  
    try {
      const destination = `groupPhotos/${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`;
      const photoUrl = await uploadFileToFirebase(file, destination);
      
      const result = await utilisateurService.changePhotoGroup(req.session.passport.user._id, id, photoUrl);
      io.emit('photo_groupe_changee', result);
      res.status(200).json(result);
    } catch (error) {
      res.status(error.status || 500).json({ message: error.message });
    }
  },
  

  async addMember(req, res) {
    const { id,utilisateurId } = req.params;


    try {
      const result = await utilisateurService.addMember(req.session.passport.user._id, id, utilisateurId);
      
      io.emit('membre_ajoute', result);

      res.status(200).json(result);
    } catch (error) {
      res.status(error.status||500).json({ message: error.message });
    }
  },

  async removeMember(req, res) {
    const { id,utilisateurId } = req.params;


    try {
      const result = await utilisateurService.removeMember(req.session.passport.user._id, id, utilisateurId);
      
      io.emit('membre_supprime', result);
      
      res.status(200).json(result);
    } catch (error) {
      res.status(error.status||500).json({ message: error.message });
    }
  },
  async updategroup(req, res) {
    const { id } = req.params;
 

    try {
      const result = await utilisateurService.updateGroup(req.session.passport.user._id, id, req.body);
            
      io.emit('groupe_mis_a_jour', result);
      
      res.status(200).json(result);
    } catch (error) {
      res.status(error.status||500).json({ message: error.message });
    }
  },

  async supprimerMessage(req, res) {
    try {
      await utilisateurService.removeMessage(req.session.passport.user._id, req.params.id);
      
      io.emit('message_supprime', req.params.id);
      
      res.status(204).send();
    } catch (error) {
      res.status(error.status||500).json({ message: error.message });
    }
  },
  async recherche(req, res) {
    try {
      const utilisateur=await utilisateurService.searchUtilisateurs(req.params.valeur,req.session.passport.user._id);
            
     // io.emit('utilisateur_recherche', utilisateur);
      
      res.status(200.).json(utilisateur);
    } catch (error) {
      res.status(error.status||500).json({ message: error.message });
    }
  },

};
