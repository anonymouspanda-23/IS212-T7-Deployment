import { EmployeeJWT } from "@/interfaces/employee";
import { List, TagField } from "@refinedev/antd";
import { useGetIdentity } from "@refinedev/core";
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  Row,
  Select,
  Statistic,
  Table,
  Typography,
  Descriptions,
  Modal,
  Tag,
} from "antd";
import axios from "axios";
import { formatDate } from "@/utils/wfh-dateUtils";
import React, { useEffect, useState } from "react";
import CountUp from "react-countup";
import { useCustomNotificationProvider } from "@/components/toast";
import { useReassignmentsCounts } from "./requestsCount";
import { Action, Status } from "@/helper/requestLogsVar";


const backendUrl = import.meta.env.VITE_BACKEND_URL;
const { Title } = Typography;

const formatter = (value: any) => {
  if (typeof value === "number") {
    return <CountUp end={value} separator="," />;
  }
  return value;
};

export const HandleReassignments: React.FC = () => {
  const { data: user } = useGetIdentity<EmployeeJWT>();
  const [incomingReassignments, setIncomingReassignments] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState<string | undefined>(undefined);
  const toast = useCustomNotificationProvider();

  // Modal states
  const [reassignmentModalVisible, setReassignmentModalVisible] = useState(false);
  const [requestModalVisible, setRequestModalVisible] = useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [selectedReassignment, setSelectedReassignment] = useState<any>(null);
  // active reassignments
  const [activeReassignments, setActiveReassignments] = useState<any[]>([]);
  const [hasActiveReassignment, setHasActiveReassignment] = useState<boolean>(false);
  // upcoming reassignments 
  const [upcomingReassignments, setUpcomingReassignments] = useState<any[]>([]);
  const [hasUpcomingReassignments, setHasUpcomingReassignments] = useState(false);
  
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [formValues, setFormValues] = useState<any>(null);
  // to count all pending requests (pending incoming reassignment and handle reassigned pending requests)
  const { totalPendingCount, fetchCounts } = useReassignmentsCounts();
  const [form] = Form.useForm();


  useEffect(() => {
    if (user?.staffId) {
      fetchIncomingReassignments(user.staffId);
    }
  }, [user?.staffId]);

  const fetchIncomingReassignments = async (staffId: string) => {
    try {
      const response = await axios.get(
        `${backendUrl}/api/v1/getIncomingReassignmentRequests`,
        { headers: { id: staffId } }
      );
      setIncomingReassignments(response.data);
    } catch (error) {
      console.error("Error fetching reassignments:", error);
      toast.open({
        message: "Error",
        description: "Failed to fetch incoming reassignments.",
        type: "error",
      });
    }
  };

  useEffect(() => {
    if (user?.staffId) {
      fetchUpcomingReassignments(user.staffId);
    }
  } , [user?.staffId])

  const fetchUpcomingReassignments = async (staffId: string) => {
    try {
      const response = await axios.get(
        `${backendUrl}/api/v1/getTempMgrReassignmentStatus`,
        { headers: { id: staffId } }
      );
    
      const filteredUpcoming = response.data.filter((reassignment: any) => {
        return reassignment.status === Status.APPROVED && !reassignment.active;
      });
      
      setUpcomingReassignments(filteredUpcoming);
      setHasUpcomingReassignments(filteredUpcoming.length > 0);
    } catch (error) {
      console.error("Error fetching upcoming reassignments:", error);
      toast.open({
        message: "Error",
        description: "Failed to fetch upcoming reassignments.",
        type: "error",
      });
    }
  };

  useEffect(() => {
    if (user?.staffId) {
      fetchActiveReassignments(user.staffId);
    }
  } , [user?.staffId])

  const fetchActiveReassignments = async (staffId: string) => {
    try {
      const response = await axios.get(
        `${backendUrl}/api/v1/getTempMgrReassignmentStatus`,
        { headers: { id: staffId } }
      );
      const filterActive = response.data.filter((reassignment: any) => {
        return  reassignment.status === Status.APPROVED
        &&
        reassignment.active === true;
    
      });      
      setActiveReassignments(filterActive);
      setHasActiveReassignment(filterActive.length > 0);
    } catch (error) {
      console.error("Error fetching upcoming reassignments:", error);
      toast.open({
        message: "Error",
        description: "Failed to fetch upcoming reassignments.",
        type: "error",
      });
    }
  };

  useEffect(() => {
    if (user?.staffId) {
      getReassignmentStatus(user.staffId);
    } else {
      setHasActiveReassignment(false);
    }
  }, [user?.staffId]);

  const getReassignmentStatus = async (staffId: string) => {
    try {
      const response = await axios.get(
        `${backendUrl}/api/v1/getTempMgrReassignmentStatus`,
        { headers: { id: staffId } }
      );
      
      const reassignmentStatuses = response.data;
      reassignmentStatuses.forEach((reassignmentStatus: any) => {
        if (reassignmentStatus.active === true) {
          setHasActiveReassignment(reassignmentStatus);
          return;
        }
      });

    } catch (error) {
      console.error("Error fetching requests:", error);
      toast.open({
        message: "Error",
        description: "Failed to fetch request status.",
        type: "error",
      });
    }
  }

  useEffect(() => {
    if (user?.staffId && hasActiveReassignment) {
      fetchRequests(user.staffId)
    } else {
      setRequests([]);
      setFilteredRequests([]);
    }
  }, [user?.staffId, hasActiveReassignment]);

  const fetchRequests = async (staffId: string) => {
    try {
      const response = await axios.get(
        `${backendUrl}/api/v1/getSubordinateRequestsForTempManager`,
        { headers: { id: staffId } }
      );
      setRequests(response.data);
      setFilteredRequests(response.data);
    } catch (error) {
      console.error("Error fetching requests:", error);
      toast.open({
        message: "Error",
        description: "Failed to fetch requests.",
        type: "error",
      });
      setRequests([]);
      setFilteredRequests([]);
    }
  };

  useEffect(() => {
    if (filterStatus) {
      setFilteredRequests(requests.filter((r) => r.status === filterStatus));
    } else {
      setFilteredRequests(requests);
    }
  }, [filterStatus, requests]);

  const getStatusCounts = () => ({
    pending: requests.filter((r) => r.status === Status.PENDING).length,
    approved: requests.filter((r) => r.status === Status.APPROVED).length,
    rejected: requests.filter((r) => r.status === Status.REJECTED).length,
  });

  const handleReassignmentEdit = (reassignment: any) => {
    setSelectedReassignment(reassignment);
    form.setFieldsValue({ status: reassignment.status });
    setReassignmentModalVisible(true);
  };

  const handleRequestEdit = (request: any) => {
    setSelectedRequest(request);
    form.setFieldsValue({ status: request.status });
    setRequestModalVisible(true);
  };

  const handleFormSubmit = async (values: any) => {
    setFormValues(values);
    if (selectedReassignment) {
      setReassignmentModalVisible(false);
    } else {
      setRequestModalVisible(false);
    }
    setConfirmModalVisible(true);
  };

  const handleConfirmAction = async () => {
    if (!formValues || !user?.staffId) return;

    try {
      let response;
      if (selectedReassignment) {
        // Handle reassignment request
        response = await axios.post(
          `${backendUrl}/api/v1/handleReassignmentRequest`,
          {
            reassignmentId: selectedReassignment.reassignmentId,
            action: formValues.status === Action.APPROVE ? Action.APPROVE : Action.REJECT,
          },
          { headers: { id: user.staffId } }
        );
        if (response?.status === 200) {
        setIncomingReassignments(prevReassignments => 
            prevReassignments.map(reassignment => 
              reassignment.reassignmentId === selectedReassignment.reassignmentId
                ? { ...reassignment, status: formValues.status }
                : reassignment));
        }
      } else if (selectedRequest) {
        // Handle WFH request
        if (formValues.status === Action.APPROVE) {
          response = await axios.post(
            `${backendUrl}/api/v1/approveRequest`,
            {
              requestId: selectedRequest.requestId,
              performedBy: selectedRequest.reportingManager
            }
          );
        } else {
          response = await axios.post(
            `${backendUrl}/api/v1/rejectRequest`,
            {
                requestId: selectedRequest.requestId,
                performedBy: selectedRequest.reportingManager,
                reason: selectedRequest.reason
            }
          );
        }
        if (response?.status === 200) {
          await fetchRequests(user.staffId);
        }
      }

      toast.open({
        message: "Success",
        description: `Request has been ${formValues.status.toLowerCase()}${formValues.status.toLowerCase() == 'approve' ? 'd' : 'ed'} successfully.`,
        type: "success",
      });
    } catch (error) {
      console.error("Error updating request:", error);
      toast.open({
        message: "Error",
        description: "Failed to update request status.",
        type: "error",
      });
    } finally {
      setConfirmModalVisible(false);
      setSelectedReassignment(null);
      setSelectedRequest(null);
      setFormValues(null);
      form.resetFields();
      await fetchCounts();
    }
  };

  const reassignmentColumns = [
    { title: "Reassignment Id", dataIndex: "reassignmentId", key: "reassignmentId" },
    { title: "Assigner", dataIndex: "staffName", key: "staffName" },
    { 
      title: "Start Date", 
      dataIndex: "startDate", 
      key: "startDate",
      render: (date: string) => formatDate(new Date(date))
    },
    { 
      title: "End Date", 
      dataIndex: "endDate", 
      key: "endDate",
      render: (date: string) => formatDate(new Date(date))
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <TagField 
          value={status} 
          color={
            status === Status.PENDING ? "blue" :
            status === Status.APPROVED ? "green" :
            status === Status.REJECTED ? "red" : "default"
          }
        />
      ),
    },
    {
      title: "Action",
      key: "action",
      render: (_: any, record: any) => (
        <Button 
          onClick={() => handleReassignmentEdit(record)} 
          disabled={record.status !== Status.PENDING}
        >
          Edit
        </Button>
      ),
    },
  ];

  const upcomingReassignmentColumns = [
    { title: "Reassignment Id", dataIndex: "reassignmentId", key: "reassignmentId" },
    { 
      title: "Start Date", 
      dataIndex: "startDate", 
      key: "startDate",
      render: (date: string) => formatDate(new Date(date))
    },
    { 
      title: "End Date", 
      dataIndex: "endDate", 
      key: "endDate",
      render: (date: string) => formatDate(new Date(date))
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <TagField 
          value={status} 
          color={
            status === Status.PENDING ? "blue" :
            status === Status.APPROVED ? "green" :
            status === Status.REJECTED ? "red" : "default"
          }
        />
      ),
    },
  ];

  const activeReassignmentColumns = [
    { title: "Reassignment Id", dataIndex: "reassignmentId", key: "reassignmentId" },
    { 
      title: "Start Date", 
      dataIndex: "startDate", 
      key: "startDate",
      render: (date: string) => formatDate(new Date(date))
    },
    { 
      title: "End Date", 
      dataIndex: "endDate", 
      key: "endDate",
      render: (date: string) => formatDate(new Date(date))
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <TagField 
          value={status} 
          color={
            status === Status.APPROVED ? "green": "default"
          }
        />
      ),
    },
  ];

  const requestColumns = [
    { title: "Request Id", dataIndex: "requestId", key: "requestId" },
    { title: "Name", dataIndex: "staffName", key: "staffName" },
    { title: "Department", dataIndex: "dept", key: "dept" },
    { 
      title: "Applied Date", 
      dataIndex: "requestedDate", 
      key: "requestedDate",
      render: (date: string) => formatDate(new Date(date))
    },
    { title: "Request Type", dataIndex: "requestType", key: "requestType" ,       render: (type: any) => {
      let color = "";
      switch (type) {
        case "FULL":
          color = "purple";
          break;
        case "PM":
        case "AM":
          color = "gold";
          break;
        default:
          color = "gray";
          break;
      }
      return <Tag color={color}>{type}</Tag>;
    },},
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <TagField 
          value={status} 
          color={
            status === Status.PENDING ? "blue" :
            status === Status.APPROVED ? "green" :
            status === Status.REJECTED ? "red" : "default"
          }
        />
      ),
    },
    {
      title: "Action",
      key: "action",
      render: (_: any, record: any) => (
        <Button 
          onClick={() => handleRequestEdit(record)} 
          disabled={record.status !== Status.PENDING}
        >
          Edit
        </Button>
      ),
    },
  ];

  const counts = getStatusCounts();

  return (
    <List>
    <Row gutter={[16, 16]}>
      <Col xs={24} md={12}>
        <Title level={3}>Incoming Reassignment Requests</Title>
      </Col>
    </Row>
        
    <div style={{ overflowX: 'auto', marginTop: 16 }}>
      <Table 
        columns={reassignmentColumns} 
        dataSource={incomingReassignments} 
        rowKey="reassignmentId" 
      />
    </div>
  {hasUpcomingReassignments && (
        <>
            <Row gutter={[16, 16]} style={{ marginTop: 48 }}>
            <Col xs={24} md={12}>
              <Title level={3}>Upcoming Reassignments</Title>
            </Col>
          </Row>
          <div style={{ overflowX: 'auto', marginTop: 16 }}>
          <Table 
            columns={upcomingReassignmentColumns} 
            dataSource={upcomingReassignments} 
            rowKey="reassignmentId" 
            scroll={{ x: 'max-content' }}
          />
            </div>
        </>
      )}

    {hasActiveReassignment && (
        <>
            <Row gutter={[16, 16]} style={{ marginTop: 48 }}>
            <Col xs={24} md={12}>
              <Title level={3}>Active Reassignments</Title>
            </Col>
          </Row>
          <div style={{ overflowX: 'auto', marginTop: 16 }}>
          <Table 
            columns={activeReassignmentColumns} 
            dataSource={activeReassignments} 
            rowKey="reassignmentId" 
            scroll={{ x: 'max-content' }}
          />
            </div>
        </>
      )}
    
    {(hasActiveReassignment && filteredRequests) && (
        <>
          <Row gutter={[16, 16]} style={{ marginTop: 48 }}>
            <Col xs={24} md={12}>
              <Title level={3}>Handle Reassignments</Title>
            </Col>
            <Col xs={24} md={12} style={{ textAlign: 'right' }}>
              <Select
                placeholder="Filter by status"
                style={{ width: '100%', maxWidth: 200, marginBottom: 16 }}
                onChange={(value) => setFilterStatus(value)}
                allowClear
              >
                <Select.Option value={undefined}>All</Select.Option>
                <Select.Option value={Status.PENDING}>Pending</Select.Option>
                <Select.Option value={Status.APPROVED}>Approved</Select.Option>
                <Select.Option value={Status.REJECTED}>Rejected</Select.Option>
              </Select>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} sm={8}>
              <Card bordered={false}>
                <Statistic
                  title="Pending Requests"
                  value={counts.pending}
                  formatter={formatter}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card bordered={false}>
                <Statistic
                  title="Approved Requests"
                  value={counts.approved}
                  formatter={formatter}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card bordered={false}>
                <Statistic
                  title="Rejected Requests"
                  value={counts.rejected}
                  formatter={formatter}
                />
              </Card>
            </Col>
          </Row>

          <div style={{ overflowX: 'auto', marginTop: 16 }}>
            <Table 
              columns={requestColumns} 
              dataSource={filteredRequests} 
              rowKey="requestId" 
              scroll={{ x: 'max-content' }}
            />
          </div>
        </>
      )}

      {/* Reassignment Modal */}
      <Modal
        title="Manage Reassignment"
        open={reassignmentModalVisible}
        onCancel={() => {
          setReassignmentModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width="90%"
        style={{ maxWidth: '600px' }}
      >
        {selectedReassignment && (
          <Form form={form} onFinish={handleFormSubmit}>
            <Descriptions layout="vertical" bordered column={{ xs: 1, sm: 2 }}>
              <Descriptions.Item label="Reassignment Id">
                {selectedReassignment.reassignmentId}
              </Descriptions.Item>
              <Descriptions.Item label="Assigner">
                {selectedReassignment.staffName}
              </Descriptions.Item>
              <Descriptions.Item label="Start Date">
                {formatDate(new Date(selectedReassignment.startDate))}
              </Descriptions.Item>
              <Descriptions.Item label="End Date">
                {formatDate(new Date(selectedReassignment.endDate))}
              </Descriptions.Item>
            </Descriptions>

            <Form.Item name="status" label="Status" rules={[{ required: true }]}>
              <Select>
                <Select.Option value={Action.APPROVE}>Approve</Select.Option>
                <Select.Option value={Action.REJECT}>Reject</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              noStyle
              shouldUpdate={(prevValues, currentValues) =>
                prevValues?.status !== currentValues?.status
              }
            >
              {({ getFieldValue }) =>
                getFieldValue("status") === Action.REJECT ? (
                  <Form.Item
                    name="reason"
                    label="Reason"
                    rules={[
                      {
                        required: true,
                        message: "Please provide a reason for rejection",
                      },
                    ]}
                  >
                    <Input.TextArea />
                  </Form.Item>
                ) : null
              }
            </Form.Item>

            <Form.Item style={{textAlign:'center'}}>
              <Button type="primary" htmlType="submit">
                Save
              </Button>
            </Form.Item>
          </Form>
        )}
      </Modal>

      {/* Request Modal */}
      <Modal
        title="Manage Request"
        open={requestModalVisible}
        onCancel={() => {
          setRequestModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width="90%"
        style={{ maxWidth: '600px' }}
      >
        {selectedRequest && (
          <Form form={form} onFinish={handleFormSubmit}>
            <Descriptions layout="vertical" bordered column={{ xs: 1, sm: 2 }}>
              <Descriptions.Item label="Request Id">
                {selectedRequest.requestId}
              </Descriptions.Item>
              <Descriptions.Item label="Staff Name">
                {selectedRequest.staffName}
              </Descriptions.Item>
              <Descriptions.Item label="Department">
                {selectedRequest.dept}
              </Descriptions.Item>
              <Descriptions.Item label="Applied Date">
                {formatDate(new Date(selectedRequest.requestedDate))}
              </Descriptions.Item>
              <Descriptions.Item label="Request Type">
                {selectedRequest.requestType}
              </Descriptions.Item>
            </Descriptions>

            <Form.Item name="status" label="Status" rules={[{ required: true }]}>
              <Select>
                <Select.Option value={Action.APPROVE}>Approve</Select.Option>
                <Select.Option value={Action.REJECT}>Reject</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              noStyle
              shouldUpdate={(prevValues, currentValues) =>
                prevValues?.status !== currentValues?.status
              }
            >
              {({ getFieldValue }) =>
                getFieldValue("status") === Action.REJECT ? (
                  <Form.Item
                    name="reason"
                    label="Reason"
                    rules={[
                      {
                        required: true,
                        message: "Please provide a reason for rejection",
                      },
                    ]}
                  >
                    <Input.TextArea />
                  </Form.Item>
                ) : null
              }
            </Form.Item>

            <Form.Item style={{textAlign:'center'}}>
              <Button type="primary" htmlType="submit">
                Save
              </Button>
            </Form.Item>
          </Form>
        )}
      </Modal>

      {/* Confirmation Modal */}
      <Modal
        title="Confirm Action"
        open={confirmModalVisible}
        onCancel={() => setConfirmModalVisible(false)}
        footer={[
          <div key="footer-buttons" style={{ display: 'flex', justifyContent: 'center', width: '100%', gap: '16px'}}>
            <Button
              key="submit"
              type="primary"
              onClick={handleConfirmAction}
            >
              Yes
            </Button>
            <Button key="cancel" onClick={() => setConfirmModalVisible(false)}>
              No
            </Button>
          </div>
        ]}
        width="90%"
        style={{ maxWidth: '400px' }}
      >
        <Typography.Text>
          Are you sure you want to{" "}
          {formValues?.status?.toLowerCase() === "approved"
            ? formValues.status.toLowerCase().slice(0, -1)
            : formValues?.status?.toLowerCase() === "rejected"
            ? formValues.status.toLowerCase().slice(0, -2)
            : formValues?.status?.toLowerCase() || "update"} this request?
        </Typography.Text>
      </Modal>
    </List>
  );};