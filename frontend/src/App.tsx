import { ChakraProvider } from "@chakra-ui/react";
import { ErrorComponent, ThemedLayoutV2, ThemedSiderV2 } from "@refinedev/antd";
import { Authenticated, Refine } from "@refinedev/core";
import dataProvider from "@refinedev/simple-rest";

import {
  CalendarOutlined,
  ClockCircleTwoTone,
  UserSwitchOutlined,
} from "@ant-design/icons";
import { ColorModeContextProvider } from "./contexts/color-mode";

import routerProvider, {
  CatchAllNavigate,
  DocumentTitleHandler,
  NavigateToResource,
  UnsavedChangesNotifier,
} from "@refinedev/react-router-v6";
import { ConfigProvider } from "antd";
import { BrowserRouter, Outlet, Route, Routes } from "react-router-dom";

import { Header } from "@/components";
import DepartmentSchedule from "@/pages/department-schedule/department-schedule";
import { Typography } from "antd";
import { authProvider } from "./authProvider";
import { useCustomNotificationProvider } from "./components/toast";
import { IncomingList } from "./pages/approve-reject";
import {
  CategoryCreate,
  CategoryEdit,
  CategoryList,
  CategoryShow,
} from "./pages/categories";
import Login from "./pages/login/login";
import { MainRequests } from "./pages/main-requests";
import { MyReassignments } from "./pages/my-reassignments/list";
import { MyRequests } from "./pages/my-requests/list";
import { RequestLogs } from "./pages/request-logs";
import { ScheduleList } from "./pages/schedule";
import { TeamScheduleList } from "./pages/team-schedule";
import { WFHForm } from "./pages/wfh-application";

const API_URL = import.meta.env.VITE_BACKEND_URL;
const App = () => {
  const { Title } = Typography;
  const CustomTitle = () => (
    <div
      style={{
        display: "flex",
        alignContent: "center",
      }}
    >
      {/* <div style={{ alignContent: "center" }}>
        <img
          src={logo}
          alt="Sayless Logo"
          style={{ height: "100px", marginLeft: "10px" }}
        />
      </div> */}
      <Title
        level={3}
        style={{
          textAlign: "center",
          color: "#48c3d9",
          fontWeight: "bold",
          fontFamily: "serif",
          margin: 0,
          marginLeft: 10,
          alignContent: "center",
        }}
      >
        WeWerk
      </Title>
    </div>
  );

  return (
    <BrowserRouter>
      <ColorModeContextProvider>
        <ConfigProvider>
          <ChakraProvider>
            <Refine
              dataProvider={dataProvider(API_URL)}
              routerProvider={routerProvider}
              authProvider={authProvider}
              notificationProvider={useCustomNotificationProvider}
              resources={[
                {
                  name: "schedule",
                  list: ScheduleList,
                  icon: <CalendarOutlined />,
                  meta: {
                    canDelete: false,
                    label: "My Schedule",
                  },
                },
                {
                  name: "teamSchedule",
                  list: TeamScheduleList,
                  icon: <CalendarOutlined />,
                  meta: {
                    canDelete: false,
                    label: "Co-workers Schedule",
                  },
                },
                {
                  name: "WFH Request",
                  list: "/wfhform",
                  create: "/wfhform",
                  edit: "/wfhform",
                  show: "/wfhform",
                  icon: <ClockCircleTwoTone />,
                  meta: {
                    canDelete: false,
                    label: "Apply for WFH",
                  },
                },
                {
                  name: "myRequests",
                  list: MyRequests,
                  meta: {
                    canDelete: false,
                    label: "My Requests",
                  },
                },
                {
                  name: "myReassignments",
                  list: MyReassignments,
                  icon: <UserSwitchOutlined />,
                  meta: {
                    canDelete: false,
                    label: "Re-assign",
                  },
                },
                {
                  name: "requestLogs",
                  list: RequestLogs,
                  icon: <UserSwitchOutlined />,
                  meta: {
                    canDelete: false,
                    label: "Request Logs",
                  },
                },
              ]}
              options={{
                syncWithLocation: true,
                warnWhenUnsavedChanges: true,
              }}
            >
              <Routes>
                <Route
                  element={
                    <Authenticated
                      key="authentication-inner"
                      fallback={<CatchAllNavigate to="/login" />}
                    >
                      <ThemedLayoutV2
                        Title={CustomTitle}
                        Header={Header}
                        Sider={(props) => <ThemedSiderV2 {...props} fixed />}
                      >
                        <Outlet />
                      </ThemedLayoutV2>
                    </Authenticated>
                  }
                >
                  <Route path="/schedule">
                    <Route index element={<ScheduleList />} />
                  </Route>
                  <Route path="/teamSchedule">
                    <Route index element={<TeamScheduleList />} />
                  </Route>
                  <Route path="/department-schedule">
                    <Route index element={<DepartmentSchedule />} />
                  </Route>
                  <Route path="/teamSchedule">
                    <Route index element={<TeamScheduleList />} />
                  </Route>
                  <Route path="/wfhform" element={<WFHForm />} />
                  <Route path="/myRequests" element={<MyRequests />} />

                  <Route
                    path="/MyReassignments"
                    element={<MyReassignments />}
                  />
                  <Route path="/requestLogs" element={<RequestLogs />} />
                  <Route path="/mainRequests" element={<MainRequests />} />
                  <Route path="/incomingRequests" element={<IncomingList />} />

                  <Route path="/categories">
                    <Route index element={<CategoryList />} />
                    <Route path="create" element={<CategoryCreate />} />
                    <Route path="edit/:id" element={<CategoryEdit />} />
                    <Route path="show/:id" element={<CategoryShow />} />
                  </Route>

                  <Route path="*" element={<ErrorComponent />} />
                </Route>

                <Route path="/login" element={<Login />} />
                <Route
                  element={
                    <Authenticated
                      key="authentication-inner"
                      fallback={<Outlet />}
                    >
                      <NavigateToResource />
                    </Authenticated>
                  }
                />
              </Routes>
              <UnsavedChangesNotifier />
              <DocumentTitleHandler />
            </Refine>
          </ChakraProvider>
        </ConfigProvider>
      </ColorModeContextProvider>
    </BrowserRouter>
  );
};

export default App;
