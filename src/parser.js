export function parseMarkdown(text) {
  const { questions } = parseMarkdownWithPassages(text);
  return questions;
}

// Giống parseMarkdown, nhưng tách riêng các block `kind: passage` (đoạn văn dùng chung,
// ví dụ TOEIC Part 6-7) khỏi câu hỏi thường. Quiz thường không dùng field này nên không
// bị ảnh hưởng — đây là phần mở rộng, không phải thay đổi hành vi cũ.
export function parseMarkdownWithPassages(text) {
  const questions = [];
  const passages = [];
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const blockRe = /^---\n([\s\S]*?)\n---$/gm;
  let match;
  while ((match = blockRe.exec(normalized)) !== null) {
    const yaml = match[1];
    if (!yaml.trim()) continue;
    const obj = parseYamlBlockRaw(yaml);
    if (!obj) continue;
    if (obj.kind === 'passage') {
      // media: 'audio' đánh dấu đây là nhóm audio dùng chung (TOEIC Listening Part 3-4) — không
      // cần content text, audio thật được khớp riêng theo number của câu hỏi (xem features/audio-library).
      // Không có media (mặc định) là đoạn văn đọc hiểu (Part 6-7), luôn cần content.
      const isAudio = obj.media === 'audio';
      if (obj.id && (isAudio || obj.content)) {
        passages.push({ id: obj.id, kind: isAudio ? 'audio' : 'text', title: obj.title || '', content: obj.content || '' });
      }
      continue;
    }
    const q = buildQuestion(obj);
    if (q && q.question && q.options) questions.push(q);
  }
  return { questions, passages };
}

// Exported để các parser khác (vd exam-types/vocab) tái dùng cú pháp YAML-ish này cho block
// --- ... --- của riêng chúng, thay vì viết lại 1 parser tương tự.
export function parseYamlBlockRaw(yaml) {
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
        const dashIndent = lines[i].match(/^(\s*)-\s/)[1].length;
        const arr = [];
        while (i < lines.length && lines[i].match(new RegExp(`^\\s{${dashIndent}}-\\s`))) {
          const firstLine = lines[i].replace(new RegExp(`^\\s{${dashIndent}}-\\s`), '');
          const firstKv = firstLine.match(/^(\w[\w_-]*):\s*(.*)/);
          i++;
          if (firstKv) {
            // Item là object nhiều key:value (vd "- word: a" rồi các dòng con "  part_of_speech: b")
            // thay vì 1 string trơn — mỗi field liên hệ trong .md (vd synonyms) có thể dùng cả 2
            // dạng, giữ nguyên tương thích ngược cho các list string đơn giản đã có từ trước.
            const item = { [firstKv[1]]: firstKv[2].trim().replace(/^["'](.*)["']$/, '$1') };
            const itemIndent = dashIndent + 2;
            while (i < lines.length && lines[i].match(new RegExp(`^\\s{${itemIndent},}\\w`))) {
              const nkv = lines[i].trim().match(/^(\w[\w_-]*):\s*(.*)/);
              if (nkv) item[nkv[1]] = nkv[2].trim().replace(/^["'](.*)["']$/, '$1');
              i++;
            }
            arr.push(item);
          } else {
            arr.push(firstLine.trim().replace(/^["'](.*)["']$/, '$1'));
          }
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

    return obj;
  } catch {
    return null;
  }
}

function buildQuestion(obj) {
  if (!obj || !obj.options || typeof obj.options !== 'object') return null;
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
    point: obj.point !== undefined && obj.point !== '' ? Number(obj.point) : null,
    // passage_id: gắn câu hỏi vào 1 đoạn văn dùng chung (TOEIC Part 6-7). Rỗng với quiz thường.
    passageId: obj.passage_id || null,
    // part: số Part trong đề TOEIC (5/6/7...), dùng để chọn phần muốn luyện/thi. Rỗng với quiz thường.
    part: obj.part !== undefined && obj.part !== '' ? Number(obj.part) : null,
    // number: số thứ tự câu hỏi thật trong đề (ví dụ TOEIC đánh số 101-200). Dùng để hiển thị
    // đúng số câu dù câu đang ở vị trí nào trong mảng sau khi filter/lọc theo Part — không được
    // suy ra từ index mảng vì index đổi theo bộ lọc đang áp dụng.
    number: obj.number !== undefined && obj.number !== '' ? Number(obj.number) : null,
  };
}
