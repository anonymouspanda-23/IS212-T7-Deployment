import { EmployeeJWT } from "@/interfaces/employee";
import {
  Badge,
  Box,
  List,
  ListItem,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  useDisclosure,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { useGetIdentity } from "@refinedev/core";
import {
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  Select,
  Space,
  Typography,
} from "antd";
import axios from "axios";
import moment from "moment-timezone";
import React, { useEffect, useState } from "react";
import {
  formatDate,
  getDatesInSameWeek,
  getSGTDate,
  isAtLeast24HoursAhead,
  isValidWFHDeadline,
  isWeekday,
} from "../../utils/wfh-dateUtils";
import { validateForm } from "../../utils/wfh-validation";
import { FormData, TimeOfDay, WFHDate } from "./types";

const { Option } = Select;
const { Title } = Typography;
const backendUrl = import.meta.env.VITE_BACKEND_URL;

export const WFHForm: React.FC = () => {
  const toast = useToast();
  const { data: user } = useGetIdentity<EmployeeJWT>();
  const [form] = Form.useForm();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [employeeData, setEmployeeData] = useState({
    name: "",
    staffID: "",
    dept: "",
    managerName: "",
    managerID: "",
  });
  const [wfhDates, setWfhDates] = useState<WFHDate[]>([]);
  const [reason, setReason] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [modalContent, setModalContent] = useState<{
    success: { message: string; dates: [string, string][] };
    error: Array<{ message: string; dates: [string, string][] }>;
    note: { message: string; dates: [string, string][] };
  }>({
    success: { message: "", dates: [] },
    error: [],
    note: { message: "", dates: [] },
  });

  useEffect(() => {
    if (user != undefined) {
      fetchEmployeeData(user);
    }
  }, [user]);

  useEffect(() => {
    form.setFieldsValue(employeeData);
  }, [employeeData, form]);

  const fetchEmployeeData = async (staff: any) => {
    try {
      const {
        staffId: id,
        name,
        dept,
        reportingManager,
        reportingManagerName,
      } = staff;

      const newEmployeeData = {
        name: name,
        staffID: id,
        dept,
        managerName: reportingManagerName,
        managerID: reportingManager,
      };
      setEmployeeData(newEmployeeData);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching employee data:", error);
      showToast("Error", "Failed to load employee data", "error");
    }
  };

  const handleWfhDatesChange = (selectedDate: any) => {
    if (selectedDate && selectedDate.$d) {
      const newDate = getSGTDate(selectedDate.$d);

      if (!isValidDate(newDate)) return;

      setWfhDates((prev) => [...prev, { date: newDate, timeOfDay: "FULL" }]);
    }
  };

  const isValidDate = (date: Date): boolean => {
    if (!isWeekday(date)) {
      showToast("Invalid date", "Please select a weekday.", "error");
      return false;
    }

    if (!isAtLeast24HoursAhead(date)) {
      showToast(
        "Invalid date",
        "Selected date must be at least 24 hours ahead.",
        "error",
      );
      return false;
    }

    if (!isValidWFHDeadline(date)) {
      showToast(
        "Invalid date",
        "This date does not meet the application deadlines.",
        "error",
      );
      return false;
    }

    const dateExists = wfhDates.some(
      (wfhDate) =>
        getSGTDate(wfhDate.date).toDateString() ===
        getSGTDate(date).toDateString(),
    );
    if (dateExists) {
      showToast(
        "Date already selected",
        "Please choose a different date.",
        "warning",
      );
      return false;
    }

    const datesInSameWeek = getDatesInSameWeek(
      date,
      wfhDates.map((wfhDate) => wfhDate.date),
    );
    if (datesInSameWeek.length >= 2) {
      showToast(
        "Weekly limit exceeded",
        "You have selected more than 2 WFH days for this week.",
        "info",
      );
    }

    return true;
  };

  const showToast = (
    title: string,
    description: string,
    status: "error" | "warning" | "info" | "success",
  ) => {
    toast({
      title,
      description,
      status,
      duration: 3000,
      isClosable: true,
    });
  };

  const handleTimeOfDayChange = (index: number, timeOfDay: TimeOfDay) => {
    setWfhDates((prev) =>
      prev.map((wfhDate, i) =>
        i === index ? { ...wfhDate, timeOfDay } : wfhDate,
      ),
    );
  };

  const handleRemoveDate = (index: number) => {
    setWfhDates((prev) => prev.filter((_, i) => i !== index));
  };

  const handleReasonChange = (
    e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>,
  ) => {
    setReason(e.target.value);
  };

  const handleSubmit = async (values: any) => {
    const formData: FormData = { wfhDates, reason: values.reason };
    const validationError = validateForm(formData);
    if (validationError) {
      showToast("Form Error", validationError, "error");
      return;
    }

    const requestedDates = wfhDates.map((wfhDate) => [
      moment(wfhDate.date).tz("Asia/Singapore").format("YYYY-MM-DD"),

      wfhDate.timeOfDay,
    ]);

    const payload = {
      staffId: Number(employeeData.staffID),
      requestedDates,
      reason: values.reason,
    };

    try {
      const response = await axios.post(
        `${backendUrl}/api/v1/postRequest`,
        payload,
      );

      const { success, error, note } = response.data;
      setModalContent({ success, error, note });

      // toast notification
      if (!error || error.length === 0) {
        showToast(
          "Success",
          "WFH application submitted successfully",
          "success",
        );
      } else {
        showToast(
          "Warning",
          "THere are some issues with your WFH application",
          "warning",
        );
      }
      // open application summary modal after 1 second delay
      setTimeout(() => {
        onOpen();
      }, 1000);

      // clear form upon submission
      form.setFieldsValue({ wfhDates: [], reason: "" });
      setWfhDates([]);
      setReason("");
    } catch (error) {
      console.error("Error:", error);

      showToast(
        "Error",
        "An error occured while submitting the WFH application.",
        "error",
      );
    }
  };

  if (isLoading) {
    return <Box>Loading...</Box>;
  }

  return (
    <>
      <Card style={{ maxWidth: "600px", margin: "0 auto", padding: "10px" }}>
        <Title level={2} style={{ textAlign: "center" }}>
          Work-From-Home Application Form
        </Title>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          {Object.entries(employeeData).map(([key, value]) => (
            <Form.Item
              key={key}
              label={key
                .replace(/([a-z])([A-Z])/g, "$1 $2")
                .replace(/^./, (str) => str.toUpperCase())}
              name={key}
            >
              <Input value={value} disabled />
            </Form.Item>
          ))}

          <Form.Item label="Date of Application">
            <Input
              value={moment().tz("Asia/Singapore").format("YYYY-MM-DD")}
              disabled
            />
          </Form.Item>

          <Form.Item
            label="Select Work-From-Home Dates"
            name="wfhDates"
            rules={[
              { required: true, message: "Please select work-from-home dates" },
            ]}
          >
            <DatePicker
              onChange={handleWfhDatesChange}
              format="YYYY-MM-DD"
              disabledDate={(date) => date && !isWeekday(date.toDate())}
            />
          </Form.Item>

          {wfhDates.map((wfhDate, index) => (
            <Form.Item key={index} label={`Date ${index + 1}`}>
              <Space>
                <span>{formatDate(wfhDate.date)}</span>
                <Select
                  value={wfhDate.timeOfDay}
                  onChange={(value) =>
                    handleTimeOfDayChange(index, value as TimeOfDay)
                  }
                  style={{ width: 120 }}
                >
                  <Option value="AM">AM</Option>
                  <Option value="PM">PM</Option>
                  <Option value="FULL">Full Day</Option>
                </Select>
                <Button
                  onClick={() => handleRemoveDate(index)}
                  type="primary"
                  danger
                >
                  Remove
                </Button>
              </Space>
            </Form.Item>
          ))}

          <Form.Item
            label="Reason for Work-From-Home"
            name="reason"
            rules={[{ required: true, message: "Please provide a reason" }]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>

          <Form.Item style={{ display: "flex", justifyContent: "center" }}>
            <Button type="primary" htmlType="submit">
              Submit
            </Button>
          </Form.Item>
        </Form>
      </Card>
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            WFH Application Summary
          </ModalHeader>
          <ModalBody>
            <VStack align="stretch" spacing={4}>
              {modalContent.success.message && (
                <Box>
                  <Text fontWeight="bold" color="green.500">
                    Success:
                  </Text>
                  <Text>{modalContent.success.message}</Text>
                  {modalContent.success.dates.length > 0 && (
                    <List mt={2}>
                      {modalContent.success.dates.map(
                        ([date, timeOfDay], index) => (
                          <ListItem key={index}>
                            {date} -{" "}
                            <Badge colorScheme="green">{timeOfDay}</Badge>
                          </ListItem>
                        ),
                      )}
                    </List>
                  )}
                </Box>
              )}
              {modalContent.error.length > 0 && (
                <Box>
                  <Text fontWeight="bold" color="red.500">
                    Error:
                  </Text>
                  {modalContent.error.map((err, index) => (
                    <Box key={index}>
                      <Text>{err.message}</Text>
                      {err.dates.length > 0 && (
                        <List mt={2}>
                          {err.dates.map(([date, timeOfDay], dateIndex) => (
                            <ListItem key={dateIndex}>
                              {date} -{" "}
                              <Badge colorScheme="red">{timeOfDay}</Badge>
                            </ListItem>
                          ))}
                        </List>
                      )}
                    </Box>
                  ))}
                  <Text>
                    {" "}
                    <br />
                    <i>
                      Kindly cancel the existing request for these day(s) and
                      submit a new application.
                    </i>
                  </Text>
                </Box>
              )}
              {modalContent.note.message && (
                <Box>
                  <Text fontWeight="bold" color="orange.500">
                    Note:
                  </Text>
                  <Text>{modalContent.note.message}</Text>
                  {modalContent.note.dates.length > 0 && (
                    <List mt={2}>
                      {modalContent.note.dates.map(
                        ([date, timeOfDay], index) => (
                          <ListItem key={index}>
                            {date} -{" "}
                            <Badge colorScheme="orange">{timeOfDay}</Badge>
                          </ListItem>
                        ),
                      )}
                    </List>
                  )}
                </Box>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter justifyContent={"center"}>
            <Button style={{ marginRight: "12px" }} onClick={onClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};
