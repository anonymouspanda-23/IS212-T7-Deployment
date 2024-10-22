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
} from "antd";
import axios from "axios";
import { formatDate } from "@/utils/wfh-dateUtils";
import React, { useEffect, useState } from "react";
import CountUp from "react-countup";
import { useCustomNotificationProvider } from "@/components/toast";

const backendUrl = import.meta.env.VITE_BACKEND_URL;
const { Title } = Typography;

const formatter = (value: any) => {
  if (typeof value === "number") {
    return <CountUp end={value} separator="," />;
  }
  return value;
};

export const ManageWithdrawals: React.FC = () => {
  const { data: user } = useGetIdentity<EmployeeJWT>();
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState<string | undefined>(undefined);
  const toast = useCustomNotificationProvider();

  // Modal states
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<any>(null);
  const [formValues, setFormValues] = useState<any>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    if (user?.staffId) {
      fetchWithdrawals(user.staffId);
    }
  }, [user?.staffId]);

  const fetchWithdrawals = async (staffId: string) => {
    try {
      const response = await axios.get(
        `${backendUrl}/api/v1/getSubordinatesWithdrawalRequests`,
        { headers: { id: staffId } }
      );
      setWithdrawals(response.data);
      setFilteredData(response.data);
      
    } catch (error) {
      console.error("Error fetching withdrawals:", error);
      toast.open({
        message: "Error",
        description: "Failed to fetch withdrawals.",
        type: "error",
      });
    }
  };

  useEffect(() => {
    if (filterStatus) {
      setFilteredData(withdrawals.filter((w) => w.status === filterStatus));
    } else {
      setFilteredData(withdrawals);
    }
  }, [filterStatus, withdrawals]);

  const getStatusCounts = () => ({
    pending: withdrawals.filter((w) => w.status === "PENDING").length,
    approved: withdrawals.filter((w) => w.status === "APPROVED").length,
    rejected: withdrawals.filter((w) => w.status === "REJECTED").length,
  });

  const handleEditClick = (withdrawal: any) => {
    setSelectedWithdrawal(withdrawal);
    form.setFieldsValue({ status: withdrawal.status });
    setEditModalVisible(true);
  };

  const handleEditSubmit = async (values: any) => {
    setFormValues(values);
    setEditModalVisible(false);
    setConfirmModalVisible(true);
  };

  const handleConfirmAction = async () => {
    if (!formValues || !selectedWithdrawal || !user?.staffId) return;

    try {
      let response;
      const basePayload = {
        performedBy: user.staffId,
        withdrawalId: selectedWithdrawal.withdrawalId,
      };

      if (formValues.status === "APPROVED") {
        response = await axios.post(
          `${backendUrl}/api/v1/approveWithdrawalRequest`,
          {
            ...basePayload
          }
        );
      } else if (formValues.status === "REJECTED") {
        response = await axios.post(
          `${backendUrl}/api/v1/rejectWithdrawalRequest`,
          {
            ...basePayload,
            reason: formValues.reason,
          }
        );
      }

      if (response?.status === 200) {
        const updatedWithdrawals = withdrawals.map((withdrawal) =>
          withdrawal.id === selectedWithdrawal.id
            ? {
                ...withdrawal,
                status: formValues.status,
              }
            : withdrawal
        );

        setWithdrawals(updatedWithdrawals);
        setFilteredData(
          updatedWithdrawals.filter(
            (withdrawal) => !filterStatus || withdrawal.status === filterStatus
          )
        );
      

        toast.open({
          message: "Success",
          description: `Withdrawal has been ${formValues.status.toLowerCase()} successfully.`,
          type: "success",
        });
      } else {
        throw new Error("Request not modified");
      }
    } catch (error) {
      console.error("Error updating withdrawal:", error);
      toast.open({
        message: "Error",
        description: "Failed to update withdrawal status.",
        type: "error",
      });
    } finally {
      setConfirmModalVisible(false);
      setSelectedWithdrawal(null);
      setFormValues(null);
      form.resetFields();
    }
  };

  const columns = [
    { title: "Withdrawal Id", dataIndex: "withdrawalId", key: "withdrawalId" },
    { title: "Staff Name", dataIndex: "staffName", key: "staffName" },
    { title: "Department/Team", dataIndex: "dept", key: "dept"},
    {
      title: "WFH Date",
      dataIndex: "requestedDate",
      key: "requestedDate",
      render: (dateString: string) => formatDate(new Date(dateString)),
    },
    { title: "Request Type", dataIndex: "requestType", key: "requestType" },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => <TagField 
      value={status} 
      color={
        status === "PENDING"
          ? "blue"
          : status === "APPROVED"
            ? "green"
                : status === "REJECTED"
                  ? "red"
                  : "pink"
      } />,
    },
    {
      title: "Action",
      key: "action",
      render: (_: any, record: any) => (
        <Button onClick={() => handleEditClick(record)} disabled={record.status === "APPROVED"}>Edit</Button>
      ),
    },
  ];

  const counts = getStatusCounts();

  return (
    <List>
      <Title level={3}>Manage Withdrawals</Title>

      <Row gutter={16}>
        <Col span={8}>
          <Card bordered={false}>
            <Statistic
              title="Pending Withdrawals"
              value={counts.pending}
              formatter={formatter}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card bordered={false}>
            <Statistic
              title="Approved Withdrawals"
              value={counts.approved}
              formatter={formatter}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card bordered={false}>
            <Statistic
              title="Rejected Withdrawals"
              value={counts.rejected}
              formatter={formatter}
            />
          </Card>
        </Col>
      </Row>

      <Select
        placeholder="Filter by status"
        style={{ width: 200, marginBottom: 16,  float: "right", marginTop: 50}}
        onChange={(value) => setFilterStatus(value)}
        allowClear
      >
        <Select.Option value={undefined}>All</Select.Option>
        <Select.Option value="PENDING" >Pending</Select.Option>
        <Select.Option value="APPROVED">Approved</Select.Option>
        <Select.Option value="REJECTED">Rejected</Select.Option>
      </Select>

      <Table columns={columns} dataSource={filteredData} rowKey="id" />

     
      <Modal
        title="Manage Withdrawal"
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          form.resetFields();
        }}
        footer={null}
      >
        {selectedWithdrawal && (
          <Form form={form} onFinish={handleEditSubmit}>
            <Descriptions layout="vertical" bordered>
              <Descriptions.Item label="Withdrawal Id">
                {selectedWithdrawal.withdrawalId}
              </Descriptions.Item>
              <Descriptions.Item label="Staff Name">
                {selectedWithdrawal.staffName}
              </Descriptions.Item>
              <Descriptions.Item label="WFH Date">
                {formatDate(new Date(selectedWithdrawal.requestedDate))}
              </Descriptions.Item>
              <Descriptions.Item label="Request Type">
                {selectedWithdrawal.requestType}
              </Descriptions.Item>
            </Descriptions>

            <Form.Item name="status" label="Status" rules={[{ required: true }]}>
              <Select>
                <Select.Option value="APPROVED">Approve</Select.Option>
                <Select.Option value="REJECTED">Reject</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              noStyle
              shouldUpdate={(prevValues, currentValues) =>
                prevValues?.status !== currentValues?.status
              }
            >
              {({ getFieldValue }) =>
                getFieldValue("status") === "REJECTED" ? (
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

            <Form.Item>
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
            <Button key="cancel"  onClick={() => setConfirmModalVisible(false)}>
            No
          </Button>
          </div>
        ]}
      >
        <Typography.Text>
          Are you sure you want to{" "}
          {formValues?.status?.toLowerCase() === "approved"
            ? formValues.status.toLowerCase().slice(0, -1)
            : formValues?.status?.toLowerCase() === "rejected"
            ? formValues.status.toLowerCase().slice(0, -2)
            : formValues?.status?.toLowerCase() || "update"} this withdrawal?
        </Typography.Text>
      </Modal>
    </List>
  );
};

