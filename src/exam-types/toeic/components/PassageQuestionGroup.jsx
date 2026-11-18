import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import OptionItem from '@/components/OptionItem'
import { Button } from '@/components/ui/button'
import { ExplanationText } from '../../../features/results'
import TranscriptCheckInput from './TranscriptCheckInput'

// 1 đoạn văn/ảnh/audio (passage) + TOÀN BỘ câu hỏi thuộc nó, bọc chung trong 1 khung ngoài duy
// nhất — đặc trưng TOEIC Part 6-7 (1 đoạn văn) và Part 1-4 (1 ảnh hoặc 1 audio dùng chung).
// Bọc chung giúp khi cuộn qua nhiều nhóm liên tiếp vẫn biết rõ câu hỏi nào thuộc nhóm nào, thay
// vì chỉ xếp đoạn văn/ảnh và câu hỏi cạnh nhau rời rạc.
// audioUrl: audio dùng chung cho cả nhóm (Part 2-4) hoặc riêng từng câu (Part 1), lấy theo
// q.number khớp với file đã nạp qua features/audio-library. imageUrl: ảnh minh hoạ Part 1.
export default function PassageQuestionGroup({
  passage, questions, questionIndexOf, answers, revealed, locked, partHeading,
  getOptionStatusAt, toggleOptionAt, confirmAt, skipAt, getAudioUrl, getImageUrl,
  dictationMode = false, hideListeningText = false, confirmDictationAt,
}) {
  const groupAudioUrl = getAudioUrl?.(questions[0])

  const inner = questions.map(q => {
    const i = questionIndexOf(q)
    const ans = answers[i] ?? new Set()
    const answeredQ = !!revealed[i]
    const isMulti = q.type === 'multiple_choice'
    const perQuestionAudioUrl = questions.length === 1 ? null : getAudioUrl?.(q)
    const imageUrl = getImageUrl?.(q)
    // Chế độ nghe & gõ lại chỉ áp dụng cho câu Listening (part 1-4) có sẵn transcript — câu
    // Reading hoặc câu thiếu transcript vẫn rơi về chọn đáp án như thường.
    const isDictation = dictationMode && q.part >= 1 && q.part <= 4 && !!q.transcript
    const isListeningPart = q.part >= 1 && q.part <= 4
    // Ẩn chữ câu hỏi/đáp án của câu Listening trong lúc chưa trả lời — giống đúng thi thật (chỉ
    // nghe audio, không đọc được gợi ý từ chữ trên màn hình). Độc lập với dictation: áp dụng cả
    // khi đang ở chế độ chọn đáp án (vẫn bấm được nút A/B/C/D, chỉ ẩn text) lẫn dictation. Sau khi
    // trả lời/hết giờ thì luôn hiện lại để đối chiếu.
    const hideQuestionText = isListeningPart && hideListeningText && !answeredQ
    const hideOptionsText = isListeningPart && hideListeningText && !answeredQ
    return (
      <div key={i} className="flex flex-col gap-3 border rounded-lg p-3.5 bg-background">
        {isMulti && (
          <div className="flex items-center gap-2">
            <Badge variant="outline">Nhiều đáp án</Badge>
          </div>
        )}
        {!hideQuestionText && (
          <p className="font-medium whitespace-pre-wrap">{q.number ?? i + 1}. {q.question}</p>
        )}
        {hideQuestionText && (
          <p className="font-medium text-muted-foreground italic">{q.number ?? i + 1}. (Nghe audio để biết câu hỏi)</p>
        )}
        {imageUrl && (
          <img src={imageUrl} alt={`Câu ${q.number ?? i + 1}`} className="rounded-lg border max-h-80 object-contain" />
        )}
        {perQuestionAudioUrl && (
          <audio controls src={perQuestionAudioUrl} className="w-full h-10" />
        )}
        {isDictation ? (
          answeredQ ? (
            <div className="rounded-lg border px-3.5 py-2.5 text-sm bg-muted">
              <p>Transcript: <strong>{q.transcript}</strong></p>
            </div>
          ) : (
            <TranscriptCheckInput
              transcript={q.transcript}
              part={q.part}
              onChecked={(ok) => (ok ? confirmDictationAt(i, q.correct_answer) : skipAt(i))}
            />
          )
        ) : (
          <div className="flex flex-col gap-2">
            {Object.entries(q.options).map(([key, val]) => (
              <OptionItem
                key={key}
                optionKey={key}
                text={val}
                hideText={hideOptionsText}
                status={getOptionStatusAt(i, key)}
                disabled={answeredQ || locked}
                onClick={() => toggleOptionAt(i, key)}
              />
            ))}
          </div>
        )}
        {!locked && !answeredQ && !isDictation && (
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => skipAt(i)}>Bỏ qua</Button>
            <Button size="sm" onClick={() => confirmAt(i)} disabled={!ans.size}>Xác nhận</Button>
          </div>
        )}
        {answeredQ && q.explanation && (
          <div className="bg-muted border border-border border-l-[3px] border-l-muted-foreground rounded-lg p-3.5">
            <h4 className="text-xs text-muted-foreground mb-1.5 uppercase tracking-wide font-semibold">Giải thích</h4>
            <ExplanationText text={q.explanation} className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed" />
          </div>
        )}
      </div>
    )
  })

  const heading = partHeading && (
    <div className="flex items-center gap-2 mb-3">
      <h2 className="text-base font-bold">Part {partHeading}</h2>
      <div className="flex-1 h-px bg-border" />
    </div>
  )

  if (!passage) {
    return (
      <div className="mb-8">
        {heading}
        {groupAudioUrl && <audio controls src={groupAudioUrl} className="w-full h-10 mb-4" />}
        <div className="flex flex-col gap-4">{inner}</div>
      </div>
    )
  }

  const isAudioPassage = passage.kind === 'audio'

  return (
    <div className="mb-8">
      {heading}
      <Card className="bg-muted/40">
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{questions.length} câu hỏi chung {isAudioPassage ? 'audio' : 'đoạn văn'}</Badge>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            <Card className="md:sticky md:top-4 md:self-start md:max-h-[calc(100vh-8rem)] overflow-y-auto">
              <CardContent className="flex flex-col gap-3">
                {passage.title && <h3 className="font-semibold">{passage.title}</h3>}
                {isAudioPassage ? (
                  groupAudioUrl && <audio controls src={groupAudioUrl} className="w-full h-10" />
                ) : (
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{passage.content}</p>
                )}
              </CardContent>
            </Card>
            <div className="flex flex-col gap-4">{inner}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
