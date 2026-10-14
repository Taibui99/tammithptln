# VẬN HÀNH — Tammi hourly scanner (Render + Supabase + Vercel, 0đ)

## A. Tạo Supabase (1 lần, ~10 phút)
1. https://supabase.com → New project (free) → lấy `Project URL` + `anon key` + `service_role key`
   (Settings > API). service_role KHÔNG đưa lên web, chỉ bỏ vào Render.
2. SQL Editor → dán toàn bộ `tammi-dashboard/supabase/schema.sql` → Run.
3. Giữ lại 3 key để dùng dưới.

## B. Deploy worker lên Render (1 lần, ~15 phút)
1. Đẩy thư mục `tammi-dashboard` lên 1 repo GitHub riêng (private cũng được).
2. https://render.com → New > Blueprint → chọn repo → file `render.yaml`.
   Nhập ENV: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`. `ADMIN_KEY` tự sinh.
3. Deploy xong mở `https://<tên>.onrender.com/health` → thấy `status: auth_dead` là đúng
   (chưa có token).
4. Nạp token acc đủ 39 nhóm (làm ở máy local, như đã test):
   - `tammi.vn` login → F12 Console → lệnh copy 3 dòng → lưu `token.json`
   - Gửi lên worker (thay ADMIN_KEY + URL):
     ```
     curl -X POST "https://<tên>.onrender.com/import?key=ADMIN_KEY" -H "Content-Type: application/json" --data @token.json
     ```
     → `{"ok":true}` là sống. Xoá `token.json` ngay.
   - Worker tự quét 1 phát lúc boot; các giờ sau quét phút 05 mỗi giờ.
5. UptimeRobot: Add Monitor > HTTP(s) > URL `/health`, interval 5 phút,
   bật alert khi down. Vậy là máy free không bao giờ ngủ.

## C. Dashboard Vercel (1 lần, ~10 phút)
1. Vercel → Add New Project → import repo trên → **Root Directory = `tammi-dashboard/web`** → Deploy.
2. Mở web → nhập Supabase URL + anon key → bấm Xem.
3. Tab "Sĩ số lớp": nhập 39 sĩ số (lần đầu). Tab "Danh sách trừ": thêm
   `TRƯƠNG KHẮC NAM` (toàn trường) + các nick thầy cô.
4. Quét bù giờ đã lỡ: `GET https://<worker>/scan?key=ADMIN_KEY&date=2026-10-14`
   (mặc định quét giờ hiện tại; tin cũ vẫn nằm trong nhóm nên bù được).

## D. Luật sống còn (dán cho người giữ acc quét)
- ĐƯỢC: đóng tab, tắt máy, dùng app điện thoại.
- CẤM: bấm Đăng xuất ở bất kỳ trình duyệt nào, đổi pass acc quét.
- Lỡ bấm → làm lại bước B.4 (2 phút) → gọi `/scan` để quét bù.

## E. Khi Viettel đổi web (dự phòng)
- Dấu hiệu: heartbeat `status=error` liên tục, không phải `auth_dead`.
- Tạm thời: thầy mở `tammi.vn`, chạy bookmark đếm tay 1 phát/ngày (sẽ bổ sung file
  `bookmarklet.js` khi cần), dashboard vẫn có số.
- Sửa chính: update bridge (`git clone` bản mới vào `scanner/lib-bridge`), test 1 nhóm,
  push → Render tự deploy lại.
