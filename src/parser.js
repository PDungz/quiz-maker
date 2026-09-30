export function parseMarkdown(text) {
  const questions = [];
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const blockRe = /^---\n([\s\S]*?)\n---$/gm;
  let match;
  while ((match = blockRe.exec(normalized)) !== null) {
    const yaml = match[1];
    if (!yaml.trim()) continue;
    const q = parseYamlBlock(yaml);
    if (q && q.question && q.options) questions.push(q);
  }
  return questions;
}

function parseYamlBlock(yaml) {
  try {
    const obj = {};
    const lines = yaml.split('\n');
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];
      const kv = line.match(/^(\w[\w_-]*):\s*(.*)/);
      if (!kv) { i++; continue; }

      const key = kv[1];
      let val = kv[2].trim();

      if (val === '|' || val === '>') {
        i++;
        const blockLines = [];
        const baseIndent = (lines[i] || '').match(/^(\s*)/)[1].length;
        while (i < lines.length) {
          const l = lines[i];
          const indent = l.match(/^(\s*)/)[1].length;
          if (l.trim() === '' || indent >= baseIndent) {
            blockLines.push(l.slice(baseIndent));
            i++;
          } else break;
        }
        obj[key] = blockLines.join('\n').trimEnd();
        continue;
      }

      if (val === '' && i + 1 < lines.length && lines[i + 1].match(/^\s+\w/)) {
        i++;
        const nested = {};
        while (i < lines.length && lines[i].match(/^\s+\w/)) {
          const nkv = lines[i].trim().match(/^(\w+):\s*(.*)/);
          if (nkv) {
            nested[nkv[1]] = nkv[2].trim().replace(/^["'](.*)["']$/, '$1');
          }
          i++;
        }
        obj[key] = nested;
        continue;
      }

      if (val === '' && i + 1 < lines.length && lines[i + 1].match(/^\s+-\s/)) {
        i++;
        const arr = [];
        while (i < lines.length && lines[i].match(/^\s+-\s/)) {
          arr.push(lines[i].replace(/^\s+-\s/, '').trim().replace(/^["'](.*)["']$/, '$1'));
          i++;
        }
        obj[key] = arr;
        continue;
      }

      if (val.startsWith('[')) {
        obj[key] = val.replace(/^\[|\]$/g, '').split(',').map(s => s.trim().replace(/^["'](.*)["']$/, '$1'));
        i++;
        continue;
      }

      // decode escape sequences in quoted strings
      const raw = val.replace(/^["'](.*)["']$/, '$1').replace(/\\n/g, '\n').replace(/\\t/g, '\t');
      obj[key] = raw;
      i++;
    }

    if (!obj.options || typeof obj.options !== 'object') return null;
    if (!obj.question) return null;

    // auto-split question that embeds code after a blank line
    let question = obj.question;
    let code = obj.code || '';
    const code_lang = obj.code_lang || '';

    if (!code && question.includes('\n\n')) {
      const idx = question.indexOf('\n\n');
      const after = question.slice(idx + 2).trim();
      // heuristic: likely code if it has indentation or common code tokens
      if (after && /^\s|\bvoid\b|\bfunc\b|\bdef\b|\bconst\b|\blet\b|\bvar\b|\bmatch\b|\ballow\b|\bclass\b|\bimport\b|[{};=()]/.test(after)) {
        question = question.slice(0, idx).trim();
        code = after;
      }
    }

    return {
      id: obj.id || '',
      category: obj.category || 'General',
      subcategory: obj.subcategory || '',
      difficulty: (obj.difficulty || 'medium').toLowerCase(),
      type: obj.type || 'single_choice',
      question,
      code,
      code_lang,
      options: obj.options,
      correct_answer: Array.isArray(obj.correct_answer)
        ? obj.correct_answer
        : (obj.correct_answer || '').split(',').map(s => s.trim()).filter(Boolean),
      explanation: obj.explanation || '',
      tags: Array.isArray(obj.tags) ? obj.tags : [],
    };
  } catch (e) {
    return null;
  }
}
