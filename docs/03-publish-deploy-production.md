# Publish / Deploy QR Loyalty app (production)

Mục tiêu của hướng dẫn này là giúp bạn đưa app lên chạy thật (có domain), với các yêu cầu:

- Điểm của khách **cập nhật gần như realtime** ngay sau khi nhân viên quét QR và cộng điểm.
- Mỗi cửa hàng có **một “endpoint/URL” riêng** (ít nhất là URL riêng theo `shopId`; nếu cần subdomain riêng cũng có hướng dẫn).
- Dùng **cloud database có free-tier** (miễn phí ở mức nhỏ).
- Bạn có thể mua và gắn **tên miền**.

Repo hiện tại là monorepo có 3 Next.js apps:

- `apps/api` (API + Prisma)
- `apps/customer` (web cho khách)
- `apps/merchant` (web cho nhân viên/quán)

DB là PostgreSQL (Prisma), và luồng hiện tại trên local là:

- Customer vào `.../shops/{shopId}`, login → xem điểm + QR của khách
- Merchant login → scan QR của khách → gọi API award points

---

## 1) Kiến trúc khuyến nghị (dễ làm + free-tier)

Khuyến nghị triển khai theo mô hình sau:

- Hosting web (customer + merchant + api): **Vercel** (free-tier)
- Database: **Supabase Postgres** (free-tier)
- Realtime: **Supabase Realtime** (free-tier ở mức nhỏ) để browser của khách nhận cập nhật ngay khi DB thay đổi
- Domain: mua domain ở bất kỳ nhà cung cấp nào (Namecheap, Cloudflare Registrar, Google Domains…), rồi trỏ DNS về Vercel

Lý do chọn Supabase:

- Bạn đang dùng Postgres + Prisma nên nối Supabase rất “khớp”.
- Supabase có realtime (pub/sub trên thay đổi Postgres) giúp tránh phải tự host WebSocket/SSE server.

Lưu ý về free-tier:

- Free-tier luôn có giới hạn (request/GB/row/compute) và có thể thay đổi theo thời điểm.
- Với demo/POC hoặc vài cửa hàng nhỏ thì OK; khi có traffic thật bạn sẽ cần nâng gói.

---

## 2) Realtime “ngay sau khi quét” (có 2 cách)

### Cách A (nhanh nhất, ít thay đổi code): Auto-refresh/Polling
- Customer page tự gọi API lấy membership mỗi 1–3 giây.
- Ưu: dễ, không cần thêm dịch vụ.
- Nhược: không phải realtime tuyệt đối (trễ 1–3 giây), tốn request.

### Cách B (khuyến nghị để “đúng realtime”): Supabase Realtime
- Customer browser subscribe vào kênh realtime theo `shopId + customerId` (hoặc theo membership row).
- Khi Merchant award points → API cập nhật `Membership.pointsBalance` → Supabase realtime bắn event → Customer UI cập nhật ngay.

Trong code hiện tại, tài liệu vận hành còn yêu cầu bấm Refresh để thấy điểm tăng. Nếu bạn muốn “tự nhảy số điểm” ngay lập tức, bạn sẽ cần triển khai Cách A hoặc Cách B.

---

## 3) “Mỗi cửa hàng 1 endpoint riêng” hiểu theo 2 mức

### Mức 1 (đơn giản, đã có sẵn): URL riêng theo `shopId` (path-based)
Ví dụ:
- Customer: `https://customer.yourdomain.com/shops/demo-shop`
- API award: `https://api.yourdomain.com/api/merchant/shops/demo-shop/award`

Như vậy mỗi shop có endpoint riêng theo đường dẫn `/shops/{shopId}`.

### Mức 2 (marketing/branding): Mỗi shop có subdomain riêng (subdomain-based)
Ví dụ:
- Shop A: `https://a.yourdomain.com` (tự map thành shopId = `a`)
- Shop B: `https://b.yourdomain.com`

Cách này cần:
- DNS wildcard `*.yourdomain.com` trỏ về Vercel
- Middleware/logic để đọc `Host` header và map sang `shopId`

Bạn có thể bắt đầu với Mức 1 (nhanh và chắc), khi cần mới nâng lên Mức 2.

---

## 4) Chuẩn bị thông tin cần có

### 4.1. Các biến môi trường (environment variables)

`apps/api` cần tối thiểu:

- `DATABASE_URL` (Postgres connection string)
- `CUSTOMER_SESSION_SECRET`
- `MERCHANT_SESSION_SECRET`
- `CUSTOMER_QR_SECRET`
- `CORS_ALLOW_ORIGIN` (nên set thành domain customer + merchant trong production)
- `APP_BASE_URL_CUSTOMER` (để API tạo shop QR URL đúng domain customer)

`apps/customer` cần:

- `NEXT_PUBLIC_API_BASE_URL` (URL public của API)

`apps/merchant` cần:

- `NEXT_PUBLIC_API_BASE_URL` (URL public của API)

Gợi ý tạo secret:

- `openssl rand -base64 32`

Ghi chú quan trọng về CORS:

- Code hiện tại ở `apps/api/src/middleware.ts` chỉ cho phép cấu hình **một** giá trị `Access-Control-Allow-Origin`.
- Nếu bạn cần vừa customer vừa merchant gọi API từ browser, cách đơn giản nhất là để `CORS_ALLOW_ORIGIN=*` (API đang dùng bearer token, không dùng cookie).
- Nếu bạn muốn khóa chặt theo whitelist nhiều domain, bạn cần chỉnh middleware để đọc header `Origin` và chỉ phản hồi lại origin nằm trong danh sách cho phép.

### 4.2. Tên miền (gợi ý)

Nếu bạn không cần subdomain theo shop, cấu trúc domain gọn như sau:

- Customer: `customer.yourdomain.com`
- Merchant: `merchant.yourdomain.com`
- API: `api.yourdomain.com`

---

## 5) Bước-by-bước: Setup Supabase (Postgres) và chạy migrations

### 5.1. Tạo Supabase project
1) Tạo account Supabase
2) New Project
3) Chọn region gần bạn
4) Lưu lại DB password

### 5.2. Lấy connection string
Trong Supabase Project Settings → Database → Connection string.

Bạn sẽ có dạng:

- `postgresql://USER:PASSWORD@HOST:PORT/DATABASE`

Dán vào biến `DATABASE_URL` của `apps/api` khi deploy.

### 5.3. Chạy migrate từ máy bạn lên Supabase
Trên máy local (repo này), chạy:

1) Cài dependencies:

- `npm install`

2) Set `DATABASE_URL` trỏ về Supabase (tạm thời trong terminal của bạn)

3) Chạy migrate:

- `npm -w apps/api run db:migrate`

4) Seed dữ liệu demo (tuỳ chọn):

- `npm -w apps/api run db:seed`

Lưu ý:
- `db:migrate` hiện dùng `prisma migrate dev` (thường phù hợp local/dev). Khi triển khai production nghiêm túc, bạn nên chuyển sang luồng `prisma migrate deploy` trong CI/CD.

---

## 6) Bước-by-bước: Deploy lên Vercel (3 projects)

Bạn sẽ tạo 3 project trên Vercel, mỗi project trỏ vào 1 thư mục con.

### 6.1. Deploy API (`apps/api`)
1) Vercel → Add New Project → import repo GitHub của bạn
2) Root Directory: chọn `apps/api`
3) Framework: Next.js
4) Environment variables (Production):

- `DATABASE_URL=...` (Supabase)
- `CUSTOMER_SESSION_SECRET=...`
- `MERCHANT_SESSION_SECRET=...`
- `CUSTOMER_QR_SECRET=...`
- `CORS_ALLOW_ORIGIN=*` (đơn giản nhất) 
- `APP_BASE_URL_CUSTOMER=https://customer.yourdomain.com`

5) Deploy

Sau khi deploy xong bạn sẽ có URL kiểu `https://xxx.vercel.app`.

### 6.2. Deploy Customer (`apps/customer`)
1) Tạo project mới
2) Root Directory: `apps/customer`
3) Env vars:

- `NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com` (hoặc URL vercel tạm của API)

4) Deploy

### 6.3. Deploy Merchant (`apps/merchant`)
1) Tạo project mới
2) Root Directory: `apps/merchant`
3) Env vars:

- `NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com`

4) Deploy

---

## 7) Gắn domain thật

### 7.1. Trỏ domain về Vercel
Trong Vercel, mỗi project có phần Settings → Domains.

Gợi ý:

- API project: add `api.yourdomain.com`
- Customer project: add `customer.yourdomain.com`
- Merchant project: add `merchant.yourdomain.com`

Vercel sẽ đưa hướng dẫn DNS record (CNAME hoặc A record). Bạn làm theo đúng hướng dẫn đó trong trang quản trị domain.

### 7.2. Nếu muốn subdomain theo shop (wildcard)
Chỉ làm khi bạn thực sự cần Mức 2 ở mục 3.

- Add wildcard domain `*.yourdomain.com` cho customer project
- Thêm DNS record wildcard theo hướng dẫn Vercel
- Cần cập nhật routing để map `Host` → `shopId`

---

## 8) Kiểm tra chạy thật (production smoke test)

1) Tạo/đảm bảo có 1 shop active trong DB (ví dụ `demo-shop`)
2) Gọi API tạo Shop QR:

- `GET https://api.yourdomain.com/api/public/shops/demo-shop/qr`

Trong response sẽ có `url` trỏ về customer domain.

3) Mở URL đó trên điện thoại, login customer, thấy QR khách
4) Merchant login, scan QR khách, award points
5) Customer thấy điểm tăng:

- Nếu bạn chưa làm realtime: reload/refresh sẽ thấy
- Nếu đã làm realtime: điểm tăng ngay

---

## 9) Checklist production tối thiểu (khuyến nghị)

- Set secrets đủ mạnh, không dùng secret mặc định
- Nếu muốn khóa CORS theo nhiều domain: cập nhật middleware để whitelist nhiều origin
- Bật HTTPS (Vercel mặc định có)
- Tắt shop không dùng (Shop.status = inactive)
- Backup DB (Supabase có snapshot/backup theo gói)

---

## 9.1) Lưu ý Prisma + Postgres khi deploy serverless

Khi chạy Prisma trên môi trường serverless (như Vercel), nếu traffic tăng bạn có thể gặp lỗi do quá nhiều DB connections.

Gợi ý hướng xử lý (chọn 1):

- Dùng connection pooling của Supabase (pooler) cho connection string dùng ở runtime.
- Dùng giải pháp pooling/accelerate cho Prisma (tuỳ gói và thời điểm).

Nếu bạn gặp lỗi kiểu "too many connections" hoặc timeout, đây thường là nguyên nhân đầu tiên cần kiểm tra.

---

## 10) Phần cần làm thêm để “realtime đúng nghĩa” (gợi ý hướng triển khai)

Nếu bạn muốn mình làm giúp phần realtime ngay trong codebase này, mình có thể triển khai theo 1 trong 2 hướng:

- Hướng 1: Polling trong customer membership page (dễ nhất)
- Hướng 2: Supabase Realtime (đúng realtime, ít request, cần thêm Supabase client + cấu hình table replication)

Bạn trả lời giúp 2 câu:

1) Bạn ưu tiên “dễ triển khai” hay “đúng realtime chuẩn”?
2) Bạn muốn endpoint theo shop là dạng `/shops/{shopId}` (đang có) hay muốn `shopA.yourdomain.com` (wildcard subdomain)?
