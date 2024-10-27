import { useEffect, useState } from "react";

import { useGetIdentity } from "@refinedev/core";
import { EmployeeJWT } from "@/interfaces/employee";
import axios from "axios";

import { IResponseData, IResponseDept } from "@/interfaces/schedule";
import { Typography } from "antd";

import EventTableGroup from "@/components/scheduleTable/EventTableGroup";
import {getColumns} from "@/components/utils/columnsConfig"
// Buttons Flex
import { Button, Flex } from "antd";
// Tabs
import { Tabs } from "antd";
import type { TabsProps } from "antd";
// Stats
import { ClockCircleOutlined, CalendarOutlined, UserOutlined } from "@ant-design/icons";
import { Card, Col, Row, Statistic } from "antd";
// Checkbox
import { Checkbox, Divider } from 'antd';
// Date Picker
import type { DatePickerProps } from 'antd';
import { DatePicker, Space } from 'antd';


const backendUrl = import.meta.env.VITE_BACKEND_URL;
const { Title } = Typography;

export const TeamScheduleList = () => {
  const { data: user } = useGetIdentity<EmployeeJWT>();
  const [allCalendarEvents, setallCalendarEvents] = useState<IResponseData[]>([]); // Stores all calendar events (all arrangement within depart)
  const [calendarEvents, setCalendarEvents] = useState<IResponseData[]>([]); // State for calendar events (filtered by teams)
  const [allDeptData, setAllDeptData] = useState<IResponseDept>({}); // Stores all dept data - later use for filtering
  const [selectedDepartment, setSelectedDepartment] = useState<keyof IResponseDept>(); // Default to CEO
  const [manpower, setManpower] = useState<Record<string, number>>({}); // Manpower within the department and teams selected

  useEffect(() => {
    if (user?.staffId) {
      fetchScheduleData(user);
    }
  }, [user]);

  const fetchScheduleData = async (user: EmployeeJWT) => {
    try {
        const responseData = await axios.get(`${backendUrl}/api/v1/getSchedule`, {
            headers: {
            id: user.staffId,
            },
            timeout: 300000,
        });
        setAllDeptData(responseData?.data)
    } catch (error) {
      // console.error("Error fetching schedule data:", error);
    }
  };
  // Set table columns
  const columns = getColumns(user || null); // Parse user to highlight current user
  // Group data by date - Incoming or Past
  const upcomingData = calendarEvents.reduce(
    (acc: Record<string, any[]>, item) => {
      const date = new Date(item.requestedDate).toLocaleDateString("en-CA", {
        timeZone: "Asia/Singapore",
      });
      const currentDate = new Date().toLocaleDateString("en-CA", {
        timeZone: "Asia/Singapore",
      });
      if (date > currentDate) {
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push(item);
      }

      return acc;
    },
    {},
  );

  const pastData = calendarEvents.reduce((acc: Record<string, any[]>, item) => {
    const date = new Date(item.requestedDate).toLocaleDateString("en-CA", {
      timeZone: "Asia/Singapore",
    });
    const currentDate = new Date().toLocaleDateString("en-CA", {
      timeZone: "Asia/Singapore",
    });
    if (date < currentDate) {
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(item);
    }

    return acc;
  }, {});

  const sortedUpcomingDates = Object.keys(upcomingData).sort();
  const sortedPastDates = Object.keys(pastData).sort().reverse();

  // Tab Config - Insert table data
  const tabItems: TabsProps["items"] = [
    {
      key: "1",
      label: "Upcoming",
      children: (
        <div>
          <EventTableGroup
            sortedDates={sortedUpcomingDates}
            groupedData={upcomingData}
            columns={columns}
          />
        </div>
      ),
    },
    {
      key: "2",
      label: "Past",
      children: (
        <div>
          <EventTableGroup
            sortedDates={sortedPastDates}
            groupedData={pastData}
            columns={columns}
          />
        </div>
      ),
    },
  ];

  // Checkbox
  const CheckboxGroup = Checkbox.Group;
  const plainOptions = Object.keys(manpower);
  const [checkedList, setCheckedList] = useState<string[]>(plainOptions);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [totalManpower, setTotalManpower] = useState<number>(0);

  const calculateTotalManpower = (data: Record<string, number>) => {
    const total = Object.values(data).reduce((acc, value) => acc + value, 0);
    setTotalManpower(total);
  };
  
  useEffect(() => {
    if (plainOptions.length > 0) {
        setCheckedList(plainOptions); // Set all options to checked by default  
        // Call the function with the manpower data
        calculateTotalManpower(manpower);
    }
  }, [manpower]);

  useEffect(() => {
    const defaultDepartment = selectedDepartment || Object.keys(allDeptData)[0] as keyof IResponseDept;
    setSelectedDepartment(defaultDepartment)
    // Set Manpower
    const teamData = allDeptData[defaultDepartment]?.teams || {};
    const manpowerData = Object.keys(teamData).reduce((acc: Record<string, number>, key) => {
        if (key !== 'dept') {
            acc[key] = teamData[key];
        }
        return acc;
    }, {});
    setManpower(manpowerData)

    const deptCalendarEvents = allDeptData[defaultDepartment]?.wfhStaff || [];
    setCalendarEvents(deptCalendarEvents); // Set the events if the data exists
    setallCalendarEvents(deptCalendarEvents)
  }, [allDeptData, selectedDepartment])

  const onChange = (list: string[]) => {
    setCheckedList(list);
    let filteredEvents = allCalendarEvents
    if (selectedDate){
        filteredEvents = allCalendarEvents.filter((event: IResponseData) => {
            const eventDate = new Date(event.requestedDate).toLocaleDateString("en-CA", {
                timeZone: "Asia/Singapore",
              }); 
            return eventDate === selectedDate;
        } 
        );
    }
    const filterByTeam = filteredEvents.filter((event: IResponseData) => 
        list.includes(event?.position) // Check if event.position is in the checkedOptions
    );
    setCalendarEvents(filterByTeam)

    const selectedTeam = list.reduce((acc: Record<string, number>, team) => {
        if (manpower[team] !== undefined) { // Check if the team exists in manpowerData
            acc[team] = manpower[team];
        }
        return acc;
    }, {});
    calculateTotalManpower(selectedTeam);

  };

  const onChangeDate: DatePickerProps['onChange'] = (date, dateString) => {
    if (typeof dateString === "string") {
        setSelectedDate(dateString); // Ensure you only set a string
    }
    let filteredEvents = allCalendarEvents
    if (date){
        filteredEvents = allCalendarEvents.filter((event: IResponseData) => {
            const eventDate = new Date(event.requestedDate).toLocaleDateString("en-CA", {
                timeZone: "Asia/Singapore",
              }); 
            return eventDate === dateString;
        } 
        );
    }
    const filterByTeam = filteredEvents.filter((event: IResponseData) => 
        checkedList.includes(event?.position) // Check if event.position is in the checkedOptions
    );
    setCalendarEvents(filterByTeam)
  };

  return (
    <div>
      <Title level={3}>Department</Title>
      <Flex gap="small" wrap>
      {Object.keys(allDeptData).map((department) => {
          const isTempTeam = allDeptData[department]?.isTempTeam; // Check if isTempTeam exists
          const isSelected = selectedDepartment === department;
          const buttonDetails = !isTempTeam ? department : department + " (Assigned)"
          return (
            <Button
              key={department}
              type={isSelected ? 'primary' : 'dashed'} // Always dashed if not selected
              style={{
                backgroundColor: isTempTeam && isSelected ? 'green' : undefined,
                borderColor: isTempTeam && !isSelected ? 'green' : undefined,
                color: isTempTeam && isSelected ? 'white' : isTempTeam && !isSelected ? 'green' : undefined, // Green text if not selected
                fontWeight: isTempTeam && !isSelected ? 'bold' : undefined, // Bold text if not selected
              }}
              onClick={() => setSelectedDepartment(department as keyof IResponseData)}
            >
              {buttonDetails}
            </Button>
          );
        })}
      </Flex>
      <Divider />
      <Row gutter={[16, 16]} style={{ height: '100%' }}>
        <Col xs={24} sm={12} md={8}>
          <Card bordered={false} style={{ height: '100%' }}>
            <Statistic
              title="Upcoming WFH"
              value={Object.values(upcomingData).flat().length}
              valueStyle={{ color: "#1890ff" }}
              prefix={<CalendarOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card bordered={false} style={{ height: '100%' }}>
            <Statistic
              title="Past WFH"
              value={Object.values(pastData).flat().length}
              valueStyle={{ color: "#808080" }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card bordered={false} style={{ height: '100%' }}>
            <Statistic
              title={selectedDate ? `Working In Office (${selectedDate})` : "Working In Office"}
              value={
                selectedDate
                  ? `${totalManpower - Object.values(upcomingData).flat().length}/${totalManpower}`
                  : "Select a date"
              }
              valueStyle={{ color: selectedDate ? "#1890ff" : "#808080" }}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
      </Row>
      <Divider />
        <Flex justify="space-between" align="flex-end">
            <Col>
                <Title level={4}>Teams</Title>
                <CheckboxGroup options={plainOptions} value={checkedList} onChange={onChange} />
            </Col>
            <Col>
                <Space direction="vertical">
                <DatePicker onChange={onChangeDate} />
                </Space>
            </Col>
        </Flex>
        <Divider />
      <Tabs defaultActiveKey="1" items={tabItems} />
    </div>
  );
};
