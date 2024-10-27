import { EmployeeJWT } from "@/interfaces/employee";
import { useGetIdentity } from "@refinedev/core";
import {
  Button,
  Card,
  DatePicker,
  Divider,
  Input,
  List,
  message,
  Modal,
  Select,
  Skeleton,
  Statistic,
  Typography,
} from "antd";
import axios from "axios";
import type { Dayjs } from "dayjs";
import moment from "moment";
import { useContext, useEffect, useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import { ColorModeContext } from "../../contexts/color-mode";

interface DataType {
  dept: string;
  email: string;
  position: string;
  role: number;
  staffId: number;
  staffName: string;
}

interface DataType {
  dept: string;
  email: string;
  position: string;
  role: number;
  staffId: number;
  staffName: string;
}

interface AssignmentStatus {
  reassignmentId: number;
  status: string; // pending, approved, or rejected
  staffName: string;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  tempManagerName: string;
}

export const MyReassignments = () => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const { Title } = Typography;
  const { Option } = Select;
  const { RangePicker } = DatePicker;
  const { data: user } = useGetIdentity<EmployeeJWT>();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DataType[]>([]);
  const [filteredData, setFilteredData] = useState<DataType[]>([]);
  const [selectedDept, setSelectedDept] = useState<string | undefined>(
    undefined,
  );
  const [assignmentsModalVisible, setAssignmentsModalVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<DataType | null>(
    null,
  );
  const [dateRange, setDateRange] = useState<
    [Dayjs | null, Dayjs | null] | null
  >(null);
  const { mode } = useContext(ColorModeContext);
  const [assignmentsData, setAssignmentsData] =
    useState<AssignmentStatus | null>(null);

  const loadMoreData = () => {
    if (loading) {
      return;
    }
    setLoading(true);
  };

  useEffect(() => {
    if (user?.staffId) {
      fetchRequests(user.staffId);
    }
  }, [user?.staffId]);

  const fetchRequests = async (staffId: any) => {
    setLoading(true);
    try {
      const { data } = await axios.get(
        `${backendUrl}/api/v1/getRoleOneOrThreeEmployees`,
        { headers: { id: staffId } },
      );
      setLoading(false);
      setData(data);
      setFilteredData(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching requests:", error);
      return [];
    }
  };

  const handleDeptChange = (value: string) => {
    setSelectedDept(value);
    if (value === "all") {
      setFilteredData(data);
    } else {
      const filtered = data.filter((item) => item.dept === value);
      setFilteredData(filtered);
    }
  };

  const departmentCounts = data.reduce(
    (acc, item) => {
      acc[item.dept] = (acc[item.dept] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const uniqueDepartments = Object.keys(departmentCounts);

  const handleAssignClick = (employee: DataType) => {
    setSelectedEmployee(employee);
    setModalVisible(true);
    setDateRange(null); // Reset date range when opening the modal
  };

  const handleModalClose = () => {
    setModalVisible(false);
    setSelectedEmployee(null);
    setDateRange(null); // Clear date range when modal closes
  };

  const handleAssignRole = async () => {
    if (dateRange && dateRange[0] && dateRange[1]) {
      const startDate = dateRange[0].format("YYYY-MM-DD");
      const endDate = dateRange[1].format("YYYY-MM-DD");

      const requestBody = {
        staffId: user?.staffId,
        startDate,
        endDate,
        tempReportingManagerId: selectedEmployee?.staffId,
      };

      try {
        handleModalClose();
        message.success("Successfully requested reassignment");
        await axios.post(
          `${backendUrl}/api/v1/requestReassignment`,
          requestBody,
        );
      } catch (error) {
        console.error("Error assigning role:", error);
      }
    } else {
      message.error("Please select a date range before assigning a role.");
    }
  };

  const disablePastDates = (current: moment.Moment) => {
    return current && current < moment().startOf("day");
  };

  // Fetch reassignment status (handling object response)
  const fetchReassignmentStatus = async (staffId: number) => {
    try {
      const response = await axios.get(
        `${backendUrl}/api/v1/getReassignmentStatus`,
        {
          headers: { id: staffId },
        },
      );

      handleModalClose();

      return response.data; // Directly return the object from the response
    } catch (error) {
      console.error("Error fetching reassignment status:", error);
      return null; // Return null in case of an error
    }
  };

  const handleExistingAssignmentsClick = async () => {
    if (user?.staffId) {
      const assignments = await fetchReassignmentStatus(Number(user.staffId));
      setAssignmentsData(assignments); // Set the assignments object directly
      setAssignmentsModalVisible(true);
    } else {
      message.error("User ID not available");
    }
  };

  return (
    <div style={{ width: "80vw", margin: "auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "10px",
        }}
      >
        <Title level={4} style={{ margin: 0 }}>
          Reassign Role
        </Title>
        <Button
          type="default"
          style={{
            color: "black",
            backgroundColor: "skyblue",
            borderColor: "skyblue",
          }} // Change to your desired color
          onClick={handleExistingAssignmentsClick}
        >
          My Current Re-Assignments
        </Button>
      </div>

      <Card bordered={true} style={{ padding: 0, marginBottom: 20 }}>
        <Statistic title="Total Employees" value={filteredData.length} />
      </Card>

      <Select
        defaultValue="all"
        style={{ width: 200, marginBottom: 16 }}
        onChange={handleDeptChange}
      >
        <Option value="all">All Departments</Option>
        {uniqueDepartments.map((dept) => (
          <Option key={dept} value={dept}>
            {dept} ({departmentCounts[dept]})
          </Option>
        ))}
      </Select>

      <Modal
        title="My Current Re-Assignments"
        visible={assignmentsModalVisible}
        onCancel={() => setAssignmentsModalVisible(false)}
        footer={null}
      >
        {Array.isArray(assignmentsData) && assignmentsData.length > 0 ? (
          <List
            dataSource={assignmentsData}
            renderItem={(assignment) => (
              <List.Item key={assignment.reassignmentId}>
                <List.Item.Meta
                  title={`Assigned Temp Manager: ${assignment.tempManagerName}`}
                  description={
                    <>
                      <span
                        style={{
                          color:
                            assignment.status === "PENDING"
                              ? "orange"
                              : assignment.status === "APPROVED"
                                ? "green"
                                : assignment.status === "REJECTED"
                                  ? "red"
                                  : "black",
                          fontWeight:
                            assignment.status === "PENDING" ? "bold" : "normal",
                        }}
                      >
                        {`Status: ${assignment.status}`}
                      </span>
                      {` | Start Date: ${moment(assignment.startDate).format("YYYY-MM-DD")} | End Date: ${moment(assignment.endDate).format("YYYY-MM-DD")}`}
                    </>
                  }
                />
              </List.Item>
            )}
          />
        ) : (
          <p>No current re-assignments available.</p>
        )}
      </Modal>

      <div
        id="scrollableDiv"
        style={{
          height: "60vh",
          overflow: "auto",
          padding: "0 16px",
          border: "1px solid rgba(140, 140, 140, 0.35)",
          borderRadius: "10px",
          backgroundColor: mode === "dark" ? "#000114" : "white",
        }}
      >
        <InfiniteScroll
          dataLength={filteredData.length}
          next={loadMoreData}
          hasMore={filteredData.length < 0}
          loader={<Skeleton active />}
          endMessage={<Divider plain>It is all, nothing more 🤐</Divider>}
          scrollableTarget="scrollableDiv"
        >
          <List
            dataSource={filteredData}
            renderItem={(item) => (
              <List.Item key={item.staffId}>
                <List.Item.Meta
                  title={<a href="https://ant.design">{item.staffName}</a>}
                  description={
                    <>
                      <div>{item.email}</div>
                      <div>
                        {item.position} - {item.dept}
                      </div>
                    </>
                  }
                />
                <Button type="dashed" onClick={() => handleAssignClick(item)}>
                  Assign
                </Button>
              </List.Item>
            )}
          />
        </InfiniteScroll>
      </div>

      <Modal
        title="Assign Role"
        visible={modalVisible}
        onCancel={handleModalClose}
        footer={null}
      >
        {selectedEmployee && (
          <div>
            <Input
              name="Name"
              value={selectedEmployee.staffName}
              disabled
              style={{ marginBottom: 16 }}
            />
            <Input
              name="Email"
              value={selectedEmployee.email}
              disabled
              style={{ marginBottom: 16 }}
            />
            <RangePicker
              disabledDate={disablePastDates as any}
              value={dateRange}
              onChange={(dates) => setDateRange(dates)}
              style={{ width: "100%" }}
            />
            <Button
              type="primary"
              onClick={handleAssignRole}
              style={{ marginTop: 16, width: "100%" }}
            >
              Assign Role
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
};
