import { Question, Answer } from '../models/types';
import PDFDocument from 'pdfkit';
import { Readable } from 'stream';

/**
 * Export questions in GIFT format
 * @param questions Array of questions to export
 * @returns String in GIFT format
 */
export function exportGift(questions: Question[]): string {
  let giftContent = '';

  for (const question of questions) {
    // Add question title/name
    giftContent += `::Question ${question.id}::`; 
    
    // Add question text
    giftContent += `${question.text} `;
    
    // Handle different question types
    switch (question.questionType) {
      case 'qcm_simple':
        giftContent += '{\n';
        
        // Add answers
        for (const answer of question.answers) {
          const prefix = answer.isCorrect ? '=' : '~';
          giftContent += `  ${prefix} ${answer.text}\n`;
        }
        
        giftContent += '}\n\n';
        break;
        
      case 'qcm_multiple':
        giftContent += '{\n';
        
        // Add answers with appropriate weights
        for (const answer of question.answers) {
          // Calculate the weight based on correctness
          // For correct answers: equal positive weights that sum to 100%
          // For incorrect answers: equal negative weights
          const correctAnswers = question.answers.filter(a => a.isCorrect);
          const incorrectAnswers = question.answers.filter(a => !a.isCorrect);
          
          let prefix;
          if (answer.isCorrect) {
            const weight = Math.round(100 / correctAnswers.length);
            prefix = `~%${weight}%`;
          } else {
            const weight = Math.round(100 / incorrectAnswers.length);
            prefix = `~%-${weight}%`;
          }
          
          giftContent += `  ${prefix} ${answer.text}\n`;
        }
        
        giftContent += '}\n\n';
        break;
        
      case 'association':
        giftContent += '{\n  =';
        
        // Group answers into pairs (assuming even number of answers with alternating correct/incorrect)
        const pairs: string[] = [];
        
        // In an association question, we assume the structure is different
        // We need to pair items that go together
        // For simplicity, we'll assume the answers array contains pairs of items to match
        for (let i = 0; i < question.answers.length; i += 2) {
          if (i + 1 < question.answers.length) {
            pairs.push(`${question.answers[i].text} -> ${question.answers[i + 1].text}`);
          }
        }
        
        giftContent += pairs.join('\n  =');
        giftContent += '\n}\n\n';
        break;
        
      default:
        // Fallback to simple question format
        giftContent += '{\n';
        for (const answer of question.answers) {
          const prefix = answer.isCorrect ? '=' : '~';
          giftContent += `  ${prefix} ${answer.text}\n`;
        }
        giftContent += '}\n\n';
    }
  }

  return giftContent;
}

/**
 * Export questions in Moodle XML format
 * @param questions Array of questions to export
 * @returns String in Moodle XML format
 */
export function exportMoodleXml(questions: Question[]): string {
  let xmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xmlContent += '<quiz>\n';

  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];
    xmlContent += '  <question type="';
    
    // Determine question type
    switch (question.questionType) {
      case 'qcm_simple':
        xmlContent += 'multichoice';
        break;
      case 'qcm_multiple':
        xmlContent += 'multichoice';
        break;
      case 'association':
        xmlContent += 'matching';
        break;
      default:
        xmlContent += 'multichoice';
    }
    
    xmlContent += '">\n';
    
    // Add question metadata with a more recognizable name
    xmlContent += `    <name><text>QuizForge Question ${i + 1}</text></name>\n`;
    xmlContent += `    <questiontext format="html"><text><![CDATA[${question.text}]]></text></questiontext>\n`;
    xmlContent += '    <generalfeedback format="html"><text></text></generalfeedback>\n';
    xmlContent += '    <defaultgrade>1.0</defaultgrade>\n';
    xmlContent += '    <penalty>0.3333333</penalty>\n';
    xmlContent += '    <hidden>0</hidden>\n';
    
    // Handle different question types
    if (question.questionType === 'qcm_simple') {
      xmlContent += '    <single>true</single>\n';
      xmlContent += '    <shuffleanswers>true</shuffleanswers>\n';
      xmlContent += '    <answernumbering>abc</answernumbering>\n';
      
      // Add answers
      for (const answer of question.answers) {
        xmlContent += '    <answer fraction="';
        xmlContent += answer.isCorrect ? '100' : '0';
        xmlContent += '" format="html">\n';
        xmlContent += `      <text><![CDATA[${answer.text}]]></text>\n`;
        xmlContent += '      <feedback format="html"><text></text></feedback>\n';
        xmlContent += '    </answer>\n';
      }
    } else if (question.questionType === 'qcm_multiple') {
      xmlContent += '    <single>false</single>\n';
      xmlContent += '    <shuffleanswers>true</shuffleanswers>\n';
      xmlContent += '    <answernumbering>abc</answernumbering>\n';
      
      // Calculate weights for multiple correct answers
      const correctAnswers = question.answers.filter(a => a.isCorrect);
      const incorrectAnswers = question.answers.filter(a => !a.isCorrect);
      
      // Add answers
      for (const answer of question.answers) {
        xmlContent += '    <answer fraction="';
        
        if (answer.isCorrect) {
          // Distribute 100% among correct answers
          xmlContent += Math.round(100 / correctAnswers.length);
        } else {
          // Distribute negative points among incorrect answers
          xmlContent += Math.round(-100 / incorrectAnswers.length);
        }
        
        xmlContent += '" format="html">\n';
        xmlContent += `      <text><![CDATA[${answer.text}]]></text>\n`;
        xmlContent += '      <feedback format="html"><text></text></feedback>\n';
        xmlContent += '    </answer>\n';
      }
    } else if (question.questionType === 'association') {
      xmlContent += '    <shuffleanswers>true</shuffleanswers>\n';
      
      // Add subquestions (assuming pairs of items to match)
      for (let j = 0; j < question.answers.length; j += 2) {
        if (j + 1 < question.answers.length) {
          xmlContent += '    <subquestion format="html">\n';
          xmlContent += `      <text><![CDATA[${question.answers[j].text}]]></text>\n`;
          xmlContent += `      <answer><text><![CDATA[${question.answers[j + 1].text}]]></text></answer>\n`;
          xmlContent += '    </subquestion>\n';
        }
      }
    }
    
    xmlContent += '  </question>\n';
  }

  xmlContent += '</quiz>';
  return xmlContent;
}

/**
 * Export questions in Aiken format
 * @param questions Array of questions to export
 * @returns String in Aiken format
 */
export function exportAiken(questions: Question[]): string {
  let aikenContent = '';

  for (const question of questions) {
    // Only QCM simple is supported in Aiken format
    if (question.questionType !== 'qcm_simple') {
      continue;
    }
    
    // Add question text
    aikenContent += `${question.text}\n`;
    
    // Add answers
    const answerOptions = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    let correctAnswer = '';
    
    question.answers.forEach((answer, index) => {
      if (index < answerOptions.length) {
        aikenContent += `${answerOptions[index]}. ${answer.text}\n`;
        
        if (answer.isCorrect) {
          correctAnswer = answerOptions[index];
        }
      }
    });
    
    // Add correct answer indicator
    aikenContent += `ANSWER: ${correctAnswer}\n\n`;
  }
  
  return aikenContent;
}

/**
 * Export questions in PDF format
 * @param questions Array of questions to export
 * @returns Buffer containing PDF data
 */
export async function exportPdf(questions: Question[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      // Create a PDF document
      const doc = new PDFDocument({
        margin: 50,
        size: 'A4'
      });
      
      // Collect PDF data chunks
      const chunks: Buffer[] = [];
      const stream = new Readable();
      
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      
      // Add title
      doc.fontSize(18).text('Quiz à compléter', { align: 'center' });
      doc.moveDown();
      
      // Add each question
      questions.forEach((question, index) => {
        // Add question number and text
        doc.fontSize(14).text(`Question ${index + 1}`, { underline: true });
        doc.fontSize(12).text(question.text);
        doc.moveDown(0.5);
        
        // Add question metadata
        doc.fontSize(10)
          .text(`Type: ${getQuestionTypeLabel(question.questionType)} | ` +
                `Difficulté: ${getDifficultyLabel(question.difficulty)}`);
        doc.moveDown(0.5);
        
        // Add answers with checkboxes for students to fill in
        doc.fontSize(12).text('Réponses:');
        
        question.answers.forEach((answer, ansIndex) => {
          // Nettoyer le texte de la réponse pour éliminer tous les caractères spéciaux indésirables
          // Utiliser une approche plus agressive pour éliminer tous les caractères non standards
          let cleanText = answer.text;
          
          // Supprimer les préfixes spécifiques qui causent des problèmes
          cleanText = cleanText.replace(/^[%'Ë○✓\s]+/g, ''); // Supprimer les préfixes problématiques
          cleanText = cleanText.replace(/[%'Ë○✓¡]/g, '');    // Supprimer les caractères spéciaux partout
          cleanText = cleanText.trim();
          
          // Utiliser des lettres pour les options (A, B, C, D) suivies d'une case à cocher vide
          const optionLetter = String.fromCharCode(65 + ansIndex); // A, B, C, D...
          doc.text(`${optionLetter}. □ ${cleanText}`);
        });
        
        // Add space between questions
        doc.moveDown();
      });
      
      // Finalize the PDF
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

// Helper functions for PDF export
function getQuestionTypeLabel(type: string): string {
  switch (type) {
    case 'qcm_simple': return 'QCM (une seule réponse)';
    case 'qcm_multiple': return 'QCM (plusieurs réponses)';
    case 'association': return 'Association';
    default: return type;
  }
}

function getDifficultyLabel(difficulty: string): string {
  switch (difficulty) {
    case 'debutant': return 'Débutant';
    case 'intermediaire': return 'Intermédiaire';
    case 'avance': return 'Avancé';
    default: return difficulty;
  }
}

function getTestModeLabel(mode: string): string {
  switch (mode) {
    case 'admission': return 'Admission';
    case 'niveau': return 'Niveau';
    case 'final': return 'Final';
    default: return mode;
  }
}
