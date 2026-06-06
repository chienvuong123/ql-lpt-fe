import React, { useMemo, useState } from "react";
import { Table, Button, Modal, Checkbox, message } from "antd";
import { CheckCircleOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { getDanhSachHocVienHocBuChoDuyet } from "../../../apis/apiHocbu";
import { normalizeApiList } from "../../dat/hoc-bu/hocBuUtils";
import { useHocBuFilter } from "../../dat/hoc-bu/hooks/useHocBuFilter";
import HocBuFilterCard from "../../dat/hoc-bu/HocBuFilterCard";
import StudentMakeUpDetailDrawer from "../../make-up-lessons/StudentMakeUpDetailDrawer";
import { useHocBuLyThuyetActions } from "./hooks/useHocBuLyThuyetActions";
import { getChoDuyetLyThuyetColumns } from "./HocBuLyThuyetColumns";
import { useTableHeight } from "../../../components/hooks/useTableHeight";

const DEFAULT_FILTERS = {
  ma_khoa: null,
  text: "",
};

const ChoDuyetHocBuTab = ({ isLoadingKhoaHoc, courseOptions }) => {
  const [tableRef, tableHeight] = useTableHeight();
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [isSelectingAllPages, setIsSelectingAllPages] = useState(false);
  const [totalValidKeys, setTotalValidKeys] = useState(-1);
  const [selectedStudentMap, setSelectedStudentMap] = useState({});

  const handleToggleSelectAllPages = async (checked) => {
    if (!checked) {
      setSelectedRowKeys([]);
      setSelectedStudentMap({});
      return;
    }

    setIsSelectingAllPages(true);
    try {
      message.loading({ content: 'Đang tải toàn bộ dữ liệu...', key: 'selectAll' });
      const res = await getDanhSachHocVienHocBuChoDuyet({
        loai: "ly_thuyet",
        ma_khoa: appliedFilters.ma_khoa,
        text: appliedFilters.text,
        trang_thai: 1,
        page: 1,
        limit: 10000,
      });
      const list = normalizeApiList(res);
      const validRecords = list.filter(record => String(record?.trang_thai_ly_thuyet) === "1");
      const validKeys = validRecords.map(record => record.id || record.ma_dk);

      setSelectedRowKeys(validKeys);
      setTotalValidKeys(validKeys.length);

      const newMap = {};
      validRecords.forEach(r => {
        newMap[r.id || r.ma_dk] = r;
      });
      setSelectedStudentMap(newMap);

      message.success({ content: `Đã chọn ${validKeys.length} bản ghi`, key: 'selectAll' });
    } catch (error) {
      message.error({ content: 'Có lỗi xảy ra khi chọn tất cả', key: 'selectAll' });
    } finally {
      setIsSelectingAllPages(false);
    }
  };

  const handleToggleSelectRecord = (record, checked) => {
    const rowKey = record.id || record.ma_dk;
    if (!rowKey) return;

    setSelectedRowKeys((prev) =>
      checked
        ? Array.from(new Set([...prev, rowKey]))
        : prev.filter((key) => key !== rowKey),
    );

    setSelectedStudentMap(prev => {
      const next = { ...prev };
      if (checked) {
        next[rowKey] = record;
      } else {
        delete next[rowKey];
      }
      return next;
    });
  };

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
      pagination.page,
      pagination.limit,
    ],
    queryFn: () =>
      getDanhSachHocVienHocBuChoDuyet({
        loai: "ly_thuyet",
        ma_khoa: appliedFilters.ma_khoa,
        text: appliedFilters.text,
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
    setSelectedStudentMap({});
  });

  const onBulkDuyet = React.useCallback(() => {
    if (!selectedRowKeys.length) return;

    const selectedRecords = selectedRowKeys.map(key => selectedStudentMap[key]).filter(Boolean);

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
  }, [selectedRowKeys, selectedStudentMap, handleBulkDuyet, modal]);

  const totalItems = studentData?.total || studentData?.pagination?.total || 0;
  const currentTotal = totalValidKeys !== -1 ? totalValidKeys : totalItems;
  const isAllSelected = currentTotal > 0 && selectedRowKeys.length >= currentTotal;
  const isIndeterminate = selectedRowKeys.length > 0 && !isAllSelected;

  const handleOpenDetail = (record) => {
    setSelectedStudent(record);
    setIsDetailOpen(true);
  };

  const baseColumns = getChoDuyetLyThuyetColumns({
    pagination,
    onOpenDetail: handleOpenDetail,
    handleDuyet,
    handleHuyDuyet,
  });

  const columns = [
    {
      title: (
        <Checkbox
          checked={isAllSelected}
          indeterminate={isIndeterminate}
          disabled={isFetchingStudents || isSelectingAllPages}
          onChange={(e) => handleToggleSelectAllPages(e.target.checked)}
        />
      ),
      key: "select_all",
      width: 40,
      align: "center",
      fixed: "left",
      render: (_, record) => {
        const canCheck = String(record?.trang_thai_ly_thuyet) === "1";
        return (
          <Checkbox
            checked={selectedRowKeys.includes(record.id || record.ma_dk)}
            disabled={!canCheck || isSelectingAllPages}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => handleToggleSelectRecord(record, e.target.checked)}
          />
        );
      },
    },
    ...baseColumns,
  ];



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

      <div ref={tableRef}>
        <Table
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
          scroll={{ x: 1300, y: tableHeight }}
          bordered
          className="table-blue-header"
        />
      </div>

      <StudentMakeUpDetailDrawer
        open={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        student={selectedStudent}
      />
    </div>
  );
};

export default ChoDuyetHocBuTab;
