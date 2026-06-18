# SRS - Workshop "Binh Gom Thanh Ha"

## 1. Muc tieu

Xay dung mot web mobile-first cho workshop de khach tham gia tro choi dap binh gom, nhan qua, luu ket qua va de admin quan ly toan bo du lieu.

## 2. Pham vi

### Trong pham vi
- Khach vao web bang dien thoai.
- Nhap thong tin: Ten, MSSV, SDT.
- Chon mot binh gom va dap de mo qua.
- Co hieu ung zoom, am thanh va animation.
- Hien thi qua trung hoac thong diep cam on.
- Luu thong tin nguoi choi va ket qua vao database.
- Admin xem danh sach, loc du lieu, xuat Excel va reset he thong.
- LocalStorage duoc dung de ghi nho trang thai choi va lich su.

### Ngoai pham vi
- Dang nhap nguoi dung phuc tap.
- Thanh toan, thu phi, hoan tien.
- Multi-tenant, phan quyen nhieu cap.
- Tich hop CRM/ERP ngoai.

## 3. Doi tuong lien quan

| Doi tuong | Vai tro |
|---|---|
| Nguoi choi | Nhap thong tin, choi game, nhan qua |
| Admin | Xem du lieu, xuat Excel, reset workshop |
| He thong | Sinh qua, luu du lieu, quan ly reset version |

## 4. Gia dinh va rang buoc

- Du kien khoang 100 luot choi.
- Moi nguoi chi duoc nhan 1 ket qua.
- He thong phai random nhung ton trong so luong qua con lai.
- Reset cua admin phai tu dong xuat Excel truoc khi xoa du lieu.
- LocalStorage khong the xoa truc tiep tren thiet bi nguoi dung tu server; can dung reset version de invalidate du lieu cu.
- Admin can co co che bao ve toi thieu (mat khau/secret).

## 5. Yeu cau chuc nang

| ID | Yeu cau | Uu tien |
|---|---|---|
| REQ-001 | He thong phai hien form nhap Ten, MSSV, SDT truoc khi vao game. | P1 |
| REQ-002 | He thong phai validate du lieu bat buoc va khong cho choi neu thong tin khong hop le. | P1 |
| REQ-003 | He thong phai luu trang thai nguoi choi va lich su tren localStorage de khoi phai dang nhap lai. | P1 |
| REQ-004 | He thong phai hien danh sach binh gom va ho tro click de phong to binh da chon. | P1 |
| REQ-005 | He thong phai cho phep dap binh bang nhieu lan cham, co am thanh va hieu ung hinh anh. | P1 |
| REQ-006 | He thong phai random ket qua dua tren phan bo con lai cua 5 ve trai nghiem, 20 giai to he, va 75 luot khong trung thuong. | P1 |
| REQ-007 | Neu mot loai qua het, he thong phai tu dong loai loai do khoi pool va tinh lai xac suat. | P1 |
| REQ-008 | Khi nguoi choi mo qua xong va bam xac nhan, he thong phai luu thong tin va ket qua vao database. | P1 |
| REQ-009 | Neu nguoi choi da co ket qua da luu, he thong khong hien man dap binh nua ma chi hien nut lich su. | P1 |
| REQ-010 | Admin phai xem duoc danh sach nguoi choi, thong tin lien he va qua da nhan. | P1 |
| REQ-011 | Admin phai xuat duoc file Excel tu du lieu hien tai. | P1 |
| REQ-012 | Khi admin reset, he thong phai tu dong xuat Excel hien tai truoc, sau do reset database ve trang thai ban dau. | P1 |
| REQ-013 | Sau reset, he thong phai tang reset version de localStorage cu cua nguoi choi bi vo hieu hoa va tai lai tu dau. | P1 |
| REQ-014 | Sau reset, nguoi choi co the choi lai tu dau nhu mot workshop moi. | P1 |
| REQ-015 | Khi nhieu nguoi cung bam xac nhan qua, he thong phai dua yeu cau vao hang doi xu ly server-side va cap phat theo transaction de khong cap trung qua. | P1 |

## 6. Quy tac nghiep vu

1. Co 3 loai ket qua:
   - 5 ve trai nghiem lam gom Thanh Ha.
   - 20 giai nhan vat to he 12 con giap.
   - 75 ket qua "Cam on ban da tham gia".
2. Ket qua duoc lay bang co che random co dieu kien.
3. Moi ket qua chi duoc cap 1 lan cho moi nguoi choi.
4. Khi het so luong cua mot loai qua, he thong khong duoc cap loai do nua.
5. Ket qua da xac nhan la trang thai chot, dung de xuat Excel va bao cao admin.
6. Lenh reset cua admin phai la lenh co hieu luc toan he thong.
7. Khi nhieu nguoi cung chot qua, he thong phai xu ly tung request theo hang doi server-side, chi mot request duoc cap nhat inventory tai mot thoi diem.
8. Inventory la nguon su that duy nhat; client khong duoc tu quyet dinh ket qua.

## 7. Yeu cau du lieu

### Cac thuc the chinh
- **Player**: ten, MSSV, SDT, browser/device id, created_at.
- **DrawResult**: player_id, prize_code, prize_label, status, created_at, confirmed_at.
- **PrizeInventory**: prize_code, prize_label, total_qty, remaining_qty, active_flag.
- **ResetEvent**: export_file_name, exported_at, performed_by, previous_version, next_version.
- **AdminUser**: username, password_hash/secret, role.
- **AppState**: reset_version, campaign_status, current_campaign_name.
- **DrawQueueItem**: request_id, player_id, status, enqueued_at, processed_at, retry_count, lock_owner.

### File Excel xuat ra
- Ten.
- MSSV.
- SDT.
- Qua nhan duoc.
- Thoi diem xac nhan.
- Reset version.
- Ghi chu neu co.

## 8. Yeu cau giao dien va trai nghiem

- Giao dien toi uu cho dien thoai, cham mot tay.
- Hien thi binh gom lon, de cham, co zoom ro rang.
- Trang ket qua phai noi bat, de nhan biet ngay.
- Trang admin phai ro rang, de xem danh sach va xuat file.
- Khi da co ket qua, nut "Lich su" phai thay cho man dap binh.

## 9. Yeu cau phi chuc nang

| Nhom | Yeu cau |
|---|---|
| Hieu nang | Trang mobile phai tai nhanh, tat ca luot cham phai phan hoi tot. |
| On dinh | Quy tac random va tru kho phai an toan khi nhieu nguoi choi dong thoi. |
| Bao mat | Du lieu admin va reset phai duoc bao ve, khong public. |
| Tin cay | Reset phai co backup bang Excel truoc khi xoa du lieu. |
| Kha nang mo rong | Co the doi so luong qua va noi dung qua trong moi dot workshop. |
| Kha dung | Luong co ban phai khong phu thuoc vao dang nhap phuc tap. |

## 10. Dieu kien chap nhan

1. Nguoi choi mo web tren dien thoai, nhap du thong tin va vao duoc game.
2. Nguoi choi dap binh va nhan ra dung 1 ket qua.
3. Ket qua duoc luu vao database khi xac nhan.
4. Nguoi choi da co ket qua se khong thay man dap binh nua.
5. Admin xem duoc du lieu va xuat Excel.
6. Admin reset se xuat Excel truoc, sau do reset DB va invalidate localStorage.
7. Sau reset, toan bo nguoi choi co the choi lai tu dau.
8. Khi nhieu nguoi chot qua dong thoi, he thong van dam bao moi qua chi duoc cap 1 lan va khong bi trung inventory.

