# QuizForge

A POC application for generating quizzes from documents using Azure OpenAI API.

## Features

- Upload documents (PDF, DOCX, SCORM)
- Extract text from uploaded documents
- Generate questions using Azure OpenAI API
- Configure question types, difficulty levels, and test modes
- Edit and validate generated questions
- Export questions in GIFT or Moodle XML format

## Tech Stack

- **Frontend**: React + TypeScript, using Vite
- **Backend**: Node.js (Express) + TypeScript
- **Database**: SQLite
- **Testing**: Jest (backend), React Testing Library (frontend)

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm run install:all
```

3. Create a `.env` file in the `backend` directory with your API keys:

```
# Azure OpenAI Configuration
AZURE_OPENAI_KEY=your_azure_openai_key_here
AZURE_OPENAI_ENDPOINT=https://your-resource-name.openai.azure.com
AZURE_OPENAI_DEPLOYMENT_NAME=your_deployment_name_here

# Optional: Claude API Configuration (Legacy)
# CLAUDE_API_KEY=your_claude_api_key_here
```

### Azure OpenAI Configuration

The application is configured to use Azure OpenAI API with the following default settings:
- API Key: 10073d56dbaf4362a3cec8c914e0b791
- Endpoint: https://flowise-azure-openai.openai.azure.com
- Deployment Name: azure-gpt4o

### Running the Application

To start both the frontend and backend in development mode:

```bash
npm run dev
```

The frontend will be available at http://localhost:5173 and the backend at http://localhost:3000.

### Testing

To run all tests:

```bash
npm test
```

## Usage

1. **Upload a Document**: Start by uploading a PDF, DOCX, or SCORM file.
2. **Configure Question Generation**: Select the question type, test mode, and difficulty level.
3. **Generate Questions**: Use Azure OpenAI to generate questions based on the document content.
4. **Edit Questions**: Review and edit the generated questions as needed.
5. **Export Questions**: Export the questions in GIFT or Moodle XML format.

## License

ISC
