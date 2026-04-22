import React, { useMemo } from "react";
import { Table, Button, Typography } from "antd";

const { Text, Title } = Typography;

const HoanThanhTab = ({ studentData }) => {
  const rubricList = useMemo(() => {
    return studentData?.learning?.learning_progress || studentData?.learning?.score_by_rubrik || [];
  }, [studentData]);

  const treeDataSource = useMemo(() => {
    if (!Array.isArray(rubricList)) return [];

    const dataSource = [];
    const plItems = [];

    // Define the order and categories
    rubricList.forEach((item) => {
      const name = String(item?.name || "");
      const normalizedItem = {
        key: item?.iid || item?.name,
        name: item?.name,
        score: item?.score ?? 0,
        passed: Number(item?.passed) === 1,
      };

      if (name.includes("PL1") || name.includes("PL2") || name.includes("PL3") || name.includes("Tổng ôn tập")) {
        plItems.push(normalizedItem);
      } else if (
        name.includes("Kỹ thuật lái xe") ||
        name.includes("Cấu tạo") ||
        name.includes("Đạo đức") ||
        name.includes("Mô phỏng")
      ) {
        dataSource.push(normalizedItem);
      }
    });

    // Handle "Pháp luật GTĐB" parent
    if (plItems.length > 0) {
      // Find the index to insert PL after "Đạo đức" if possible
      const daoDucIndex = dataSource.findIndex(i => String(i.name).includes("Đạo đức"));

      const plParent = {
        key: "pl-gtdb-parent",
        name: "Pháp luật GTĐB",
        score: plItems.reduce((acc, curr) => acc + curr.score, 0) / plItems.length, // Average or as per business logic
        passed: plItems.every(i => i.passed),
        children: plItems,
      };

      if (daoDucIndex !== -1) {
        dataSource.splice(daoDucIndex + 1, 0, plParent);
      } else {
        dataSource.push(plParent);
      }
    }

    return dataSource;
  }, [rubricList]);

  const columns = [
    {
      title: "Bài học",
      dataIndex: "name",
      key: "name",
      width: "80%",
      render: (text) => <Text className="!text-sm">{text}</Text>,
    },
    {
      title: "Hoàn thành",
      dataIndex: "score",
      key: "score",
      align: "center",
      width: "20%",
      render: (score) => (
        <span className={`font-medium ${score >= 10 ? "text-orange-500" : "text-orange-400"}`}>
          {score}
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Lớp học section */}
      <section>
        <Title level={5} className="!mb-2">Lớp học</Title>
        <Text className="text-sm !text-[#EE0000]">
          Chưa có lớp học nào gắn cho bạn hoặc chưa đến thời gian mở lớp
        </Text>
      </section>

      {/* Bảng điểm section */}
      <section className="!w-[50vw]">
        <Title level={5} className="!mb-3">Bảng điểm khoá học</Title>
        <Table
          columns={columns}
          dataSource={treeDataSource}
          pagination={false}
          size="small"
          bordered
          showHeader
          className="theory-score-table [&_.ant-table-thead_th]:!bg-blue-50 [&_.ant-table-thead_th]:!text-gray-700 [&_.ant-table-thead_th]:!font-semibold [&_.ant-table-row-level-0]:font-medium [&_.ant-table-row-level-1]:bg-gray-50/50"
          expandable={{
            defaultExpandAllRows: true,
          }}
          rowClassName={(record) => record.children ? "bg-blue-50/20" : ""}
        />
      </section>

      {/* Footer section */}
      <section className="mt-2">
        <Title level={5} className="!mb-2">Mô tả chi tiết công thức tính điểm</Title>
        <Text className="text-xs text-gray-500 block mb-4">
          Phương thức tính điểm: Điểm đạt dựa trên trung bình cộng các tiêu chí con
        </Text>
        <Button
          type="primary"
          className="!bg-blue-600 hover:!bg-blue-700 !h-10 !px-6 font-medium rounded-md border-none"
        >
          Cập nhật lại điểm mới nhất
        </Button>
      </section>
    </div>
  );
};

export default HoanThanhTab;
