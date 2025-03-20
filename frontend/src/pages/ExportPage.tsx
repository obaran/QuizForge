import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { exportTempQuestions } from '../services/api';
import { ExportFormat, Question } from '../types';

const ExportPage = () => {
  const { docId } = useParams<{ docId: string }>();
  const navigate = useNavigate();
  
  const [validatedQuestions, setValidatedQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportInProgress, setExportInProgress] = useState(false);

  useEffect(() => {
    if (!docId) {
      navigate('/');
      return;
    }

    // Récupérer les questions validées depuis sessionStorage
    const storedQuestions = sessionStorage.getItem(`validatedQuestions_${docId}`);
    
    if (storedQuestions) {
      try {
        const parsedQuestions = JSON.parse(storedQuestions);
        setValidatedQuestions(parsedQuestions);
      } catch (err) {
        setError('Erreur lors du chargement des questions temporaires');
      }
    } else {
      // Récupérer toutes les questions temporaires et filtrer les validées
      const tempQuestions = sessionStorage.getItem(`tempQuestions_${docId}`);
      
      if (tempQuestions) {
        try {
          const parsedQuestions = JSON.parse(tempQuestions);
          const validated = parsedQuestions.filter((q: Question) => q.validated);
          setValidatedQuestions(validated);
        } catch (err) {
          setError('Erreur lors du chargement des questions temporaires');
        }
      } else {
        setError('Aucune question disponible pour ce document');
      }
    }
    
    setLoading(false);
  }, [docId, navigate]);

  const handleExport = async (format: ExportFormat) => {
    if (!docId) return;
    
    if (validatedQuestions.length === 0) {
      setError('Vous n\'avez validé aucune question. Veuillez valider au moins une question avant d\'exporter.');
      return;
    }
    
    setExportInProgress(true);
    setError(null);
    
    try {
      // Appeler l'API pour exporter les questions temporaires
      const blob = await exportTempQuestions(format, docId, validatedQuestions);
      
      // Créer un URL pour le blob
      const url = window.URL.createObjectURL(blob);
      
      // Créer un lien pour télécharger le fichier
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      
      // Déterminer le nom du fichier en fonction du format
      let extension = '';
      switch (format) {
        case 'gift':
          extension = 'txt';
          break;
        case 'moodlexml':
          extension = 'xml';
          break;
        case 'aiken':
          extension = 'txt';
          break;
        case 'pdf':
          extension = 'pdf';
          break;
        default:
          extension = 'txt';
      }
      
      a.download = `questions_export.${extension}`;
      document.body.appendChild(a);
      a.click();
      
      // Nettoyer
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError('Erreur lors de l\'exportation des questions');
      console.error('Export error:', err);
    } finally {
      setExportInProgress(false);
    }
  };

  if (loading) {
    return <div className="loading">Chargement des informations...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Erreur</h2>
        <p>{error}</p>
        <button onClick={() => navigate(`/edit/${docId}`)}>Retour à l'édition</button>
      </div>
    );
  }

  return (
    <div className="export-page">
      <h1>Exporter les Questions</h1>
      
      <div className="export-info">
        <p>
          Vous avez <strong>{validatedQuestions.length}</strong> questions validées prêtes à être exportées.
        </p>
        
        {validatedQuestions.length === 0 ? (
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
                disabled={exportInProgress}
              >
                {exportInProgress ? 'Exportation en cours...' : 'Exporter en GIFT'}
              </button>
            </div>
            
            <div className="export-format-card">
              <h3>Format Moodle XML</h3>
              <p>Format XML standard pour l'importation dans Moodle.</p>
              <button 
                onClick={() => handleExport('moodlexml')}
                className="export-button"
                disabled={exportInProgress}
              >
                {exportInProgress ? 'Exportation en cours...' : 'Exporter en Moodle XML'}
              </button>
            </div>
            
            <div className="export-format-card">
              <h3>Format Aiken</h3>
              <p>Format texte simple pour les QCM, compatible avec Moodle.</p>
              <button 
                onClick={() => handleExport('aiken')}
                className="export-button"
                disabled={exportInProgress}
              >
                {exportInProgress ? 'Exportation en cours...' : 'Exporter en Aiken'}
              </button>
            </div>
            
            <div className="export-format-card">
              <h3>Format PDF</h3>
              <p>Document PDF pour impression ou distribution.</p>
              <button 
                onClick={() => handleExport('pdf')}
                className="export-button"
                disabled={exportInProgress}
              >
                {exportInProgress ? 'Exportation en cours...' : 'Exporter en PDF'}
              </button>
            </div>
          </div>
        )}
      </div>
      
      <div className="page-actions">
        <button onClick={() => navigate(`/edit/${docId}`)}>
          Retour à l'édition
        </button>
      </div>
    </div>
  );
};

export default ExportPage;
