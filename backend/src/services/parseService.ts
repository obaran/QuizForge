import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import unzipper from 'unzipper';
import { Readable } from 'stream';

/**
 * Parse a PDF file and extract its text content
 * @param filePath Path to the PDF file
 * @returns Extracted text content
 */
export async function parsePDF(filePath: string): Promise<string> {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw new Error(`Failed to parse PDF: ${(error as Error).message}`);
  }
}

/**
 * Parse a DOCX file and extract its text content
 * @param filePath Path to the DOCX file
 * @returns Extracted text content
 */
export async function parseDocx(filePath: string): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  } catch (error) {
    console.error('Error parsing DOCX:', error);
    throw new Error(`Failed to parse DOCX: ${(error as Error).message}`);
  }
}

/**
 * Parse a SCORM zip file and extract text from its content
 * @param filePath Path to the SCORM zip file
 * @returns Extracted text content
 */
export async function parseScorm(filePath: string): Promise<string> {
  try {
    // TODO: Implement full SCORM parsing logic
    // This is a simplified placeholder implementation
    
    const extractedTexts: string[] = [];
    
    // Create a read stream for the zip file
    const zipStream = fs.createReadStream(filePath)
      .pipe(unzipper.Parse());
    
    // Process each entry in the zip file
    for await (const entry of zipStream) {
      const fileName = entry.path;
      const type = entry.type;
      
      // Only process HTML and XML files
      if (type === 'File' && (fileName.endsWith('.html') || fileName.endsWith('.xml'))) {
        const content = await entry.buffer();
        const textContent = content.toString('utf8');
        extractedTexts.push(textContent);
      } else {
        // Skip directories and other file types
        entry.autodrain();
      }
    }
    
    return extractedTexts.join('\n\n');
  } catch (error) {
    console.error('Error parsing SCORM:', error);
    throw new Error(`Failed to parse SCORM: ${(error as Error).message}`);
  }
}

/**
 * Parse a file based on its extension
 * @param filePath Path to the file
 * @returns Extracted text content
 */
export async function parseFile(filePath: string): Promise<string> {
  const extension = path.extname(filePath).toLowerCase();
  
  switch (extension) {
    case '.pdf':
      return parsePDF(filePath);
    case '.docx':
      return parseDocx(filePath);
    case '.zip':
      return parseScorm(filePath);
    default:
      throw new Error(`Unsupported file format: ${extension}`);
  }
}
