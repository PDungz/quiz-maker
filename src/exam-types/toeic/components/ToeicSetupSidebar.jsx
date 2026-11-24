import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

function FieldLabel({ children }) {
  return <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{children}</Label>
}

const PART_LABEL = {
  1: 'Part 1 — Mô tả tranh',
  2: 'Part 2 — Hỏi đáp',
  3: 'Part 3 — Đoạn hội thoại',
  4: 'Part 4 — Bài nói ngắn',
  5: 'Part 5 — Hoàn thành câu',
  6: 'Part 6 — Hoàn thành đoạn văn',
  7: 'Part 7 — Đọc hiểu',
}

// Dùng chung cho cả prop `items` (để Select.Value hiện đúng label ngay từ đầu, không phải mở
// dropdown lần nào trước đó base-ui mới ghi nhớ được label) và để map ra SelectItem bên dưới —
// viết 1 chỗ duy nhất, tránh lặp lại text label ở 2 nơi dễ bị lệch nhau khi sửa sau này.
const TOPIC_FILTER_LABELS = {
  part: 'Part — luyện riêng 1 dạng (vd chỉ Part 2)',
  tag: 'Chuyên đề ngữ pháp — luyện riêng 1 điểm (vd chỉ "thì")',
}
const LISTENING_ANSWER_MODE_LABELS = {
  choice: 'Chọn đáp án — như bình thường',
  dictation: 'Nghe & gõ lại — luyện nghe chép, tự chấm theo transcript',
}
const DICTATION_THRESHOLD_LABELS = {
  100: '100% — phải khớp tuyệt đối từng từ',
  90: '90% — cho sai lệch rất ít',
  80: '80% — cho thiếu/sai vài từ (khuyến nghị)',
  70: '70% — dễ hơn, chỉ cần đúng ý chính',
}
const EXAM_STYLE_LABELS = {
  practice: 'Luyện tập — xem đáp án ngay, không giới hạn giờ',
  test: 'Thi thử — mô phỏng thi thật, chấm sau khi nộp',
}
const DISPLAY_MODE_LABELS = {
  split: 'Chia theo tab Part',
  all: 'Cuộn tất cả, không chia Part',
}

// Cấu hình riêng cho TOEIC: chọn Part/chuyên đề có sẵn trong file đã nạp (practiceMode do
// ToeicPage quyết định qua tab "Làm đề / Ôn luyện" ngay đầu sidebar, không nằm ở đây) + chọn
// Luyện tập/Thi thử + hiển thị. Đồng hồ tham khảo (practiceTimerEnabled/timerMinutes) dùng
// chung 1 cặp state cho cả 2 tab — ở tab Học hiện ngay trong "Luyện riêng", ở tab Làm đề hiện
// trong "Hình thức" cùng với lựa chọn Luyện tập/Thi thử. Phần còn lại (chấm điểm, retry...) tái
// dùng nguyên features/quiz-session + results.
export default function ToeicSetupSidebar({
  practiceMode,
  topicFilterBy, setTopicFilterBy,
  partCounts, selectedParts, togglePart, setSelectedParts,
  tagCounts, selectedTags, toggleTag, setSelectedTags,
  examStyle, setExamStyle,
  splitByPart, setSplitByPart,
  timerMinutes, setTimerMinutes,
  practiceTimerEnabled, setPracticeTimerEnabled,
  listeningAnswerMode, setListeningAnswerMode,
  hideListeningText, setHideListeningText,
  dictationMatchThreshold, setDictationMatchThreshold,
  poolSize, onBuildQuiz, hasQuestions,
}) {
  const parts = Object.keys(partCounts).map(Number).sort((a, b) => a - b)
  const tags = Object.keys(tagCounts).sort()
  const isTopicMode = practiceMode === 'topic'
  const isTopicByTag = isTopicMode && topicFilterBy === 'tag'
  // selectedParts/selectedTags rỗng nghĩa là "không lọc gì" = dùng tất cả, nên coi như đã chọn hết
  const allPartsSelected = selectedParts.length === 0 || parts.every(p => selectedParts.includes(p))
  const allTagsSelected = selectedTags.length === 0 || tags.every(t => selectedTags.includes(t))
  // Chế độ "Nghe & gõ lại" chỉ có ý nghĩa khi đang lọc theo Part VÀ có ít nhất 1 Part Listening
  // (1-4) đang được chọn — lọc theo tag là chuyên đề ngữ pháp (Reading), không có audio để nghe chép.
  const hasListeningPartSelected = !isTopicByTag &&
    (allPartsSelected ? parts.some(p => p >= 1 && p <= 4) : selectedParts.some(p => p >= 1 && p <= 4))
  const showListeningAnswerMode = isTopicMode && hasListeningPartSelected

  return (
    <div className="flex flex-col gap-5 border-t pt-5 mt-2">
      <Tabs defaultValue="content">
        <TabsList className="w-full">
          <TabsTrigger value="content">{isTopicMode ? '🎯 Luyện riêng' : '📑 Part'}</TabsTrigger>
          {!isTopicMode && <TabsTrigger value="mode">⏱ Hình thức</TabsTrigger>}
          {!isTopicMode && <TabsTrigger value="display">🖥 Hiển thị</TabsTrigger>}
        </TabsList>

        <TabsContent value="content" className="flex flex-col gap-2 pt-3">
          {isTopicMode && (
            <div className="flex flex-col gap-2 pb-1">
              <FieldLabel>Lọc theo</FieldLabel>
              <Select value={topicFilterBy} onValueChange={setTopicFilterBy} items={TOPIC_FILTER_LABELS}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TOPIC_FILTER_LABELS).map(([v, label]) => (
                    <SelectItem key={v} value={v}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {showListeningAnswerMode && (
            <div className="flex flex-col gap-2 pb-1">
              <FieldLabel>Cách trả lời (Listening)</FieldLabel>
              <Select value={listeningAnswerMode} onValueChange={setListeningAnswerMode} items={LISTENING_ANSWER_MODE_LABELS}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(LISTENING_ANSWER_MODE_LABELS).map(([v, label]) => (
                    <SelectItem key={v} value={v}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Label className="font-normal text-muted-foreground text-xs">
                <Checkbox checked={hideListeningText} onCheckedChange={v => setHideListeningText(!!v)} />
                Ẩn chữ câu hỏi &amp; đáp án — giống thi thật, chỉ nghe audio
              </Label>
              {listeningAnswerMode === 'dictation' && (
                <div className="flex flex-col gap-2 pt-1">
                  <FieldLabel>Ngưỡng tính đúng khi gõ lại</FieldLabel>
                  <Select value={String(dictationMatchThreshold)} onValueChange={v => setDictationMatchThreshold(+v)} items={DICTATION_THRESHOLD_LABELS}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(DICTATION_THRESHOLD_LABELS).map(([v, label]) => (
                        <SelectItem key={v} value={v}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          {isTopicMode && (
            <div className="flex flex-col gap-2 pb-1">
              <FieldLabel>Giới hạn thời gian</FieldLabel>
              <Label className="font-normal text-muted-foreground">
                <Checkbox checked={practiceTimerEnabled} onCheckedChange={v => setPracticeTimerEnabled(!!v)} />
                Bật đếm giờ (chỉ để tham khảo, hết giờ không tự nộp bài)
              </Label>
              {practiceTimerEnabled && (
                <div className="flex items-center gap-2.5">
                  <Input type="number" min={1} max={600} value={timerMinutes}
                    onChange={e => setTimerMinutes(Math.max(1, +e.target.value))} />
                  <span className="text-xs text-muted-foreground shrink-0">phút</span>
                </div>
              )}
            </div>
          )}

          {isTopicByTag ? (
            tags.length === 0 ? (
              <p className="text-sm text-muted-foreground">Đề đã nạp chưa có câu nào gắn tags chuyên đề.</p>
            ) : (
              <>
                <Label className="font-normal text-muted-foreground">
                  <Checkbox
                    checked={allTagsSelected}
                    onCheckedChange={v => setSelectedTags(v ? tags : [])}
                  />
                  Chọn tất cả
                </Label>
                <div className="h-px bg-border my-0.5" />
                {tags.map(tag => (
                  <Label key={tag} className="font-normal text-muted-foreground">
                    <Checkbox checked={allTagsSelected || selectedTags.includes(tag)} onCheckedChange={() => toggleTag(tag, tags)} />
                    {tag}
                    <Badge variant="secondary" className="ml-auto shrink-0">{tagCounts[tag]} câu</Badge>
                  </Label>
                ))}
              </>
            )
          ) : (
            <>
              <Label className="font-normal text-muted-foreground">
                <Checkbox
                  checked={allPartsSelected}
                  onCheckedChange={v => setSelectedParts(v ? parts : [])}
                />
                Chọn tất cả
              </Label>
              <div className="h-px bg-border my-0.5" />
              {parts.map(part => (
                <Label key={part} className="font-normal text-muted-foreground">
                  <Checkbox checked={allPartsSelected || selectedParts.includes(part)} onCheckedChange={() => togglePart(part, parts)} />
                  {PART_LABEL[part] ?? `Part ${part}`}
                  <Badge variant="secondary" className="ml-auto shrink-0">{partCounts[part]} câu</Badge>
                </Label>
              ))}
            </>
          )}
        </TabsContent>

        <TabsContent value="mode" className="flex flex-col gap-4 pt-3">
          <div className="flex flex-col gap-2">
            <FieldLabel>Hình thức</FieldLabel>
            <Select value={examStyle} onValueChange={setExamStyle} items={EXAM_STYLE_LABELS}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(EXAM_STYLE_LABELS).map(([v, label]) => (
                  <SelectItem key={v} value={v}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {examStyle === 'practice' ? (
            <div className="flex flex-col gap-2">
              <FieldLabel>Giới hạn thời gian</FieldLabel>
              <Label className="font-normal text-muted-foreground">
                <Checkbox checked={practiceTimerEnabled} onCheckedChange={v => setPracticeTimerEnabled(!!v)} />
                Bật đếm giờ (chỉ để tham khảo, hết giờ không tự nộp bài)
              </Label>
              {practiceTimerEnabled && (
                <div className="flex items-center gap-2.5">
                  <Input type="number" min={1} max={600} value={timerMinutes}
                    onChange={e => setTimerMinutes(Math.max(1, +e.target.value))} />
                  <span className="text-xs text-muted-foreground shrink-0">phút</span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <FieldLabel>Giới hạn thời gian</FieldLabel>
              <div className="flex items-center gap-2.5">
                <Input type="number" min={1} max={600} value={timerMinutes}
                  onChange={e => setTimerMinutes(Math.max(1, +e.target.value))} />
                <span className="text-xs text-muted-foreground shrink-0">phút</span>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="display" className="flex flex-col gap-2 pt-3">
          <FieldLabel>Hiển thị danh sách câu hỏi</FieldLabel>
          <Select value={splitByPart ? 'split' : 'all'} onValueChange={v => setSplitByPart(v === 'split')} items={DISPLAY_MODE_LABELS}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(DISPLAY_MODE_LABELS).map(([v, label]) => (
                <SelectItem key={v} value={v}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </TabsContent>
      </Tabs>

      <Button size="lg" className="w-full" onClick={onBuildQuiz} disabled={!poolSize}>
        {hasQuestions ? '↺ Làm lại' : '▶ Bắt đầu'} ({poolSize} câu)
      </Button>
    </div>
  )
}
