import { parseYamlBlockRaw } from '../../parser'

// Đọc file .md chứa bộ từ vựng flashcard — mỗi thẻ là 1 block YAML-ish giữa 2 dấu `---`, cùng
// cú pháp block với câu hỏi Quiz/TOEIC (tái dùng parseYamlBlockRaw, không viết lại parser).
export function parseVocabMarkdown(text) {
  const cards = []
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const blockRe = /^---\n([\s\S]*?)\n---$/gm
  let match
  while ((match = blockRe.exec(normalized)) !== null) {
    const yaml = match[1]
    if (!yaml.trim()) continue
    const obj = parseYamlBlockRaw(yaml)
    if (!obj) continue
    const card = buildFlashcard(obj)
    if (card) cards.push(card)
  }
  return cards
}

// synonyms/antonyms cho phép 2 dạng: string trơn (vd "determine") hoặc object đầy đủ như thẻ
// chính (vd { word: determine, part_of_speech: verb, meaning: "..." }) — chuẩn hoá về cùng 1
// shape object để component hiển thị không phải tự rẽ nhánh theo kiểu dữ liệu.
function normalizeRelatedWord(item) {
  if (typeof item === 'string') return { word: item, partOfSpeech: '', meaning: '' }
  return {
    word: item.word || '',
    partOfSpeech: item.part_of_speech || '',
    meaning: item.meaning || '',
  }
}

function buildFlashcard(obj) {
  if (!obj.word || !obj.meaning) return null
  return {
    id: obj.id || obj.word,
    word: obj.word,
    meaning: obj.meaning,
    example: obj.example || '',
    pronunciation: obj.pronunciation || '',
    partOfSpeech: obj.part_of_speech || '',
    category: obj.category || '',
    tags: Array.isArray(obj.tags) ? obj.tags : [],
    // 4 field liên hệ, giúp học theo nhóm giống cách TOEIC hay hỏi (chọn đúng từ loại trong 1 họ
    // từ, phân biệt từ đồng nghĩa/đối nghĩa gần nghĩa, nhớ cụm cố định đi kèm). word_family và
    // collocations giữ string tự do (tự ghi từ loại gọn trong chuỗi, vd "decision (n)"), còn
    // synonyms/antonyms chuẩn hoá thành object {word, partOfSpeech, meaning} vì mỗi từ gần nghĩa
    // có thể khác từ loại/sắc thái với từ chính, cần phân loại rõ như chính thẻ đó.
    wordFamily: Array.isArray(obj.word_family) ? obj.word_family : [],
    synonyms: Array.isArray(obj.synonyms) ? obj.synonyms.map(normalizeRelatedWord) : [],
    antonyms: Array.isArray(obj.antonyms) ? obj.antonyms.map(normalizeRelatedWord) : [],
    collocations: Array.isArray(obj.collocations) ? obj.collocations : [],
  }
}
