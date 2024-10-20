import { useEffect, useState, useContext } from "react";
import { EmployeeJWT } from "@/interfaces/employee";
import { useGetIdentity } from "@refinedev/core";
import {
  Button,
  Typography,
  Divider,
  List,
  Skeleton,
  Select,
  Statistic,
  Card,
  Modal,
  DatePicker,
  Input,
  message,
} from "antd";
import axios from "axios";
import InfiniteScroll from "react-infinite-scroll-component";
import { ColorModeContext } from "../../contexts/color-mode";
import moment from "moment";
import dayjs from "dayjs";
import type { Dayjs } from 'dayjs';

const backendUrl = import.meta.env.VITE_BACKEND_URL;
const { Title } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

interface DataType {
  dept: string;
  email: string;
  position: string;
  role: number;
  staffId: number;
  staffName: string;
}

const fetchRequests = async () => {
  try {
    const response = await axios.get(
      `${backendUrl}/api/v1/getRoleOneEmployees`,
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching requests:", error);
    return [];
  }
};

export const MyReassignments = () => {
  const { data: user } = useGetIdentity<EmployeeJWT>();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DataType[]>([]);
  const [filteredData, setFilteredData] = useState<DataType[]>([]);
  const [selectedDept, setSelectedDept] = useState<string | undefined>(
    undefined,
  );
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<DataType | null>(
    null,
  );
  const [dateRange, setDateRange] = useState<
    [Dayjs | null, Dayjs | null] | null
  >(null);
  const { mode } = useContext(ColorModeContext);

  const loadMoreData = () => {
    if (loading) {
      return;
    }
    setLoading(true);

    fetchRequests()
      .then((res) => {
        setData(res);
        setFilteredData(res);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadMoreData();
  }, []);

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
        await axios.post(
          `${backendUrl}/api/v1/requestReassignment`,
          requestBody,
        );
        handleModalClose();
      } catch (error) {
        console.error("Error assigning role:", error);
      }
    } else {
      message.error("Please select a date range before assigning a role.");
    }
  };

  return (
    <div style={{ width: "80vw", margin: "auto" }}>
      <Title level={4}>Reassign Role</Title>

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
            <Input
              name="Position"
              value={selectedEmployee.position}
              disabled
              style={{ marginBottom: 16 }}
            />
            <Input
              name="Department"
              value={selectedEmployee.dept}
              disabled
              style={{ marginBottom: 16 }}
            />
            <RangePicker
              style={{ width: "100%", marginBottom: 16 }}
              minDate={dayjs(moment().startOf("day").toDate())}
              value={dateRange} // Add this line to bind the date range to the picker
              onChange={(dates) => {
                setDateRange(dates);
              }}
            />
            <Button
              type="primary"
              onClick={handleAssignRole}
              disabled={!dateRange}
            >
              Assign Role
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
};
