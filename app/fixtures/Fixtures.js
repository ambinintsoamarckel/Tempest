const mongoose = require('mongoose');
const faker = require('@faker-js/faker');
const MessagePrive = require('../models/MessagePrive');
const MessageGroupe = require('../models/MessageGroupe');
const Utilisateur= require('../models/Utilisateur');
const Groupe = require('../models/Groupe');
const Story =require('../models/Story');




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
      const utilisateur = new Utilisateur({
        nom: faker.fakerFR.person.firstName(),
        email: faker.fakerFR.internet.email(),
        password: 123456789,
        photo: faker.fakerFR.image.avatar(),
        presence: 'inactif'
      });
      utilisateur.setPassword(); // Hacher le mot de passe
      utilisateurs.push(utilisateur);
    }
    const utilisateursInserts = await Utilisateur.insertMany(utilisateurs);
// Créer des groupes individuellement pour déclencher le middleware post('save')
const groupes = [];
for (let i = 0; i < 5; i++) {
  const nouveauGroupe = new Groupe({
    nom: faker.fakerFR.company.name(),
    description: faker.fakerFR.lorem.sentence(),
    createur: utilisateursInserts[i % utilisateursInserts.length]._id,
    membres: utilisateursInserts.slice(i, i + 3).map(u => u._id)
  });
  groupes.push(nouveauGroupe.save()); // Ajoute la promesse du save() à un tableau
}

// Attendre que toutes les opérations de save() soient terminées
const groupesInserts = await Promise.all(groupes);
 

// Créer des messages privés
for (let i = 0; i < 20; i++) {
  const expediteur = utilisateurs[Math.floor(Math.random() * utilisateurs.length)];
  const destinataire = utilisateurs[Math.floor(Math.random() * utilisateurs.length)];
  const message = await expediteur.sendMessageToPerson(destinataire._id,{ contenu: { type: 'texte', texte: faker.fakerFR.lorem.sentence() }});
}
// Créer des messages de groupe
for (let i = 0; i < 20; i++) {
  const expediteur = utilisateurs[Math.floor(Math.random() * utilisateurs.length)];
  const groupe = groupesInserts[Math.floor(Math.random() * groupesInserts.length)];

  // Vérifier si l'expéditeur est membre du groupe
  if (!groupe.membres.includes(expediteur._id)) {
    console.log(`L'utilisateur ${expediteur.nom} (${expediteur._id}) n'est pas membre du groupe ${groupe.nom} (${groupe._id}).`);
    continue; // Passer à l'itération suivante si l'utilisateur n'est pas membre du groupe
  }

  try {
    const message = await expediteur.sendMessageToGroup(groupe._id, { contenu: { type: 'texte', texte: faker.fakerFR.lorem.sentence() }});
    console.log(`Message envoyé au groupe ${groupe.nom} par ${expediteur.nom}.`);
  } catch (error) {
    console.error(`Erreur lors de l'envoi du message au groupe ${groupe.nom} par ${expediteur.nom} :`, error);
  }
}
// Créer des stories
for (let i = 0; i < 10; i++) {
  const utilisateur = utilisateurs[i % utilisateurs.length];
  const contenu = {contenu:{
    type: 'texte',
    texte: faker.fakerFR.lorem.sentence()}
  };
  await utilisateur.addStory(contenu);
}
   console.log('Fixtures insérées avec succès !');
  } catch (error) {
    console.error('Erreur lors de l\'insertion des fixtures :', error);
  }
}

module.exports = insertFixtures;
