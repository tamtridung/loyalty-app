# Feature Specification: QR Loyalty Points Web App

**Feature Branch**: `001-qr-loyalty-webapp`  
**Created**: 2026-04-02  
**Status**: Draft  
**Input**: User description: "Tạo web app tối ưu cho điện thoại để tích điểm khách hàng cho quán cà phê/quán ăn. Luồng: khách thanh toán → quán đưa QR → khách quét QR → đăng nhập SĐT/Gmail → xem điểm & QR của mình → nhân viên quét QR khách để tích điểm → thông báo thành công. Yêu cầu: 2 web-app (khách/quán), dashboard quán (hôm nay/hôm qua/tuần trước/tháng trước), khách đổi tên hiển thị, đăng nhập không OTP, UI hiện đại tối giản kiểu Apple."

## Clarifications

### Session 2026-04-02

- Q: “Đăng nhập khách không OTP” cụ thể là cơ chế nào? → A: Khách chỉ nhập SĐT/email là vào được ngay (không mật khẩu/không xác thực).
- Q: Mỗi lần nhân viên quét QR khách thì cộng bao nhiêu điểm? → A: Mặc định +1 điểm; nhân viên chọn số điểm qua tối đa 3 nút gợi ý (preset) có thể cấu hình.
- Q: Quy tắc chống quét lặp (cộng điểm trùng) là gì? → A: Mỗi khách tại mỗi quán tối đa N lần/ngày (N cấu hình).
- Q: Nhân viên/chủ quán đăng nhập web-app quán bằng cách nào? → A: Tài khoản nhân viên riêng (email/username + mật khẩu).
- Q: Giá trị mặc định của N lần/ngày là bao nhiêu nếu quán chưa cấu hình? → A: 3.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Tích điểm bằng QR tại quán (Priority: P1)

Khách hàng sau khi thanh toán tại quán quét QR của quán để mở trang tích điểm của quán đó, đăng nhập bằng SĐT hoặc email (Gmail). Sau khi đăng nhập, khách nhìn thấy tổng điểm hiện có tại quán và một mã QR cá nhân để nhân viên quét. Nhân viên đăng nhập vào web-app dành cho quán và quét QR của khách để cộng điểm, cả nhân viên và khách đều nhận được xác nhận “tích điểm thành công”.

**Why this priority**: Đây là luồng tạo giá trị cốt lõi (tích điểm nhanh tại quầy) và là lý do chính để người dùng sử dụng hệ thống.

**Independent Test**: Có thể test end-to-end tại 1 quán bằng 2 điện thoại (khách + nhân viên): khách đăng nhập, hiển thị QR cá nhân, nhân viên quét và hệ thống cập nhật điểm + hiện thông báo thành công.

**Acceptance Scenarios**:

1. **Given** khách đang ở trang tích điểm của một quán và chưa đăng nhập, **When** khách đăng nhập bằng SĐT hoặc email và truy cập trang tích điểm, **Then** khách thấy tổng điểm hiện tại tại quán đó và mã QR cá nhân để tích điểm.
2. **Given** nhân viên đã đăng nhập vào web-app quán, **When** nhân viên quét mã QR cá nhân của khách, **Then** hệ thống cộng điểm cho khách tại quán đó và hiển thị thông báo thành công trên cả thiết bị nhân viên và giao diện khách.
3. **Given** nhân viên đã đăng nhập vào web-app quán và quán có cấu hình các nút cộng điểm nhanh, **When** nhân viên quét QR khách và chọn một nút cộng điểm (ví dụ +2 hoặc +3), **Then** giao dịch tích điểm ghi nhận đúng số điểm đã chọn và tổng điểm của khách tăng tương ứng.
4. **Given** khách đã đạt giới hạn N lần tích điểm trong ngày tại cùng một quán, **When** nhân viên tiếp tục quét QR của khách để cộng điểm, **Then** hệ thống từ chối giao dịch và hiển thị thông báo đạt giới hạn (không thay đổi tổng điểm).
5. **Given** một mã QR của quán (được đặt tại quầy) được quét, **When** khách quét mã này bằng camera điện thoại, **Then** khách được đưa đúng đến trang tích điểm của quán tương ứng.

---

### User Story 2 - Khách đổi tên hiển thị (Priority: P2)

Khách hàng có thể chỉnh sửa “tên hiển thị” trên giao diện tích điểm. Nếu khách không đặt tên, hệ thống hiển thị mặc định theo định danh đăng nhập (SĐT hoặc email).

**Why this priority**: Giúp trải nghiệm cá nhân hoá và giúp nhân viên/quán nhận diện khách quen dễ hơn mà không thay đổi luồng tích điểm cốt lõi.

**Independent Test**: Chỉ cần 1 khách đăng nhập và đổi tên hiển thị; không cần nhân viên quét vẫn test được đầy đủ.

**Acceptance Scenarios**:

1. **Given** khách đã đăng nhập, **When** khách cập nhật tên hiển thị và lưu, **Then** giao diện hiển thị tên mới ngay và được dùng trong các lần truy cập tiếp theo.
2. **Given** khách đã đăng nhập nhưng chưa từng đặt tên hiển thị, **When** khách vào trang tích điểm, **Then** tên hiển thị mặc định là SĐT hoặc email dùng để đăng nhập.

---

### User Story 3 - Quán xem dashboard tình hình tích điểm (Priority: P3)

Chủ quán/nhân viên quản lý có thể xem nhanh dashboard về tình hình tích điểm của quán theo các khoảng thời gian: hôm nay, hôm qua, tuần trước, tháng trước.

**Why this priority**: Tạo giá trị quản trị cho quán, giúp theo dõi hiệu quả chương trình tích điểm theo thời gian.

**Independent Test**: Tạo dữ liệu tích điểm mẫu cho một quán và kiểm tra dashboard hiển thị đúng tổng hợp theo từng khoảng thời gian.

**Acceptance Scenarios**:

1. **Given** quán có phát sinh giao dịch tích điểm, **When** người dùng quán mở dashboard và chọn "hôm nay", **Then** dashboard hiển thị số liệu tổng hợp của hôm nay.
2. **Given** cùng một quán, **When** người dùng chuyển lần lượt qua "hôm qua", "tuần trước", "tháng trước", **Then** mỗi lựa chọn hiển thị đúng dữ liệu theo khoảng thời gian tương ứng.

### Edge Cases

- Khách quét QR quán nhưng mạng yếu/không có mạng: hiển thị lỗi rõ ràng và cho phép thử lại.
- Nhân viên quét nhầm QR (không phải QR của khách hoặc QR bị hỏng): hiển thị “không hợp lệ” và không cộng điểm.
- Quét lặp (nhân viên quét cùng một QR khách nhiều lần liên tiếp): hệ thống phải ngăn cộng điểm trùng theo quy tắc chống trùng lặp đã định nghĩa.
- Khi khách đã đạt giới hạn N lần/ngày tại quán: lần quét tiếp theo phải bị từ chối rõ ràng và không ghi giao dịch thành công.
- Nhân viên chưa đăng nhập hoặc phiên đăng nhập hết hạn khi quét: yêu cầu đăng nhập lại trước khi cộng điểm.
- Nhân viên nhập sai tài khoản/mật khẩu: hiển thị lỗi rõ ràng và không cho phép thao tác cộng điểm.
- Khách đăng nhập bằng cùng SĐT/email trên thiết bị mới: vẫn truy cập được đúng hồ sơ và điểm của mình.
- Người khác nhập SĐT/email của khách trên thiết bị khác: hệ thống xử lý theo đúng mô hình định danh đã chọn (không OTP/không mật khẩu) và đảm bảo vận hành tại quán không bị nhầm lẫn.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Hệ thống MUST cung cấp 2 trải nghiệm web tách biệt: (1) web-app dành cho khách hàng, (2) web-app dành cho quán (nhân viên/chủ quán).
- **FR-002**: Khách MUST có thể truy cập web-app khách bằng cách quét QR của quán (hoặc truy cập đường dẫn tương đương) để vào đúng trang tích điểm của quán đó.
- **FR-003**: Hệ thống MUST cho phép “đăng nhập” khách bằng cách nhập SĐT hoặc email (Gmail) để định danh và MUST NOT yêu cầu OTP, mật khẩu, hoặc bước xác thực bổ sung.
- **FR-004**: Hệ thống MUST hỗ trợ trải nghiệm quay lại nhanh cho khách trên thiết bị đã dùng trước đó (giảm thao tác tại quầy), phù hợp với mô hình đăng nhập chỉ bằng SĐT/email.
- **FR-005**: Sau đăng nhập, web-app khách MUST hiển thị: (a) tổng điểm hiện tại của khách tại quán đang xem, (b) mã QR cá nhân dùng cho tích điểm.
- **FR-006**: Web-app quán MUST hỗ trợ nhân viên quét mã QR cá nhân của khách để thực hiện thao tác “cộng điểm”.
- **FR-007**: Khi cộng điểm, web-app quán MUST cho nhân viên chọn số điểm cộng qua các nút gợi ý (preset) với các ràng buộc: (a) mặc định +1 điểm, (b) hiển thị tối đa 3 nút, (c) các giá trị nút được phép cấu hình theo quán.
- **FR-008**: Khi cộng điểm thành công, hệ thống MUST (a) cập nhật điểm của khách tại quán đó đúng theo số điểm đã chọn và (b) hiển thị thông báo thành công trên web-app quán.
- **FR-009**: Web-app khách MUST phản ánh kết quả tích điểm (ví dụ: điểm tăng lên và/hoặc thông báo thành công) sau khi nhân viên thực hiện cộng điểm.
- **FR-010**: Hệ thống MUST ngăn các trường hợp cộng điểm không hợp lệ (ví dụ: QR không hợp lệ, nhân viên không có quyền tại quán, hoặc quét lặp trong thời gian ngắn) và MUST hiển thị thông báo lỗi rõ ràng.
- **FR-011**: Web-app quán MUST yêu cầu nhân viên đăng nhập bằng tài khoản riêng (email/username + mật khẩu) trước khi thực hiện thao tác quét/cộng điểm.
- **FR-012**: Hệ thống MUST gắn mỗi giao dịch tích điểm với Staff User thực hiện thao tác (để phục vụ đối soát/dashboard).
- **FR-013**: Hệ thống MUST áp dụng giới hạn chống trùng lặp: mỗi Customer tại mỗi Shop tối đa N giao dịch tích điểm thành công trong một ngày (theo múi giờ của quán), trong đó N là giá trị cấu hình theo quán; nếu quán chưa cấu hình thì mặc định N = 3.
- **FR-014**: Web-app khách MUST cho phép khách chỉnh sửa tên hiển thị; nếu không đặt tên thì MUST hiển thị mặc định là SĐT/email đăng nhập.
- **FR-015**: Web-app quán MUST cung cấp dashboard thể hiện tình hình tích điểm theo các mốc: hôm nay, hôm qua, tuần trước, tháng trước.
- **FR-016**: Dashboard MUST hiển thị tối thiểu các chỉ số: tổng số lần tích điểm (giao dịch), tổng điểm đã cộng, và số lượng khách duy nhất có phát sinh tích điểm trong khoảng thời gian đó.
- **FR-017**: UI của cả hai web-app MUST tối ưu cho màn hình điện thoại và hướng tới phong cách hiện đại, tối giản, trực quan (tương thích thao tác một tay tại quầy).

### Key Entities *(include if feature involves data)*

- **Shop**: Quán/cửa hàng; thông tin nhận diện quán và cấu hình chương trình tích điểm (bao gồm các preset nút cộng điểm nhanh và giá trị mặc định).
- **Staff User**: Nhân viên/chủ quán đăng nhập web-app quán; gắn với một hoặc nhiều Shop và quyền thao tác.
- **Customer**: Người dùng được định danh bởi SĐT hoặc email.
- **Membership**: Quan hệ giữa Customer và Shop; chứa điểm hiện tại và các thông tin hiển thị.
- **Point Transaction**: Một lần cộng điểm; gồm thời điểm, Shop, Staff User, Customer, số điểm cộng (theo lựa chọn/preset), và trạng thái thành công/thất bại.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 90%+ các lượt “tích điểm tại quầy” (nhân viên quét QR → nhận xác nhận thành công) hoàn tất trong ≤ 15 giây trong điều kiện mạng ổn định.
- **SC-002**: 99%+ các giao dịch tích điểm hợp lệ được ghi nhận chính xác (điểm của khách tăng đúng, không bị mất/gấp đôi ngoài quy tắc chống trùng lặp).
- **SC-003**: 95%+ người dùng mới có thể đăng nhập và nhìn thấy điểm + QR cá nhân trong ≤ 30 giây (không cần hướng dẫn trực tiếp).
- **SC-004**: Dashboard hiển thị số liệu khớp với tổng hợp giao dịch tích điểm theo từng khoảng thời gian với độ sai lệch = 0 trong kiểm tra đối soát.
- **SC-005**: Tỷ lệ hoàn thành tác vụ chính (khách vào trang → nhân viên quét → tích điểm thành công) đạt ≥ 85% trong thử nghiệm thực tế tại quán.

## Assumptions

- Khách và nhân viên đều sử dụng điện thoại có camera và có kết nối internet trong phần lớn thời gian vận hành.
- “Đăng nhập không OTP” được hiểu là: khách chỉ cần nhập SĐT/email để truy cập tài khoản; không có OTP, không mật khẩu và không bước xác thực bổ sung.
- Mô hình định danh trên đồng nghĩa với việc SĐT/email được xem như “ID truy cập”; các biện pháp giảm rủi ro (nếu cần) sẽ được quyết định ở bước lập kế hoạch và triển khai.
- V1 tập trung vào tích điểm và xem điểm; quy đổi/đổi quà (redemption) không nằm trong phạm vi nếu không được yêu cầu thêm.
- Mỗi lần quét thành công tương ứng với một giao dịch tích điểm; mặc định cộng +1 điểm, và quán có thể cấu hình tối đa 3 giá trị preset để nhân viên chọn nhanh.
- Quán có thể cấu hình giới hạn N lần/ngày cho mỗi khách (N) để giảm việc cộng điểm trùng/nhầm; nếu không cấu hình thì mặc định N = 3.
- Quán sẽ được tạo sẵn các tài khoản Staff User (hoặc có cơ chế quản lý tài khoản nội bộ) trước khi vận hành; chi tiết quy trình tạo/đổi mật khẩu sẽ được quyết định ở bước lập kế hoạch.
- Khoảng thời gian của dashboard được hiểu theo múi giờ địa phương của quán: hôm nay (00:00–23:59), hôm qua, tuần trước (tuần lịch trước đó), tháng trước (tháng lịch trước đó).
