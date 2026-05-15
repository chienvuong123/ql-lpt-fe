import axios from "axios";
import { baseURL } from "../constants/base";

const instance = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const getForbiddenZones = () => instance.get("/forbidden-zones");
export const createForbiddenZone = (data) => instance.post("/forbidden-zones", data);
export const updateForbiddenZone = (id, data) => instance.put(`/forbidden-zones/${id}`, data);
export const deleteForbiddenZone = (id) => instance.delete(`/forbidden-zones/${id}`);
