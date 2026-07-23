import React, { useEffect, useRef } from "react";
import { Alert } from "antd";
import { ScanOutlined } from "@ant-design/icons";

// Khoảng cách tối đa (ms) giữa 2 phím để coi là máy quét đang gõ (gõ cực nhanh, khác gõ tay bình thường)
const FAST_KEY_GAP_MS = 60;
// Độ dài tối thiểu của chuỗi để tính là 1 lượt quét hợp lệ, tránh nhận nhầm khi gõ tay/Enter thường
const MIN_SCAN_LENGTH = 8;
// Sau khi xử lý xong 1 lượt quét, bỏ qua mọi thứ đến trong khoảng thời gian này — đó chắc chắn
// là phần còn sót của cùng 1 lượt quét vật lý (vd dòng URL tra cứu đi kèm bị gãy giữa chừng).
const SCAN_COOLDOWN_MS = 1200;

// Các thẻ mà người dùng có thể đang gõ tay thật sự (tìm kiếm, chọn ngày...) — tuyệt đối
// không can thiệp phím ở đây, kể cả khi gõ nhanh, để không phá gõ dấu tiếng Việt của người dùng.
const isRealFormField = (target) => {
  if (!target) return false;
  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable
  );
};

// Máy quét QR vật lý gõ chuỗi rất nhanh + Enter, giả lập bàn phím. Thay vì yêu cầu 1 ô input
// đang được focus (dễ mất focus khi đổi tab hoặc bấm chỗ khác), component này lắng nghe keydown
// ở mức window nên chỉ cần đang ở tab này là quét được ngay, không cần bấm chuột vào đâu cả.
const ScanInput = ({ onScan, loading = false, active = true }) => {
  const bufferRef = useRef("");
  const lastKeyTimeRef = useRef(0);
  const lastScanAtRef = useRef(0);

  useEffect(() => {
    if (!active || loading) return undefined;

    const handleKeyDown = (e) => {
      // Người dùng đang gõ tay vào 1 ô input/select thật (vd ô tìm theo họ tên) -> bỏ qua
      // hoàn toàn, không được nuốt phím của họ dù gõ nhanh hay gõ dấu tiếng Việt.
      if (isRealFormField(e.target)) return;

      if (e.key === "Enter") {
        const text = bufferRef.current.trim();
        bufferRef.current = "";
        if (text.length < MIN_SCAN_LENGTH) return; // quá ngắn, không phải dữ liệu từ máy quét

        e.preventDefault();
        e.stopPropagation();

        const now = Date.now();

        // Dòng URL tra cứu đi kèm ngay sau dòng dữ liệu chính (vd https://gplx.csgt.bocongan.gov.vn/)
        // -> luôn bỏ qua, không coi là 1 lượt quét, không gọi API, không báo gì.
        if (/^https?:\/\//i.test(text)) {
          lastScanAtRef.current = now;
          return;
        }

        // Bất kỳ chuỗi nào khác đến ngay sau 1 lượt quét vừa xử lý (trong SCAN_COOLDOWN_MS)
        // đều là phần rác còn sót của CÙNG 1 lượt quét vật lý (dòng URL bị gãy giữa chừng do
        // lệch timing/layout bàn phím) -> bỏ qua hoàn toàn, không gọi API, không báo gì.
        if (now - lastScanAtRef.current < SCAN_COOLDOWN_MS) {
          lastScanAtRef.current = now;
          return;
        }

        lastScanAtRef.current = now;
        onScan?.(text);
        return;
      }

      if (e.key.length !== 1) return; // Bỏ qua phím điều hướng/modifier (Shift, Tab, F5...)

      const now = Date.now();
      const gap = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      if (gap > FAST_KEY_GAP_MS) {
        // Gõ chậm -> có thể là người dùng gõ tay ở ô khác, bắt đầu lại buffer từ ký tự này
        bufferRef.current = e.key;
      } else {
        // Gõ liên tục rất nhanh -> chắc chắn là máy quét, giữ luôn để không gõ lạc vào chỗ khác
        bufferRef.current += e.key;
        e.preventDefault();
        e.stopPropagation();
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [active, loading, onScan]);

  if (!active) return null;

  return (
    <Alert
      type="info"
      showIcon
      icon={<ScanOutlined />}
      message={
        loading
          ? "Đang xử lý mã vừa quét..."
          : "Sẵn sàng quét mã QR trên GPLX — không cần bấm chuột, cứ quét là nhận."
      }
    />
  );
};

export default ScanInput;
