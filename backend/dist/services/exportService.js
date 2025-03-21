"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportGift = exportGift;
exports.exportMoodleXml = exportMoodleXml;
/**
 * Export questions in GIFT format
 * @param questions Array of questions to export
 * @returns String in GIFT format
 */
function exportGift(questions) {
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
                    }
                    else {
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
                const pairs = [];
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
function exportMoodleXml(questions) {
    let xmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xmlContent += '<quiz>\n';
    for (const question of questions) {
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
        // Add question metadata
        xmlContent += `    <name><text>Question ${question.id}</text></name>\n`;
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
        }
        else if (question.questionType === 'qcm_multiple') {
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
                }
                else {
                    // Distribute negative points among incorrect answers
                    xmlContent += Math.round(-100 / incorrectAnswers.length);
                }
                xmlContent += '" format="html">\n';
                xmlContent += `      <text><![CDATA[${answer.text}]]></text>\n`;
                xmlContent += '      <feedback format="html"><text></text></feedback>\n';
                xmlContent += '    </answer>\n';
            }
        }
        else if (question.questionType === 'association') {
            xmlContent += '    <shuffleanswers>true</shuffleanswers>\n';
            // Add subquestions (assuming pairs of items to match)
            for (let i = 0; i < question.answers.length; i += 2) {
                if (i + 1 < question.answers.length) {
                    xmlContent += '    <subquestion format="html">\n';
                    xmlContent += `      <text><![CDATA[${question.answers[i].text}]]></text>\n`;
                    xmlContent += `      <answer><text><![CDATA[${question.answers[i + 1].text}]]></text></answer>\n`;
                    xmlContent += '    </subquestion>\n';
                }
            }
        }
        xmlContent += '  </question>\n';
    }
    xmlContent += '</quiz>';
    return xmlContent;
}
//# sourceMappingURL=exportService.js.map