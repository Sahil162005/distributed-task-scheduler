import axios from "axios";

export const apiClient = axios.create({
  baseURL: "",
  withCredentials: true,
});

axios.defaults.withCredentials = true;
