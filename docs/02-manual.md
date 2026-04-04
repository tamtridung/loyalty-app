Bạn có thể hiểu app này theo 2 vai trò rõ ràng:

- **Customer (khách)**: vào “trang của quán”, nhập SĐT/email để “nhận diện”, xem điểm và **hiện QR của chính khách**.
- **Merchant (nhân viên/quán)**: đăng nhập bằng tài khoản staff, mở màn hình quét camera, **quét QR của khách** rồi bấm **cộng điểm**.

Dưới đây là hướng dẫn vận hành chi tiết (đúng luồng demo).

**1) Chuẩn bị (đảm bảo 3 server đang chạy)**
- Chạy: `npm run dev`
- Mặc định:
  - Customer app: http://localhost:3000
  - API: http://localhost:3001
  - Merchant app: http://localhost:3002

**2) “Shop QR” là gì và lấy ở đâu? (QR của quán để khách quét vào đúng quán)**
- Mở link này trên trình duyệt (API sẽ trả JSON):  
  http://localhost:3001/api/public/shops/demo-shop/qr
- Bạn sẽ thấy JSON có field `url` kiểu:  
  `http://localhost:3000/shops/demo-shop`
- Dùng bất kỳ tool tạo QR (web/extension) để tạo QR từ `url` đó và in/đưa cho khách quét.
  - QR này gọi là **Shop QR** (QR của quán).

**3) Customer làm gì? (khách vào quán và lấy “Customer QR”)**
- Khách dùng điện thoại quét **Shop QR** → trình duyệt mở trang quán:
  - http://localhost:3000/shops/demo-shop
- Bấm **Continue** → vào trang login của customer
- Nhập **SĐT hoặc email** (không cần mật khẩu/OTP) → login
- Sau khi login, khách sẽ thấy:
  - **Điểm hiện tại**
  - **QR của khách** (đây là **Customer QR** để đưa nhân viên quét)

**4) Merchant đăng nhập như thế nào? (nhân viên/quán)**
- Mở Merchant app:  
  http://localhost:3002/login
- Đăng nhập bằng tài khoản seed mặc định:
  - `shopId`: `demo-shop`
  - `username/email`: `staff@demo.local`
  - `password`: `password`
- Đăng nhập xong app sẽ chuyển sang trang scan (quét QR)
  - Nếu trình duyệt hỏi quyền camera: chọn **Allow/Cho phép**

**5) Merchant cộng điểm như thế nào?**
- Trên Merchant app (màn hình scan): đưa camera quét **Customer QR** trên điện thoại khách
- Quét xong sẽ chuyển sang màn hình award (cộng điểm)
- Bấm `+1` (hoặc preset `+2`, `+3`, `+5` nếu có) → thấy thông báo kiểu “Awarded +X points”

**6) Customer kiểm tra điểm tăng**
- Khách quay lại màn hình điểm và bấm **Refresh** → điểm sẽ tăng

**7) Merchant xem dashboard**
- Mở: http://localhost:3002/dashboard
- Chọn khoảng thời gian (`today`, `yesterday`, `last_week`, `last_month`)
- Xem các số:
  - `awardTransactions`: số lần cộng điểm
  - `pointsAwarded`: tổng điểm đã cộng
  - `uniqueCustomers`: số khách khác nhau

Nếu bạn muốn, bạn nói bạn đang kẹt ở bước nào (ví dụ “không thấy ô shopId”, “login sai”, “không xin được camera”), mình sẽ hướng dẫn đúng theo màn hình bạn đang thấy. Ngoài ra hướng dẫn này cũng nằm trong tài liệu van-hanh-2-app-qr-loyalty.md.