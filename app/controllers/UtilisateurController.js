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
      res.status(500).json({ message: error.message });
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
      const result = await utilisateurService.updateUtilisateur(
        req.session.passport.user._id,
        req.body
      );

      // ✅ Mettre à jour directement la session (pas de nouveau cookie)
      req.session.passport.user = {
        _id: result._id,
        email: result.email,
        nom: result.nom,
        photo: result.photo,
        presence: result.presence
      };

      // Sauvegarder la session modifiée
      req.session.save((err) => {
        if (err) {
          return res.status(500).json({
            message: 'Erreur lors de la sauvegarde de la session'
          });
        }

        // ✅ Émettre le socket APRÈS que la session soit sauvegardée
        const io = getIo();
        io.emit('utilisateur_modifie', result);

        return res.status(200).json({
          message: 'Utilisateur modifié avec succès',
          user: req.session.passport.user
        });
      });
    } catch (error) {
      res.status(error.status || 500).json({ message: error.message });
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
    console.log('=== DÉBUT envoyerMessageAPersonne ===');
    console.log('User ID:', req.session?.passport?.user?._id);
    console.log('Contact ID:', req.params.contactId);
    console.log('File présent:', !!req.file);
    console.log('Body:', req.body);

    try {
      const messageData = await prepareMessageData(req);
      console.log('Message data préparé:', JSON.stringify(messageData, null, 2));

      const message = await utilisateurService.sendMessageToPerson(
        req.session.passport.user._id,
        req.params.contactId,
        messageData
      );

      console.log('Message envoyé avec succès:', message._id);
      console.log('=== FIN envoyerMessageAPersonne (SUCCESS) ===\n');
      res.status(201).json(message);
    } catch (error) {
      console.error('=== ERREUR envoyerMessageAPersonne ===');
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
      console.error('Status:', error.status);
      console.error('=== FIN envoyerMessageAPersonne (ERROR) ===\n');
      res.status(error.status || 500).json({ message: error.message });
    }
  },

  async envoyerMessageAGroupe(req, res) {
    console.log('=== DÉBUT envoyerMessageAGroupe ===');
    console.log('User ID:', req.session?.passport?.user?._id);
    console.log('Groupe ID:', req.params.groupeId);
    console.log('File présent:', !!req.file);
    console.log('Body:', req.body);

    try {
      const messageData = await prepareMessageData(req);
      console.log('Message data préparé:', JSON.stringify(messageData, null, 2));

      const message = await utilisateurService.sendMessageToGroup(
        req.session.passport.user._id,
        req.params.groupeId,
        messageData
      );

      console.log('Message envoyé avec succès au groupe:', message._id);
      console.log('=== FIN envoyerMessageAGroupe (SUCCESS) ===\n');
      res.status(201).json(message);
    } catch (error) {
      console.error('=== ERREUR envoyerMessageAGroupe ===');
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
      console.error('Status:', error.status);
      console.error('=== FIN envoyerMessageAGroupe (ERROR) ===\n');
      res.status(error.status || 500).json({ message: error.message });
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

  /**
   * ✅ Ajouter une story (texte stylisé OU fichier avec légende)
   *
   * Pour texte (Content-Type: application/json):
   * {
   *   texte: 'Mon message',
   *   backgroundColor: '#FF6B6B',
   *   textColor: '#FFFFFF',
   *   textAlign: 'center',
   *   fontSize: 28,
   *   fontWeight: 'w600'
   * }
   *
   * Pour fichier (Content-Type: multipart/form-data):
   * - file: [fichier]
   * - caption: 'Ma légende' (optionnel)
   */
  async ajouterStory(req, res) {
    try {
      console.log('\n🎬 === AJOUT STORY ===');
      console.log('📍 User ID:', req.session.passport.user._id);
      console.log('📦 Body:', req.body);
      console.log('📎 File:', req.file ? 'Présent' : 'Absent');

      // Préparer les données selon le type de story
      const data = await prepareStoryData(req);

      // Appeler le service utilisateur pour créer la story
      const story = await utilisateurService.addStory(
        req.session.passport.user._id,
        data
      );

      // Émettre l'événement socket
      io.emit('story_ajoutee', story);

      console.log('✅ Story créée avec succès:', story.storyId || story._id);
      console.log('======================\n');

      res.status(201).json(story);
    } catch (error) {
      console.error('❌ [ajouterStory] Erreur:', error.message);
      console.error('Stack:', error.stack);
      res.status(error.status || 500).json({ message: error.message });
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

/**
   * Supprimer une story
   */
  async supprimerStory(req, res) {
    try {
      console.log('\n🗑️ === SUPPRESSION STORY ===');
      console.log('📍 User ID:', req.session.passport.user._id);
      console.log('📍 Story ID:', req.params.id);

      await utilisateurService.deleteStory(
        req.session.passport.user._id,
        req.params.id
      );

      // Émettre l'événement socket
      io.emit('story_supprimee', req.params.id);

      console.log('✅ Story supprimée avec succès');
      console.log('============================\n');

      res.status(204).send();
    } catch (error) {
      console.error('❌ [supprimerStory] Erreur:', error.message);
      res.status(error.status || 500).json({ message: error.message });
    }
  },

  /**
   * Voir une story (marque comme vue)
   */
  async voirStory(req, res) {
    try {
      console.log('\n👁️ === VOIR STORY ===');
      console.log('📍 User ID:', req.session.passport.user._id);
      console.log('📍 Story ID:', req.params.id);

      const story = await utilisateurService.voirStory(
        req.session.passport.user._id,
        req.params.id
      );

      console.log('✅ Story récupérée');
      console.log('   Vues:', story.vues.length);
      console.log('======================\n');

      res.status(200).json(story);
    } catch (error) {
      console.error('❌ [voirStory] Erreur:', error.message);
      res.status(error.status || 500).json({ message: error.message });
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
    console.log('=== DÉBUT supprimerMessage ===');
    console.log('User ID:', req.session?.passport?.user?._id);
    console.log('Message ID:', req.params.id);

    try {
      const result = await utilisateurService.removeMessage(
        req.session.passport.user._id,
        req.params.id
      );

      console.log('Message supprimé:', result);
      console.log('Émission socket.io: message_supprime');
      io.emit('message_supprime', req.params.id);

      console.log('=== FIN supprimerMessage (SUCCESS) ===\n');
      res.status(204).send();
    } catch (error) {
      console.error('=== ERREUR supprimerMessage ===');
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
      console.error('Status:', error.status);
      console.error('=== FIN supprimerMessage (ERROR) ===\n');
      res.status(error.status || 500).json({ message: error.message });
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
