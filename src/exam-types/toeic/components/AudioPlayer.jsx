import { useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

// Audio player cho Listening. srcLow là audio đọc chậm THẬT (1 file riêng do người tạo đề tự gen,
// khác hẳn playbackRate giả lập chậm trên cùng file gốc) — đặt trong folder con "audio-low" cùng
// tên q<number> như bản gốc, xem useAudioLibrary.js. Checkbox "So sánh" chỉ hiện khi câu này có cả
// 2 bản — bật lên hiện CẢ 2 player cùng lúc (không phải chuyển đổi qua lại bằng dropdown) để nghe
// đối chiếu trực tiếp dễ hơn. Mặc định tắt, chỉ hiện bản gốc, không khung/nhãn thừa.
// className: CHỈ dùng cho spacing/margin của wrapper ngoài (vd "mb-4") — không truyền h-10/w-full
// vào đây, kích thước audio đã cố định sẵn trong component, truyền chiều cao cố định sẽ ép cứng
// cả khối kể cả khi hiện 2 player so sánh, làm nội dung tràn ra ngoài khung thay vì tự giãn.
export default function AudioPlayer({ src, srcLow, className }) {
  const [compare, setCompare] = useState(false)
  const showBoth = !!srcLow && compare

  const compareToggle = srcLow && (
    <Label className="font-normal text-muted-foreground text-xs shrink-0 whitespace-nowrap">
      <Checkbox checked={compare} onCheckedChange={v => setCompare(!!v)} />
      So sánh
    </Label>
  )

  if (!showBoth) {
    return (
      <div className={`flex items-center gap-3 ${className ?? ''}`}>
        <audio controls src={src} className="w-full h-10" />
        {compareToggle}
      </div>
    )
  }

  return (
    <div className={`flex flex-col gap-1.5 ${className ?? ''}`}>
      <div className="flex flex-col gap-2 border rounded-lg p-2.5 bg-muted/40">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="shrink-0 w-[72px] justify-center">Gốc</Badge>
          <audio controls src={src} className="w-full h-10" />
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="shrink-0 w-[72px] justify-center">Đọc chậm</Badge>
          <audio controls src={srcLow} className="w-full h-10" />
        </div>
      </div>
      <div className="self-end">{compareToggle}</div>
    </div>
  )
}
