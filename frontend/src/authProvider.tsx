import { AuthProvider } from "@refinedev/core";
import axios, { AxiosInstance } from "axios";

const backendUrl = import.meta.env.VITE_BACKEND_URL;

export const api: AxiosInstance = axios.create({
  baseURL: String(backendUrl),
  timeout: 300000,
  headers: {
    "Content-Type": "application/json",
  },
});

export const authProvider: AuthProvider = {
  login: async ({ email, password }) => {
    // Axios post to 'baseURL/api/v1/login' with email and password
    const response = await api.post("/api/v1/login", {
      staffEmail: email,
      staffPassword: password,
    });

    if (response.data.error == undefined) {
      localStorage.setItem("auth", JSON.stringify(response.data));

      return {
        success: true,
        redirectTo: response.data.role == 2 ? "/schedule" : "/teamSchedule",
      };
    } else {
      return {
        success: false,
        error: {
          message: "Login failed",
          name: response.data.error,
        },
      };
    }
  },
  logout: async () => {
    localStorage.removeItem("auth");
    return {
      success: true,
      redirectTo: "/login",
    };
  },
  check: async () => {
    const auth = localStorage.getItem("auth");
    if (auth) {
      return {
        authenticated: true,
      };
    }
    return {
      authenticated: false,
      logout: true,
      redirectTo: "/login",
    };
  },
  getPermissions: async () => null,
  getIdentity: async () => {
    const auth = localStorage.getItem("auth");
    if (auth) {
      return JSON.parse(auth);
    }
    return null;
  },
  onError: async (error) => {
    console.error(error);
    return { error };
  },
};
