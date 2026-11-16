/**
 * Shape of a vocabulary flashcard, as produced by exam-types/vocab's parser and
 * consumed by features/srs. Separate from question.js/passage.js — a flashcard is
 * self-graded (recall quality 1-4), not multiple-choice, so it does not reuse the
 * quiz-session reveal/answer model at all.
 *
 * @typedef {Object} Flashcard
 * @property {string} id - Unique id, from the .md block or derived from `word`.
 * @property {string} word - The term being learned, e.g. "resilient".
 * @property {string} meaning - Definition/translation shown on the back of the card.
 * @property {string} example - Optional example sentence using the word.
 * @property {string} pronunciation - Optional IPA or phonetic spelling.
 * @property {string} partOfSpeech - Optional, e.g. "noun", "verb", "adjective".
 * @property {string} category - Optional grouping label, e.g. a word list name.
 * @property {string[]} tags - Optional free-form tags for filtering.
 * @property {string[]} wordFamily - Optional, same root word in other forms, e.g. ["decision (n)", "decisive (adj)"].
 * @property {RelatedWord[]} synonyms - Optional, close-meaning words, each classified like the main word (part of speech, meaning) since they often differ in nuance/form.
 * @property {RelatedWord[]} antonyms - Optional, opposite-meaning words, same classified shape as synonyms.
 * @property {string[]} collocations - Optional, fixed phrases the word commonly appears in, e.g. ["make a decision"].
 */

/**
 * A single synonym/antonym entry, classified the same way as the main flashcard (word + part of
 * speech + its own meaning) rather than a bare string, since a close-meaning word can differ in
 * form or nuance from the word it relates to.
 *
 * @typedef {Object} RelatedWord
 * @property {string} word
 * @property {string} partOfSpeech - Optional, may be empty when the .md only gave a bare word.
 * @property {string} meaning - Optional, may be empty when the .md only gave a bare word.
 */

/**
 * Per-card SRS (spaced repetition) progress, kept separate from the Flashcard's own
 * static content so re-importing the same .md file never resets learning progress —
 * progress is keyed by flashcard id and persisted independently (see features/srs).
 *
 * @typedef {Object} CardProgress
 * @property {string} cardId
 * @property {number} easeFactor - Multiplier applied to interval on each review, starts at 2.5.
 * @property {number} intervalDays - Days until the next review is due.
 * @property {number} repetitions - Consecutive successful reviews (quality >= 2).
 * @property {string|null} dueAt - ISO date string; card is due when now >= dueAt.
 * @property {string|null} lastReviewedAt - ISO date string of the last review, or null if never reviewed.
 */

export {}
