# Hướng dẫn publish QR Loyalty cho nhiều cửa hàng (dành cho người không rành lập trình)

Tài liệu này hướng dẫn bạn cách **đưa app lên internet** để nhiều quán dùng được, theo đúng luồng hiện tại của repo:

- **Customer app (khách)**: khách quét QR của quán → vào trang quán → login (SĐT/email) → thấy điểm + QR cá nhân.
- **Merchant app (nhân viên/quán)**: nhân viên login → quét QR khách → cộng điểm.
- **API app**: xử lý login, cộng điểm, dashboard.

Bạn muốn:
- URL kiểu `loyalty.com/shops/thaonguyencoffee` và `loyalty.com/shops/hutieuanhtu`.
- Mỗi quán **tự quản lý dữ liệu của họ** (bạn không giữ dữ liệu khách/điểm của quán).

Trong code hiện tại, `shopId` chính là phần nằm trong URL: `.../shops/<shopId>`.
=> Bạn có thể đặt `shopId` là một “slug” dễ nhớ như `thaonguyencoffee`.

---

## 1) Hiểu đúng 2 tình huống bạn nêu

### Tình huống 1: Quán có máy tính riêng
- Máy tính chỉ cần mở trình duyệt để:
  - đăng nhập Merchant app
  - mở màn hình scan (nếu máy có camera) hoặc dùng điện thoại để quét
  - mở dashboard để xem số liệu
- Khi nhân viên cộng điểm xong:
  - Dữ liệu lưu ở database của quán (cloud)
  - Khách bấm **Refresh** sẽ thấy điểm tăng
  - Máy tính của quán bấm **Refresh** dashboard sẽ thấy số liệu cập nhật

### Tình huống 2: Quán không có máy tính
- Vẫn dùng được bình thường vì **Merchant app chạy trên điện thoại**.
- Điểm khác duy nhất: quán không có màn hình PC để xem dashboard, nhưng có thể xem trên điện thoại.

> Kết luận: app hiện tại **không bắt buộc quán phải có máy tính**. Có máy tính chỉ giúp xem dashboard tiện hơn.

---

## 2) “Bạn không muốn quản lý data” thì làm sao?

Bạn đang muốn bán “giải pháp + endpoint” nhưng không muốn giữ dữ liệu của từng quán.

Trong thực tế, có 3 mô hình (từ dễ triển khai → khó hơn):

### Mô hình A (khuyến nghị): Mỗi quán có 1 database cloud riêng (miễn phí) + 3 app deploy riêng
- Mỗi quán có:
  - 1 database Postgres riêng (ví dụ Supabase/Neon)
  - 1 API deployment riêng
  - 1 Customer deployment riêng
  - 1 Merchant deployment riêng
- Dữ liệu của quán nằm trong tài khoản cloud của quán.
- Bạn có thể hỗ trợ setup ban đầu, nhưng **không sở hữu dữ liệu**.

Nhược điểm:
- URL của quán thường sẽ là 1 domain riêng, ví dụ:
  - `https://thaonguyencoffee-customer.vercel.app/shops/thaonguyencoffee`

### Mô hình A+ (thực tế nhất nếu bạn vẫn muốn URL đẹp dưới `loyalty.com/shops/<slug>`): Dùng 1 trang “redirect” trung gian
- Bạn vẫn làm theo mô hình A (mỗi quán có stack riêng, tự giữ data).
- Bạn tạo thêm 1 trang cực đơn giản ở domain chung `loyalty.com`, chỉ làm việc:
  - Khi ai đó vào `loyalty.com/shops/thaonguyencoffee` → **redirect** sang URL thật của quán.
- Trang redirect chỉ lưu bảng ánh xạ `shopSlug -> shopCustomerUrl`.
  - Đây không phải dữ liệu khách hàng/điểm.

### Mô hình B (ý tưởng Google Drive/Google Sheets)
- Google Drive **không phải database**, nên để “lưu điểm” bạn cần dùng Google Sheets hoặc Google Apps Script.
- Repo hiện tại đang dùng **Postgres + Prisma**, nên để chuyển sang Google Sheets sẽ phải **làm lại phần lưu trữ**.

Khuyến nghị thực tế:
- Nếu mục tiêu là “miễn phí + đơn giản + ổn định”, hãy dùng **Supabase (Postgres)** cho mỗi quán.
- Nếu bạn bắt buộc muốn Google (Sheets/Drive), hãy xem đây là **phase 2**.

---

## 3) Checklist nhanh trước khi publish

Bạn cần chuẩn bị:

1) Một “tên quán trong URL” (slug) cho mỗi quán
- Ví dụ:
  - Coffee Thảo Nguyên → `thaonguyencoffee`
  - Hủ tiếu Anh Tư → `hutieuanhtu`
- Quy tắc nên dùng:
  - chữ thường, không dấu, không khoảng trắng
  - chỉ dùng `a-z`, `0-9`, dấu `-` nếu cần

2) Tài khoản cloud (khuyên dùng)
- Vercel (deploy web): https://vercel.com
- Supabase (Postgres miễn phí): https://supabase.com

3) (Tuỳ chọn) Domain chung `loyalty.com`
- Nếu bạn muốn URL chuẩn đẹp.

---

## 4) Triển khai theo mô hình A (mỗi quán tự sở hữu database)

Phần này là “recipe” bạn có thể lặp lại cho mỗi quán.

### Bước 4.1 — Tạo database Postgres cho quán (Supabase)

1) Quán (hoặc bạn làm giúp nhưng đăng nhập bằng tài khoản của quán) tạo Supabase project
2) Lấy connection string (DATABASE_URL)
- Dạng ví dụ:
  - `postgresql://USER:PASSWORD@HOST:5432/postgres?schema=public`

Ghi lại `DATABASE_URL` vì bạn sẽ dùng nó ở bước migrate/seed.

### Bước 4.2 — Deploy 3 app lên Vercel (API + Customer + Merchant)

Bạn sẽ tạo 3 project trên Vercel, mỗi project trỏ vào một thư mục con của repo:

- Project 1: `api`
  - Root Directory: `apps/api`
- Project 2: `customer`
  - Root Directory: `apps/customer`
- Project 3: `merchant`
  - Root Directory: `apps/merchant`

#### 4.2.1 — Cấu hình ENV cho API project

Trong Vercel project `api`, set các biến môi trường:

- `DATABASE_URL` = connection string của Supabase (của quán)
- `CUSTOMER_SESSION_SECRET` = chuỗi bí mật dài (random)
- `MERCHANT_SESSION_SECRET` = chuỗi bí mật dài (random)
- `CUSTOMER_QR_SECRET` = chuỗi bí mật dài (random)
- `APP_BASE_URL_CUSTOMER` = URL của customer app (sau khi deploy customer)
  - Ví dụ: `https://thaonguyencoffee-customer.vercel.app`

Ghi chú:
- Trong repo có `apps/api/.env.example` để bạn biết tên biến.

#### 4.2.2 — Cấu hình ENV cho Customer project

Trong Vercel project `customer`, set:

- `NEXT_PUBLIC_API_BASE_URL` = URL của API app
  - Ví dụ: `https://thaonguyencoffee-api.vercel.app`

#### 4.2.3 — Cấu hình ENV cho Merchant project

Trong Vercel project `merchant`, set:

- `NEXT_PUBLIC_API_BASE_URL` = URL của API app

### Bước 4.3 — Migrate database (tạo bảng) cho quán

Bạn cần chạy migrate lên database của quán **1 lần**.

Trên máy của bạn (macOS), mở terminal ở thư mục repo và chạy:

1) Cài dependencies (chỉ lần đầu)
```bash
npm install
```

2) Trỏ DATABASE_URL sang database của quán và migrate
```bash
export DATABASE_URL="<DATABASE_URL_CUA_QUAN>"

npm run db:generate
npm run db:migrate:deploy
```

Giải thích nhanh:
- `db:generate` tạo Prisma client
- `db:migrate:deploy` áp migrations có sẵn vào DB

### Bước 4.4 — Tạo shopId + tài khoản nhân viên cho quán

Repo có sẵn 1 lệnh để bạn tạo “shop” và “staff user” mà không phải sửa code seed.

1) Trỏ DATABASE_URL sang DB của quán
2) Chạy lệnh provision (ví dụ cho Coffee Thảo Nguyên)
```bash
export DATABASE_URL="<DATABASE_URL_CUA_QUAN>"

npm -w apps/api run shop:provision -- \
  --shopId=thaonguyencoffee \
  --shopName="Coffee Thảo Nguyên" \
  --timezone=Asia/Ho_Chi_Minh \
  --staffLogin=staff@thaonguyen.local \
  --staffPassword="password123" \
  --staffDisplayName="Thảo Nguyên Staff" \
  --awardPresets=2,3,5 \
  --defaultAwardPoints=1 \
  --dailyAwardLimitPerCustomer=3
```

Ghi chú quan trọng:
- `shopId` chính là phần bạn muốn xuất hiện trong URL: `/shops/<shopId>`.
- `staffPassword` là mật khẩu để nhân viên đăng nhập Merchant app.

---

## 5) Tạo endpoint + in QR cho quán

### 5.1 — Link khách hàng (endpoint chính)

Link khách hàng của quán có dạng:
- `https://<CUSTOMER_DOMAIN>/shops/<shopId>`

Ví dụ:
- `https://thaonguyencoffee-customer.vercel.app/shops/thaonguyencoffee`

### 5.2 — Lấy URL chuẩn để in “Shop QR” từ API

API có endpoint trả về URL để bạn đem đi tạo QR:

- `GET https://<API_DOMAIN>/api/public/shops/<shopId>/qr`

Ví dụ:
- `GET https://thaonguyencoffee-api.vercel.app/api/public/shops/thaonguyencoffee/qr`

Kết quả JSON sẽ có field `url`.
- Copy `url` đó
- Dùng web tạo QR (bất kỳ) để tạo ảnh QR
- In QR đó và dán tại quầy

---

## 6) Vận hành tại quán (đúng theo 2 trường hợp)

### 6.1 — Luồng khách (Customer)
1) Khách quét Shop QR
2) Mở trang quán → bấm Continue
3) Nhập SĐT/email để login
4) Thấy điểm và QR cá nhân
5) Khi nhân viên cộng điểm xong, khách bấm Refresh → điểm tăng

### 6.2 — Luồng nhân viên (Merchant)

#### Nếu quán có máy tính
- Trên máy tính mở Merchant app: `https://<MERCHANT_DOMAIN>/login`
- Nhập:
  - `shopId` = slug của quán (vd `thaonguyencoffee`)
  - `username/email` = staffLogin
  - `password` = staffPassword
- Vào màn hình scan:
  - Nếu máy tính không có camera: dùng điện thoại đăng nhập merchant để quét

#### Nếu quán không có máy tính
- Nhân viên dùng điện thoại mở Merchant app và làm y chang.

> Dashboard: mở `https://<MERCHANT_DOMAIN>/dashboard` (PC hay điện thoại đều được).

---

## 7) Nếu bạn muốn URL đúng dạng `loyalty.com/shops/<slug>`

Như đã nói ở phần 2, cách thực tế nhất để bạn không giữ data là:

- Mỗi quán deploy riêng (mô hình A)
- Domain `loyalty.com` chỉ làm redirect

Bạn sẽ cần:
1) Một danh sách mapping:
- `thaonguyencoffee` → `https://thaonguyencoffee-customer.vercel.app/shops/thaonguyencoffee`
- `hutieuanhtu` → `https://hutieuanhtu-customer.vercel.app/shops/hutieuanhtu`

2) Một trang redirect đơn giản (deploy Vercel/Cloudflare Pages)
- Khi truy cập `loyalty.com/shops/<slug>` thì redirect theo mapping.

Nếu bạn muốn, mình có thể tạo sẵn “redirect app” nhỏ này trong repo (không động vào data của quán).

---

## 8) Câu hỏi quan trọng về “Google Drive”

Bạn có thể dùng Google Drive/Sheets để lưu dữ liệu, nhưng cần lưu ý:

- Drive là nơi lưu file → không phù hợp để update điểm liên tục.
- Sheets có thể dùng như database đơn giản, nhưng:
  - cần làm thêm auth Google
  - cần sửa lại backend hiện tại (đang dùng Postgres/Prisma)

Nếu mục tiêu của bạn là chạy sớm cho nhiều quán, mình khuyên:
- V1: dùng Supabase/Neon (Postgres miễn phí) cho từng quán
- V2: sau khi ổn định mới làm Google Sheets/Drive nếu thật sự cần

---

## 9) Checklist bàn giao cho mỗi quán

Khi bạn “bán giải pháp” và bàn giao cho quán, bạn nên bàn giao 5 thứ:

1) `shopId` của quán (slug)
2) Link khách (customer endpoint)
3) Link nhân viên (merchant endpoint)
4) Tài khoản staff (username/password)
5) Supabase account là của quán (để quán tự sở hữu dữ liệu)

---

## 10) Bạn đang muốn mình làm tiếp phần nào?

Chọn 1 trong 2 hướng:

1) Bạn muốn mình **tạo luôn redirect app** để có URL dạng `loyalty.com/shops/<slug>` (chỉ redirect, không lưu data khách).
2) Bạn muốn mình **viết thêm hướng dẫn “1 quán 1 lần setup” dạng checklist in ra** (siêu cơ bản) để bạn đưa cho chủ quán làm theo.
