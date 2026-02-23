import React from "react";
import { Modal, Progress, Table, Card, Row, Col, Flex, Image } from "antd";
import {
  CheckCircleFilled,
  CloseCircleFilled,
  CloseOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { LICENSE_PLATE_LABEL } from "../../constants";

const StudentDetailModal = ({
  visible,
  onClose,
  studentData,
  progress,
  passed,
  total,
}) => {
  const columns = [
    {
      title: "Tên chỉ tiêu",
      dataIndex: "rubricName",
      key: "rubricName",
      width: "60%",
    },
    {
      title: "Điểm",
      dataIndex: "score",
      key: "score",
      align: "center",
      width: "20%",
    },
    {
      title: "Passed",
      dataIndex: "passed",
      key: "passed",
      align: "center",
      width: "20%",
      render: (passed) =>
        passed ? (
          <CheckCircleFilled className="!text-green-600 text-lg" />
        ) : (
          <CloseCircleFilled className="!text-red-600 text-lg" />
        ),
    },
  ];

  const transformDataForTable = (apiData) => {
    if (!apiData) return [];

    return [
      // {
      //   key: "1",
      //   rubricName: `Khóa học: ${apiData.khoaHoc?.tenKhoaHoc || ""}`,
      //   score: apiData.phapLuatGT08?.tongOnTap?.diem || 0,
      //   passed: apiData.trangThaiDat === "Đạt",
      // },
      {
        key: "2",
        rubricName: "Kỹ thuật lái xe",
        score: apiData.kyThuatLaiXe?.diem || 0,
        passed: apiData.kyThuatLaiXe?.trangThaiDat === "Đạt",
      },
      {
        key: "3",
        rubricName: "Cấu tạo sửa chữa",
        score: apiData.cauTaoSuaChua?.diem || 0,
        passed: apiData.cauTaoSuaChua?.trangThaiDat === "Đạt",
      },
      {
        key: "4",
        rubricName: "Đạo đức, VHGT, PCCC",
        score: apiData.daoDucVHGT?.diem || 0,
        passed: apiData.daoDucVHGT?.trangThaiDat === "Đạt",
      },
      {
        key: "5",
        rubricName: "Pháp luật GTĐB (Tổng ôn)",
        score: apiData.phapLuatGT08?.tongOnTap?.diem || 0,
        passed: apiData.phapLuatGT08?.tongOnTap?.trangThaiDat === "Đạt",
      },
      {
        key: "6",
        rubricName: "PL1 - Luật trật tự, ATGT",
        score: apiData.phapLuatGT08?.pl1?.diem || 0,
        passed: apiData.phapLuatGT08?.pl1?.trangThaiDat === "Đạt",
      },
      {
        key: "7",
        rubricName: "PL2 - Biển báo",
        score: apiData.phapLuatGT08?.pl2?.diem || 0,
        passed: apiData.phapLuatGT08?.pl2?.trangThaiDat === "Đạt",
      },
      {
        key: "8",
        rubricName: "PL3 - Xử lý THGT",
        score: apiData.phapLuatGT08?.pl3?.diem || 0,
        passed: apiData.phapLuatGT08?.pl3?.trangThaiDat === "Đạt",
      },
      {
        key: "9",
        rubricName: "Mô phỏng",
        score: apiData.moPhong?.diem || 0,
        passed: apiData.moPhong?.trangThaiDat === "Đạt",
      },
    ];
  };
  console.log(studentData);

  return (
    <Modal
      title="Chi tiết"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={900}
      closeIcon={<CloseOutlined />}
    >
      <Card className="!mt-4">
        <div className="mb-4">
          <h3 className="text-xl !font-semibold text-gray-800 !mb-0">
            Học viên: {studentData?.user?.name || ""}{" "}
            <span className="text-gray-500 font-normal text-sm">
              ({studentData?.user?.identification_card || ""})
            </span>
          </h3>
          <p className="text-sm text-gray-500">
            Lớp: #{studentData?.khoaHoc?.tenKhoaHoc || ""} · Chương trình:{" "}
            {studentData?.khoaHoc?.hangDaoTao || ""} - Hạng{" "}
            {studentData?.khoaHoc?.hangDaoTao || ""}{" "}
            {LICENSE_PLATE_LABEL[studentData?.khoaHoc?.hangDaoTao]}
          </p>
        </div>
        <Row gutter={[12, 12]}>
          <Col span={10}>
            <div className="mb-4">
              <Progress
                percent={progress}
                strokeColor="#3333FF"
                showInfo={false}
                strokeWidth={11}
              />
              <p className="text-xs text-gray-600 mt-1">
                Tiến độ:{" "}
                <span className="!font-semibold text-black">{progress}%</span> (
                {passed}/{total} chỉ tiêu đạt)
              </p>

              <Row gutter={12} className="!text-[13px]">
                <Col span={10}>
                  <Flex
                    vertical
                    gap={"middle"}
                    className="!bg-gray-50 !p-2 !h-full"
                  >
                    <span className="!text-[13px] font-semibold text-gray-700">
                      CCCD
                    </span>
                    <span className="!text-[13px] font-semibold text-gray-700">
                      Năm sinh
                    </span>
                    <span className="!text-[13px] font-semibold text-gray-700">
                      Giới tính
                    </span>
                    <span className="!text-[13px] font-semibold text-gray-700">
                      Tổ chức
                    </span>
                    <span className="!text-[13px] font-semibold text-gray-700">
                      Ảnh
                    </span>
                  </Flex>
                </Col>
                <Col span={14}>
                  <Flex vertical gap={"middle"} className="!h-full">
                    <span className="!text-[13px] text-gray-600">
                      {studentData?.user?.identification_card || ""}
                    </span>
                    <span className="!text-[13px] text-gray-600">
                      {dayjs(studentData?.user?.birth_date).format("YYYY")}
                    </span>
                    <span className="!text-[13px] text-gray-600">
                      {" "}
                      {studentData?.user?.sex || ""}
                    </span>
                    <span className="!text-[13px] text-gray-600 !break-words !whitespace-normal">
                      Trung tâm dạy nghề và sát hạch lái xe Lập Phương Thành
                    </span>
                    <div className="flex items-start">
                      <Image
                        size={120}
                        src={
                          studentData?.user?.avatar ||
                          studentData?.user?.default_avatar
                        }
                        className="!h-20 !w-20 rounded-lg"
                      />
                    </div>
                  </Flex>
                </Col>
              </Row>
            </div>
          </Col>
          <Col span={14}>
            <div>
              <h4 className="text-base font-semibold text-gray-800 mb-3">
                Điểm số theo từng chỉ tiêu
              </h4>
              <Table
                rowKey="key"
                columns={columns}
                dataSource={transformDataForTable(studentData)}
                pagination={false}
                size="small"
                className="[&_.ant-table-cell]:text-[13px]"
              />
            </div>
          </Col>
        </Row>
      </Card>

      <div className="text-right mt-4 text-xs text-gray-500">
        Cập nhật: 2026-02-10 08:57
      </div>

      <div className="text-center text-xs text-gray-500 pb-4 mt-5">
        © 2026 Lập Phương Thành. All rights reserved.
      </div>
    </Modal>
  );
};

export default StudentDetailModal;
