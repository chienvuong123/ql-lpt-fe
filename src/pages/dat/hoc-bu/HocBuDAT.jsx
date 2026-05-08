import React, { useMemo } from "react";
import { Tabs } from "antd";
import { useQuery } from "@tanstack/react-query";
import { optionLopLyThuyet } from "../../../apis/apiLyThuyetLocal";
import HocBuTab from "./HocBuTab";
import ChoDuyetHocBuTab from "./ChoDuyetHocBuTab";
import { normalizeApiList } from "./hocBuUtils";

const HocBuDAT = () => {
    const { data: dataKhoaHoc, isLoading: isLoadingKhoaHoc } = useQuery({
        queryKey: ["optionLopLyThuyet"],
        queryFn: optionLopLyThuyet,
        staleTime: 1000 * 60 * 10,
    });

    const courseOptions = useMemo(() => {
        return normalizeApiList(dataKhoaHoc).map((item) => ({
            label: item?.name || item?.suffix_name || item?.code || `#${item?.iid}`,
            value: item?.code,
        }));
    }, [dataKhoaHoc]);

    const tabItems = [
        {
            key: "hoc-bu",
            label: "Học bù",
            children: <HocBuTab isLoadingKhoaHoc={isLoadingKhoaHoc} courseOptions={courseOptions} />,
        },
        {
            key: "cho-duyet",
            label: "Chờ duyệt học bù",
            children: <ChoDuyetHocBuTab isLoadingKhoaHoc={isLoadingKhoaHoc} courseOptions={courseOptions} />,
        },
    ];

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Học bù DAT</h1>
            <Tabs defaultActiveKey="hoc-bu" items={tabItems} className="theory-tabs" />
        </div>
    );
};

export default HocBuDAT;