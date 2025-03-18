# DevBook : POC Local – Générateur de Quiz IA

## 1) Initialisation du projet
- [x] Créer un dossier principal (ex. poc-quiz-gen)
- [x] Ajouter deux sous-répertoires : backend/ et frontend/
- [x] Init chacun avec un package.json (ou monorepo, si tu préfères)
- [x] Configurer un script "dev" pour lancer le front (Vite) et le back (Express) en parallèle

## 2) Backend – Node + Express + TypeScript
- [x] Installer les dépendances (ex. express, multer, pdf-parse, unzipper, axios, better-sqlite3 ou knex, etc.)
- [x] Installer les dépendances de dev (ex. typescript, ts-node-dev, jest, ts-jest, supertest, @types/express, etc.)
- [x] Configurer le tsconfig.json et jest.config.js
- [x] Créer un src/index.ts (ou server.ts) qui lance Express
- [x] Créer un répertoire src/routes/ avec quizRoutes.ts (endpoints décrits)
- [x] Créer un répertoire src/services/ pour parseService.ts, aiService.ts et exportService.ts
- [x] Gérer la base SQLite : un db.ts ou config knex
- [x] Écrire les tests TDD (au moins un test unitaire parseService.test.ts, aiService.test.ts, exportService.test.ts + un test d'intégration sur routes)
- [x] Intégrer la clé Claude (stockée en .env) et un appel mock dans aiService.ts

## 3) Frontend – React + Vite + TypeScript
- [x] Créer le squelette Vite (ex. npm create vite@latest frontend -- --template react-ts)
- [x] Installer axios pour les requêtes au backend
- [x] Ajouter la structure de pages :
  - [x] UploadPage
  - [x] GeneratePage
  - [x] EditQuestionsPage (ou composant)
  - [x] ExportPage (ou simple bouton)
- [x] Créer un routes ou router.ts si besoin (React Router)
- [x] Installer les dev deps : @testing-library/react, @testing-library/jest-dom, etc.
- [x] Écrire quelques tests React (UploadPage.test.tsx, etc.)

## 4) Fonctionnalités principales
- [x] Upload (POST /api/upload) → parse doc → stocker en DB (ou mémoire)
- [x] Génération (POST /api/generate-questions) → param testMode + difficulty + questionType → call IA (Claude)
- [x] Édition questions (PUT /api/questions/:id) → maj DB
- [x] Export (GET /api/export/gift ou /api/export/xml) → build string GIFT/XML → renvoyer en fichier

## 5) Tests / TDD
- [x] parseService : test unitaire parse PDF, docx, zip SCORM
- [x] aiService : test unitaire mock d'appel Claude → structure attendue
- [x] exportService : test unitaire format GIFT/XML
- [x] quizRoutes : test d'intégration (upload, generate, export)
- [ ] Front : tests unitaires (UploadPage, GeneratePage, etc.)

## 6) Scripts & CI
- [x] Script "dev" (concurrently back + front)
- [x] Script "test" (lance tests back + front)
- [ ] (Optionnel) Intégration continue (GitHub Actions ou autre)

## 7) Documentation finale
- [x] README avec instructions pour lancer "npm run dev"
- [x] Exemple d'utilisation (comment importer un pdf, générer un quiz, exporter, etc.)

## Corrections et améliorations récentes
- [x] Ajout de la dépendance `uuid` dans package.json
- [x] Correction de la fonction de récupération des questions dans quizRoutes.ts (remplacement de `getQuestionsByDocId('*')` par `getAllQuestions()`)
- [x] Mise à jour des routes d'exportation pour utiliser `getValidatedQuestions()` au lieu de `getAllQuestions()`
- [x] Création des interfaces `DbDocument` et `DbQuestion` dans db.ts
- [x] Correction des types de retour des fonctions de base de données
- [x] Installation des types TypeScript manquants (@types/express, @types/cors, @types/node, @types/multer, @types/uuid, @types/jest)
