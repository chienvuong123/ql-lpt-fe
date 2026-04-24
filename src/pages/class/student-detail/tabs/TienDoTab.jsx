import React, { useMemo, useState } from "react";
import { Table, Typography, Space, Spin, Button } from "antd";
import { EyeOutlined, FieldTimeOutlined } from "@ant-design/icons";
import { BsCheck } from "react-icons/bs";
import { useQuery, useQueries } from "@tanstack/react-query";
import { getTienDoHoanThanh, getDiemTheoRubric } from "../../../../apis/apiLyThuyetLocal";
import SelfStudyTimeModal from "../components/SelfStudyTimeModal";

const { Text, Title } = Typography;

const TienDoTab = ({ studentData, enrolmentPlanIid, visible }) => {
  const [detailModal, setDetailModal] = useState({
    visible: false,
    courseIid: null,
    itemNtype: "video",
  });

  // 1. Fetch the main list of courses
  const courseListQuery = useQuery({
    queryKey: ["getTienDoHoanThanh", studentData?.user?.iid, enrolmentPlanIid],
    queryFn: () =>
      getTienDoHoanThanh({
        user_iid: studentData?.user?.iid,
        enrolment_plan_iid: enrolmentPlanIid,
        submit: 1,
        page: 1,
        items_per_page: 10,
      }),
    enabled: !!studentData?.user?.iid && !!enrolmentPlanIid && !!visible,
  });

  const coursesList = courseListQuery.data?.result || [];

  // 2. Fetch rubric details for EACH course in the list
  const rubricDetailsQueries = useQueries({
    queries: coursesList.map((course) => ({
      queryKey: ["getDiemTheoRubric", course.iid, studentData?.user?.iid],
      queryFn: () =>
        getDiemTheoRubric({
          iid: course.iid,
          ntype: "course",
          uiid: studentData?.user?.iid,
          recalculate: 1,
          submit: 1,
        }),
      enabled: !!course.iid && !!studentData?.user?.iid && !!visible,
    })),
  });

  // Combine course summary data with its rubric details
  const combinedData = useMemo(() => {
    return coursesList.map((course, index) => {
      const detailQuery = rubricDetailsQueries[index];
      const detailData = detailQuery?.data?.result || {};

      // Calculate total hours based on actual/percentage or use max_score from rubric
      const actualHours = course.p || 0;
      const completionPercentage = course.cp || 100;
      const totalHours = completionPercentage > 0
        ? Math.round((actualHours / (completionPercentage / 100)) * 100) / 100
        : actualHours;

      return {
        ...course,
        totalHours,
        details: detailData,
        isLoadingDetails: detailQuery?.isLoading,
      };
    });
  }, [coursesList, rubricDetailsQueries]);

  const columns = [
    {
      title: <span className="flex justify-start">Bài học</span>,
      dataIndex: "name",
      key: "name",
      width: "70%",
      align: 'left',
    },
    {
      title: "Số giờ",
      key: "hours",
      width: "10%",
      align: "center",
      render: (_, record) => (
        <span className="text-orange-500 font-medium">
          {record.score || 0}/<span className="text-gray-700">{record.max_score || 0}</span>
        </span>
      ),
    },
    {
      title: "Chi tiết",
      key: "action",
      align: "center",
      width: "12%",
      render: (_, record, index) => {
        // Find the course parent this rubric belongs to
        // This is a bit tricky since the table is rendered inside combinedData.map
        // I'll need to pass the course.iid down
        return (
          <Button
            type="primary"
            size="small"
            className="!bg-orange-500 hover:!bg-orange-600 border-none !px-3 !h-8 flex items-center gap-1"
            icon={<EyeOutlined className="text-[13px]" />}
            onClick={() => {
              // We'll need the course iid. I'll adjust the render to capture it from a closure or pass it.
              // Let's assume the render is redefined inside the map below or we use a helper.
            }}
          >
            <span className="text-[13px] font-medium">Xem chi tiết</span>
          </Button>
        );
      },
    },
  ];

  const getColumns = (courseIid) => [
    ...columns.slice(0, 2),
    {
      title: "Chi tiết",
      key: "action",
      align: "center",
      width: "12%",
      render: (_, record) => {
        let ntype = "video";
        if (record.name?.includes("giáo trình")) ntype = "video";
        // Map other names to types if necessary

        return (
          <Button
            type="primary"
            size="small"
            className="!bg-orange-500 hover:!bg-orange-600 border-none !px-3 !h-8 flex items-center gap-1"
            icon={<EyeOutlined className="text-[13px]" />}
            onClick={() => setDetailModal({
              visible: true,
              courseIid: courseIid,
              itemNtype: ntype
            })}
          >
            <span className="text-[13px] font-medium">Xem chi tiết</span>
          </Button>
        );
      },
    },
  ];


  const isInitiallyLoading = courseListQuery.isLoading;

  if (isInitiallyLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spin size="small" tip="Đang tải danh sách môn học..." />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 py-4 pr-4">
      {combinedData.map((course) => (
        <div key={course.id || course.iid} className="course-section">
          {/* Header */}
          <div className="flex items-center gap-2 mb-2">
            <Text className="!text-blue-500 font-medium !text-[17px] cursor-pointer hover:underline">
              {course.name}
            </Text>
            {course.isLoadingDetails ? (
              <Spin size="small" />
            ) : (
              <FieldTimeOutlined className="text-gray-400 text-lg cursor-pointer" />
            )}
          </div>

          {/* Overall Progress Summary */}
          <div className="text-center mb-3">
            <Text className="!text-base flex items-center justify-center gap-2">
              <span className="font-bold text-gray-600 pr-1">Số giờ</span>
              <span className="text-orange-500 font-medium"> {course.p}
                <span className="text-gray-600">/{course.totalHours}</span>
              </span>
              {"-"}
              {course.pf === 1 && (
                <Space size={4} className="align-middle">
                  <BsCheck className="text-blue-500 text-3xl" />
                  <span className="text-[14px]">Đạt</span>
                </Space>
              )}
            </Text>
          </div>

          <Title level={5} className="!text-base !font-medium !mb-3 !text-gray-800">
            Điểm thành phần chi tiết
          </Title>

          <Table
            columns={getColumns(course.iid)}
            dataSource={course.details?.score_by_rubrik?.filter(item =>
              ["Xem giáo trình", "Ôn luyện", "Ôn tập"].some(name => item.name?.includes(name))
            ) || []}
            pagination={false}
            size="small"
            bordered
            loading={course.isLoadingDetails}
            className="theory-detail-table [&_.ant-table-thead_th]:!bg-[#E6F7FF] [&_.ant-table-thead_th]:!font-semibold [&_.ant-table-thead_th]:!text-gray-800 [&_.ant-table-thead_th]:!text-[14px] [&_.ant-table-cell]:text-[14px]"
          />

          {/* Footer Formula Info */}
          <div className="mt-4">
            <Title level={5} className="!text-[14px] !font-medium !mb-1 !text-gray-800">
              Mô tả chi tiết công thức tính điểm
            </Title>
            {course.details?.rubric?.description ? (
              <div
                className="text-[14px] text-gray-500 rich-description [&_p]:m-0 [&_p]:p-0 [&_strong]:!font-normal"
                dangerouslySetInnerHTML={{ __html: course.details.rubric.description }}
              />
            ) : (
              <Text className="text-[14px] text-gray-600 italic">
                (Đang tải mô tả công thức tính điểm...)
              </Text>
            )}
          </div>
        </div>
      ))}

      {combinedData.length === 0 && (
        <div className="py-20 text-center text-gray-400 italic">
          Không có dữ liệu tiến độ hoàn thành.
        </div>
      )}

      <SelfStudyTimeModal
        visible={detailModal.visible}
        onClose={() => setDetailModal({ ...detailModal, visible: false })}
        userIid={studentData?.user?.iid}
        courseIid={detailModal.courseIid}
        itemNtype={detailModal.itemNtype}
      />
    </div>
  );
};

export default TienDoTab;
