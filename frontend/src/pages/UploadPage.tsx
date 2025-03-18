import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadDocument } from '../services/api';

const UploadPage = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setError('Veuillez sélectionner un fichier');
      return;
    }

    // Validate file extension
    const allowedExtensions = ['.pdf', '.docx', '.zip'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!allowedExtensions.includes(fileExtension)) {
      setError('Type de fichier non valide. Seuls les fichiers PDF, DOCX et ZIP (SCORM) sont acceptés.');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const response = await uploadDocument(file);
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Échec de l\'upload du fichier');
      }
      
      // Navigate to generate page with docId
      navigate(`/generate/${response.data.docId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue lors de l\'upload');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="upload-page">
      <h1>Importer un Document</h1>
      <p className="description">
        Importez un fichier PDF, DOCX ou ZIP (SCORM) pour générer des questions de quiz.
      </p>
      
      <form onSubmit={handleSubmit} className="upload-form">
        <div className="file-input-container">
          <input
            type="file"
            id="file-upload"
            onChange={handleFileChange}
            accept=".pdf,.docx,.zip"
            disabled={isUploading}
          />
          <label htmlFor="file-upload" className="file-input-label">
            {file ? file.name : 'Choisir un fichier'}
          </label>
        </div>
        
        {file && (
          <div className="file-info">
            <p>Nom: {file.name}</p>
            <p>Taille: {(file.size / 1024).toFixed(2)} KB</p>
          </div>
        )}
        
        {error && <div className="error-message">{error}</div>}
        
        <button 
          type="submit" 
          className="submit-button"
          disabled={!file || isUploading}
        >
          {isUploading ? 'Importation en cours...' : 'Importer'}
        </button>
      </form>
    </div>
  );
};

export default UploadPage;
