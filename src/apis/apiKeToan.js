import axios from "axios";
import { baseURL } from "../constants/base";

export const getUnassignedStudents2026 = async (params) => {
    const res = await axios.get(`${baseURL}/google-sheet/unassigned-students-2026`, { params });
    return res.data;
};