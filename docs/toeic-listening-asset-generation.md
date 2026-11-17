# Quy trình tạo audio và ảnh cho đề Listening (dành cho AI đọc để làm nhanh, không phải dò lại)

Phần này ghi lại cách đã làm thành công trong môi trường làm việc của AI (Linux, chỉ truy cập được pip/npm và GitHub). Làm đúng theo thứ tự dưới đây, không cần thử lại các hướng đã thất bại.

## 0. Quy ước chung

- Tên file bắt buộc: `q<number>.mp3` và `q<number>.jpg`, `<number>` đúng bằng field `number` trong file .md.
- Part 3-4: cả nhóm 3 câu dùng chung 1 audio, đặt tên theo number của câu ĐẦU nhóm (vd q32.mp3 cho câu 32-34).
- Đóng gói giao cho người dùng thành MỘT file zip duy nhất theo đúng cấu trúc:

```
toeic-listening/
├── audio/   q1.mp3, q2.mp3, q7.mp3, q32.mp3 ...
└── image/   q1.jpg ... q6.jpg   (chỉ Part 1)
```

- Không ghi vào thư mục trên máy người dùng nếu họ chưa xác nhận; mặc định chỉ gửi file zip.
- AI không nghe được audio nên không kiểm tra được chất lượng giọng; nói rõ điều này khi giao.
- Không dùng icon trong file hay trong lời giao.

## 1. Những thứ KHÔNG dùng được (đã thử, bỏ qua)

- Không có sẵn công cụ đọc giọng nói (espeak, piper, festival...). Chỉ có ffmpeg.
- Không tải được từ HuggingFace (bị chặn mạng), nên không dùng piper hay kokoro tải model từ HuggingFace.
- Không có công cụ tạo ảnh. Ảnh Part 1 phải tự vẽ bằng code (xem mục 4).
- `pip install sherpa-onnx` bản mới nhất (2.0.1) bị lỗi "phoneme_codepoints is empty ... no frontend available", đọc ra 0 giây. Phải ghim bản 1.12.40.

## 2. Cài đặt (làm một lần mỗi phiên)

```bash
mkdir -p /home/claude/tts && cd /home/claude/tts
pip install --break-system-packages -q "sherpa-onnx==1.12.40" soundfile numpy cairosvg pillow
curl -sSL -o m.tar.bz2 https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/vits-piper-en_US-libritts_r-medium.tar.bz2
tar xjf m.tar.bz2     # ra thư mục vits-piper-en_US-libritts_r-medium (khoảng 82 MB)
```

Model libritts_r có 904 giọng (sid), một model cho cả giọng nam và nữ.

## 3. Tạo audio

File `lib.py` (nạp model, hàm đọc):

```python
import sherpa_onnx, numpy as np
D="/home/claude/tts/vits-piper-en_US-libritts_r-medium"
cfg=sherpa_onnx.OfflineTtsConfig(model=sherpa_onnx.OfflineTtsModelConfig(
  vits=sherpa_onnx.OfflineTtsVitsModelConfig(model=f"{D}/en_US-libritts_r-medium.onnx",
  tokens=f"{D}/tokens.txt",data_dir=f"{D}/espeak-ng-data"),num_threads=4,provider="cpu"))
tts=sherpa_onnx.OfflineTts(cfg)
SR=tts.sample_rate   # 22050
def syn(text,sid,speed=0.95):
    return np.array(tts.generate(text,sid=sid,speed=speed).samples,dtype=np.float32)
```

Giọng đã chọn (đã đo cao độ để phân biệt nam nữ, dùng lại luôn, không cần dò):
- Người dẫn "Number N": sid 0 (nữ).
- Nam: sid 21 (cũng dùng được 3, 6, 27, 48, 51, 90).
- Nữ: sid 12 (cũng dùng được 9, 15, 18, 30, 33, 39).
- Muốn thêm giọng khác: đọc thử 1 câu bằng nhiều sid rồi đo tần số cơ bản; dưới khoảng 135 Hz là nam, trên khoảng 175 Hz là nữ.

Khung ghép audio (mỗi câu hỏi = 1 file mp3):

```python
import soundfile as sf, subprocess, os
def sil(s): return np.zeros(int(SR*s),dtype=np.float32)
def save(n,parts):
    a=np.concatenate(parts+[sil(1.0)])
    sf.write(f"out/q{n}.wav",a,SR)
    subprocess.run(["ffmpeg","-y","-loglevel","error","-i",f"out/q{n}.wav","-ac","1","-b:a","96k",f"out/q{n}.mp3"],check=True)
    os.remove(f"out/q{n}.wav")
```

Cách ghép từng Part (thời gian nghỉ đã dùng):
- Part 1: "Number N." (sid 0), nghỉ 1.5 giây, rồi 4 câu mô tả A, B, C, D, mỗi câu cách nhau 1.8 giây. Không đọc tên chữ cái A, B, C, D (đề thật không đọc). Một giọng cho cả câu, luân phiên nam nữ giữa các câu.
- Part 2: "Number N." (sid 0), nghỉ 1.0 giây, câu hỏi (giọng X), nghỉ 1.3 giây, rồi 3 đáp án bằng giọng ngược giới tính với người hỏi, mỗi đáp án cách nhau 1.3 giây.
- Part 3 (hội thoại): tách từng lượt "Woman:" / "Man:", đọc bằng sid nữ / nam tương ứng, nghỉ khoảng 0.6 giây giữa các lượt. Lấy transcript trong file .md làm nguồn, bỏ nhãn "Woman:" và "Man:" khi đọc. Nhóm 3 câu dùng 1 file `q<number đầu nhóm>.mp3`.
- Part 4 (bài nói): một giọng đọc liền cả bài, tốc độ khoảng 0.95. Một file cho cả nhóm.
- Câu có số, giờ, ký hiệu: viết lại thành chữ trước khi đọc (vd "9 A.M." đọc là "nine A M", "$50" đọc là "fifty dollars") để giọng đọc không sai.

Khi chạy script, thêm `2>/dev/null` hoặc lọc bớt log, vì thư viện in cảnh báo rất nhiều dòng.

## 4. Tạo ảnh Part 1

Ảnh Part 1 trong đề TOEIC thật là ĐEN TRẮNG (thang xám). Cách làm: vẽ SVG bằng code, render ra PNG bằng `cairosvg`, rồi chuyển sang thang xám và lưu thành jpg.

Nguyên tắc nội dung tranh:
- Mỗi tranh thể hiện đúng MỘT hành động, khớp với đáp án đúng, không mập mờ.
- Phải có sẵn các bẫy hợp lý nhưng KHÔNG làm đáp án sai thành đúng: vd đáp án sai là "writing" thì không để người trong tranh cầm bút; đáp án sai là "carrying a ladder" thì không vẽ cái thang.
- Có thể đưa vật thật có trong tranh làm bẫy (bảng trắng, cuốn sổ đóng) nhưng người trong tranh không dùng vật đó.
- Không có chữ, không watermark.
- Phong cách phẳng: đầu hình tròn, thân là nét dày bo tròn (stroke-linecap round), tay chân là polyline bo tròn. Khung 1000 x 700.

Các hàm hỗ trợ đã dùng:

```python
import cairosvg, io
from PIL import Image, ImageOps
SK='#f1c7a2'
def limb(pts,w,c):
    d="M"+" L".join(f"{x},{y}" for x,y in pts)
    return f'<path d="{d}" fill="none" stroke="{c}" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round"/>'
def circ(x,y,r,c): return f'<circle cx="{x}" cy="{y}" r="{r}" fill="{c}"/>'
def rect(x,y,w,h,c,rx=0,extra=''):
    if isinstance(rx,str): extra=rx; rx=0
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{c}" {extra}/>'
def wrap(body): return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 700" width="1000" height="700">{body}</svg>'

def to_jpg_bw(svg,path):
    png=cairosvg.svg2png(bytestring=svg.encode(),output_width=1000,output_height=700)
    im=Image.open(io.BytesIO(png)).convert('L')
    ImageOps.autocontrast(im,cutoff=1).save(path,quality=92)
```

Cách dựng một người (nhìn nghiêng, quay sang phải), toạ độ tham khảo:
- Chân: `limb([(322,440),(308,565)],30,'#2f3b52')` và chân thứ hai, bàn chân là ellipse đen.
- Thân: `limb([(335,300),(335,445)],76,màu_áo)`.
- Đầu: `circ(338,235,40,SK)` cộng tóc (path nửa vòng tròn) và một chấm mắt lệch về hướng đang quay.
- Tay: `limb([vai, khuỷu, bàn tay],22,SK)`, ống tay áo là đoạn đầu với màu áo; bàn tay là circle bán kính 14 đến 16.
- Muốn chỉ tay: thêm một nét mảnh `limb(..., 9, SK)` kéo dài từ bàn tay làm ngón trỏ.

Các cảnh đã làm cho Part 1 trong bộ q1-q6 (dùng lại nếu cần làm lại): đẩy xe hàng (q1), với tay lấy sách ở kệ cao (q2), đưa tài liệu cho người khác (q3), chỉ vào biểu đồ trên bảng trắng có người ngồi nghe (q4), gõ laptop với cuốn sổ đóng trên bàn (q5), đội mũ bảo hộ đứng tay không (q6).

Sau khi vẽ xong PHẢI ghép các ảnh thành một tấm xem trước (3 cột x 2 hàng) rồi mở xem để kiểm tra từng tranh có khớp đáp án đúng và không vô tình làm đáp án sai thành đúng, trước khi giao.

## 5. Đóng gói và giao

```python
import zipfile
z=zipfile.ZipFile('toeic-listening.zip','w',zipfile.ZIP_DEFLATED)
for n in audio_numbers: z.write(f'tts/out/q{n}.mp3',f'toeic-listening/audio/q{n}.mp3')
for n in image_numbers: z.write(f'img/gray/q{n}.jpg',f'toeic-listening/image/q{n}.jpg')
z.close()
```

Giao file `toeic-listening.zip` bằng công cụ gửi file. Dặn người dùng khi nạp vào app: chọn thư mục gốc `toeic-listening`, không chọn riêng `audio/` hay `image/`.

## 6. Danh sách kiểm tra trước khi giao

1. Số file audio khớp với tập `number` của các câu (Part 3-4: một file cho mỗi nhóm 3 câu, đặt theo number đầu nhóm).
2. Số ảnh đúng bằng số câu Part 1, đã chuyển sang đen trắng.
3. Cấu trúc zip đúng `toeic-listening/audio/` và `toeic-listening/image/`.
4. Nói rõ audio là giọng máy và AI chưa nghe thử; ảnh là tranh minh họa vẽ bằng code, không phải ảnh chụp.
5. Nếu người dùng muốn ảnh chụp thực tế: dùng prompt mẫu trong mục "Tạo ảnh cho Part 1 bằng AI" của file hướng dẫn (xem [ToeicListeningHelpModal.jsx](../src/exam-types/toeic/components/ToeicListeningHelpModal.jsx)) để họ tự tạo bằng công cụ khác.
