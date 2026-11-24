import { useState } from 'react'

const AUDIO_NAME_RE = /^q(\d+)\.(mp3|m4a|wav|ogg)$/i
const IMAGE_NAME_RE = /^q(\d+)\.(jpg|jpeg|png|webp)$/i

// Thư viện audio/ảnh cho TOEIC Listening: người dùng chọn cả 1 folder (qua input
// webkitdirectory), app đọc tên file theo quy ước q<number>.<ext> và khớp với field
// `number` của câu hỏi đã nạp từ .md. Không cần chọn đúng Part 3-4 cho từng câu trong nhóm —
// chỉ file của câu đầu nhóm (number nhỏ nhất) mới cần có, vì cả nhóm dùng chung 1 audio.
//
// Audio đọc chậm (tuỳ chọn): đặt trong 1 folder con riêng tên "audio-low" (cùng cấp với
// "audio"/"image"), file cùng tên q<number>.<ext> như bản gốc — KHÔNG phải cùng file đổi tốc độ
// phát (playbackRate), mà là 1 file audio thật đọc chậm riêng do người tạo đề tự gen. Thiếu
// audio-low cho câu nào thì câu đó chỉ có nút nghe bản Gốc, không hiện lựa chọn Low.
export function useAudioLibrary(saved = {}) {
  const [audioByNumber, setAudioByNumber] = useState(() => saved.audioByNumber ?? {})
  const [audioLowByNumber, setAudioLowByNumber] = useState(() => saved.audioLowByNumber ?? {})
  const [imageByNumber, setImageByNumber] = useState(() => saved.imageByNumber ?? {})
  const [audioFolderName, setAudioFolderName] = useState(() => saved.audioFolderName ?? '')
  const [unmatchedFiles, setUnmatchedFiles] = useState([])

  const loadAudioFolder = (fileList) => {
    const files = Array.from(fileList)
    if (!files.length) return

    const nextAudio = {}
    const nextAudioLow = {}
    const nextImage = {}
    const unmatched = []
    let folderName = ''

    files.forEach(file => {
      const relPath = file.webkitRelativePath || file.name
      if (!folderName && relPath.includes('/')) folderName = relPath.split('/')[0]
      const segments = relPath.split('/')
      const isLowFolder = segments.some(seg => seg.toLowerCase() === 'audio-low')
      const name = file.name
      const audioMatch = name.match(AUDIO_NAME_RE)
      const imageMatch = name.match(IMAGE_NAME_RE)
      if (audioMatch && isLowFolder) {
        nextAudioLow[Number(audioMatch[1])] = URL.createObjectURL(file)
      } else if (audioMatch) {
        nextAudio[Number(audioMatch[1])] = URL.createObjectURL(file)
      } else if (imageMatch) {
        nextImage[Number(imageMatch[1])] = URL.createObjectURL(file)
      } else {
        unmatched.push(name)
      }
    })

    setAudioByNumber(prev => ({ ...prev, ...nextAudio }))
    setAudioLowByNumber(prev => ({ ...prev, ...nextAudioLow }))
    setImageByNumber(prev => ({ ...prev, ...nextImage }))
    setAudioFolderName(folderName || `${files.length} file`)
    setUnmatchedFiles(unmatched)
  }

  const clearAudioLibrary = () => {
    Object.values(audioByNumber).forEach(url => URL.revokeObjectURL(url))
    Object.values(audioLowByNumber).forEach(url => URL.revokeObjectURL(url))
    Object.values(imageByNumber).forEach(url => URL.revokeObjectURL(url))
    setAudioByNumber({}); setAudioLowByNumber({}); setImageByNumber({}); setAudioFolderName(''); setUnmatchedFiles([])
  }

  return {
    audioByNumber, audioLowByNumber, imageByNumber, audioFolderName, unmatchedFiles,
    loadAudioFolder, clearAudioLibrary,
  }
}
