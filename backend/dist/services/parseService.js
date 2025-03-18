"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parsePDF = parsePDF;
exports.parseDocx = parseDocx;
exports.parseScorm = parseScorm;
exports.parseFile = parseFile;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const pdf_parse_1 = __importDefault(require("pdf-parse"));
const mammoth_1 = __importDefault(require("mammoth"));
const unzipper_1 = __importDefault(require("unzipper"));
/**
 * Parse a PDF file and extract its text content
 * @param filePath Path to the PDF file
 * @returns Extracted text content
 */
async function parsePDF(filePath) {
    try {
        const dataBuffer = fs_1.default.readFileSync(filePath);
        const data = await (0, pdf_parse_1.default)(dataBuffer);
        return data.text;
    }
    catch (error) {
        console.error('Error parsing PDF:', error);
        throw new Error(`Failed to parse PDF: ${error.message}`);
    }
}
/**
 * Parse a DOCX file and extract its text content
 * @param filePath Path to the DOCX file
 * @returns Extracted text content
 */
async function parseDocx(filePath) {
    try {
        const result = await mammoth_1.default.extractRawText({ path: filePath });
        return result.value;
    }
    catch (error) {
        console.error('Error parsing DOCX:', error);
        throw new Error(`Failed to parse DOCX: ${error.message}`);
    }
}
/**
 * Parse a SCORM zip file and extract text from its content
 * @param filePath Path to the SCORM zip file
 * @returns Extracted text content
 */
async function parseScorm(filePath) {
    try {
        // TODO: Implement full SCORM parsing logic
        // This is a simplified placeholder implementation
        const extractedTexts = [];
        // Create a read stream for the zip file
        const zipStream = fs_1.default.createReadStream(filePath)
            .pipe(unzipper_1.default.Parse());
        // Process each entry in the zip file
        for await (const entry of zipStream) {
            const fileName = entry.path;
            const type = entry.type;
            // Only process HTML and XML files
            if (type === 'File' && (fileName.endsWith('.html') || fileName.endsWith('.xml'))) {
                const content = await entry.buffer();
                const textContent = content.toString('utf8');
                extractedTexts.push(textContent);
            }
            else {
                // Skip directories and other file types
                entry.autodrain();
            }
        }
        return extractedTexts.join('\n\n');
    }
    catch (error) {
        console.error('Error parsing SCORM:', error);
        throw new Error(`Failed to parse SCORM: ${error.message}`);
    }
}
/**
 * Parse a file based on its extension
 * @param filePath Path to the file
 * @returns Extracted text content
 */
async function parseFile(filePath) {
    const extension = path_1.default.extname(filePath).toLowerCase();
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
//# sourceMappingURL=parseService.js.map