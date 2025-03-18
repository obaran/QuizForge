import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getQuestionsByDocId, exportQuestions } from '../services/api';
import { ExportFormat } from '../types';

const ExportPage = () => {
  const { docId } = useParams<{ docId: string }>();
  const navigate = useNavigate();
  
  const [validatedCount, setValidatedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        
        const total = response.data.questions.length;
        const validated = response.data.questions.filter(q => q.validated).length;
        
        setTotalCount(total);
        setValidatedCount(validated);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [docId, navigate]);

  const handleExport = (format: ExportFormat) => {
    // Create a link to download the file
    const exportUrl = exportQuestions(format);
    window.open(exportUrl, '_blank');
  };

  if (loading) {
    return <div className="loading">Chargement des informations...</div>;
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

  return (
    <div className="export-page">
      <h1>Exporter les Questions</h1>
      
      <div className="export-info">
        <p>
          Vous avez validé <strong>{validatedCount}</strong> questions sur un total de <strong>{totalCount}</strong>.
        </p>
        
        {validatedCount === 0 ? (
          <div className="warning-message">
            <p>Vous n'avez validé aucune question. Veuillez valider au moins une question avant d'exporter.</p>
            <button 
              onClick={() => navigate(`/edit/${docId}`)}
              className="primary-button"
            >
              Retour à l'édition
            </button>
          </div>
        ) : (
          <div className="export-options">
            <h2>Formats d'exportation disponibles</h2>
            
            <div className="export-format-card">
              <h3>Format GIFT</h3>
              <p>Format texte compatible avec Moodle et d'autres systèmes LMS.</p>
              <button 
                onClick={() => handleExport('gift')}
                className="export-button"
              >
                Exporter en GIFT
              </button>
            </div>
            
            <div className="export-format-card">
              <h3>Format XML Moodle</h3>
              <p>Format XML standard pour l'importation dans Moodle.</p>
              <button 
                onClick={() => handleExport('xml')}
                className="export-button"
              >
                Exporter en XML
              </button>
            </div>
          </div>
        )}
      </div>
      
      <div className="page-actions">
        <button 
          onClick={() => navigate(`/edit/${docId}`)}
          className="secondary-button"
        >
          Retour à l'édition
        </button>
        <button 
          onClick={() => navigate('/')}
          className="secondary-button"
        >
          Nouvelle importation
        </button>
      </div>
    </div>
  );
};

export default ExportPage;
