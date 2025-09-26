# Système de Gestion Référendum Toulouse 2025

## Présentation

Ce projet est une application web permettant de gérer l'intégralité du processus électoral pour le référendum du 21 septembre 2025 à Toulouse. Elle centralise la gestion des listes d'électeurs, la distribution des cartes, le contrôle d'entrée, l'émargement et le suivi statistique en temps réel.

- **Nombre d'électeurs** : 1366
- **Bureaux de vote** : BV-1, BV-2, BV-3
- **Modes** : Recherche, Distribution, Contrôle Entrée, Émargement, Tableau de bord

## Fonctionnalités principales

- Recherche d'électeurs par nom, prénom et date de naissance (résultats en temps réel)
- Distribution des cartes d'électeur avec suivi du statut
- Contrôle d'entrée le jour du vote
- Émargement à la sortie
- Statistiques et tableau de bord
- Gestion multi-bureaux

## Structure du projet

- `index.html` : Interface utilisateur principale
- `style.css` : Feuilles de style
- `app.js` : Logique applicative (gestion des modes, recherche, événements, etc.)
- `database.js` / `allData.js` : Données des électeurs (par bureau)
- `fonctionnalites.md` : Documentation détaillée des fonctionnalités

## Prérequis

- Un navigateur web moderne (Chrome, Firefox, Edge, etc.)
- Aucune installation serveur n'est nécessaire (tout fonctionne en local)

## Lancement de l'application

1. Placez tous les fichiers du projet dans un même dossier.
2. Ouvrez le fichier `index.html` dans votre navigateur (double-cliquez ou clic droit > Ouvrir avec).
3. L'application est immédiatement opérationnelle.

**Remarque** :
- Assurez-vous que les fichiers `database.js` et/ou `allData.js` sont bien présents et chargés avant `app.js` dans le fichier `index.html`.
- Les données sont chargées en mémoire et ne sont pas persistées après fermeture du navigateur.

## Personnalisation

- Pour modifier la liste des électeurs, éditez les fichiers `database.js` ou `allData.js`.
- Pour adapter le style, modifiez `style.css`.

## Aide et documentation

Consultez le fichier `fonctionnalites.md` pour une description détaillée de chaque mode et des cas d'usage.

---

© 2025 - Gestion Référendum Toulouse
