/**
 * A shared stimulus that multiple questions can reference via Question.passageId.
 * Not produced or consumed anywhere yet — this documents the shape future exam
 * types (TOEIC Part 6/7 reading passages, Part 1-4 listening audio) will use,
 * so the eventual parser/UI work has a settled target instead of inventing the
 * shape ad-hoc later.
 *
 * @typedef {Object} Passage
 * @property {string} id
 * @property {'text'|'audio'} kind
 * @property {string} title
 * @property {string} content - plain text for kind 'text', a URL for kind 'audio'
 */
