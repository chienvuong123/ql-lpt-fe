import React, { useMemo, useState } from "react";
import { Table } from "antd";
import { useQuery } from "@tanstack/react-query";
import { getDanhSachHocVienHocBu } from "../../../apis/apiHocbu";
import { normalizeApiList } from "../../dat/hoc-bu/hocBuUtils";
import { useHocBuFilter } from "../../dat/hoc-bu/hooks/useHocBuFilter";
import HocBuFilterCard from "../../dat/hoc-bu/HocBuFilterCard";
import TheoryDetailModal from "../TheoryDetailModal";
import { getHocBuLyThuyetColumns } from "./HocBuLyThuyetColumns";
import { useTableHeight } from "../../../components/hooks/useTableHeight";

const DEFAULT_FILTERS = { ma_khoa: null, text: "" };

const HocBuTab = ({ isLoadingKhoaHoc, courseOptions }) => {
  const [tableRef, tableHeight] = useTableHeight();
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedMaDk, setSelectedMaDk] = useState(null);

  const {
    pagination,
    setPagination,
    appliedFilters,
    tempFilters,
    setTempFilter,
    applyFilter,
    resetFilter,
  } = useHocBuFilter(DEFAULT_FILTERS);

  const { data: studentData, isFetching: isFetchingStudents } = useQuery({
    queryKey: [
      "hocVienHocBuLyThuyet",
      appliedFilters.ma_khoa,
      appliedFilters.text,
      pagination.page,
      pagination.limit,
    ],
    queryFn: () =>
      getDanhSachHocVienHocBu({
        ma_khoa: appliedFilters.ma_khoa,
        loai: "ly_thuyet",
        text: appliedFilters.text,
        page: pagination.page,
        limit: pagination.limit,
      }),
    keepPreviousData: true,
  });

  const students = useMemo(() => normalizeApiList(studentData), [studentData]);
  const totalItems = studentData?.total || studentData?.pagination?.total || 0;

  const handleOpenDetail = (record) => {
    setSelectedMaDk(record?.student?.ma_dk);
    setIsDetailOpen(true);
  };

  const columns = getHocBuLyThuyetColumns({
    pagination,
    onOpenDetail: handleOpenDetail,
  });

  return (
    <div>
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

      <div ref={tableRef}>
        <Table
          columns={columns}
          dataSource={students}
          rowKey={(record) => record.student?.id || record.student?.ma_dk}
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

      <TheoryDetailModal
        visible={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        ma_dk={selectedMaDk}
      />
    </div>
  );
};

export default HocBuTab;
