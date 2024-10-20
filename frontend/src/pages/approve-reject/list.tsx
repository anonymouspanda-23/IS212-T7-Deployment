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
  Typography,
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
  const [, setPendingCount] = usePendingCount();
  const [filterStatus, setFilterStatus] = useState<string | undefined>(
    undefined,
  );
  const [description, setDescription] = useState<string>(""); // New state for description
  const [showDescription, setShowDescription] = useState<boolean>(false); // New state for description visibility

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
      };

      const pendingRequests = response.data.map((request: any) => ({
        id: request.staffId,
        name: request.staffName,
        email: `${request.staffName}@example.com`, // Assuming email can be derived or added
        role: request.requestType,
        date: new Date(request.requestedDate).toLocaleDateString(),
        department: request.dept,
        status: StatusMap[request.status],
        reportingManager: request.reportingManager,
        requestId: request.requestId,
        staffId: request.staffId,
      }));

      // Update the global count of pending requests
      const pendingCount = pendingRequests.filter(
        (request: { status: string; }) => request.status === "Pending",
      ).length;

      setPendingCount(pendingCount);
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
  }, [user?.staffId]); // Dependency array includes staffId to re-fetch when it changes

  // Filter data based on selected status
  useEffect(() => {
    if (filterStatus) {
      setFilteredData(
        dataSource.filter((post) => post.status === filterStatus),
      );
    } else {
      setFilteredData(dataSource);
    }
  }, [filterStatus, dataSource]);

  // Function to calculate the count of requests based on status
  const getStatusCounts = () => {
    if (!Array.isArray(dataSource)) {
      console.error("dataSource is not an array:", dataSource);
      return {
        pending: 0,
        approved: 0,
        expired: 0,
        rejected: 0,
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
    };
  };

  const counts = getStatusCounts(); // Get the current counts for each status

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
      // Check if the status is "Approved" or "Rejected"
      if (values.status === "Approved") {
        const response = await axios.post(
          `${backendUrl}/api/v1/approveRequest`,
          {
            requestId: currentPost?.requestId,
            performedBy: currentPost?.reportingManager,
          },
        );
      } else if (values.status === "Rejected") {
        const response = await axios.post(
          `${backendUrl}/api/v1/rejectRequest`,
          {
            requestId: currentPost?.requestId,
            performedBy: currentPost?.reportingManager,
            reason: description,
          },
        );
      }

      // Re-fetch requests to get the latest status after approval or rejection
      await fetchRequests(user?.staffId); // Await this to ensure the data is fetched before updating state

      // Update the current post status
      const updatedDataSource = dataSource.map((post) =>
        post.requestId === currentPost?.requestId // Use requestId for matching
          ? {
              ...updatedPost,
              status: values.status === "Approved" ? "Approved" : "Rejected",
            }
          : post,
      );

      // Update state to show the new data in the table
      setDataSource(updatedDataSource);
      setFilteredData(
        updatedDataSource.filter(
          (post) => !filterStatus || post.status === filterStatus,
        ),
      );
    } catch (error) {
      console.error("Error processing request:", error);
    }

    // Close the modal and reset state
    setModalVisible(false);
    setCurrentPost(null);
    setDescription("");
    setShowDescription(false);
  };

  return (
    <List>
      <Typography.Title level={3}>Approve/Reject WFH Requests</Typography.Title>

      {/* Row for Animated Status Counts */}
      <Row gutter={16}>
        <Col span={6}>
          <Card bordered={true} style={{ borderColor: "lightblue" }}>
            <Statistic
              title="Pending"
              value={counts.pending}
              formatter={formatter}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false}>
            <Statistic
              title="Approved"
              value={counts.approved}
              formatter={formatter}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false}>
            <Statistic
              title="Expired"
              value={counts.expired}
              formatter={formatter}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false}>
            <Statistic
              title="Rejected"
              value={counts.rejected}
              formatter={formatter}
            />
          </Card>
        </Col>
      </Row>

      {/* Filter by status */}
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
      </Select>

      {/* Table */}
      <Table dataSource={filteredData} rowKey="requestId" pagination={false}>
        <Table.Column dataIndex="requestId" title="Request ID." />
        <Table.Column dataIndex="name" title="Name" />
        <Table.Column dataIndex="email" title="Email" />
        <Table.Column dataIndex="department" title="Department/Team" />
        <Table.Column dataIndex="date" title="Applied Date" />
        <Table.Column dataIndex="role" title="WFH Duration" />
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
                      ? "red"
                      : "orange"
              }
            />
          )}
        />
        <Table.Column
          dataIndex="action"
          title="Action"
          render={(value: string, record: any) =>
            record.status === "Pending" ? (
              <Button onClick={() => handleEditClick(record)}>Edit</Button>
            ) : (
              <TagField value="Not-editable" color="grey" />
            )
          }
        />
      </Table>

      {/* Modal for Editing */}
      <Modal
        title="Approve/Reject"
        open={modalVisible}
        onCancel={handleModalClose}
        footer={null}
        key={currentPost ? currentPost.id : "modal"}
      >
        {currentPost && (
          <Form
            initialValues={{
              title: currentPost.name,
              email: currentPost.email,
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
              <Select
                onChange={(value) => setShowDescription(value === "Rejected")}
              >
                <Select.Option value="Pending">Pending</Select.Option>
                <Select.Option value="Approved">Approved</Select.Option>
                <Select.Option value="Rejected">Rejected</Select.Option>
              </Select>
            </Form.Item>
            {showDescription && (
              <Form.Item
                label="Description"
                name="description"
                rules={[
                  {
                    required: showDescription,
                    message: "Description is required for rejected status.",
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
            <Form.Item>
              <Button type="primary" htmlType="submit">
                Save
              </Button>
            </Form.Item>
          </Form>
        )}
      </Modal>
    </List>
  );
};
