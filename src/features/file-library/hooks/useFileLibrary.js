import { useState } from 'react'
import { parseMarkdown } from '../../../parser'

// Quản lý thư viện câu hỏi: file .md đã upload, danh sách câu hỏi gộp, và chủ đề suy ra từ đó.
// parseFn: tùy chỉnh cách đọc file .md — mặc định parseMarkdown (chỉ câu hỏi, dùng cho Quiz
// thường). TOEIC/IELTS truyền parseMarkdownWithPassages để giữ lại cả đoạn văn dùng chung.
export function useFileLibrary(saved, { parseFn = parseMarkdown } = {}) {
  const [allQuestions, setAllQuestions] = useState(() => saved.allQuestions ?? [])
  const [files, setFiles] = useState(() => saved.files ?? [])
  const [allPassages, setAllPassages] = useState(() => saved.allPassages ?? [])

  const categories = [...new Set(allQuestions.map(q => q.category).filter(Boolean))]

  const loadFiles = (fileList) => {
    let pending = Array.from(fileList).filter(f => f.name.endsWith('.md')).length
    if (!pending) return
    const incomingQuestions = []
    const incomingPassages = []
    const newFiles = []
    Array.from(fileList).forEach(file => {
      if (!file.name.endsWith('.md')) return
      const reader = new FileReader()
      reader.onload = e => {
        const parsed = parseFn(e.target.result)
        const qs = (Array.isArray(parsed) ? parsed : parsed.questions).map(q => ({ ...q, _sourceFile: file.name }))
        const passages = Array.isArray(parsed) ? [] : (parsed.passages ?? [])
        incomingQuestions.push(...qs)
        incomingPassages.push(...passages)
        newFiles.push({ name: file.name, count: qs.length })
        if (--pending === 0) {
          setAllQuestions(prev => {
            const merged = [...prev]
            incomingQuestions.forEach(q => { if (!merged.find(x => x.id && x.id === q.id)) merged.push(q) })
            return merged
          })
          setAllPassages(prev => {
            const merged = [...prev]
            incomingPassages.forEach(p => { if (!merged.find(x => x.id === p.id)) merged.push(p) })
            return merged
          })
          setFiles(prev => [...prev, ...newFiles.filter(nf => !prev.find(p => p.name === nf.name))])
        }
      }
      reader.readAsText(file)
    })
  }

  const removeFile = (name) => {
    setAllQuestions(prev => prev.filter(q => q._sourceFile !== name))
    setFiles(prev => prev.filter(f => f.name !== name))
  }

  const clearAll = () => {
    setAllQuestions([]); setFiles([]); setAllPassages([])
  }

  return { allQuestions, setAllQuestions, files, setFiles, allPassages, setAllPassages, categories, loadFiles, removeFile, clearAll }
}
