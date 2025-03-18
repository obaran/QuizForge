import { exportGift, exportMoodleXml } from '../services/exportService';
import { Question, QuestionType, TestMode, Difficulty } from '../models/types';

describe('Export Service', () => {
  // Sample questions for testing
  const sampleQuestions: Question[] = [
    {
      id: 'q1',
      docId: 'doc1',
      text: 'What is the capital of France?',
      questionType: 'qcm_simple' as QuestionType,
      testMode: 'admission' as TestMode,
      difficulty: 'debutant' as Difficulty,
      answers: [
        { id: 'a1', text: 'Paris', isCorrect: true },
        { id: 'a2', text: 'London', isCorrect: false },
        { id: 'a3', text: 'Berlin', isCorrect: false },
        { id: 'a4', text: 'Madrid', isCorrect: false }
      ],
      validated: true,
      createdAt: '2023-01-01T00:00:00.000Z'
    },
    {
      id: 'q2',
      docId: 'doc1',
      text: 'Which of the following are planets in our solar system?',
      questionType: 'qcm_multiple' as QuestionType,
      testMode: 'niveau' as TestMode,
      difficulty: 'intermediaire' as Difficulty,
      answers: [
        { id: 'a5', text: 'Earth', isCorrect: true },
        { id: 'a6', text: 'Jupiter', isCorrect: true },
        { id: 'a7', text: 'Sun', isCorrect: false },
        { id: 'a8', text: 'Moon', isCorrect: false }
      ],
      validated: true,
      createdAt: '2023-01-01T00:00:00.000Z'
    },
    {
      id: 'q3',
      docId: 'doc1',
      text: 'Match the countries with their capitals',
      questionType: 'association' as QuestionType,
      testMode: 'final' as TestMode,
      difficulty: 'avance' as Difficulty,
      answers: [
        { id: 'a9', text: 'France', isCorrect: true },
        { id: 'a10', text: 'Paris', isCorrect: true },
        { id: 'a11', text: 'Germany', isCorrect: true },
        { id: 'a12', text: 'Berlin', isCorrect: true }
      ],
      validated: true,
      createdAt: '2023-01-01T00:00:00.000Z'
    }
  ];

  describe('exportGift', () => {
    it('should export questions in GIFT format', () => {
      // Call the function
      const result = exportGift(sampleQuestions);
      
      // Check the result
      expect(result).toContain('::Question q1::');
      expect(result).toContain('What is the capital of France?');
      expect(result).toContain('= Paris');
      expect(result).toContain('~ London');
      
      expect(result).toContain('::Question q2::');
      expect(result).toContain('Which of the following are planets in our solar system?');
      expect(result).toContain('~%50% Earth');
      expect(result).toContain('~%50% Jupiter');
      expect(result).toContain('~%-50% Sun');
      expect(result).toContain('~%-50% Moon');
      
      expect(result).toContain('::Question q3::');
      expect(result).toContain('Match the countries with their capitals');
      expect(result).toContain('=France -> Paris');
      expect(result).toContain('=Germany -> Berlin');
    });

    it('should return an empty string for empty questions array', () => {
      // Call the function with an empty array
      const result = exportGift([]);
      
      // Check the result
      expect(result).toBe('');
    });
  });

  describe('exportMoodleXml', () => {
    it('should export questions in Moodle XML format', () => {
      // Call the function
      const result = exportMoodleXml(sampleQuestions);
      
      // Check the result
      expect(result).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(result).toContain('<quiz>');
      expect(result).toContain('</quiz>');
      
      expect(result).toContain('<question type="multichoice">');
      expect(result).toContain('<name><text>Question q1</text></name>');
      expect(result).toContain('<questiontext format="html"><text><![CDATA[What is the capital of France?]]></text></questiontext>');
      expect(result).toContain('<single>true</single>');
      expect(result).toContain('<answer fraction="100" format="html">');
      expect(result).toContain('<text><![CDATA[Paris]]></text>');
      expect(result).toContain('<answer fraction="0" format="html">');
      expect(result).toContain('<text><![CDATA[London]]></text>');
      
      expect(result).toContain('<question type="multichoice">');
      expect(result).toContain('<name><text>Question q2</text></name>');
      expect(result).toContain('<questiontext format="html"><text><![CDATA[Which of the following are planets in our solar system?]]></text></questiontext>');
      expect(result).toContain('<single>false</single>');
      
      expect(result).toContain('<question type="matching">');
      expect(result).toContain('<name><text>Question q3</text></name>');
      expect(result).toContain('<questiontext format="html"><text><![CDATA[Match the countries with their capitals]]></text></questiontext>');
      expect(result).toContain('<subquestion format="html">');
      expect(result).toContain('<text><![CDATA[France]]></text>');
      expect(result).toContain('<answer><text><![CDATA[Paris]]></text></answer>');
    });

    it('should return a valid XML structure for empty questions array', () => {
      // Call the function with an empty array
      const result = exportMoodleXml([]);
      
      // Check the result
      expect(result).toBe('<?xml version="1.0" encoding="UTF-8"?>\n<quiz>\n</quiz>');
    });
  });
});
