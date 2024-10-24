import { useEffect, useState } from "react";

import { EmployeeJWT } from "@/interfaces/employee";
import {
  IDepartmentLogs,
  ILogEntry,
  IPositionLogs,
} from "@/interfaces/requestLogs";
import { useGetIdentity } from "@refinedev/core";
import axios from "axios";

import { Typography } from "antd";
// Buttons Flex
import { Button, Flex } from "antd";
// Table
import { Checkbox, Col, Divider, Empty, Input, Table } from "antd";

import { LogsColumns } from "@/components/utils/logsColumnsConfig";

const backendUrl = import.meta.env.VITE_BACKEND_URL;
const { Title } = Typography;

export const RequestLogs = () => {
  const { data: user } = useGetIdentity<EmployeeJWT>();
  // const [selectedDepartment, setSelectedDepartment] = useState("");
  const [hasLogs, setHasLogs] = useState(Boolean);
  const [allDeptData, setAllDeptData] = useState<IDepartmentLogs>({});

  const [selectedDepartment, setSelectedDepartment] =
    useState<keyof IDepartmentLogs>();
  const [selectedDeptTeams, setSelectedDeptTeams] = useState<
    (keyof IPositionLogs)[]
  >([]); // Teams under selected department

  const [logsShow, setlogsShow] = useState<ILogEntry[]>([]);
  const [checkedList, setCheckedList] = useState<string[]>([]);

  const [searchText, setSearchText] = useState<string>(""); // For Name filter

  // Utils - Sorting
  const sortAndSetLogs = (logsList: ILogEntry[]) => {
    const sortedLogsList = logsList.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    setlogsShow(sortedLogsList);
  };

  const sortDepartmentsAlphabetically = (data: {
    [department: string]: IPositionLogs;
  }): IDepartmentLogs => {
    const sortedKeys = Object.keys(data).sort(); // Sort keys alphabetically
    const sortedData: IDepartmentLogs = {}; // Ensure the return type matches IDepartmentLogs
    // Construct a new object with sorted keys
    sortedKeys.forEach((key) => {
      sortedData[key] = data[key]; // This should match the structure of IPositionLogs
    });

    return sortedData;
  };

  useEffect(() => {
    if (user?.staffId) {
      fetchRequestLogs(user);
    }
  }, [user]);

  const fetchRequestLogs = async (user: EmployeeJWT) => {
    try {
      const responseData = await axios.get(`${backendUrl}/api/v1/getAllLogs`, {
        headers: {
          id: user.staffId,
        },
        timeout: 300000,
      });
      if (responseData?.data && !("errMsg" in responseData.data)) {
        const sortedDeptData = sortDepartmentsAlphabetically(
          responseData?.data,
        );
        setAllDeptData(sortedDeptData);
        setHasLogs(true);
      }
    } catch (error) {
      // console.error("Error fetching schedule data:", error);
    }
  };

  useEffect(() => {
    const defaultDepartment =
      selectedDepartment ||
      (Object.keys(allDeptData)[0] as keyof IDepartmentLogs);
    setSelectedDepartment(defaultDepartment);
    const logsList: ILogEntry[] = [];
    const teamList: (keyof IPositionLogs)[] = [];

    if (allDeptData[defaultDepartment]) {
      for (const key in allDeptData[defaultDepartment]) {
        logsList.push(...allDeptData[defaultDepartment][key]);
        teamList.push(key);
      }
      sortAndSetLogs(logsList);
      setSelectedDeptTeams(teamList);
      const teamListAsStrings: string[] = teamList as string[];
      setCheckedList(teamListAsStrings);
    }
  }, [allDeptData, selectedDepartment]);

  // Checkbox
  const CheckboxGroup = Checkbox.Group;
  const onChange = (list: string[]) => {
    // Filter logs by selected team
    setCheckedList(list);
    if (selectedDepartment && allDeptData[selectedDepartment]) {
      const logsList: ILogEntry[] = [];
      list.forEach((team) => {
        if (allDeptData[selectedDepartment][team]) {
          logsList.push(...allDeptData[selectedDepartment][team]);
        }
      });
      sortAndSetLogs(logsList);
    }
  };

  // Empty Log Check
  if (!hasLogs) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <Empty
          description={<span>No logs found</span>}
          imageStyle={{
            height: 100,
          }}
        />
      </div>
    );
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };
  // Filter logs based on search input
  const filteredLogs = logsShow.filter(
    (log) =>
      log.staffName &&
      log.staffName.toLowerCase().includes(searchText.toLowerCase()),
  );

  return (
    <div>
      <Title level={3}>Department</Title>
      <Flex gap="small" wrap>
        {Object.keys(allDeptData).map((department) => (
          <Button
            key={department}
            type={selectedDepartment === department ? "primary" : "default"}
            onClick={() => setSelectedDepartment(department)}
          >
            {department}
          </Button>
        ))}
      </Flex>
      <Divider />
      <Flex justify="space-between" align="flex-end">
        <Col>
          <Title level={4}>Teams</Title>
          <CheckboxGroup
            options={selectedDeptTeams}
            value={checkedList}
            onChange={onChange}
          />
        </Col>
        <Col>
          <Input
            placeholder="Search by Staff Name"
            value={searchText}
            onChange={handleSearch}
            style={{ marginBottom: 16 }}
          />
        </Col>
      </Flex>
      <Divider />
      <Table
        columns={LogsColumns}
        dataSource={filteredLogs}
        pagination={false}
      />
    </div>
  );
};
