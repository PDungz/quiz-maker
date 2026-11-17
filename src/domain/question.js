/**
 * Shape of a question, as produced by parser.js and consumed throughout the app.
 * `passageId` is optional and unused today — it exists so a future exam type
 * (e.g. TOEIC Part 6/7, IELTS Reading) can group several questions under one
 * shared Passage (see ./passage.js) without changing this shape or the code
 * that reads it (isCorrect/getPoint only ever look at a single question).
 *
 * @typedef {Object} Question
 * @property {string} id
 * @property {string} category
 * @property {string} subcategory
 * @property {'easy'|'medium'|'hard'} difficulty
 * @property {'single_choice'|'multiple_choice'} type
 * @property {string} question
 * @property {string} code
 * @property {string} code_lang
 * @property {Record<string, string>} options
 * @property {string[]} correct_answer
 * @property {string} explanation
 * @property {string[]} tags
 * @property {number|null} point
 * @property {string} [_sourceFile]
 * @property {string} [passageId] - reserved for future exam types; undefined today
 * @property {number|null} [part] - TOEIC part number (1-7); null for plain quiz
 * @property {number|null} [number] - real exam question number (e.g. 101-200); null for plain quiz
 * @property {string} [transcript] - TOEIC Listening audio transcript, used by "Nghe & gõ lại" dictation mode
 */
