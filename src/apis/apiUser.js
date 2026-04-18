import axios from "axios";
import { baseURL } from "../constants/base";

const userApiClient = axios.create({
  baseURL,
});

userApiClient.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem("userToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const getAllUsers = async (params = {}) => {
  const response = await userApiClient.get("/users", { params });
  return response.data;
};

export const getDetailUser = async (id) => {
  const response = await userApiClient.get(`/users/${id}`);
  return response.data;
};

export const loginUser = async (data) => {
  const response = await userApiClient.post("/auth/login", data);
  return response.data;
};

export const updateUser = async (id, data) => {
  const response = await userApiClient.put(`/users/${id}`, data);
  return response.data;
};

export const deleteUser = async (id) => {
  const response = await userApiClient.delete(`/users/${id}`);
  return response.data;
};

export const createUser = async (data) => {
  const response = await userApiClient.post("/users", data);
  return response.data;
};