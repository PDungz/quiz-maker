import { useEffect, useRef, useState } from 'react'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'

const SPEED_LABELS = { '0.5': '0.5x', '0.75': '0.75x', '0.85': '0.85x', '1': '1x (gốc)' }

// Audio player cho Listening, có thêm control làm chậm giọng đọc (playbackRate của thẻ <audio>
// chuẩn HTML5 — không cần xử lý lại file audio) cho người mới luyện nghe. Mặc định 1x (nguyên tốc
// độ gốc, giống thi thật). Tốc độ chọn không lưu lại giữa các audio khác nhau — mỗi audio lúc nạp
// lại bắt đầu ở 1x, tránh người học quên đang ở tốc độ chậm mà hiểu nhầm trình độ nghe thật của
// mình khi chuyển sang luyện Part/câu khác.
export default function AudioPlayer({ src, className }) {
  const audioRef = useRef(null)
  const [speed, setSpeed] = useState('1')

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = Number(speed)
  }, [speed, src])

  return (
    <div className={`flex items-center gap-2 ${className ?? ''}`}>
      <audio ref={audioRef} controls src={src} className="w-full h-10" />
      <Select value={speed} onValueChange={setSpeed} items={SPEED_LABELS}>
        <SelectTrigger className="w-[88px] shrink-0 h-10"><SelectValue /></SelectTrigger>
        <SelectContent>
          {Object.entries(SPEED_LABELS).map(([v, label]) => (
            <SelectItem key={v} value={v}>{label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
