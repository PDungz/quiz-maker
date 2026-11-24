// Dữ liệu thuần (text/bảng) cho ToeicReadingHelpModal.jsx — tách khỏi file UI để sửa nội dung
// hướng dẫn không phải đọc/động vào JSX. Không có JSX ở đây để file có thể là .js thuần.

export const FIELDS = [
  ['part', 'Không', 'Part của câu hỏi: 5, 6 hoặc 7'],
  ['number', 'Khuyến nghị', 'Số thứ tự câu hỏi thật trong đề, vd 101-200. App hiển thị đúng số này thay vì tự đếm, vì tự đếm sẽ sai khi lọc theo Part'],
  ['passage_id', 'Không', 'Gắn câu hỏi vào 1 đoạn văn dùng chung (bắt buộc với Part 6-7), vd p1'],
  ['tags', 'Khuyến nghị', 'Danh sách chuyên đề ngữ pháp của câu hỏi, vd [thi, chu-ngu-dong-tu]. Dùng để lọc câu hỏi ở tab Học'],
  ['question', 'Có', 'Nội dung câu hỏi'],
  ['options', 'Có', 'Các lựa chọn dạng key-value'],
  ['correct_answer', 'Có', 'Key đáp án đúng, vd A'],
  ['explanation', 'Có', 'Lời giải đầy đủ 4 phần: Dịch / Chọn X vì / Các đáp án / Ghi nhớ, dùng tag <hl type="..."> để đánh dấu dấu hiệu nhận biết'],
]

export const HL_TYPES = [
  ['grammar', 'Dấu hiệu ngữ pháp (thì, cấu trúc, loại từ cần điền)'],
  ['time', 'Dấu hiệu thời gian (last week, by the time, since...)'],
  ['collocation', 'Collocation / đi kèm cố định (increase in, responsible for...)'],
  ['connector', 'Từ nối / liên từ (however, therefore, in addition...)'],
  ['vocab', 'Từ vựng/thành ngữ cần chú ý nghĩa'],
]

export const PASSAGE_FIELDS = [
  ['kind', 'Có', 'Luôn là passage để đánh dấu đây là đoạn văn, không phải câu hỏi'],
  ['id', 'Có', 'Định danh đoạn văn, dùng để câu hỏi tham chiếu qua passage_id, vd p1'],
  ['title', 'Không', 'Tiêu đề đoạn văn'],
  ['content', 'Có', 'Nội dung đoạn văn, dùng | để giữ format xuống dòng'],
]

export const FULL_GUIDE = `# Quy tắc định dạng file đề TOEIC Reading (.md) — Quiz Maker

Tài liệu này mô tả định dạng file Markdown cho đề TOEIC Reading (Part 5-7).
Dùng để: (1) người đọc tự viết file tay, (2) làm prompt đưa cho AI generate bộ đề đúng chuẩn.

## Cấu trúc tổng quát

File gồm nhiều block, mỗi block nằm giữa hai dấu \`---\`. Có 2 loại block:
1. Block đoạn văn (\`kind: passage\`) — dùng chung cho nhiều câu hỏi, đặc trưng của Part 6-7.
2. Block câu hỏi — giống Quiz thường, có thêm \`part\`, \`number\`, \`passage_id\` và \`tags\`.

## Số câu hỏi chuẩn theo từng Part (quan trọng)

- **Part 5** (number 101-130): mỗi câu độc lập, KHÔNG có đoạn văn, KHÔNG cần passage_id.
- **Part 6** (number 131-146): 1 đoạn văn (thường là email/thông báo ngắn) luôn đi kèm ĐÚNG 4 câu hỏi
  (thường có các chỗ trống đánh số (1) (2) (3) (4) ngay trong đoạn văn).
- **Part 7** (number 147-200): 1 đoạn văn (thông báo, email, quảng cáo, bài báo...) đi kèm TỪ 2 ĐẾN 4 câu hỏi,
  tuỳ độ dài đoạn văn (đoạn ngắn ~2 câu, đoạn dài ~4 câu).

Mỗi đoạn văn khai báo 1 block \`kind: passage\` riêng, và TẤT CẢ câu hỏi thuộc đoạn văn đó phải
cùng trỏ \`passage_id\` về đúng \`id\` của nó — app sẽ tự nhóm và hiển thị chung 1 khối (đoạn văn +
toàn bộ câu hỏi của nó), đúng như cách đề thi thật trình bày.

Mỗi câu hỏi nên có field \`number\` đúng số thứ tự thật trong đề — app hiển thị đúng số này, không
tự đếm theo vị trí trong file.

## Field tags cho tab Học

Câu hỏi Part 5-6 nên gắn field \`tags\` (vd \`tags: [thi, chu-ngu-dong-tu]\`) để dùng được ở tab
"Học" trong app — lọc riêng theo chuyên đề ngữ pháp thay vì làm cả đề theo Part. Xem đầy đủ các
tag gợi ý và cách hoạt động ở hướng dẫn riêng của tab Học trong app.

## Block đoạn văn (passage)

| Trường | Bắt buộc | Mô tả |
|---|---|---|
| kind | Có | Luôn là \`passage\` |
| id | Có | Định danh đoạn văn, vd p6-1, p7-1 |
| title | Không | Tiêu đề đoạn văn |
| content | Có | Nội dung đoạn văn, dùng \\| để giữ format. Với Part 6, đánh số các chỗ trống bằng (1) (2) (3) (4) ngay trong nội dung |

## Block câu hỏi

| Trường | Bắt buộc | Mô tả |
|---|---|---|
| part | Không | Part của câu hỏi: 5, 6 hoặc 7 |
| number | Khuyến nghị | Số thứ tự câu hỏi THẬT trong đề (chuẩn TOEIC: Part 5 = 101-130, Part 6 = 131-146, Part 7 = 147-200). App hiển thị đúng số này — KHÔNG tự đếm theo vị trí trong file, vì vị trí sẽ sai lệch khi lọc theo Part |
| passage_id | Không | Gắn vào đoạn văn đã khai báo ở trên — BẮT BUỘC với Part 6-7, để trống với Part 5 |
| tags | Khuyến nghị | Danh sách chuyên đề ngữ pháp, vd [thi, chu-ngu-dong-tu] — dùng để lọc ở tab Học |
| question | Có | Nội dung câu hỏi |
| options | Có | Các lựa chọn dạng key: value |
| correct_answer | Có | Key đáp án đúng, vd A |
| explanation | Có | Lời giải đầy đủ theo chuẩn 4 phần ở mục dưới, dùng dạng nhiều dòng \`explanation: |\` |

Các trường khác (id, category, difficulty, point...) giống hệt Quiz thường.

## Chuẩn viết explanation (quan trọng)

Mỗi \`explanation\` phải đủ 4 phần, theo đúng thứ tự và đúng nhãn dưới đây. Viết bằng tiếng Việt,
KHÔNG dùng icon / emoji, KHÔNG dùng ký tự trang trí. Các phần cách nhau một dòng trống.

Dùng dạng nhiều dòng của YAML (\`explanation: |\`), nội dung thụt vào 2 dấu cách.

### Phần 1. Dịch:
Dịch nghĩa tiếng Việt của cả câu.
- Part 5: dịch cả câu với đáp án đúng đã điền.
- Part 6: dịch câu chứa chỗ trống với đáp án đúng đã điền (câu điền câu thì dịch câu đó).
- Part 7: dịch câu hỏi và nêu ngắn gọn thông tin liên quan trong đoạn văn.

### Phần 2. Chọn X vì:
(X là chữ cái đáp án đúng.) Nêu lý do chọn, chỉ rõ vị trí chỗ trống cần loại từ gì hoặc thông tin nào
trong đoạn văn dẫn đến đáp án. Bọc đúng cụm là dấu hiệu bằng thẻ \`<hl>\` (xem mục dưới).

### Phần 3. Các đáp án:
Liệt kê TẤT CẢ 4 đáp án, mỗi đáp án một dòng, dạng:
\`- (A) từ (loại từ): nghĩa → ĐÚNG\` hoặc \`→ loại, lý do\`
- Part 5-6 ngữ pháp / từ loại: bắt buộc ghi loại từ (n, v, adj, adv, V2/V3, V-ing...) và nghĩa tiếng Việt của từng từ.
  Nếu một từ có nhiều loại từ (vd "refund" vừa là n vừa là v) thì ghi cả hai.
- Part 6 điền câu và Part 7: ghi nghĩa tiếng Việt của từng đáp án và lý do loại (sai ngữ cảnh, không có trong đoạn văn, ngược thông tin...).
- Lý do loại phải cụ thể, không viết chung chung kiểu "sai nghĩa".

### Phần 4. Ghi nhớ:
Nêu cấu trúc, cụm danh từ, collocation hoặc điểm ngữ pháp liên quan, giải thích nghĩa và cách dùng,
kèm ít nhất 1 ví dụ tiếng Anh có dịch tiếng Việt trong ngoặc.

## Đánh dấu dấu hiệu nhận biết trong explanation

Khi viết \`explanation\`, bọc đúng cụm từ là "dấu hiệu nhận biết" bằng tag \`<hl type="...">...</hl>\`
để app highlight bằng màu riêng cho từng loại — giống cách sách luyện thi dùng nhiều màu bút dạ
quang khi chữa bài. KHÔNG bọc cả câu, chỉ bọc đúng cụm từ là dấu hiệu. Dùng \`<hl>\` ở phần
"Chọn X vì" và phần "Ghi nhớ".

Các type hợp lệ:

| type | Dùng cho |
|---|---|
| grammar | Dấu hiệu ngữ pháp (thì, cấu trúc, loại từ cần điền) |
| time | Dấu hiệu thời gian (last week, by the time, since...) |
| collocation | Collocation / đi kèm cố định (increase in, responsible for...) |
| connector | Từ nối / liên từ (however, therefore, in addition...) |
| vocab | Từ vựng/thành ngữ cần chú ý nghĩa |

## Ví dụ Part 5 (không cần passage_id, có tags chuyên đề)

---
id: t5-001
part: 5
number: 101
tags: [thi, chu-ngu-dong-tu]
question: The company ----- its profits significantly last quarter.
options:
  A: increase
  B: increased
  C: increasing
  D: to increase
correct_answer: B
explanation: |
  Dịch: Công ty đã tăng lợi nhuận một cách đáng kể vào quý trước.

  Chọn B vì: Câu chưa có động từ chính, và <hl type="time">last quarter</hl> là dấu hiệu thời gian quá khứ, nên động từ phải chia <hl type="grammar">quá khứ đơn</hl> → "increased".

  Các đáp án:
  - (A) increase (v nguyên mẫu / n): tăng; sự tăng → loại, chủ ngữ "The company" số ít ở quá khứ cần động từ chia thì, không dùng nguyên mẫu.
  - (B) increased (V2/V3): đã tăng → ĐÚNG.
  - (C) increasing (V-ing / adj): đang tăng → loại, V-ing đứng một mình không làm động từ chính được.
  - (D) to increase (to V): để tăng → loại, to V không làm động từ chính của câu.

  Ghi nhớ: <hl type="collocation">increase + N</hl> = làm tăng cái gì (ngoại động từ); <hl type="collocation">an increase in + N</hl> = sự tăng về cái gì. Ví dụ: Sales increased by 10 percent last year. (Doanh số tăng 10 phần trăm năm ngoái.)
---

## Ví dụ Part 6 (1 đoạn văn + ĐÚNG 4 câu hỏi theo 4 chỗ trống (1)(2)(3)(4))

---
kind: passage
id: p6-1
title: New Visitor Check-In System
content: |
  To: All Employees
  From: Security Office

  Beginning on 1 December, all visitors will check in (1) ----- a self-service kiosk. Visitors must wear the badge (2) ----- at all times. (3) -----. Please return all badges when visitors (4) -----.
---

---
id: t6-001
part: 6
number: 131
passage_id: p6-1
tags: [tu-loai]
question: Which choice best completes blank (1)?
options:
  A: use
  B: used
  C: using
  D: uses
correct_answer: C
explanation: |
  Dịch: Từ ngày 1 tháng 12, tất cả khách sẽ đăng ký vào cổng bằng máy tự phục vụ.

  Chọn C vì: Trước chỗ trống đã có mệnh đề đầy đủ "all visitors will check in", nên cần <hl type="grammar">phân từ V-ing</hl> để chỉ cách thức thực hiện hành động.

  Các đáp án:
  - (A) use (v / n): dùng; sự sử dụng → loại, động từ nguyên mẫu không nối được vào mệnh đề đã đủ chủ vị.
  - (B) used (V2/V3 / adj): đã dùng; quen với → loại, mang nghĩa bị động hoặc quá khứ, không hợp.
  - (C) using (V-ing): bằng cách dùng → ĐÚNG.
  - (D) uses (v ngôi thứ ba / n số nhiều): dùng; các cách dùng → loại, thêm một động từ chia thì vào mệnh đề đã có động từ.

  Ghi nhớ: <hl type="grammar">mệnh đề + V-ing</hl> dùng để diễn tả cách thức hoặc phương tiện. Ví dụ: Customers can pay using a credit card. (Khách có thể thanh toán bằng thẻ tín dụng.)
---

---
id: t6-002
part: 6
number: 132
passage_id: p6-1
tags: [tu-loai]
question: Which choice best completes blank (2)?
options:
  A: visibly
  B: visible
  C: visibility
  D: visibilities
correct_answer: A
explanation: |
  Dịch: Khách phải đeo thẻ một cách dễ thấy trong mọi lúc.

  Chọn A vì: "wear the badge" đã là cụm động từ + tân ngữ đầy đủ nghĩa, nên chỗ trống cần <hl type="grammar">trạng từ</hl> bổ nghĩa cho động từ "wear".

  Các đáp án:
  - (A) visibly (adv): một cách rõ ràng, dễ thấy → ĐÚNG.
  - (B) visible (adj): có thể nhìn thấy → loại, tính từ không bổ nghĩa cho động từ.
  - (C) visibility (n): tầm nhìn, độ hiển thị → loại, danh từ thừa sau tân ngữ.
  - (D) visibilities (n số nhiều): hiếm dùng → loại, cũng là danh từ.

  Ghi nhớ: <hl type="grammar">trạng từ đứng cuối cụm động từ + tân ngữ</hl> để bổ nghĩa cách thức. <hl type="collocation">at all times</hl> = mọi lúc. Ví dụ: Please keep your ID visibly displayed. (Vui lòng để thẻ nhận dạng ở chỗ dễ thấy.)
---

---
id: t6-003
part: 6
number: 133
passage_id: p6-1
question: Which choice best completes blank (3)?
options:
  A: The cafeteria will extend its lunch hours next month.
  B: Parking permits can be renewed through the intranet.
  C: The building was constructed more than twenty years ago.
  D: Anyone without a badge will be asked to return to the front desk.
correct_answer: D
explanation: |
  Dịch: Bất kỳ ai không có thẻ sẽ bị yêu cầu quay lại quầy lễ tân.

  Chọn D vì: Câu trước nói về quy định phải đeo thẻ, nên câu tiếp theo hợp lý nhất là <hl type="vocab">hệ quả khi không có thẻ</hl>. Câu cuối đoạn nói về việc trả thẻ cũng liên quan đến quy trình thẻ khách.

  Các đáp án:
  - (A) Căng tin sẽ kéo dài giờ ăn trưa vào tháng sau → loại, nói về căng tin, không liên quan đến thẻ khách.
  - (B) Thẻ đậu xe có thể được gia hạn qua mạng nội bộ → loại, nói về thẻ đậu xe, lạc đề.
  - (C) Tòa nhà được xây hơn hai mươi năm trước → loại, thông tin về tòa nhà, không liên quan.
  - (D) Bất kỳ ai không có thẻ sẽ bị yêu cầu quay lại quầy lễ tân → ĐÚNG, tiếp nối quy định đeo thẻ.

  Ghi nhớ: Với câu điền câu, hãy đọc câu liền trước và liền sau để xác định chủ đề và quan hệ (hệ quả, bổ sung, đối lập). Ví dụ: Visitors must sign in. Those who do not will be turned away. (Khách phải đăng ký. Ai không làm vậy sẽ bị từ chối.)
---

---
id: t6-004
part: 6
number: 134
passage_id: p6-1
tags: [thi]
question: Which choice best completes blank (4)?
options:
  A: departure
  B: depart
  C: departing
  D: departed
correct_answer: B
explanation: |
  Dịch: Vui lòng trả lại tất cả thẻ khi khách rời đi.

  Chọn B vì: Mệnh đề thời gian bắt đầu bằng <hl type="connector">when</hl> trong câu nói về tương lai dùng <hl type="grammar">hiện tại đơn</hl> thay cho tương lai. Chủ ngữ "visitors" số nhiều nên động từ giữ nguyên "depart".

  Các đáp án:
  - (A) departure (n): sự khởi hành, sự rời đi → loại, mệnh đề cần động từ.
  - (B) depart (v nguyên mẫu): rời đi → ĐÚNG.
  - (C) departing (V-ing / adj): đang rời đi → loại, thiếu trợ động từ nên không thành động từ chính của mệnh đề.
  - (D) departed (V2/V3): đã rời đi → loại, câu mang nghĩa tương lai, không dùng quá khứ.

  Ghi nhớ: <hl type="grammar">when / after / before / as soon as + hiện tại đơn</hl> (không dùng will) khi nói về tương lai. Ví dụ: Please call me when you arrive. (Hãy gọi tôi khi bạn đến.)
---

## Ví dụ Part 7 (1 đoạn văn + 2-4 câu hỏi, ở đây 3 câu — thường không gắn tags vì là đọc hiểu, không kiểm tra ngữ pháp)

---
kind: passage
id: p7-1
title: Training Session Rescheduled
content: |
  Hi Marcus,

  The training originally planned for Thursday has been moved to Monday, because the trainer has to attend a conference. Please bring your laptop. If you cannot attend, let me know by Friday.

  Dana Okafor
---

---
id: t7-001
part: 7
number: 147
passage_id: p7-1
question: Why was the training rescheduled?
options:
  A: The trainer will be away at a conference.
  B: The meeting room was unavailable.
  C: The ticketing system was not ready.
  D: Too few employees had signed up.
correct_answer: A
explanation: |
  Dịch: Tại sao buổi tập huấn bị dời lịch? Đoạn văn nêu lý do ngay sau "because".

  Chọn A vì: Đoạn văn ghi <hl type="connector">because</hl> <hl type="vocab">the trainer has to attend a conference</hl> (vì người tập huấn phải dự hội nghị), khớp với "The trainer will be away at a conference".

  Các đáp án:
  - (A) Người tập huấn sẽ đi vắng vì dự hội nghị → ĐÚNG, diễn đạt lại thông tin trong đoạn.
  - (B) Phòng họp không có sẵn → loại, đoạn văn không nhắc đến phòng họp.
  - (C) Hệ thống bán vé chưa sẵn sàng → loại, đoạn văn không nhắc đến hệ thống vé.
  - (D) Có quá ít nhân viên đăng ký → loại, đoạn văn không nhắc đến số người đăng ký.

  Ghi nhớ: <hl type="vocab">attend a conference</hl> = tham dự hội nghị. Câu hỏi "Why...?" thường được trả lời sau các từ báo lý do như because, since, due to. Ví dụ: The flight was delayed due to bad weather. (Chuyến bay bị hoãn do thời tiết xấu.)
---

---
id: t7-002
part: 7
number: 148
passage_id: p7-1
question: What are attendees asked to bring?
options:
  A: A printed handbook
  B: A packed lunch
  C: A laptop
  D: A signed form
correct_answer: C
explanation: |
  Dịch: Người tham dự được yêu cầu mang theo gì?

  Chọn C vì: Email có câu <hl type="vocab">Please bring your laptop</hl> (Hãy mang theo máy tính xách tay của bạn).

  Các đáp án:
  - (A) Một cuốn sổ tay in sẵn → loại, không được nhắc đến.
  - (B) Một bữa trưa đóng gói → loại, không được nhắc đến.
  - (C) Một chiếc máy tính xách tay → ĐÚNG, khớp nguyên văn "your laptop".
  - (D) Một mẫu đơn đã ký → loại, không được nhắc đến.

  Ghi nhớ: <hl type="collocation">bring + vật</hl> = mang theo cái gì; <hl type="grammar">Please + động từ nguyên mẫu</hl> là câu yêu cầu lịch sự. Ví dụ: Please bring your ID to the interview. (Vui lòng mang theo giấy tờ tùy thân đến buổi phỏng vấn.)
---

---
id: t7-003
part: 7
number: 149
passage_id: p7-1
question: What should Marcus do if he cannot attend?
options:
  A: Cancel the training for everyone
  B: Let Dana know by Friday
  C: Ask a colleague to attend instead
  D: Reschedule to December
correct_answer: B
explanation: |
  Dịch: Marcus nên làm gì nếu anh ấy không thể tham dự?

  Chọn B vì: Đoạn văn ghi <hl type="grammar">If you cannot attend</hl>, <hl type="time">let me know by Friday</hl> (nếu bạn không thể tham dự, hãy báo cho tôi trước thứ Sáu). Người viết email là Dana, nên "me" chính là Dana.

  Các đáp án:
  - (A) Hủy buổi tập huấn cho mọi người → loại, đoạn văn không đề cập, và Marcus không có quyền đó.
  - (B) Báo cho Dana trước thứ Sáu → ĐÚNG, khớp với "let me know by Friday".
  - (C) Nhờ đồng nghiệp đi thay → loại, đoạn văn không nói đến.
  - (D) Dời sang tháng 12 → loại, không có thông tin này.

  Ghi nhớ: <hl type="collocation">let + người + know</hl> = báo cho ai biết; <hl type="time">by + mốc thời gian</hl> = trước hoặc muộn nhất vào thời điểm đó. Ví dụ: Let us know by noon if you plan to join. (Hãy báo cho chúng tôi trước trưa nếu bạn định tham gia.)
---

## Quy tắc quan trọng

1. Khai báo block passage TRƯỚC các câu hỏi tham chiếu đến nó trong file.
2. Part 6: mỗi đoạn văn luôn đi kèm ĐÚNG 4 câu hỏi. Part 7: đi kèm TỪ 2 ĐẾN 4 câu hỏi.
3. Toàn bộ câu hỏi của cùng 1 đoạn văn phải dùng cùng 1 passage_id — app nhóm và hiển thị chúng chung 1 khối duy nhất với đoạn văn, không tách lẻ từng câu.
4. Part 5 không có passage_id (mỗi câu độc lập). Part 6-7 luôn phải có passage_id.
5. Luôn đánh số number cho từng câu hỏi theo đúng chuẩn TOEIC: Part 5 = 101-130, Part 6 = 131-146, Part 7 = 147-200 — không để app tự đếm, vì số hiển thị sẽ sai khi lọc theo Part.
6. Gắn tags chuyên đề ngữ pháp cho câu hỏi Part 5-6 (vd [thi, chu-ngu-dong-tu]) để dùng được ở tab Học. Part 7 là đọc hiểu nên thường không cần tags.
7. Mọi câu hỏi PHẢI có explanation đủ 4 phần: Dịch, Chọn X vì, Các đáp án, Ghi nhớ — theo đúng thứ tự và đúng nhãn. Không bỏ phần nào, không gộp phần.
8. Trong phần "Các đáp án", phải nêu nghĩa (và loại từ với Part 5-6) của CẢ 4 đáp án và lý do loại cụ thể cho 3 đáp án sai.
9. Trong explanation, bọc đúng cụm từ là dấu hiệu nhận biết bằng <hl type="...">...</hl>, chọn type phù hợp nhất trong bảng trên.
10. Không dùng icon, emoji hay ký tự trang trí trong bất kỳ field nào.
11. Không thêm text nào ngoài các block --- ... ---.

---
# YÊU CẦU (điền vào phần dưới rồi gửi cho AI để generate bộ đề)

Part muốn tạo: <5 / 6 / 7 / mix>
Số lượng câu hỏi: <điền số lượng>
Chuyên đề ngữ pháp muốn tập trung (nếu có): <vd: thì, hoà hợp chủ ngữ-động từ, từ loại>
Chủ đề đoạn văn (nếu Part 6-7): <vd: email công việc, thông báo nội bộ, quảng cáo>
Ghi chú thêm: <vd: độ khó, tránh trùng chủ đề đã có>
Lưu ý bắt buộc: explanation phải đủ 4 phần Dịch / Chọn X vì / Các đáp án / Ghi nhớ, không dùng icon.`
