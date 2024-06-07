const mongoose = require('mongoose');
const faker = require('@faker-js/faker');
const Utilisateur = require('../models/Utilisateur');
const Groupe = require('../models/Groupe');
const MessagePrive = require('../models/MessagePrive');
const MessageGroupe = require('../models/MessageGroupe');
const Story = require('../models/Story');

async function insertFixtures() {
  try {
    // Supprimer les anciennes données
    await Utilisateur.deleteMany({});
    await Groupe.deleteMany({});
    await MessagePrive.deleteMany({});
    await MessageGroupe.deleteMany({});
    await Story.deleteMany({});
    

    // Créer des utilisateurs
    const utilisateurs = [];
    for (let i = 0; i < 10; i++) {
      utilisateurs.push({
        nom: faker.fakerFR.person.firstName(),
        email: faker.fakerFR.internet.email(),
        motDePasse: faker.fakerFR.internet.password(),
        photo: faker.fakerFR.image.avatar(),
        presence: 'inactif'
      });
    }
    const utilisateursInserts = await Utilisateur.insertMany(utilisateurs);


    // Créer des groupes
    const groupes = [];
    for (let i = 0; i < 5; i++) {
      groupes.push({
        nom: faker.fakerFR.company.name(),
        description: faker.fakerFR.lorem.sentence(),
        createur: utilisateursInserts[i % utilisateursInserts.length]._id,
        membres: utilisateursInserts.slice(i, i + 3).map(u => u._id)
      });
    }
    const groupesInserts = await Groupe.insertMany(groupes);

    // Créer des messages privés
    const messagesPrives = [];
    for (let i = 0; i < 20; i++) {
      const expediteur = utilisateursInserts[Math.floor(Math.random() * utilisateursInserts.length)];
      const destinataire = utilisateursInserts[Math.floor(Math.random() * utilisateursInserts.length)];
      messagesPrives.push({
        contenu: { type: 'texte', texte: faker.fakerFR.lorem.sentence() },
        expediteur: expediteur._id,
        destinataire: destinataire._id
      });
    }
    const messagesPrivesInserts = await MessagePrive.insertMany(messagesPrives);

    // Créer des messages de groupe
    const messagesGroupes = [];
    for (let i = 0; i < 20; i++) {
      const expediteur = utilisateursInserts[Math.floor(Math.random() * utilisateursInserts.length)];
      const groupe = groupesInserts[Math.floor(Math.random() * groupesInserts.length)];
      messagesGroupes.push({
        contenu: { type: 'texte', texte: faker.fakerFR.lorem.sentence() },
        expediteur: expediteur._id,
        groupe: groupe._id
      });
    }
    const messagesGroupesInserts = await MessageGroupe.insertMany(messagesGroupes);

    // Créer des stories
    const stories = [];
    for (let i = 0; i < 10; i++) {
      stories.push({
        utilisateur: utilisateursInserts[i % utilisateursInserts.length]._id,
        contenu: { type: 'texte', texte: faker.fakerFR.lorem.sentence(),   dateExpiration: new Date(Date.now() + 24 * 60 * 60 * 1000) }
     
      });
    }
    const storiesInserts = await Story.insertMany(stories);

    // Ajouter des références de messages aux utilisateurs et groupes
    for (let i = 0; i < utilisateursInserts.length; i++) {
      const utilisateur = utilisateursInserts[i];
      const messagesEnvoyes = messagesPrivesInserts.filter(msg => msg.expediteur.equals(utilisateur._id)).map(msg => msg._id);
      const messagesRecus = messagesPrivesInserts.filter(msg => msg.destinataire.equals(utilisateur._id)).map(msg => msg._id);
      await Utilisateur.findByIdAndUpdate(utilisateur._id, { messagesEnvoyes, messagesRecus });
    }

    for (let i = 0; i < groupesInserts.length; i++) {
      const groupe = groupesInserts[i];
      const messages = messagesGroupesInserts.filter(msg => msg.groupe.equals(groupe._id)).map(msg => msg._id);
      await Groupe.findByIdAndUpdate(groupe._id, { messages });
    }

    console.log('Fixtures insérées avec succès !');
  } catch (error) {
    console.error('Erreur lors de l\'insertion des fixtures :', error);
  }
}

module.exports = insertFixtures;
