import { EmployeeJWT } from "@/interfaces/employee";
import { DataSourceItem } from "@/interfaces/getRequests";
import { List, TagField } from "@refinedev/antd";
import { useGetIdentity } from "@refinedev/core";
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Statistic,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import axios from "axios";
import React, { useEffect, useState } from "react";
import CountUp from "react-countup";
import { usePendingCount } from "./requestsCount";
const backendUrl = import.meta.env.VITE_BACKEND_URL;

const formatter = (value: any) => {
  if (typeof value === "number") {
    return <CountUp end={value} separator="," />;
  }
  return value;
};
export const IncomingList: React.FC = () => {
  const { data: user } = useGetIdentity<EmployeeJWT>();
  const [dataSource, setDataSource] = useState<DataSourceItem[]>([]);
  const [filteredData, setFilteredData] = useState<DataSourceItem[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentPost, setCurrentPost] = useState<DataSourceItem | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | undefined>(
    undefined,
  );
  const [description, setDescription] = useState<string>("");
  const [showDescription, setShowDescription] = useState<boolean>(false);
  const [selectedStatus, setSelectedStatus] = useState(currentPost?.status);
  const { pendingCount, fetchPendingRequests } = usePendingCount();

  const fetchRequests = async (staffId: any) => {
    try {
      const response = await axios.get(
        `${backendUrl}/api/v1/getAllSubordinatesRequests`,
        {
          headers: { id: staffId },
        },
      );

      if (response.data.length === 0) {
        return;
      }

      const StatusMap: any = {
        PENDING: "Pending",
        APPROVED: "Approved",
        REJECTED: "Rejected",
        EXPIRED: "Expired",
        WITHDRAWN: "Withdrawn",
        REVOKED: "Revoked",
        CANCELLED: "Cancelled"
      };

      const pendingRequests = response.data.map((request: any) => ({
        id: request.staffId,
        name: request.staffName,
        email: `${request.staffName}@example.com`,
        role: request.requestType,
        date: new Date(request.requestedDate).toLocaleDateString(),
        department: request.dept,
        status: StatusMap[request.status],
        reportingManager: request.reportingManager,
        requestId: request.requestId,
        staffId: request.staffId,
        reason: request.reason
      }));

      setDataSource(pendingRequests);
      setFilteredData(pendingRequests);
    } catch (error) {
      console.error("Error fetching requests:", error);
    }
  };

  useEffect(() => {
    const staffId = user?.staffId;
    if (staffId) {
      fetchRequests(staffId);
    }
  }, [user?.staffId]);

  useEffect(() => {
    if (filterStatus) {
      setFilteredData(
        dataSource.filter((post) => post.status === filterStatus),
      );
    } else {
      setFilteredData(dataSource);
    }
  }, [filterStatus, dataSource]);

  useEffect(() => {
    setSelectedStatus(currentPost?.status);
  }, [currentPost]);

  const handleStatusChange = (value: string) => {
    setSelectedStatus(value);
    setShowDescription(value === "Rejected" || value === "Revoked");
  };

  const getStatusCounts = () => {
    if (!Array.isArray(dataSource)) {
      console.error("dataSource is not an array:", dataSource);
      return {
        pending: 0,
        approved: 0,
        expired: 0,
        rejected: 0,
        withdrawn: 0,
        revoked: 0,
        cancelled: 0
      };
    }

    return {
      pending: dataSource.filter(
        (post) => post.status.toLowerCase() === "pending",
      ).length,
      approved: dataSource.filter(
        (post) => post.status.toLowerCase() === "approved",
      ).length,
      expired: dataSource.filter(
        (post) => post.status.toLowerCase() === "expired",
      ).length,
      rejected: dataSource.filter(
        (post) => post.status.toLowerCase() === "rejected",
      ).length,
      revoked: dataSource.filter(
        (post) => post.status.toLowerCase() === "revoked",
      ).length,
      withdrawn: dataSource.filter(
        (post) => post.status.toLowerCase() === "withdrawn",
      ).length,
      cancelled: dataSource.filter(
        (post) => post.status.toLowerCase() === "cancelled",
      ).length,
    };
  };

  const counts = getStatusCounts();

  const handleEditClick = (post: any) => {
    setCurrentPost(post);
    setDescription("");
    setShowDescription(false);
    setModalVisible(true);
  };

  const handleModalClose = () => {
    setModalVisible(false);
    setCurrentPost(null);
    setDescription("");
  };

  const handleSave = async (values: any) => {
    const updatedPost = {
      ...currentPost,
      ...values,
      description: description || undefined,
    };
    try {
      const confirmAction = async () => {
        if (values.status === "Approved") {
          await axios.post(`${backendUrl}/api/v1/approveRequest`, {
            requestId: currentPost?.requestId,
            performedBy: currentPost?.reportingManager,
          });
          message.success("Request approved successfully");
        } else if (values.status === "Rejected") {
          await axios.post(`${backendUrl}/api/v1/rejectRequest`, {
            requestId: currentPost?.requestId,
            performedBy: currentPost?.reportingManager,
            reason: description,
          });
          message.success("Request has been rejected");
        } else if (values.status === "Revoked") {
          await axios.post(`${backendUrl}/api/v1/revokeRequest`, {
            requestId: currentPost?.requestId,
            performedBy: currentPost?.reportingManager,
            reason: description,
          });
          message.success("Request revoked successfully");
        }

        await fetchRequests(user?.staffId);

        const updatedDataSource = dataSource.map((post) =>
          post.requestId === currentPost?.requestId
            ? {
                ...updatedPost,
                status:
                  values.status === "Approved"
                    ? "Approved"
                    : values.status === "Rejected"
                      ? "Rejected"
                      : values.status === "Revoked"
                        ? "Revoked"
                        : post.status,
              }
            : post,
        );

        setDataSource(updatedDataSource);
        setFilteredData(
          updatedDataSource.filter(
            (post) => !filterStatus || post.status === filterStatus,
          ),
        );
      };

      Modal.confirm({
        title: `Confirm ${values.status}`,
        content: `Are you sure you want to ${values.status.toLowerCase()} this request?`,
        onOk: confirmAction,
      });
    } catch (error) {
      console.error("Error processing request:", error);
      message.error(`Error ${values.status.toLowerCase()}ing request.`);
    }

    setModalVisible(false);
    setCurrentPost(null);
    setDescription("");
    setShowDescription(false);
    await fetchPendingRequests();
  };

  return (
    <List>
      
      <Typography.Title level={5}>Approve/Reject WFH Requests</Typography.Title>
          <Row gutter={[16, 16]}>
        {[
          { title: "Pending", value: counts.pending, color: "lightblue" },
          { title: "Approved", value: counts.approved },
          { title: "Rejected", value: counts.rejected },
          { title: "Expired", value: counts.expired },
          { title: "Withdrawn", value: counts.withdrawn },
          { title: "Revoked", value: counts.revoked },
        ].map((item, index) => (
          <Col xs={12} sm={8} md={8} lg={4} key={index}>
            <Card bordered={index === 0} style={index === 0 ? { borderColor: item.color } : {}}>
              <Statistic title={item.title} value={item.value} formatter={formatter} />
            </Card>
          </Col>
        ))}
      </Row>
      
      
      <Select
        placeholder="Filter by status"
        style={{ width: 200, marginBottom: 16, float: "right", marginTop: 50 }}
        onChange={(value) => setFilterStatus(value)}
        defaultValue={"All"}
        allowClear
      >
        <Select.Option value={undefined}>All</Select.Option>
        <Select.Option value="Pending">Pending</Select.Option>
        <Select.Option value="Approved">Approved</Select.Option>
        <Select.Option value="Expired">Expired</Select.Option>
        <Select.Option value="Rejected">Rejected</Select.Option>
        <Select.Option value="Withdrawn">Withdrawn</Select.Option>
        <Select.Option value="Revoked">Revoked</Select.Option>
      </Select>

        
      <Table dataSource={filteredData} rowKey="requestId" pagination={false} scroll={{ x: 'max-content' }}>
        <Table.Column dataIndex="requestId" title="Request ID." />
        <Table.Column dataIndex="name" title="Staff Name" />
        <Table.Column dataIndex="department" title="Department/Team" />
        <Table.Column dataIndex="date" title="WFH Date" />
        <Table.Column dataIndex="role" title="Request Type"  render={(type: any) => {
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
          }} />
        <Table.Column dataIndex="reason" title="Reason"/>
        
        <Table.Column
          dataIndex="status"
          title="Status"
          render={(value: string) => (
            <TagField
              value={value}
              color={
                value === "Pending"
                  ? "blue"
                  : value === "Approved"
                    ? "green"
                    : value === "Expired"
                      ? "grey"
                      : value === "Withdrawn"
                        ? "orange"
                        : value === "Rejected"
                          ? "red"
                          : "pink"
              }
            />
          )}
        />
        <Table.Column
          dataIndex="action"
          title="Action"
          render={(value: string, record: any) =>
            record.status === "Approved" || record.status === "Pending" ? (
              <Button onClick={() => handleEditClick(record)}>
                {record.status === "Pending" ? "Edit" : "Revoke"}
              </Button>
            ) : (
              <TagField value="Not-editable" color="grey" />
            )
          }
        />
      </Table>

      <Modal
        title={
          currentPost?.status === "Pending"
            ? "Approve/Reject"
            : "Revoke Approved Request"
        }
        open={modalVisible}
        onCancel={handleModalClose}
        footer={null}
        key={currentPost ? currentPost.id : "modal"}
        width="90%"
        style={{ maxWidth: "600px" }}
      >
        {currentPost && (
          <Form
            initialValues={{
              title: currentPost.name,
              email: currentPost.email,
              reason: currentPost.reason,
              status: currentPost.status,
            }}
            onFinish={handleSave}
          >
            <Form.Item label="Title" name="title">
              <Input disabled />
            </Form.Item>
            <Form.Item label="Email" name="email">
              <Input disabled />
            </Form.Item>
            <Form.Item
              label="Status"
              name="status"
              rules={[{ required: true, message: "Status is required" }]}
            >
              <Select onChange={handleStatusChange}>
                {currentPost.status === "Pending" && (
                  <>
                    <Select.Option value="Pending">Pending</Select.Option>
                    <Select.Option value="Approved">Approve</Select.Option>
                    <Select.Option value="Rejected">Reject</Select.Option>
                  </>
                )}
                {currentPost.status === "Approved" && (
                  <>
                    <Select.Option value="Approved">Approve</Select.Option>
                    <Select.Option value="Revoked">Revoke</Select.Option>
                  </>
                )}
              </Select>
            </Form.Item>
            {showDescription && (
              <Form.Item
                label="Reason"
                name="description"
                rules={[
                  {
                    required: showDescription,
                    message: "Reason is required.",
                  },
                ]}
              >
                <Input.TextArea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </Form.Item>
            )}
            <Form.Item  style={{ textAlign: "center" }}>
              <Button
                type="primary"
                danger={currentPost.status === "Approved"}
                htmlType="submit"
                disabled={
                  (currentPost.status === "Pending" ||
                    currentPost.status === "Approved") &&
                  selectedStatus === currentPost.status
                }
              >
                {currentPost.status === "Pending" ? "Save" : "Revoke"}
              </Button>
            </Form.Item>
          </Form>
        )}
      </Modal>
    </List>
  );
};
