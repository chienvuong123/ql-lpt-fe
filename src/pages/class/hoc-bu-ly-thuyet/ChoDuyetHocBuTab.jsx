import React, { useMemo, useState } from "react";
import { Table, Select, Col, Button, Modal, Space } from "antd";
import { CheckCircleOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { getDanhSachHocVienHocBuChoDuyet } from "../../../apis/apiHocbu";
import { normalizeApiList } from "../../dat/hoc-bu/hocBuUtils";
import { useHocBuFilter } from "../../dat/hoc-bu/hooks/useHocBuFilter";
import HocBuFilterCard from "../../dat/hoc-bu/HocBuFilterCard";
import StudentMakeUpDetailDrawer from "../../make-up-lessons/StudentMakeUpDetailDrawer";
import { useHocBuLyThuyetActions } from "./hooks/useHocBuLyThuyetActions";
import { getChoDuyetLyThuyetColumns } from "./HocBuLyThuyetColumns";

const DEFAULT_FILTERS = {
  ma_khoa: null,
  text: "",
  trang_thai: '',
  trang_thai_hoc_bu: [],
};

const ChoDuyetHocBuTab = ({ isLoadingKhoaHoc, courseOptions }) => {
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  const {
    pagination,
    setPagination,
    appliedFilters,
    tempFilters,
    setTempFilter,
    applyFilter,
    resetFilter,
  } = useHocBuFilter(DEFAULT_FILTERS);

  const [modal, contextHolder] = Modal.useModal();
  const { data: studentData, isFetching: isFetchingStudents, refetch: refetchStudents } = useQuery({
    queryKey: [
      "hocVienHocBuChoDuyetLyThuyet",
      appliedFilters.ma_khoa,
      appliedFilters.text,
      appliedFilters.trang_thai,
      appliedFilters.trang_thai_hoc_bu,
      pagination.page,
      pagination.limit,
    ],
    queryFn: () =>
      getDanhSachHocVienHocBuChoDuyet({
        loai: "ly_thuyet",
        ma_khoa: appliedFilters.ma_khoa,
        text: appliedFilters.text,
        trang_thai: 1,
        page: pagination.page,
        limit: pagination.limit,
      }),
    keepPreviousData: true,
  });

  const students = useMemo(() => {
    const list = normalizeApiList(studentData);
    return list;
  }, [studentData]);

  const { handleDuyet, handleHuyDuyet, handleBulkDuyet } = useHocBuLyThuyetActions(() => {
    refetchStudents();
    setSelectedRowKeys([]);
  });

  const onBulkDuyet = React.useCallback(() => {
    if (!selectedRowKeys.length) return;
    
    // Sử dụng Set tối ưu hóa việc lookup O(1)
    const keySet = new Set(selectedRowKeys);
    const selectedRecords = students.filter(s => keySet.has(s.id) || keySet.has(s.ma_dk));
    
    if (!selectedRecords.length) return;
    
    modal.confirm({
      title: "Xác nhận duyệt học bù hàng loạt",
      content: `Bạn có chắc muốn duyệt học bù cho ${selectedRecords.length} học viên đã chọn?`,
      okText: "Xác nhận",
      cancelText: "Hủy",
      centered: true,
      onOk: async () => {
        await handleBulkDuyet(selectedRecords);
      },
    });
  }, [selectedRowKeys, students, handleBulkDuyet, modal]);

  const totalItems = studentData?.total || studentData?.pagination?.total || 0;

  const handleOpenDetail = (record) => {
    setSelectedStudent(record);
    setIsDetailOpen(true);
  };

  const columns = getChoDuyetLyThuyetColumns({
    pagination,
    onOpenDetail: handleOpenDetail,
    handleDuyet,
    handleHuyDuyet,
  });

  const extraFilters = (
    <>
      <Col xs={24} sm={10} md={8} lg={5}>
        <label className="block text-xs text-gray-500 uppercase">Trạng thái</label>
        <Select
          className="w-full"
          mode="multiple"
          placeholder="Chọn trạng thái"
          value={tempFilters.trang_thai}
          onChange={(v) => setTempFilter("trang_thai", v)}
          allowClear
          maxTagCount="responsive"
          options={[
            { label: "Chờ duyệt", value: 2 },
            { label: "Đã duyệt", value: 3 },
          ]}
        />
      </Col>
      <Col xs={24} sm={10} md={8} lg={5}>
        <label className="block text-xs text-gray-500 uppercase">Trạng thái học bù</label>
        <Select
          className="w-full"
          mode="multiple"
          placeholder="Chọn trạng thái học bù"
          value={tempFilters.trang_thai_hoc_bu}
          onChange={(v) => setTempFilter("trang_thai_hoc_bu", v)}
          allowClear
          maxTagCount="responsive"
          options={[
            { label: "Chưa đăng ký", value: 1 },
            { label: "Đã đăng ký", value: 2 },
          ]}
        />
      </Col>
    </>
  );

  return (
    <div>
      {contextHolder}
      <HocBuFilterCard
        maKhoa={tempFilters.ma_khoa}
        setMaKhoa={(v) => setTempFilter("ma_khoa", v)}
        searchText={tempFilters.text}
        setSearchText={(v) => setTempFilter("text", v)}
        onApply={applyFilter}
        onReset={resetFilter}
        isLoadingKhoaHoc={isLoadingKhoaHoc}
        courseOptions={courseOptions}
        extraFilters={extraFilters}
      />

      <div className="flex mb-3">
        <Button
          type="primary"
          className="!bg-green-600 hover:!bg-green-700 border-none"
          icon={<CheckCircleOutlined />}
          disabled={selectedRowKeys.length === 0}
          onClick={onBulkDuyet}
        >
          Duyệt ({selectedRowKeys.length})
        </Button>
      </div>

      <Table
        rowSelection={{
          selectedRowKeys,
          onChange: (keys) => setSelectedRowKeys(keys),
          getCheckboxProps: (record) => ({
            disabled: String(record?.trang_thai_ly_thuyet) !== "1",
          }),
        }}
        columns={columns}
        dataSource={students}
        rowKey={(record) => record.id || record.ma_dk}
        loading={isFetchingStudents}
        pagination={{
          current: pagination.page,
          pageSize: pagination.limit,
          total: totalItems,
          showSizeChanger: true,
          onChange: (page, limit) => setPagination({ page, limit }),
        }}
        size="small"
        scroll={{ x: 1300 }}
        bordered
        className="table-blue-header"
      />

      <StudentMakeUpDetailDrawer
        open={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        student={selectedStudent}
      />
    </div>
  );
};

export default ChoDuyetHocBuTab;
