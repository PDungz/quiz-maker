# Quiz Interview v2

Ứng dụng luyện tập phỏng vấn bằng cách upload file Markdown chứa bộ câu hỏi.

## Luồng sử dụng

1. Upload file `.md` → câu hỏi được shuffle ngẫu nhiên
2. Trả lời từng câu → bấm **Xác nhận** để chấm điểm
3. Xem kết quả tổng hợp và chi tiết từng câu

---

## Định dạng file Markdown

Mỗi câu hỏi là một block nằm giữa hai dấu `---`. Các block phân cách nhau cũng bằng `---`.

### Cấu trúc một câu hỏi

```md
---
id: q1
category: JavaScript
subcategory: ES6
difficulty: medium
type: single_choice
question: Arrow function khác gì với function thường?
options:
  A: Không có this riêng
  B: Không thể có tham số
  C: Chạy nhanh hơn
  D: Không có sự khác biệt
correct_answer: A
explanation: Arrow function kế thừa this từ lexical scope bao ngoài, không có this riêng.
tags: [arrow-function, this, es6]
---
```

### Giải thích các trường

| Trường | Bắt buộc | Mô tả |
|---|---|---|
| `id` | Không | Định danh câu hỏi, ví dụ `q1`, `js-001` |
| `category` | Không | Chủ đề, ví dụ `JavaScript`, `React`, `CSS` |
| `subcategory` | Không | Chủ đề con |
| `difficulty` | Không | `easy` / `medium` / `hard` (mặc định: `medium`) |
| `type` | Không | `single_choice` hoặc `multiple_choice` (mặc định: `single_choice`) |
| `question` | **Có** | Nội dung câu hỏi |
| `options` | **Có** | Các lựa chọn dạng key-value (key thường là A, B, C, D) |
| `correct_answer` | **Có** | Key của đáp án đúng. Nhiều đáp án thì viết `[A, C]` |
| `code` | Không | Đoạn code đính kèm, dùng block scalar `\|` để giữ format |
| `code_lang` | Không | Ngôn ngữ của code, ví dụ `dart`, `javascript`, `sql` (hiển thị label góc phải) |
| `explanation` | Không | Giải thích đáp án, hiển thị sau khi trả lời |
| `tags` | Không | Danh sách tag, ví dụ `[react, hook, useState]` |

---

### Câu hỏi có code đính kèm

```md
---
id: dart-001
category: Dart
difficulty: medium
type: single_choice
code_lang: dart
question: What is the output of the following code?
code: |
  void main() async {
    print('A');
    await Future.delayed(Duration.zero);
    print('B');
    print('C');
  }
options:
  A: A B C
  B: A C B
  C: B A C
  D: Lỗi runtime
correct_answer: A
explanation: await Future.delayed(Duration.zero) nhường event loop nhưng B và C vẫn chạy tuần tự sau đó.
---
```

> Dùng `|` sau tên trường để giữ nguyên xuống dòng và indent của code. Indent của code phải lớn hơn indent của key `code:`.

---

### Câu hỏi nhiều đáp án (`multiple_choice`)

```md
---
id: q2
category: React
difficulty: hard
type: multiple_choice
question: Các hook nào sau đây là built-in của React?
options:
  A: useState
  B: useLocalStorage
  C: useEffect
  D: useDebounce
correct_answer: [A, C]
explanation: useState và useEffect là hook built-in. useLocalStorage và useDebounce là custom hook.
---
```

> Khi `type: multiple_choice`, người dùng phải chọn **tất cả** đáp án đúng mới được tính là đúng.

---

### Câu hỏi có code trong nội dung

Dùng backtick `` ` `` để inline code trong `question`, `options`, hoặc `explanation`:

```md
---
id: q3
category: JavaScript
difficulty: easy
type: single_choice
question: Kết quả của `typeof null` là gì?
options:
  A: "null"
  B: "object"
  C: "undefined"
  D: "boolean"
correct_answer: B
explanation: Đây là một bug lịch sử của JS. `typeof null` trả về "object".
---
```

---

### Ví dụ file đầy đủ

```md
---
id: js-001
category: JavaScript
difficulty: easy
type: single_choice
question: `let` khác `var` ở điểm nào?
options:
  A: let có block scope, var có function scope
  B: let không thể dùng trong vòng lặp
  C: var nhanh hơn let
  D: Không có sự khác biệt
correct_answer: A
explanation: let được scoped theo block {}, còn var được scoped theo function hoặc global.
tags: [scope, let, var]
---
---
id: js-002
category: JavaScript
difficulty: medium
type: multiple_choice
question: Phương thức nào của Array trả về một mảng mới?
options:
  A: map
  B: forEach
  C: filter
  D: push
correct_answer: [A, C]
explanation: map và filter luôn trả về mảng mới. forEach và push thay đổi/dùng mảng gốc.
tags: [array, functional]
---
```

---

## Chạy dự án

```bash
npm install
npm run dev
```
