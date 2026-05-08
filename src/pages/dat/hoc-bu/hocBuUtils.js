export const normalizeApiList = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.result)) return payload.result;
    return [];
};

export const filterByTrangThaiHocBu = (list, trangThaiHocBuFilter) => {
    if (!trangThaiHocBuFilter || trangThaiHocBuFilter.length === 0) return list;
    return list.filter((item) =>
        trangThaiHocBuFilter.some(
            (val) => String(val) === String(item?.trang_thai_hoc_bu)
        )
    );
};