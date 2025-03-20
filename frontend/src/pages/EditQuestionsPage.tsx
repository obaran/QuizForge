import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getQuestionsByDocId } from '../services/api';
import { Question, Answer } from '../types';
import { FaEdit, FaCheckCircle, FaSave, FaTimes } from 'react-icons/fa';

const EditQuestionsPage = () => {
  const { docId } = useParams<{ docId: string }>();
  const navigate = useNavigate();
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [originalQuestion, setOriginalQuestion] = useState<Question | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (!docId) {
      navigate('/');
      return;
    }

    // Vérifier si des questions temporaires existent dans sessionStorage
    const tempQuestionsKey = `tempQuestions_${docId}`;
    const storedQuestions = sessionStorage.getItem(tempQuestionsKey);
    
    if (storedQuestions) {
      try {
        const parsedQuestions = JSON.parse(storedQuestions);
        setQuestions(parsedQuestions);
        if (parsedQuestions.length > 0) {
          setEditingQuestion(parsedQuestions[0]);
          setOriginalQuestion(JSON.parse(JSON.stringify(parsedQuestions[0])));
        }
        setLoading(false);
        console.log('Questions chargées depuis le stockage temporaire:', parsedQuestions.length);
      } catch (err) {
        console.error('Erreur lors du chargement des questions temporaires:', err);
        fetchQuestionsFromServer();
      }
    } else {
      fetchQuestionsFromServer();
    }
  }, [docId, navigate]);

  // Fonction pour récupérer les questions depuis le serveur
  const fetchQuestionsFromServer = async () => {
    setLoading(true);
    try {
      const response = await getQuestionsByDocId(docId!);
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Échec de la récupération des questions');
      }
      
      setQuestions(response.data.questions);
      if (response.data.questions.length > 0) {
        setEditingQuestion(response.data.questions[0]);
        setOriginalQuestion(JSON.parse(JSON.stringify(response.data.questions[0])));
      }
      
      // Stocker les questions dans sessionStorage
      sessionStorage.setItem(`tempQuestions_${docId}`, JSON.stringify(response.data.questions));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  // Sauvegarder les questions dans sessionStorage à chaque modification
  useEffect(() => {
    if (questions.length > 0 && docId) {
      sessionStorage.setItem(`tempQuestions_${docId}`, JSON.stringify(questions));
    }
  }, [questions, docId]);

  // Check if the current question has been modified
  useEffect(() => {
    if (editingQuestion && originalQuestion) {
      const currentJson = JSON.stringify({
        text: editingQuestion.text,
        answers: editingQuestion.answers.map(a => ({ id: a.id, text: a.text, isCorrect: a.isCorrect }))
      });
      
      const originalJson = JSON.stringify({
        text: originalQuestion.text,
        answers: originalQuestion.answers.map(a => ({ id: a.id, text: a.text, isCorrect: a.isCorrect }))
      });
      
      setHasChanges(currentJson !== originalJson);
    } else {
      setHasChanges(false);
    }
  }, [editingQuestion, originalQuestion]);

  const handleQuestionTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!editingQuestion || !isEditing) return;
    setEditingQuestion({
      ...editingQuestion,
      text: e.target.value
    });
  };

  const handleAnswerTextChange = (answerId: string, text: string) => {
    if (!editingQuestion || !isEditing) return;
    setEditingQuestion({
      ...editingQuestion,
      answers: editingQuestion.answers.map(answer => 
        answer.id === answerId ? { ...answer, text } : answer
      )
    });
  };

  const handleAnswerCorrectChange = (answerId: string, isCorrect: boolean) => {
    if (!editingQuestion || !isEditing) return;
    
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
      // First, save any changes
      if (hasChanges) {
        await handleSaveQuestion();
      }
      
      // Mettre à jour la question localement
      const updatedQuestion = {
        ...editingQuestion,
        validated: validated
      };
      
      // Mettre à jour l'état local sans appeler l'API
      const updatedQuestions = questions.map(q => 
        q.id === editingQuestion.id ? updatedQuestion : q
      );
      
      setQuestions(updatedQuestions);
      setEditingQuestion(updatedQuestion);
      setOriginalQuestion(JSON.parse(JSON.stringify(updatedQuestion)));
      setIsEditing(false);
      
      // Mettre à jour le stockage temporaire
      sessionStorage.setItem(`tempQuestions_${docId}`, JSON.stringify(updatedQuestions));
      
      console.log('Question validated locally:', validated);
      
      // Move to next question if available
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setEditingQuestion(updatedQuestions[currentIndex + 1]);
        setOriginalQuestion(JSON.parse(JSON.stringify(updatedQuestions[currentIndex + 1])));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    }
  };

  const handleSaveQuestion = async () => {
    if (!editingQuestion || !hasChanges) return;
    
    try {
      // Mettre à jour la question localement sans appeler l'API
      const updatedQuestions = questions.map(q => 
        q.id === editingQuestion.id ? editingQuestion : q
      );
      
      setQuestions(updatedQuestions);
      setOriginalQuestion(JSON.parse(JSON.stringify(editingQuestion)));
      setIsEditing(false);
      setError(null);
      
      // Mettre à jour le stockage temporaire
      sessionStorage.setItem(`tempQuestions_${docId}`, JSON.stringify(updatedQuestions));
      
      console.log('Question saved locally');
      
      return { success: true };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      throw err;
    }
  };

  const handleCancelEdit = () => {
    // Restaurer la question à son état original
    if (originalQuestion) {
      setEditingQuestion(JSON.parse(JSON.stringify(originalQuestion)));
    }
    // Quitter le mode édition
    setIsEditing(false);
  };

  const handleNavigateToQuestion = (index: number) => {
    // Si en mode édition, demander confirmation
    if (isEditing && hasChanges) {
      if (!window.confirm('Vous avez des modifications non enregistrées. Voulez-vous vraiment changer de question ?')) {
        return;
      }
    }
    
    setCurrentIndex(index);
    setEditingQuestion(questions[index]);
    setOriginalQuestion(JSON.parse(JSON.stringify(questions[index])));
    setIsEditing(false);
  };

  const navigateToExport = () => {
    // Vérifier si des questions sont validées
    const validatedQuestions = questions.filter(q => q.validated);
    
    if (validatedQuestions.length === 0) {
      setError('Vous n\'avez validé aucune question. Veuillez valider au moins une question avant d\'exporter.');
      return;
    }
    
    // Stocker les questions validées dans sessionStorage pour l'exportation
    sessionStorage.setItem(`validatedQuestions_${docId}`, JSON.stringify(validatedQuestions));
    
    // Naviguer vers la page d'exportation
    navigate(`/export/${docId}`);
  };

  if (loading) {
    return <div className="loading">Chargement des questions...</div>;
  }

  if (questions.length === 0) {
    return (
      <div className="no-questions">
        <h2>Aucune question disponible</h2>
        <p>Retournez à la page de génération pour créer des questions.</p>
        <button onClick={() => navigate(`/generate/${docId}`)}>
          Retour à la génération
        </button>
      </div>
    );
  }

  if (!editingQuestion) {
    return <div className="error">Erreur: Impossible de charger la question</div>;
  }

  return (
    <div className="edit-questions-page">
      <h1>Édition des Questions</h1>
      
      <div className="questions-navigation">
        <div className="questions-count">
          Question {currentIndex + 1} sur {questions.length}
        </div>
        <div className="pagination">
          {questions.map((q, index) => (
            <button
              key={q.id}
              className={`page-button ${index === currentIndex ? 'active' : ''} ${q.validated ? 'validated' : ''}`}
              onClick={() => handleNavigateToQuestion(index)}
              title={q.validated ? 'Question validée' : 'Question non validée'}
            >
              {index + 1}
              {q.validated && <FaCheckCircle className="validated-icon" />}
            </button>
          ))}
        </div>
      </div>
      
      <div className="question-editor">
        <div className="editor-header">
          <h3>Question</h3>
        </div>
        
        <div className="form-group">
          <textarea
            id="question-text"
            value={editingQuestion.text}
            onChange={handleQuestionTextChange}
            rows={4}
            disabled={!isEditing}
            className={isEditing ? 'editing' : ''}
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
                className="answer-checkbox"
                disabled={!isEditing}
              />
              <input
                type="text"
                value={answer.text}
                onChange={(e) => handleAnswerTextChange(answer.id, e.target.value)}
                className={`answer-text-input ${isEditing ? 'editing' : ''}`}
                disabled={!isEditing}
              />
            </div>
          ))}
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <div className="question-actions">
          {isEditing && (
            <button 
              onClick={handleCancelEdit}
              className="cancel-button"
              title="Annuler les modifications"
            >
              <FaTimes size={18} /> Annuler
            </button>
          )}
          <button 
            onClick={isEditing ? handleSaveQuestion : () => setIsEditing(true)}
            className={`action-button ${isEditing ? 'save-button' : 'edit-button'}`}
            disabled={isEditing && !hasChanges}
            title={isEditing 
              ? (!hasChanges ? "Aucune modification à enregistrer" : "Enregistrer les modifications") 
              : "Modifier la question"
            }
          >
            {isEditing 
              ? <><FaSave size={18} /> Enregistrer</> 
              : <><FaEdit size={18} /> Éditer</>
            }
          </button>
          <button 
            onClick={() => handleValidateQuestion(!editingQuestion.validated)}
            className={`validate-button ${editingQuestion.validated ? 'validated' : ''}`}
          >
            {editingQuestion.validated ? 'Retirer la validation' : 'Valider'}
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
          disabled={questions.filter(q => q.validated).length === 0}
        >
          Exporter les questions
        </button>
      </div>
    </div>
  );
};

export default EditQuestionsPage;
