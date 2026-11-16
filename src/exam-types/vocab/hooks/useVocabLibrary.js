import { useState } from 'react'
import { parseVocabMarkdown } from '../vocabParser'

// Quản lý bộ từ vựng đã nạp: file .md, danh sách thẻ gộp — giống features/file-library nhưng
// đơn giản hơn (không có khái niệm passage), và KHÔNG cần tái dùng chung vì nội dung thẻ
// (word/meaning) hoàn toàn khác shape câu hỏi multiple-choice.
export function useVocabLibrary(saved = {}) {
  const [allCards, setAllCards] = useState(() => saved.allCards ?? [])
  const [files, setFiles] = useState(() => saved.files ?? [])

  const categories = [...new Set(allCards.map(c => c.category).filter(Boolean))]

  const loadFiles = (fileList) => {
    const mdFiles = Array.from(fileList).filter(f => f.name.endsWith('.md'))
    if (!mdFiles.length) return
    let pending = mdFiles.length
    const incomingCards = []
    const newFiles = []
    mdFiles.forEach(file => {
      const reader = new FileReader()
      reader.onload = e => {
        const cards = parseVocabMarkdown(e.target.result).map(c => ({ ...c, _sourceFile: file.name }))
        incomingCards.push(...cards)
        newFiles.push({ name: file.name, count: cards.length })
        if (--pending === 0) {
          setAllCards(prev => {
            const merged = [...prev]
            incomingCards.forEach(c => { if (!merged.find(x => x.id === c.id)) merged.push(c) })
            return merged
          })
          setFiles(prev => [...prev, ...newFiles.filter(nf => !prev.find(p => p.name === nf.name))])
        }
      }
      reader.readAsText(file)
    })
  }

  const removeFile = (name) => {
    setAllCards(prev => prev.filter(c => c._sourceFile !== name))
    setFiles(prev => prev.filter(f => f.name !== name))
  }

  const clearAll = () => {
    setAllCards([]); setFiles([])
  }

  return { allCards, setAllCards, files, setFiles, categories, loadFiles, removeFile, clearAll }
}
