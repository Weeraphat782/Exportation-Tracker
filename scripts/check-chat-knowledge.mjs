import {
  parseModelResponse,
  fallbackResponse,
  normalizeAnswerMarkdown,
  buildPrompt,
} from '../src/lib/chat-knowledge.ts';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const valid = parseModelResponse(
  JSON.stringify({
    answer: 'OMG Cargo coordinates air freight from BKK.',
    suggestions: ['What documents are needed?', 'Which lanes do you serve?', 'Extra one'],
  })
);
assert(valid.answer.includes('OMG Cargo'), 'valid: answer extracted');
assert(valid.suggestions.length === 3, 'valid: suggestions capped at 3');
assert(!valid.fallback, 'valid: not fallback');

const malformed = parseModelResponse('not json at all but readable');
assert(malformed.answer.includes('not json'), 'malformed: plain text used');
assert(!malformed.fallback, 'malformed plain: not fallback');

const empty = parseModelResponse(JSON.stringify({ answer: '', suggestions: [] }));
assert(empty.fallback === true, 'empty answer: fallback');

const fb = fallbackResponse();
assert(fb.fallback === true && fb.answer.includes('cargo@omgexp.com'), 'fallbackResponse');

const collapsedHeading =
  'OMG Cargo ships from BKK to: ## Supported destinations - Germany (Frankfurt) - Switzerland (Zurich)';
const normalized = normalizeAnswerMarkdown(collapsedHeading);
assert(/\n##\s/.test(normalized), 'normalize: heading on own line');
assert((normalized.match(/\n- /g) || []).length >= 2, 'normalize: bullet lines');

const numericRange = normalizeAnswerMarkdown('Shipments of 5 - 10 kg are common.');
assert(!numericRange.includes('\n- '), 'normalize: numeric range not split');

const collapsedTable =
  '| Country | Airports | | :--- | :--- | | Germany | Frankfurt (FRA), Munich (MUC) | | Switzerland | Zurich (ZUR) |';
const tableNorm = normalizeAnswerMarkdown(collapsedTable);
assert(tableNorm.includes('\n|'), 'normalize: table rows split');

const parsedCollapsed = parseModelResponse(
  JSON.stringify({ answer: collapsedHeading, suggestions: ['test'] })
);
assert((parsedCollapsed.answer.match(/\n- /g) || []).length >= 2, 'parseModelResponse applies normalize');

const knowledgeWithDocs = '## Required export documents (cannabis)\n- DBD\n- ภ.ท.32';
const docPrompt = buildPrompt('What documents are needed for cannabis export?', knowledgeWithDocs);
assert(docPrompt.includes('IMPORTANT'), 'buildPrompt: document hint for export question');
const lanePrompt = buildPrompt('Which lanes do you serve?', knowledgeWithDocs);
assert(!lanePrompt.includes('IMPORTANT'), 'buildPrompt: no document hint for lane question');

console.log('check-chat-knowledge: OK');
