import React, { useMemo } from "react";
import { Tabs } from "antd";
import { useQuery } from "@tanstack/react-query";
import { optionLopLyThuyet } from "../../apis/apiLyThuyetLocal";
import HocBuTab from "./hoc-bu/HocBuTab";
import ChoDuyetHocBuTab from "./hoc-bu/ChoDuyetHocBuTab";

const normalizeApiList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.result)) return payload.result;
  return [];
};

const BuCaBin = () => {
  const { data: dataKhoaHoc, isLoading: isLoadingKhoaHoc } = useQuery({
    queryKey: ["optionLopLyThuyet"],
    queryFn: () => optionLopLyThuyet(),
    staleTime: 1000 * 60 * 10,
  });

  const courseOptions = useMemo(() => {
    const list = normalizeApiList(dataKhoaHoc);
    return list.map((item) => ({
      label: item?.name || item?.suffix_name || item?.code || `#${item?.iid}`,
      value: item?.code,
    }));
  }, [dataKhoaHoc]);

  const tabItems = [
    {
      key: "hoc-bu",
      label: "Học bù",
      children: (
        <HocBuTab
          isLoadingKhoaHoc={isLoadingKhoaHoc}
          courseOptions={courseOptions}
        />
      ),
    },
    {
      key: "cho-duyet",
      label: "Chờ duyệt học bù",
      children: (
        <ChoDuyetHocBuTab
          isLoadingKhoaHoc={isLoadingKhoaHoc}
          courseOptions={courseOptions}
        />
      ),
    },
  ];

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Học bù Cabin</h1>
      </div>

      <Tabs defaultActiveKey="hoc-bu" items={tabItems} className="theory-tabs" />
    </div>
  );
};

export default BuCaBin;
