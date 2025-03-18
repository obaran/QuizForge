# QuizForge

A POC application for generating quizzes from documents using Claude AI.

## Features

- Upload documents (PDF, DOCX, SCORM)
- Extract text from uploaded documents
- Generate questions using Claude AI
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

3. Create a `.env` file in the `backend` directory with your Claude API key:

```
CLAUDE_API_KEY=your_claude_api_key_here
```

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
3. **Generate Questions**: Use Claude AI to generate questions based on the document content.
4. **Edit Questions**: Review and edit the generated questions as needed.
5. **Export Questions**: Export the questions in GIFT or Moodle XML format.

## License

ISC
