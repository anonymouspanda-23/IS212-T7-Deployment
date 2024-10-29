import { AuthProvider } from "@refinedev/core";
import axios, { AxiosInstance } from "axios";
import { EmployeeJWT } from "@/interfaces/employee";

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
    const injectedStyle = document.getElementById("dynamic-role-style");
    if (injectedStyle) {
      injectedStyle.remove();
    }
    
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
      const myAuth: EmployeeJWT = JSON.parse(auth);
      const style = document.createElement("style");
      style.id = "dynamic-role-style";
      if(myAuth.role == 2){
        style.innerHTML = `
          .ant-menu li[role="menuitem"]:nth-of-type(5) {
            display: none;
          }
        `;
      }else if(myAuth.dept == "CEO"){
        style.innerHTML = `
          .ant-menu li[role="menuitem"]:nth-of-type(1),
          .ant-menu li[role="menuitem"]:nth-of-type(3),
          .ant-menu li[role="menuitem"]:nth-of-type(4),
          .ant-menu li[role="menuitem"]:nth-of-type(5) {
            display: none;
          }
        `;
      }
      document.head.appendChild(style);
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
