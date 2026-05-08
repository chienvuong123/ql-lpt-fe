import { message } from "antd";
import { updateHocBuStatus } from "../../../../apis/apiHocbu";

const getUsername = () =>
    sessionStorage.getItem("name") || localStorage.getItem("name") || "Admin";

export const useHocBuActions = (refetch) => {
    const handleDuyet = async (recordId, record, index = 2, trangThaiMoi = 3) => {
        try {
            const current = Array.isArray(record?.trang_thai_duyet)
                ? record.trang_thai_duyet
                : [false, false, false];
            const newDuyet = [...current];
            newDuyet[index] = true;
            await updateHocBuStatus({
                id: recordId,
                trang_thai: trangThaiMoi,
                trang_thai_duyet: newDuyet,
                nguoi_update: getUsername(),
                updated_at: new Date().toISOString(),
            });
            message.success("Duyệt học bù thành công!");
            refetch();
        } catch {
            message.error("Duyệt học bù thất bại!");
        }
    };

    const handleHuyDuyet = async (recordId, record, index = 2, trangThaiMoi = 2) => {
        try {
            const current = Array.isArray(record?.trang_thai_duyet)
                ? record.trang_thai_duyet
                : [false, false, false];
            const newDuyet = [...current];
            newDuyet[index] = false;
            await updateHocBuStatus({
                id: recordId,
                trang_thai: trangThaiMoi,
                trang_thai_duyet: newDuyet,
                nguoi_update: getUsername(),
                updated_at: new Date().toISOString(),
            });
            message.success("Hủy duyệt thành công!");
            refetch();
        } catch {
            message.error("Hủy duyệt thất bại!");
        }
    };

    return { handleDuyet, handleHuyDuyet };
};