import { message } from "antd";
import { updateHocBuStatus } from "../../../../apis/apiHocbu";

const getUsername = () =>
    sessionStorage.getItem("name") || localStorage.getItem("name") || "Admin";

export const useHocBuLyThuyetActions = (refetch) => {
    const handleDuyet = async (recordId, record) => {
        try {
            const currentDuyet = Array.isArray(record?.trang_thai_duyet)
                ? record.trang_thai_duyet
                : [false, false, false];
            const newTrangThaiDuyet = [...currentDuyet];
            newTrangThaiDuyet[0] = true;
            await updateHocBuStatus({
                id: recordId,
                trang_thai: 2,
                trang_thai_ly_thuyet: 2,
                trang_thai_duyet: newTrangThaiDuyet,
                nguoi_update: getUsername(),
                updated_at: new Date().toISOString(),
            });
            message.success("Duyệt học bù thành công!");
            refetch();
        } catch (err) {
            message.error("Duyệt học bù thất bại!");
        }
    };

    const handleHuyDuyet = async (recordId, record) => {
        try {
            const currentDuyet = Array.isArray(record?.trang_thai_duyet)
                ? record.trang_thai_duyet
                : [false, false, false];
            const newTrangThaiDuyet = [...currentDuyet];
            newTrangThaiDuyet[0] = false;
            await updateHocBuStatus({
                id: recordId,
                trang_thai: 1,
                trang_thai_ly_thuyet: 1,
                trang_thai_duyet: newTrangThaiDuyet,
                nguoi_update: getUsername(),
                updated_at: new Date().toISOString(),
            });
            message.success("Hủy duyệt học bù thành công!");
            refetch();
        } catch (err) {
            message.error("Hủy duyệt học bù thất bại!");
        }
    };

    return { handleDuyet, handleHuyDuyet };
};
