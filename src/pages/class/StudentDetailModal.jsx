import React, { useMemo } from "react";
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
  program_code,
  program_name,
  maKhoaHoc,
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
      render: (isPassed) =>
        isPassed ? (
          <CheckCircleFilled className="!text-green-600 text-lg" />
        ) : (
          <CloseCircleFilled className="!text-red-600 text-lg" />
        ),
    },
  ];

  const rubricRows = useMemo(() => {
    if (!studentData) return [];

    const rubricList = Array.isArray(studentData?.learning)
      ? studentData.learning
      : studentData?.learning?.score_by_rubrik || [];

    return rubricList
      .filter(
        (item) =>
          !String(item?.name || "").includes("Bảng tổng hợp") &&
          !String(item?.name || "").includes("Điểm kiểm tra tổng hợp") &&
          !String(item?.name || "").includes("Tổng thời gian học") &&
          !String(item?.name || "").includes("Pháp luật GTĐB"),
      )
      .map((item, index) => ({
        key: item?.iid || `${index}`,
        rubricName: item?.name || "-",
        score: item?.score ?? 0,
        passed: Number(item?.passed) === 1,
      }));
  }, [studentData]);

  const { progress, passed, total } = useMemo(() => {
    const eligibleRows = rubricRows.filter((item) => {
      const tenChiTieu = String(item?.rubricName || "");
      return (
        !tenChiTieu.includes("Bảng tổng hợp") &&
        !tenChiTieu.includes("Điểm kiểm tra tổng hợp") &&
        !tenChiTieu.includes("Tổng thời gian học") &&
        !tenChiTieu.includes("Pháp luật GTĐB")
      );
    });

    const totalRubric = eligibleRows.length;
    const passedRubric = eligibleRows.filter((item) => item.passed).length;
    const progressPercent =
      totalRubric > 0 ? Math.round((passedRubric / totalRubric) * 100) : 0;

    return {
      progress: progressPercent,
      passed: passedRubric,
      total: totalRubric,
    };
  }, [rubricRows]);

  return (
    <Modal
      title="Chi tiết học viên"
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
              (#{studentData?.user?.iid || ""})
            </span>
          </h3>
          <p className="text-sm text-gray-500">
            Khóa:{" "}
            <span className="font-medium">
              {maKhoaHoc}(#{studentData?.learning_progress?.item_iid || ""}
              ){" "}
            </span>
            - Chương trình:{" "}
            <span className="font-medium">{program_name || ""}</span>{" "}
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
                    gap="middle"
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
                  <Flex vertical gap="middle" className="!h-full">
                    <span className="!text-[13px] text-gray-600">
                      {studentData?.user?.identification_card || ""}
                    </span>
                    <span className="!text-[13px] text-gray-600">
                      {dayjs(studentData?.user?.birth_date).format("YYYY")}
                    </span>
                    <span className="!text-[13px] text-gray-600">
                      {studentData?.user?.sex === "1" ? "Nam" : "Nữ"}
                    </span>
                    <span className="!text-[13px] text-gray-600 !break-words !whitespace-normal">
                      {studentData?.user?.organization_name}
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
                dataSource={rubricRows}
                pagination={false}
                size="small"
                className="[&_.ant-table-cell]:text-[13px]"
              />
            </div>
          </Col>
        </Row>
      </Card>

      <div className="text-center text-xs text-gray-500 pb-4 mt-5">
        (c) 2026 Lap Phuong Thanh. All rights reserved.
      </div>
    </Modal>
  );
};

export default StudentDetailModal;
