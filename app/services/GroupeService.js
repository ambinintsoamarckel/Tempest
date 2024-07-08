const Groupe = require('../models/Groupe');
const Utilisateur = require('../models/Utilisateur');
const MessageGroupe = require('../models/MessageGroupe');

class GroupeService {


  async getAllGroupes() {
    try {
      const groupes = await Groupe.find().populate('membres createur');
      const groups=[];
      groupes.forEach(groupe => {
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
        groups.push(group);
      })
      return groups;
    } catch (error) {
      console.error('Erreur lors de la récupération des groupes :', error);
      throw error;
    }
  }
  async getGroupe(id) {
    try {
      const groupes = await Groupe.findById(id).populate('membres createur');
      const membres=[];
      groupes.membres.forEach(utilisateur => {
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
        _id:groupes._id,
        nom:groupes.nom,
        description:groupes.description,
        photo:groupe.photo,
        createur:{_id:groupes.createur._id,
                  nom:groupes.createur.nom,
                  email:groupes.createur.email,
                  photo:groupes.createur.photo,
                  stories:groupes.createur.stories
        },
        membres:membres
      }
      return group;
    } catch (error) {
      console.error('Erreur lors de la récupération des groupes :', error);
      throw error;
    }
  }

}

module.exports = new GroupeService();
