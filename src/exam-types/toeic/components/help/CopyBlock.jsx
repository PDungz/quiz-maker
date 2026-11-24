import { useState } from 'react'
import { Button } from '@/components/ui/button'

// Khối text dài kèm nút Copy — dùng trong các modal hướng dẫn định dạng file (Reading/Listening)
// để người dùng copy nguyên văn 1 đoạn hướng dẫn hoặc cả bộ quy tắc gửi cho AI.
export default function CopyBlock({ text }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <div className="relative w-full">
      <Button
        variant={copied ? 'default' : 'outline'}
        size="sm"
        className="absolute top-2 right-2"
        onClick={copy}
      >
        {copied ? '✓ Đã copy' : '📋 Copy'}
      </Button>
      <pre className="m-0 w-full max-h-[360px] overflow-y-auto whitespace-pre-wrap break-words bg-muted border rounded-lg p-3.5 font-mono text-xs"><code>{text}</code></pre>
    </div>
  )
}
