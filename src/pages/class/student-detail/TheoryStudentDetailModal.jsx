import React, { useState, useEffect, useRef, useMemo, forwardRef, useImperativeHandle } from "react";


import { Modal, Tabs, Image, Typography } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

import HoanThanhTab from "./tabs/HoanThanhTab";
import TienDoTab from "./tabs/TienDoTab";
import MinhChungTab from "./tabs/MinhChungTab";
import ThoiGianTab from "./tabs/ThoiGianTab";

const { Text, Title } = Typography;

const TheoryStudentDetailModal = React.memo(forwardRef(({ onClose, enrolmentPlanIid }, ref) => {
  const [visible, setVisible] = useState(false);
  const [studentData, setStudentData] = useState(null);
  const [activeTab, setActiveTab] = useState("1");
  const contentRef = useRef(null);

  useImperativeHandle(ref, () => ({
    open: (data) => {
      setStudentData(data);
      setVisible(true);
      setActiveTab("1");
    },
    close: () => {
      setVisible(false);
    }
  }));

  const handleClose = () => {
    setVisible(false);
    if (onClose) onClose();
  };

  // Scroll top mỗi khi mở Modal
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        if (contentRef.current) {
          const modalBody = contentRef.current.closest('.ant-modal-body');
          if (modalBody) {
            modalBody.scrollTop = 0;
          }
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const user = studentData?.user || {};
  const studentName = user?.name || "Học viên";
  const studentId = user?.iid || user?.code || "";

  const infoItems = useMemo(() => [
    { label: "Mã", value: user?.identification_card || user?.code || "-" },
    { label: "Tên", value: studentName },
    { label: "Giới tính", value: user?.sex === "1" ? "Nam" : "Nữ" },
    { label: "Ngày sinh", value: user?.birthday ? dayjs(user.birthday).format("DD/MM/YYYY") : "-" },
    { label: "Tên đăng nhập", value: user?.identification_card || user?.username || "-" },
    { label: "CCCD/CMT", value: user?.identification_card || "-" },
    { label: "Ngày cấp", value: user?.id_card_date ? dayjs(user.id_card_date).format("DD/MM/YYYY") : "11/08/2021" },
    { label: "Nơi cấp", value: user?.id_card_place || "30" },
    { label: "Đơn vị", value: user?.organization_name || "Trung tâm dạy nghề và sát hạch lái xe Lập Phương Thành" },
    { label: "Phòng ban", value: user?.department || "-" },
    { label: "Là giảng viên", value: "Không" },
  ], [user, studentName]);

  const tabItems = useMemo(() => [
    {
      key: "1",
      label: "Hoàn thành",
      children: <HoanThanhTab studentData={studentData} />,
    },
    {
      key: "2",
      label: "Tiến độ hoàn thành",
      children: <TienDoTab studentData={studentData} enrolmentPlanIid={enrolmentPlanIid} visible={visible} />,
    },
    {
      key: "3",
      label: "Minh chứng học tập",
      children: <MinhChungTab studentData={studentData} enrolmentPlanIid={enrolmentPlanIid} visible={visible} />,
    },
    {
      key: "4",
      label: "Thời gian học",
      children: (
        <ThoiGianTab
          studentData={studentData}
          enrolmentPlanIid={enrolmentPlanIid}
          visible={visible}
        />
      ),
    },
  ], [studentData, enrolmentPlanIid, visible]);

  if (!visible && !studentData) return null;

  return (
    <Modal
      open={visible}
      onCancel={handleClose}
      footer={null}
      width="75vw"
      destroyOnClose={true}
      styles={{
        body: {
          maxHeight: 'calc(95vh - 90px)',
          overflowY: 'auto',
          marginRight: '-24px',
          padding: '16px',
        }
      }}
      closeIcon={
        <div className="flex items-center justify-center w-5 h-5 rounded-full bg-gray-400">
          <CloseOutlined className="!text-white text-[10px] " />
        </div>
      }
      title={
        <div className="text-gray-600 font-medium text-md border-b border-gray-200 mx-[-24px] px-[36px] pb-[16px]">
          {studentName.toUpperCase()}
        </div>
      }
      centered
    >
      <div ref={contentRef} className="">
        {/* Header Title */}
        <Title level={4} className="!mb-6 !text-gray-700 !font-semibold">
          {studentName.toUpperCase()} (#{studentId})
        </Title>

        {/* Profile Info Section */}
        <div className="flex flex-row gap-10 mb-8 border-b border-gray-200 pb-8">
          <div className="flex-shrink-0">
            <div className="relative">
              <Image
                src={user?.avatar || user?.default_avatar}
                alt="avatar"
                className="!w-54 !h-54 rounded-full object-cover border-4 border-white shadow-sm"
                fallback="https://as1.ftcdn.net/v2/jpg/03/46/83/96/1000_F_346839623_6n7hPgwisPdyitS7ZzSyJskfHByzyNoQ.jpg"
              />
            </div>
          </div>

          <div className="flex-grow">
            <div className="flex flex-col gap-y-0">
              {infoItems.map((item, index) => (
                <div key={index} className="flex gap-2 items-baseline">
                  <Text className="text-gray-400 min-w-[120px] text-[13px]">{item.label}:</Text>
                  <Text strong className="text-gray-700 text-[13px]">{item.value}</Text>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          className="theory-tabs"
        />
      </div>
    </Modal>
  );
}));



export default TheoryStudentDetailModal;
