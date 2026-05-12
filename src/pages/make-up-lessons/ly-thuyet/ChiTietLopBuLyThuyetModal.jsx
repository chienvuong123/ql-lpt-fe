import React, { useState, useEffect } from "react";
import { Modal, Table, Tag, message } from "antd";
import { CloseCircleFilled } from "@ant-design/icons";
import { BsCheck } from "react-icons/bs";
import { getChiTietLopBuLyThuyet } from "../../../apis/apiHocbu";
import HocVienInfo from "../../../components/HocVienInfor";

const getRubricResult = (record, targetName) => {
  const rubricList = record?.scoreByRubrik || [];
  if (!Array.isArray(rubricList)) return { score: 0, passed: false };

  const item = rubricList.find((r) =>
    String(r?.name || "")
      .toLowerCase()
      .includes(targetName.toLowerCase())
  );

  return {
    score: item?.score ?? 0,
    passed: Number(item?.passed) === 1,
  };
};

const ProgressCell = React.memo(({ result }) => {
  const { score, passed } = result;
  return (
    <div className="flex flex-col items-center justify-center gap-1 py-1">
      {passed ? (
        <BsCheck className="!text-blue-600 !text-2xl !font-bold mb-[-3px]" />
      ) : (
        <CloseCircleFilled className="!text-red-500 text-base !font-bold" />
      )}
      <span
        className={`text-[13px] font-medium ${passed ? "text-green-700" : "text-red-500"}`}
      >
        {score}
      </span>
    </div>
  );
});

const QualifiedCell = React.memo(({ isQualified }) => (
  <div className="flex items-center justify-center">
    {isQualified ? (
      <Tag color="success" className="!m-0 !px-4 !py-1 font-medium">
        Đạt
      </Tag>
    ) : (
      <Tag color="error" className="!m-0 !px-4 !py-1 font-medium">
        Chưa đạt
      </Tag>
    )}
  </div>
));

// Fix 3: Move columns out to constant
const COLUMNS = [
  {
    title: "#",
    key: "stt",
    width: 45,
    align: "center",
    render: (_, __, index) => index + 1,
  },
  {
    title: "HỌC VIÊN",
    key: "user",
    width: 250,
    fixed: "left",
    render: (_, record) => <HocVienInfo record={record} />,
  },
  {
    title: "TIẾN ĐỘ",
    children: [
      {
        title: "KỸ THUẬT LÁI XE",
        width: 100,
        align: "center",
        render: (_, record) => (
          <ProgressCell result={getRubricResult(record, "Kỹ thuật lái xe")} />
        ),
      },
      {
        title: "CẤU TẠO SỬA CHỮA",
        width: 100,
        align: "center",
        render: (_, record) => (
          <ProgressCell result={getRubricResult(record, "Cấu tạo")} />
        ),
      },
      {
        title: "ĐẠO ĐỨC, VHGT, PCCC",
        width: 120,
        align: "center",
        render: (_, record) => (
          <ProgressCell result={getRubricResult(record, "Đạo đức")} />
        ),
      },
      {
        title: "PHÁP LUẬT GTĐB",
        children: [
          {
            title: "PL1 - LUẬT TRẬT TỰ, ATGT",
            width: 120,
            align: "center",
            render: (_, record) => (
              <ProgressCell result={getRubricResult(record, "PL1")} />
            ),
          },
          {
            title: "PL2 - BIỂN BÁO",
            width: 100,
            align: "center",
            render: (_, record) => (
              <ProgressCell result={getRubricResult(record, "PL2")} />
            ),
          },
          {
            title: "PL3 - XỬ LÝ THGT",
            width: 100,
            align: "center",
            render: (_, record) => (
              <ProgressCell result={getRubricResult(record, "PL3")} />
            ),
          },
          {
            title: "TỔNG ÔN TẬP",
            width: 100,
            align: "center",
            render: (_, record) => (
              <ProgressCell result={getRubricResult(record, "Tổng ôn tập")} />
            ),
          },
        ],
      },
      {
        title: "MÔ PHỎNG",
        width: 100,
        align: "center",
        render: (_, record) => (
          <ProgressCell result={getRubricResult(record, "Mô phỏng")} />
        ),
      },
    ],
  },
  {
    title: "ĐẠT CHƯƠNG TRÌNH ĐÀO TẠO",
    width: 120,
    align: "center",
    render: (_, record) => {
      const isQualified = record?.theoryInfo?.loai_ly_thuyet === 1;
      return <QualifiedCell isQualified={isQualified} />;
    },
  },
];

const ChiTietLopBuLyThuyetModal = ({ visible, maKhoaBu, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);

  const fetchData = async (maKhoa) => {
    setLoading(true);
    try {
      const res = await getChiTietLopBuLyThuyet(maKhoa);
      setData(res?.data || []);
    } catch (error) {
      message.error("Lỗi khi tải dữ liệu chi tiết lớp học bù.");
    } finally {
      setLoading(false);
    }
  };

  // Fix 4: Delay fetch slightly for smoother modal animation
  useEffect(() => {
    if (!visible || !maKhoaBu) {
      return;
    }
    const timer = setTimeout(() => fetchData(maKhoaBu), 300);
    return () => clearTimeout(timer);
  }, [visible, maKhoaBu]);

  return (
    <Modal
      title={`Chi tiết lớp học bù lý thuyết: ${maKhoaBu || ""}`}
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={1400}
      centered
      destroyOnClose={true}
      // Fix 1: keep DOM, reset explicitly after close
      afterClose={() => setData([])}
    >
      <Table
        columns={COLUMNS}
        dataSource={data}
        rowKey={(record) => record.id || record.ma_dk}
        loading={loading}
        pagination={{ pageSize: 10, showTotal: (total) => `Tổng cộng ${total} bản ghi` }}
        size="small"
        bordered
        className="table-blue-header"
      />
    </Modal>
  );
};

export default React.memo(ChiTietLopBuLyThuyetModal);
