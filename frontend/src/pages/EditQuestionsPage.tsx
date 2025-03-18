import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getQuestionsByDocId, updateQuestion } from '../services/api';
import { Question, Answer } from '../types';

const EditQuestionsPage = () => {
  const { docId } = useParams<{ docId: string }>();
  const navigate = useNavigate();
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  useEffect(() => {
    if (!docId) {
      navigate('/');
      return;
    }

    const fetchQuestions = async () => {
      setLoading(true);
      try {
        const response = await getQuestionsByDocId(docId);
        
        if (!response.success || !response.data) {
          throw new Error(response.error || 'Échec de la récupération des questions');
        }
        
        setQuestions(response.data.questions);
        if (response.data.questions.length > 0) {
          setEditingQuestion(response.data.questions[0]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [docId, navigate]);

  const handleQuestionTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!editingQuestion) return;
    setEditingQuestion({
      ...editingQuestion,
      text: e.target.value
    });
  };

  const handleAnswerTextChange = (answerId: string, text: string) => {
    if (!editingQuestion) return;
    setEditingQuestion({
      ...editingQuestion,
      answers: editingQuestion.answers.map(answer => 
        answer.id === answerId ? { ...answer, text } : answer
      )
    });
  };

  const handleAnswerCorrectChange = (answerId: string, isCorrect: boolean) => {
    if (!editingQuestion) return;
    
    // For qcm_simple, only one answer can be correct
    if (editingQuestion.questionType === 'qcm_simple' && isCorrect) {
      setEditingQuestion({
        ...editingQuestion,
        answers: editingQuestion.answers.map(answer => ({
          ...answer,
          isCorrect: answer.id === answerId
        }))
      });
    } else {
      setEditingQuestion({
        ...editingQuestion,
        answers: editingQuestion.answers.map(answer => 
          answer.id === answerId ? { ...answer, isCorrect } : answer
        )
      });
    }
  };

  const handleValidateQuestion = async (validated: boolean) => {
    if (!editingQuestion) return;
    
    try {
      const response = await updateQuestion(editingQuestion.id, {
        text: editingQuestion.text,
        answers: editingQuestion.answers,
        validated
      });
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Échec de la mise à jour de la question');
      }
      
      // Update questions array with the updated question
      setQuestions(questions.map(q => 
        q.id === editingQuestion.id ? response.data!.question : q
      ));
      
      // Move to next question if available
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setEditingQuestion(questions[currentIndex + 1]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    }
  };

  const handleSaveQuestion = async () => {
    if (!editingQuestion) return;
    
    try {
      const response = await updateQuestion(editingQuestion.id, {
        text: editingQuestion.text,
        answers: editingQuestion.answers
      });
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Échec de la mise à jour de la question');
      }
      
      // Update questions array with the updated question
      setQuestions(questions.map(q => 
        q.id === editingQuestion.id ? response.data!.question : q
      ));
      
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    }
  };

  const handleNavigateQuestion = (index: number) => {
    if (index >= 0 && index < questions.length) {
      setCurrentIndex(index);
      setEditingQuestion(questions[index]);
      setError(null);
    }
  };

  const navigateToExport = () => {
    navigate(`/export/${docId}`);
  };

  if (loading) {
    return <div className="loading">Chargement des questions...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Erreur</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/')}>Retour à l'accueil</button>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="no-questions">
        <h2>Aucune question disponible</h2>
        <p>Aucune question n'a été générée pour ce document.</p>
        <button onClick={() => navigate(`/generate/${docId}`)}>
          Générer des questions
        </button>
      </div>
    );
  }

  if (!editingQuestion) {
    return null;
  }

  return (
    <div className="edit-questions-page">
      <h1>Édition des Questions</h1>
      
      <div className="question-navigation">
        <span>Question {currentIndex + 1} sur {questions.length}</span>
        <div className="navigation-buttons">
          <button 
            onClick={() => handleNavigateQuestion(currentIndex - 1)}
            disabled={currentIndex === 0}
          >
            Précédent
          </button>
          <button 
            onClick={() => handleNavigateQuestion(currentIndex + 1)}
            disabled={currentIndex === questions.length - 1}
          >
            Suivant
          </button>
        </div>
      </div>
      
      <div className="question-editor">
        <div className="form-group">
          <label htmlFor="question-text">Question</label>
          <textarea
            id="question-text"
            value={editingQuestion.text}
            onChange={handleQuestionTextChange}
            rows={4}
          />
        </div>
        
        <h3>Réponses</h3>
        <div className="answers-list">
          {editingQuestion.answers.map((answer: Answer) => (
            <div key={answer.id} className="answer-item">
              <input
                type={editingQuestion.questionType === 'qcm_simple' ? 'radio' : 'checkbox'}
                checked={answer.isCorrect}
                onChange={(e) => handleAnswerCorrectChange(answer.id, e.target.checked)}
                name="correct-answer"
                id={`answer-${answer.id}`}
              />
              <input
                type="text"
                value={answer.text}
                onChange={(e) => handleAnswerTextChange(answer.id, e.target.value)}
                className="answer-text-input"
              />
            </div>
          ))}
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <div className="question-actions">
          <button 
            onClick={handleSaveQuestion}
            className="save-button"
          >
            Enregistrer
          </button>
          <button 
            onClick={() => handleValidateQuestion(true)}
            className="validate-button"
            disabled={editingQuestion.validated}
          >
            {editingQuestion.validated ? 'Validée' : 'Valider'}
          </button>
        </div>
      </div>
      
      <div className="page-actions">
        <button onClick={() => navigate(`/generate/${docId}`)}>
          Retour
        </button>
        <button 
          onClick={navigateToExport}
          className="export-button"
        >
          Exporter les questions
        </button>
      </div>
    </div>
  );
};

export default EditQuestionsPage;
