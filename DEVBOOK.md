# DevBook : QuizForge – Générateur de Quiz IA

## 1) Initialisation du projet
- [x] Créer un dossier principal (ex. poc-quiz-gen)
- [x] Ajouter deux sous-répertoires : backend/ et frontend/
- [x] Init chacun avec un package.json (ou monorepo, si tu préfères)
- [x] Configurer un script "dev" pour lancer le front (Vite) et le back (Express) en parallèle

## 2) Backend – Node + Express + TypeScript
- [x] Installer les dépendances (ex. express, multer, pdf-parse, mammoth, axios, better-sqlite3, etc.)
- [x] Installer les dépendances de dev (ex. typescript, ts-node-dev, jest, ts-jest, supertest, @types/express, etc.)
- [x] Configurer le tsconfig.json et jest.config.js
- [x] Créer un src/index.ts (ou server.ts) qui lance Express
- [x] Créer un répertoire src/routes/ avec quizRoutes.ts (endpoints décrits)
- [x] Créer un répertoire src/services/ pour parseService.ts, aiService.ts et exportService.ts
- [x] Gérer la base SQLite : un db.ts ou config knex
- [x] Écrire les tests TDD (au moins un test unitaire parseService.test.ts, aiService.test.ts, exportService.test.ts + un test d'intégration sur routes)
- [x] Intégrer l'API Azure OpenAI (stockée en .env) et un appel mock dans aiService.ts

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
- [x] Upload (POST /api/upload) → parse doc → stocker en DB
- [x] Upload référentiel (POST /api/upload-referentiel) → parse doc → utiliser pour la génération
- [x] Génération (POST /api/generate-questions) → param testMode + difficulty + questionType → call IA (Azure OpenAI)
- [x] Édition questions (PUT /api/questions/:id) → maj DB
- [x] Export (GET /api/export/gift, /api/export/xml, /api/export/aiken, /api/export/pdf) → formats multiples

## 5) Formats d'export
- [x] Format GIFT (compatible Moodle)
- [x] Format Moodle XML (avec préfixe "QuizForge Question")
- [x] Format Aiken (format texte simple pour QCM)
- [x] Format PDF pour les élèves
  - [x] Sans indication des réponses correctes
  - [x] Avec cases à cocher vides
  - [x] Nettoyage des caractères spéciaux indésirables

## 6) Améliorations de l'IA
- [x] Utilisation de l'API Azure OpenAI (GPT-4o)
- [x] Intégration de référentiels pédagogiques pour guider la génération
- [x] Amélioration des prompts pour des questions plus pertinentes
- [x] Gestion des erreurs et fallback en cas d'échec de l'API

## 7) Scripts & CI
- [x] Script "dev" (concurrently back + front)
- [x] Script "test" (lance tests back + front)
- [x] Script "install:all" pour installer toutes les dépendances

## 8) Documentation
- [x] README complet avec instructions d'installation et d'utilisation
- [x] DEVBOOK avec suivi du développement et des améliorations
- [x] Documentation des formats d'export

## Corrections et améliorations récentes
- [x] Ajout de la dépendance `uuid` dans package.json
- [x] Correction de la fonction de récupération des questions dans quizRoutes.ts
- [x] Mise à jour des routes d'exportation pour utiliser `getValidatedQuestions()`
- [x] Création des interfaces `DbDocument` et `DbQuestion` dans db.ts
- [x] Correction des types de retour des fonctions de base de données
- [x] Amélioration de l'export PDF pour les élèves (suppression des caractères spéciaux indésirables)
- [x] Mise à jour du format d'export PDF avec cases à cocher vides et lettres pour les options
- [x] Nettoyage des textes des réponses pour éliminer les caractères spéciaux
