import axios from "axios";
import { baseURL } from "../constants/base";

export const getAllUsers = async (params = {}) => {
    const response = await axios.get(`${baseURL}/users`, params);
    return response.data;
};

export const getDetailUser = async (id) => {
    const response = await axios.get(`${baseURL}/users/${id}`);
    return response.data;
};

export const loginUser = async (data) => {
    const response = await axios.post(`${baseURL}/auth/login`, data);
    return response.data;
};

export const updateUser = async (id, data) => {
    const response = await axios.put(`${baseURL}/users/${id}`, data);
    return response.data;
};

export const deleteUser = async (id) => {
    const response = await axios.delete(`${baseURL}/users/${id}`);
    return response.data;
};

export const createUser = async (data) => {
    const response = await axios.post(`${baseURL}/users`, data);
    return response.data;
};