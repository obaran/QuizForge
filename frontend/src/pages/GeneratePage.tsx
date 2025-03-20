import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { generateQuestions, getReferentiels, getReferentielContent } from '../services/api';
import { QuestionType, TestMode, Difficulty, ReferentielResponse } from '../types';
import { FaEye, FaFileAlt } from 'react-icons/fa';
import '../styles/GeneratePage.css';

const GeneratePage = () => {
  const { docId } = useParams<{ docId: string }>();
  const navigate = useNavigate();
  
  const [questionType, setQuestionType] = useState<QuestionType>('qcm_simple');
  const [testMode, setTestMode] = useState<TestMode>('niveau');
  const [difficulty, setDifficulty] = useState<Difficulty>('intermediaire');
  const [numberOfQuestions, setNumberOfQuestions] = useState<number>(5);
  const [customNumberInput, setCustomNumberInput] = useState<string>('');
  const [useCustomNumber, setUseCustomNumber] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // États pour le référentiel
  const [referentiels, setReferentiels] = useState<ReferentielResponse[]>([]);
  const [selectedReferentielId, setSelectedReferentielId] = useState<string | null>(null);
  const [selectedReferentiel, setSelectedReferentiel] = useState<ReferentielResponse | null>(null);
  const [isLoadingReferentiels, setIsLoadingReferentiels] = useState(false);
  const [referentielContent, setReferentielContent] = useState<string | null>(null);
  const [isViewingReferentiel, setIsViewingReferentiel] = useState(false);
  const [referentielError, setReferentielError] = useState<string | null>(null);

  useEffect(() => {
    if (!docId) {
      navigate('/');
    }
    
    // Charger les référentiels disponibles
    const fetchReferentiels = async () => {
      setIsLoadingReferentiels(true);
      try {
        const response = await getReferentiels();
        if (response.success && response.data) {
          setReferentiels(response.data.referentiels);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des référentiels:', error);
        setReferentielError('Erreur lors du chargement des référentiels');
      } finally {
        setIsLoadingReferentiels(false);
      }
    };

    fetchReferentiels();
  }, [docId, navigate]);

  const handleGenerate = async () => {
    if (!docId) {
      setError('ID du document manquant');
      return;
    }

    // Vérifier que le nombre de questions est valide
    const questionsToGenerate = useCustomNumber ? parseInt(customNumberInput, 10) : numberOfQuestions;
    
    if (isNaN(questionsToGenerate) || questionsToGenerate < 1 || questionsToGenerate > 50) {
      setError('Le nombre de questions doit être entre 1 et 50');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await generateQuestions({
        docId,
        questionType,
        testMode,
        difficulty,
        numberOfQuestions: questionsToGenerate,
        refId: selectedReferentielId // Ajouter l'ID du référentiel sélectionné
      });

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Échec de la génération des questions');
      }

      // Stocker les questions générées dans sessionStorage
      const tempQuestionsKey = `tempQuestions_${docId}`;
      sessionStorage.setItem(tempQuestionsKey, JSON.stringify(response.data.questions));
      console.log(`${response.data.questions.length} questions stockées dans sessionStorage`);

      // Navigate to edit questions page
      navigate(`/edit/${docId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue lors de la génération');
    } finally {
      setIsGenerating(false);
    }
  };

  // Gérer le changement du nombre de questions prédéfini
  const handleNumberOfQuestionsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'custom') {
      setUseCustomNumber(true);
    } else {
      setUseCustomNumber(false);
      setNumberOfQuestions(parseInt(value, 10));
    }
  };

  // Gérer le changement du nombre personnalisé
  const handleCustomNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomNumberInput(e.target.value);
  };

  // Gestion de la sélection d'un référentiel
  const handleReferentielSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const refId = e.target.value;
    setSelectedReferentielId(refId === 'none' ? null : refId);
    
    // Trouver le référentiel correspondant dans la liste
    if (refId !== 'none') {
      const selectedRef = referentiels.find(ref => ref.refId === refId);
      setSelectedReferentiel(selectedRef || null);
    } else {
      setSelectedReferentiel(null);
    }
  };

  // Visualiser le contenu d'un référentiel
  const handleViewReferentiel = async () => {
    if (!selectedReferentielId) {
      setReferentielError('Veuillez sélectionner un référentiel');
      return;
    }

    setIsViewingReferentiel(true);
    try {
      const response = await getReferentielContent(selectedReferentielId);
      if (response.success && response.data) {
        setReferentielContent(response.data.content);
      } else {
        throw new Error(response.error || 'Échec de la récupération du contenu');
      }
    } catch (err) {
      setReferentielError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsViewingReferentiel(false);
    }
  };

  return (
    <div className="generate-page">
      <h1>Générer des Questions</h1>
      <p className="description">
        Configurez les paramètres pour générer des questions à partir de votre document.
      </p>

      {/* Section Référentiel */}
      <div className="referentiel-section">
        <h2>Référentiel pédagogique (optionnel)</h2>
        <p className="description">
          Sélectionnez un référentiel pour guider la génération des questions.
        </p>

        {/* Liste des référentiels existants */}
        <div className="referentiels-list">
          <h3>Référentiels disponibles</h3>
          {isLoadingReferentiels ? (
            <p>Chargement des référentiels...</p>
          ) : referentiels.length > 0 ? (
            <div className="file-management">
              <div className="select-container">
                <select 
                  value={selectedReferentielId || 'none'} 
                  onChange={handleReferentielSelect}
                  className="referentiel-select"
                  disabled={isGenerating}
                >
                  <option value="none">Aucun référentiel (optionnel)</option>
                  {referentiels.map(ref => (
                    <option key={ref.refId} value={ref.refId}>
                      {ref.filename}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="file-actions">
                <button 
                  onClick={handleViewReferentiel}
                  className="action-button view-button"
                  disabled={!selectedReferentielId || isViewingReferentiel || isGenerating}
                  title="Voir le contenu du référentiel"
                >
                  <FaEye /> {isViewingReferentiel ? 'Chargement...' : 'Voir'}
                </button>
              </div>
            </div>
          ) : (
            <p className="no-referentiels-message">
              Aucun référentiel importé. L'utilisation d'un référentiel est optionnelle.
            </p>
          )}
          
          {selectedReferentiel && (
            <div className="selected-file-info">
              <h4>Référentiel sélectionné</h4>
              <div className="selected-file-details">
                <FaFileAlt className="file-icon" />
                <div className="file-details">
                  <p className="file-name">{selectedReferentiel.filename}</p>
                  <p className="file-date">Importé le {new Date(selectedReferentiel.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          )}
          
          {referentielContent && (
            <div className="content-preview">
              <h4>Contenu du référentiel</h4>
              <div className="content-container">
                <pre>{referentielContent.substring(0, 1000)}{referentielContent.length > 1000 ? '...' : ''}</pre>
              </div>
              <button 
                onClick={() => setReferentielContent(null)} 
                className="close-preview-button"
              >
                Fermer l'aperçu
              </button>
            </div>
          )}

          {referentielError && <div className="error-message">{referentielError}</div>}
        </div>
      </div>

      <div className="generate-form">
        <div className="form-group">
          <label htmlFor="question-type">Type de questions</label>
          <select
            id="question-type"
            value={questionType}
            onChange={(e) => setQuestionType(e.target.value as QuestionType)}
            disabled={isGenerating}
          >
            <option value="qcm_simple">QCM (une seule réponse)</option>
            <option value="qcm_multiple">QCM (plusieurs réponses)</option>
            <option value="association">Association</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="test-mode">Mode de test</label>
          <select
            id="test-mode"
            value={testMode}
            onChange={(e) => setTestMode(e.target.value as TestMode)}
            disabled={isGenerating}
          >
            <option value="admission">Admission</option>
            <option value="niveau">Niveau</option>
            <option value="final">Final</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="difficulty">Niveau de difficulté</label>
          <select
            id="difficulty"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as Difficulty)}
            disabled={isGenerating}
          >
            <option value="debutant">Débutant</option>
            <option value="intermediaire">Intermédiaire</option>
            <option value="avance">Avancé</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="number-of-questions">Nombre de questions</label>
          <select
            id="number-of-questions"
            value={useCustomNumber ? 'custom' : numberOfQuestions.toString()}
            onChange={handleNumberOfQuestionsChange}
            disabled={isGenerating}
          >
            <option value="5">5 questions</option>
            <option value="10">10 questions</option>
            <option value="15">15 questions</option>
            <option value="20">20 questions</option>
            <option value="25">25 questions</option>
            <option value="30">30 questions</option>
            <option value="40">40 questions</option>
            <option value="50">50 questions</option>
            <option value="custom">Personnalisé...</option>
          </select>
        </div>

        {useCustomNumber && (
          <div className="form-group">
            <label htmlFor="custom-number">Nombre personnalisé (1-50)</label>
            <input
              id="custom-number"
              type="number"
              min="1"
              max="50"
              value={customNumberInput}
              onChange={handleCustomNumberChange}
              placeholder="Entrez un nombre entre 1 et 50"
              disabled={isGenerating}
              className="custom-number-input"
            />
          </div>
        )}

        {error && <div className="error-message">{error}</div>}

        <div className="actions">
          <button 
            onClick={() => navigate('/')}
            className="secondary-button"
            disabled={isGenerating}
          >
            Retour
          </button>
          <button 
            onClick={handleGenerate}
            className="primary-button"
            disabled={isGenerating}
          >
            {isGenerating ? 'Génération en cours...' : 'Générer les questions'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GeneratePage;
