import React from "react";
import { Modal, Button, Spin } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import StudentDetail from "../StudentDetail";

const DATDetailModal = ({ visible, onClose, student }) => {
  const [shouldRender, setShouldRender] = React.useState(false);

  // Defer rendering until after the modal animate in
  React.useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        setShouldRender(true);
      }, 300); // 300ms is enough for modal transition
      return () => clearTimeout(timer);
    } else {
      setShouldRender(false);
    }
  }, [visible]);

  // Map student record from HocBuDat to the format StudentDetail expects
  const mappedData = React.useMemo(() => {
    if (!student) return null;
    return {
      MaDK: student.ma_dk,
      HoTen: student.ho_ten,
      srcAvatar: student.anh,
      SoCMT: student.cccd,
      NgaySinh: student.ngay_sinh,
      TenKhoaHoc: student.ten_khoa,
      HangDaoTao: student.hang,
      ma_khoa: student.ma_khoa,
    };
  }, [student]);

  return (
    <Modal
      title={`Chi tiết hành trình DAT - ${student?.ho_ten || ""}`}
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          Đóng
        </Button>
      ]}
      width="75%"
      style={{ top: 20 }}
      closeIcon={<CloseOutlined />}
      destroyOnClose
    >
      <div style={{ minHeight: '400px', maxHeight: '80vh', overflowY: 'auto', position: 'relative' }}>
        {shouldRender && mappedData ? (
          <StudentDetail data={mappedData} />
        ) : (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh'
          }}>
            <Spin size="middle" tip="Đang tải chi tiết hành trình..." />
          </div>
        )}
      </div>
    </Modal>
  );
};

export default DATDetailModal;
