import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  uploadDocument, 
  uploadReferentiel, 
  getReferentiels, 
  getDocuments, 
  deleteDocument, 
  // deleteReferentiel,  // Commenté car la fonction associée a été retirée
  getDocumentContent,
  // getReferentielContent  // Commenté car la fonction associée a été retirée
} from '../services/api';
import { ReferentielResponse, UploadResponse } from '../types';
import { FaEye, FaTrash, FaFileAlt } from 'react-icons/fa';
import '../styles/UploadPage.css';

const UploadPage = () => {
  // État pour le contenu pédagogique
  const [contentFile, setContentFile] = useState<File | null>(null);
  const [isUploadingContent, setIsUploadingContent] = useState(false);
  const [contentError, setContentError] = useState<string | null>(null);
  const [documents, setDocuments] = useState<UploadResponse[]>([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<UploadResponse | null>(null);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [documentContent, setDocumentContent] = useState<string | null>(null);
  const [isViewingDocument, setIsViewingDocument] = useState(false);
  const [isDeletingDocument, setIsDeletingDocument] = useState(false);
  
  // État pour le référentiel pédagogique
  const [referentielFile, setReferentielFile] = useState<File | null>(null);
  const [isUploadingReferentiel, setIsUploadingReferentiel] = useState(false);
  const [referentielError, setReferentielError] = useState<string | null>(null);
  const [referentiels, setReferentiels] = useState<ReferentielResponse[]>([]);
  const [selectedReferentielId, setSelectedReferentielId] = useState<string | null>(null);
  const [selectedReferentiel, setSelectedReferentiel] = useState<ReferentielResponse | null>(null);
  const [isLoadingReferentiels, setIsLoadingReferentiels] = useState(false);
  const [referentielContent, setReferentielContent] = useState<string | null>(null);
  // Variables commentées car les boutons associés ont été retirés
  // const [isViewingReferentiel, setIsViewingReferentiel] = useState(false);
  // const [isDeletingReferentiel, setIsDeletingReferentiel] = useState(false);
  
  const navigate = useNavigate();

  // Chargement initial des référentiels et documents
  useEffect(() => {
    const fetchReferentiels = async () => {
      setIsLoadingReferentiels(true);
      try {
        const response = await getReferentiels();
        if (response.success && response.data) {
          setReferentiels(response.data.referentiels);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des référentiels:', error);
      } finally {
        setIsLoadingReferentiels(false);
      }
    };

    const fetchDocuments = async () => {
      setIsLoadingDocuments(true);
      try {
        const response = await getDocuments();
        if (response.success && response.data) {
          setDocuments(response.data.documents);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des documents:', error);
      } finally {
        setIsLoadingDocuments(false);
      }
    };

    fetchReferentiels();
    fetchDocuments();
  }, []);

  // Gestion du changement de fichier de contenu pédagogique
  const handleContentFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setContentFile(selectedFile);
    setContentError(null);
    setSelectedDocumentId(null); // Réinitialiser le document sélectionné
  };

  // Gestion du changement de fichier de référentiel
  const handleReferentielFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setReferentielFile(selectedFile);
    setReferentielError(null);
  };

  // Gestion de la sélection d'un référentiel existant
  const handleReferentielSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const refId = e.target.value;
    setSelectedReferentielId(refId);
    
    // Trouver le référentiel correspondant dans la liste
    const selectedRef = referentiels.find(ref => ref.refId === refId);
    if (selectedRef) {
      setSelectedReferentiel(selectedRef);
    }
  };
  
  // Gestion de la sélection d'un document existant
  const handleDocumentSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const docId = e.target.value;
    setSelectedDocumentId(docId === 'none' ? null : docId);
    
    // Mettre à jour le document sélectionné
    if (docId !== 'none') {
      const selectedDoc = documents.find(doc => doc.docId === docId);
      setSelectedDocument(selectedDoc || null);
    } else {
      setSelectedDocument(null);
    }
    
    setContentFile(null); // Réinitialiser le fichier sélectionné
  };
  
  // Générer le quiz et naviguer vers la page d'édition
  const handleGenerateQuiz = () => {
    if (!selectedDocumentId) {
      setContentError('Veuillez sélectionner un document pour générer le quiz');
      return;
    }
    
    // Naviguer vers la page d'édition avec le document sélectionné
    navigate(`/generate/${selectedDocumentId}`);
  };

  // Visualiser le contenu d'un document
  const handleViewDocument = async () => {
    if (!selectedDocumentId) {
      setContentError('Veuillez sélectionner un document');
      return;
    }

    setIsViewingDocument(true);
    try {
      const response = await getDocumentContent(selectedDocumentId);
      if (response.success && response.data) {
        setDocumentContent(response.data.content);
      } else {
        throw new Error(response.error || 'Échec de la récupération du contenu');
      }
    } catch (err) {
      setContentError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsViewingDocument(false);
    }
  };

  // Supprimer un document
  const handleDeleteDocument = async () => {
    if (!selectedDocumentId) {
      setContentError('Veuillez sélectionner un document');
      return;
    }

    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce document ? Cette action est irréversible.')) {
      return;
    }

    setIsDeletingDocument(true);
    try {
      const response = await deleteDocument(selectedDocumentId);
      if (response.success) {
        // Actualiser la liste des documents
        const docResponse = await getDocuments();
        if (docResponse.success && docResponse.data) {
          setDocuments(docResponse.data.documents);
        }
        setSelectedDocumentId(null);
      } else {
        throw new Error(response.error || 'Échec de la suppression du document');
      }
    } catch (err) {
      setContentError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsDeletingDocument(false);
    }
  };

  // Fonctions commentées car les boutons associés ont été retirés
  /*
  // Visualiser le contenu d'un référentiel
  const handleViewReferentiel = async () => {
    if (!selectedReferentielId) {
      setReferentielError('Veuillez sélectionner un référentiel');
      return;
    }

    // setIsViewingReferentiel(true);
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
      // setIsViewingReferentiel(false);
    }
  };

  // Supprimer un référentiel
  const handleDeleteReferentiel = async () => {
    if (!selectedReferentielId) {
      setReferentielError('Veuillez sélectionner un référentiel');
      return;
    }

    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce référentiel ? Cette action est irréversible.')) {
      return;
    }

    // setIsDeletingReferentiel(true);
    try {
      const response = await deleteReferentiel(selectedReferentielId);
      if (response.success) {
        // Actualiser la liste des référentiels
        const refResponse = await getReferentiels();
        if (refResponse.success && refResponse.data) {
          setReferentiels(refResponse.data.referentiels);
        }
        setSelectedReferentielId(null);
      } else {
        throw new Error(response.error || 'Échec de la suppression du référentiel');
      }
    } catch (err) {
      setReferentielError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      // setIsDeletingReferentiel(false);
    }
  };
  */

  // Soumission du formulaire de contenu pédagogique
  const handleContentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contentFile) {
      setContentError('Veuillez sélectionner un fichier');
      return;
    }
    
    setIsUploadingContent(true);
    setContentError(null);
    
    try {
      const response = await uploadDocument(contentFile);
      
      if (response.success && response.data) {
        // Réinitialiser le formulaire
        setContentFile(null);
        
        // Actualiser la liste des documents
        const documentsResponse = await getDocuments();
        if (documentsResponse.success && documentsResponse.data) {
          setDocuments(documentsResponse.data.documents);
          
          // Sélectionner automatiquement le document nouvellement importé
          const newDocument = documentsResponse.data.documents.find(
            doc => doc.filename === response.data?.filename
          );
          if (newDocument) {
            setSelectedDocumentId(newDocument.docId);
            setSelectedDocument(newDocument);
          }
        }
      } else {
        setContentError(`Erreur lors de l'importation: ${response.error}`);
      }
    } catch (error) {
      setContentError(`Erreur lors de l'importation: ${(error as Error).message}`);
    } finally {
      setIsUploadingContent(false);
    }
  };

  // Soumission du formulaire de référentiel
  const handleReferentielSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!referentielFile) {
      setReferentielError('Veuillez sélectionner un fichier');
      return;
    }
    
    setIsUploadingReferentiel(true);
    setReferentielError(null);
    
    try {
      const response = await uploadReferentiel(referentielFile);
      
      if (response.success && response.data) {
        // Réinitialiser le formulaire
        setReferentielFile(null);
        
        // Actualiser la liste des référentiels
        const referentielsResponse = await getReferentiels();
        if (referentielsResponse.success && referentielsResponse.data) {
          setReferentiels(referentielsResponse.data.referentiels);
          
          // Sélectionner automatiquement le référentiel nouvellement importé
          const newReferentiel = referentielsResponse.data.referentiels.find(
            ref => ref.filename === response.data?.filename
          );
          if (newReferentiel) {
            setSelectedReferentielId(newReferentiel.refId);
            setSelectedReferentiel(newReferentiel);
          }
        }
      } else {
        setReferentielError(`Erreur lors de l'importation: ${response.error}`);
      }
    } catch (error) {
      setReferentielError(`Erreur lors de l'importation: ${(error as Error).message}`);
    } finally {
      setIsUploadingReferentiel(false);
    }
  };

  return (
    <div className="upload-page-container">
      <div className="upload-page-content">
        <h1>Générateur de Quiz</h1>
        
        {/* Section Référentiel pédagogique */}
        <section className="referentiel-section">
          <h2>Référentiel pédagogique</h2>
          <p className="description">
            Importez un référentiel pédagogique au format XLS, DOCX ou PDF pour guider la génération de questions.
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
                  >
                    <option value="none">Sélectionner un référentiel</option>
                    {referentiels.map(ref => (
                      <option key={ref.refId} value={ref.refId}>
                        {ref.filename}
                      </option>
                    ))}
                  </select>
                </div>
                
              </div>
            ) : (
              <p className="no-referentiels-message">
                Aucun référentiel importé. Veuillez importer un référentiel pédagogique pour continuer.
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
          </div>
          
          <div className="separator">
            <span>OU</span>
          </div>
          
          <form onSubmit={handleReferentielSubmit} className="upload-form">
            <div className="file-input-container">
              <input
                type="file"
                id="referentiel-upload"
                onChange={handleReferentielFileChange}
                accept=".pdf,.docx,.xls,.xlsx"
                disabled={isUploadingReferentiel}
              />
              <label htmlFor="referentiel-upload" className="file-input-label">
                {referentielFile ? referentielFile.name : 'Importer un référentiel'}
              </label>
            </div>
            
            {referentielFile && (
              <div className="file-info">
                <p>Nom: {referentielFile.name}</p>
                <p>Taille: {(referentielFile.size / 1024).toFixed(2)} KB</p>
              </div>
            )}
            
            {referentielError && <div className="error-message">{referentielError}</div>}
            
            <button 
              type="submit" 
              className="submit-button"
              disabled={!referentielFile || isUploadingReferentiel}
            >
              {isUploadingReferentiel ? 'Importation en cours...' : 'Valider l\'import'}
            </button>
          </form>
        </section>
        
        {/* Section Contenu pédagogique */}
        <section className="content-section">
          <h2>Contenu pédagogique à utiliser</h2>
          <p className="description">
            Importez un contenu pédagogique au format PDF, DOCX, ZIP (SCORM), TXT ou HTML pour générer des questions de quiz.
          </p>
          
          {/* Liste des documents existants */}
          <div className="documents-list">
            <h3>Documents disponibles</h3>
            {isLoadingDocuments ? (
              <p>Chargement des documents...</p>
            ) : documents.length > 0 ? (
              <div className="file-management">
                <div className="select-container">
                  <select 
                    value={selectedDocumentId || 'none'} 
                    onChange={handleDocumentSelect}
                    className="document-select"
                    disabled={isUploadingContent}
                  >
                    <option value="none">Sélectionner un document existant</option>
                    {documents.map(doc => (
                      <option key={doc.docId} value={doc.docId}>
                        {doc.filename}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="file-actions">
                  <button 
                    onClick={handleViewDocument}
                    className="action-button view-button"
                    disabled={!selectedDocumentId || isViewingDocument}
                    title="Voir le contenu du document"
                  >
                    <FaEye /> {isViewingDocument ? 'Chargement...' : 'Voir'}
                  </button>
                  
                  <button 
                    onClick={handleDeleteDocument}
                    className="action-button delete-button"
                    disabled={!selectedDocumentId || isDeletingDocument}
                    title="Supprimer le document"
                  >
                    <FaTrash /> {isDeletingDocument ? 'Suppression...' : 'Supprimer'}
                  </button>
                </div>
              </div>
            ) : (
              <p className="no-documents-message">
                Aucun document importé. Veuillez importer un contenu pédagogique pour continuer.
              </p>
            )}
            
            {selectedDocument && (
              <div className="selected-file-info">
                <h4>Document sélectionné</h4>
                <div className="selected-file-details">
                  <FaFileAlt className="file-icon" />
                  <div className="file-details">
                    <p className="file-name">{selectedDocument.filename}</p>
                    <p className="file-date">Importé le {new Date(selectedDocument.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            )}
            
            {documentContent && (
              <div className="content-preview">
                <h4>Contenu du document</h4>
                <div className="content-container">
                  <pre>{documentContent.substring(0, 1000)}{documentContent.length > 1000 ? '...' : ''}</pre>
                </div>
                <button 
                  onClick={() => setDocumentContent(null)} 
                  className="close-preview-button"
                >
                  Fermer l'aperçu
                </button>
              </div>
            )}
          </div>
          
          <div className="separator">
            <span>OU</span>
          </div>
          
          <form onSubmit={handleContentSubmit} className="upload-form">
            <div className="file-input-container">
              <input
                type="file"
                id="content-upload"
                onChange={handleContentFileChange}
                accept=".pdf,.docx,.zip,.txt,.html"
                disabled={isUploadingContent}
              />
              <label htmlFor="content-upload" className="file-input-label">
                {contentFile ? contentFile.name : 'Importer contenu pédagogique'}
              </label>
            </div>
            
            {contentFile && (
              <div className="file-info">
                <p>Nom: {contentFile.name}</p>
                <p>Taille: {(contentFile.size / 1024).toFixed(2)} KB</p>
              </div>
            )}
            
            {contentError && <div className="error-message">{contentError}</div>}
            
            <button 
              type="submit" 
              className="submit-button"
              disabled={!contentFile || isUploadingContent}
            >
              {isUploadingContent ? 'Importation en cours...' : 'Valider l\'import'}
            </button>
          </form>
          
          {selectedDocumentId && (
            <div className="generate-section">
              <button 
                onClick={handleGenerateQuiz}
                className="generate-button"
                disabled={!selectedDocumentId || isUploadingContent}
              >
                Générer le quiz
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default UploadPage;
