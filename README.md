# QuizForge

Application pour générer des quiz à partir de documents pédagogiques en utilisant l'API Azure OpenAI.

## Fonctionnalités

- Import de documents pédagogiques (PDF, DOCX)
- Import de référentiels pédagogiques pour guider la génération de questions
- Extraction de texte à partir des documents importés
- Génération de questions en utilisant l'API Azure OpenAI
- Configuration des types de questions, niveaux de difficulté et modes de test
- Édition et validation des questions générées
- Export des questions dans plusieurs formats :
  - GIFT (compatible Moodle)
  - Moodle XML (avec noms de questions préfixés "QuizForge Question")
  - Aiken
  - PDF (format adapté pour les élèves avec cases à cocher)

## Stack Technique

- **Frontend**: React + TypeScript, utilisant Vite
- **Backend**: Node.js (Express) + TypeScript
- **Base de données**: SQLite
- **API IA**: Azure OpenAI (GPT-4o)
- **Parsing de documents**: pdf-parse, mammoth

## Démarrage Rapide

### Prérequis

- Node.js (v14 ou supérieur)
- npm (v6 ou supérieur)

### Installation

1. Cloner le dépôt
2. Installer les dépendances:

```bash
npm run install:all
```

3. Créer un fichier `.env` dans le répertoire `backend` avec vos clés API:

```
# Configuration Azure OpenAI
AZURE_OPENAI_KEY=your_azure_openai_key_here
AZURE_OPENAI_ENDPOINT=https://your-resource-name.openai.azure.com
AZURE_OPENAI_DEPLOYMENT_NAME=your_deployment_name_here
```

### Configuration Azure OpenAI

L'application est configurée pour utiliser l'API Azure OpenAI avec les paramètres par défaut suivants:
- Clé API: 10073d56dbaf4362a3cec8c914e0b791
- Endpoint: https://flowise-azure-openai.openai.azure.com
- Nom du déploiement: azure-gpt4o

### Lancement de l'Application

Pour démarrer à la fois le frontend et le backend en mode développement:

```bash
npm run dev
```

Le frontend sera disponible à l'adresse http://localhost:5173 et le backend à l'adresse http://localhost:3000.

## Utilisation

1. **Import d'un Document**: Commencez par importer un document PDF ou DOCX.
2. **Import d'un Référentiel** (optionnel): Importez un référentiel pédagogique pour guider la génération des questions.
3. **Configuration de la Génération**: Sélectionnez le type de question, le mode de test et le niveau de difficulté.
4. **Génération des Questions**: Utilisez Azure OpenAI pour générer des questions basées sur le contenu du document.
5. **Édition des Questions**: Révisez et modifiez les questions générées selon vos besoins.
6. **Export des Questions**: Exportez les questions dans le format de votre choix (GIFT, Moodle XML, Aiken, PDF).

## Formats d'Export

- **GIFT**: Format texte compatible avec Moodle
- **Moodle XML**: Format XML avec noms de questions préfixés "QuizForge Question" pour une identification facile
- **Aiken**: Format texte simple pour les QCM
- **PDF**: Format adapté pour les élèves avec cases à cocher et sans indication des réponses correctes

## Licence

ISC
