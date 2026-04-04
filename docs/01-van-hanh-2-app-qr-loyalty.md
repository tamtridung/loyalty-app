# Tài liệu vận hành (dành cho người không chuyên)

Tài liệu này hướng dẫn bạn **vận hành 2 app**:

- **Customer app** (Khách): xem điểm + hiện QR của khách
- **Merchant app** (Nhân viên/quán): đăng nhập, quét QR khách, cộng điểm, xem dashboard

> Lưu ý: Hệ thống này thực tế chạy **3 phần** (2 app + 1 API). Bạn chỉ “dùng” 2 app, nhưng khi chạy trên máy để test/đào tạo thì cần chạy đủ API.

---

## 1) Bạn cần chuẩn bị gì?

### 1.1. Phần mềm bắt buộc (cài 1 lần)

- **Node.js** (khuyến nghị bản LTS)
- **PostgreSQL** (database)
- VS Code (để mở repo)

Nếu bạn không muốn cài PostgreSQL, bạn có thể nhờ dev/IT cung cấp `DATABASE_URL` trỏ tới DB có sẵn.

### 1.2. Repo này có những thư mục nào là quan trọng?

- `apps/customer` — Customer app (khách)
- `apps/merchant` — Merchant app (quán)
- `apps/api` — API + Prisma + seed
- `db/prisma` — schema DB
- `tests` — test tự động

---

## 2) Các khái niệm nhanh (đọc 2 phút)

- **Shop** = quán. Mỗi quán có `shopId` (ví dụ mặc định: `demo-shop`).
- **Staff (nhân viên)**: đăng nhập Merchant app bằng username/email + password.
- **Customer (khách)**: “đăng nhập” bằng **SĐT/email** (không OTP, không password).
- **Shop QR (QR của quán)**: một QR in ra ở quầy. Khách quét QR này để mở trang của quán.
- **Customer QR (QR của khách)**: khách mở màn hình điểm và đưa QR này để nhân viên quét.

---

## 3) Chạy hệ thống trên máy (Local) để học và demo

### 3.1. Cài dependencies (1 lần / khi có cập nhật)

Mở Terminal tại thư mục gốc repo và chạy:

- `npm install`

### 3.2. Cấu hình biến môi trường (env)

Bạn sẽ tạo 3 file cấu hình (copy từ file mẫu):

1) API env
- Copy `apps/api/.env.example` → `apps/api/.env`

2) Customer env
- Copy `apps/customer/.env.example` → `apps/customer/.env.local`

3) Merchant env
- Copy `apps/merchant/.env.example` → `apps/merchant/.env.local`

#### Ý nghĩa các env quan trọng

- `DATABASE_URL` (ở API): link tới PostgreSQL
- `CUSTOMER_SESSION_SECRET`, `MERCHANT_SESSION_SECRET`, `CUSTOMER_QR_SECRET`: khóa bí mật để ký token/QR
  - Local dev có thể để mặc định.
  - Môi trường thật: phải đổi sang chuỗi mạnh và giữ bí mật.
- `APP_BASE_URL_CUSTOMER`: base URL để API tạo link in QR của quán
  - Local dev: `http://localhost:3000`
- `NEXT_PUBLIC_API_BASE_URL` (Customer/Merchant): URL của API
  - Local dev: `http://localhost:3001`

### 3.3. Khởi tạo database (migrate + seed)

Chạy tại thư mục gốc repo:

- `npm run db:migrate`
- `npm run db:seed`

Seed sẽ tạo sẵn:
- `shopId`: `demo-shop`
- `staff`:
  - username/email: `staff@demo.local`
  - password: `password`

### 3.4. Chạy 3 server cùng lúc

Chạy tại thư mục gốc repo:

- `npm run dev`

Mặc định các cổng:
- Customer app: `http://localhost:3000`
- API: `http://localhost:3001`
- Merchant app: `http://localhost:3002`

> Ghi chú: API nằm dưới các đường dẫn `http://localhost:3001/api/...`. Trang `http://localhost:3001/` chỉ là trang thông báo API đang chạy.

---

## 4) Vận hành luồng demo chuẩn (đúng theo nghiệp vụ)

### 4.1. Bước A — In QR của quán (Shop QR)

Mục tiêu: có một QR để khách quét và đi tới trang quán.

1) Lấy link “cố định” để in QR của quán (public endpoint):

- Mở trình duyệt: `http://localhost:3001/api/public/shops/demo-shop/qr`

2) API sẽ trả JSON có trường `url` kiểu:

- `http://localhost:3000/shops/demo-shop`

3) Dùng **bất kỳ tool tạo QR** (website/extension) để tạo QR từ link đó và in ra.

> Thực tế triển khai: bạn sẽ đặt `APP_BASE_URL_CUSTOMER` là domain customer thật (vd: `https://loyalty.yourdomain.com`).

### 4.2. Bước B — Khách vào Customer app và lấy Customer QR

1) Khách quét **Shop QR** (QR của quán) → mở trang quán
2) Bấm **Continue** → màn hình login
3) Nhập **SĐT hoặc email** → login
4) Khách thấy:
- Điểm hiện tại
- QR của khách (Customer QR)

### 4.3. Bước C — Nhân viên dùng Merchant app để cộng điểm

1) Mở Merchant app:
- `http://localhost:3002/login`

2) Đăng nhập bằng tài khoản seed:
- shopId: `demo-shop`
- username/email: `staff@demo.local`
- password: `password`

3) App chuyển sang trang scan:
- Cho phép quyền camera
- Quét **Customer QR** từ điện thoại khách

4) Sau khi quét xong, app chuyển sang trang award:
- Bấm `+1` (mặc định) hoặc preset `+2`, `+3`...
- Thấy thông báo “Awarded +X points”

### 4.4. Bước D — Khách kiểm tra điểm tăng

Khách mở lại màn hình điểm và bấm **Refresh** để cập nhật điểm.

---

## 5) Dashboard cho quán (xem tổng quan)

Mở:
- `http://localhost:3002/dashboard`

Có 4 lựa chọn:
- `today`
- `yesterday`
- `last_week`
- `last_month`

Các chỉ số chính:
- `awardTransactions`: số lần cộng điểm thành công
- `pointsAwarded`: tổng điểm đã cộng
- `uniqueCustomers`: số khách khác nhau

---

## 6) Các “rule” nghiệp vụ quan trọng (để vận hành đúng)

### 6.1. Preset điểm

- Mặc định có nút `+1`
- Có tối đa 3 preset (config theo shop): ví dụ `+2`, `+3`, `+5`

### 6.2. Giới hạn cộng điểm theo ngày (daily limit)

- Mỗi khách trong mỗi quán bị giới hạn số lần cộng điểm thành công trong ngày
- Mặc định seed: `3` lần/ngày
- Nếu vượt quá sẽ báo lỗi `DAILY_LIMIT_REACHED`

### 6.3. Chống bấm/click lại (idempotency / dedupe)

- Nếu nhân viên vô tình cộng điểm lại quá nhanh (retry) trong một “cửa sổ ngắn” (hiện là ~30s) với cùng staff + customer + points,
  hệ thống sẽ coi là **trùng** và trả về giao dịch cũ (không cộng thêm lần nữa).

---

## 7) E2E smoke test (tự chạy để kiểm tra nhanh)

Smoke test này không dùng camera thật (đi đường tắt), nhưng vẫn kiểm tra được:
- Merchant login
- Award +1 thành công

### 7.1. Cài browser cho Playwright (1 lần)

- `npx playwright install`

### 7.2. Chạy test

Điều kiện:
- DB đã migrate + seed
- `npm run dev` đang chạy

Sau đó chạy:

- `npm run test:e2e`

---

## 8) Các lỗi hay gặp & cách xử lý

### 8.1. Mở customer/merchant nhưng gọi API lỗi

Dấu hiệu:
- Bấm login/refresh bị lỗi

Cách xử lý:
- Kiểm tra API có chạy không: mở `http://localhost:3001/api/customer/login` (phải trả 405 vì GET không hỗ trợ, nhưng không được “Connection refused”)
- Kiểm tra `NEXT_PUBLIC_API_BASE_URL` trong `.env.local` của customer/merchant

### 8.2. Lỗi database (Prisma) / không migrate

Dấu hiệu:
- API trả lỗi liên quan bảng/column

Cách xử lý:
- Chạy lại:
  - `npm run db:migrate`
  - `npm run db:seed`

### 8.3. Camera không quét được

Cách xử lý:
- Thử trên HTTPS (môi trường thật) vì một số trình duyệt hạn chế camera trên HTTP
- Trên local: dùng Chrome/Edge, cấp quyền camera

### 8.4. Login customer “nhầm người” (do không OTP)

Đây là rủi ro đã biết theo spec.
Cách vận hành giảm rủi ro:
- Với demo/MVP: chấp nhận đơn giản
- Khi triển khai thật: cân nhắc OTP hoặc cơ chế xác nhận

---

## 9) Checklist vận hành demo nhanh (1 trang)

1) `npm install`
2) Copy env (3 file)
3) `npm run db:migrate` + `npm run db:seed`
4) `npm run dev`
5) In Shop QR: gọi `GET /api/public/shops/{shopId}/qr` → lấy `url` → tạo QR
6) Customer: mở `/shops/{shopId}` → login → thấy Customer QR
7) Merchant: login → scan Customer QR → award +1
8) Customer: Refresh → điểm tăng
9) Merchant: Dashboard → xem số liệu

---

## 10) Nếu bạn muốn mình viết thêm

Bạn có thể nói rõ bạn muốn đọc theo hướng nào:
- (A) “Vận hành quán thật” (quy trình nhân viên, in QR, xử lý lỗi tại quầy)
- (B) “DevOps nhẹ” (deploy lên server, domain/HTTPS, backup DB, secrets)
- (C) “Giải thích code” (API route là gì, session token/QR ký ra sao)