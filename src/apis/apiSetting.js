import axios from "axios";
import { baseURL } from "../constants/base";

export const settingInstance = axios.create({
    baseURL,
    headers: {
        "Content-Type": "application/json",
    },
});

export const getCheckConfigs = () => {
    return settingInstance.get("/check-configs");
}

export const updateCheckConfig = (data) => {
    return settingInstance.put("/check-configs", data);
}

export const addCheckConfig = (data) => {
    return settingInstance.post("/check-configs", data);
}
