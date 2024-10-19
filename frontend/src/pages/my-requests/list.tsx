import { useEffect, useState } from "react";
import { Table, Button, Typography, Tabs, Tag } from "antd";
import axios from "axios";
import { useGetIdentity } from "@refinedev/core";
import { EmployeeJWT } from "@/interfaces/employee";
import { formatDate } from "@/utils/wfh-dateUtils";
import { useCustomNotificationProvider } from "@/components/toast";
import { ModalProvider, useModal } from "@/components/modal";
import { Box } from "@chakra-ui/react";
const backendUrl = import.meta.env.VITE_BACKEND_URL;

const { Title } = Typography;
const { TabPane } = Tabs;

export const MyRequestsContent = () => {
  const { data: user } = useGetIdentity<EmployeeJWT>();
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useCustomNotificationProvider();
  const { openModal, closeModal } = useModal();

  useEffect(() => {
    if (user?.staffId) {
      fetchRequests(user.staffId);
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchRequests = async (staffId: any) => {
    try {
      const response = await axios.get(
        `${backendUrl}/api/v1/getOwnPendingRequests`,
        {
          params: { myId: staffId },
        },
      );
      const ownPendingRequests = response.data.map((request: any) => ({
        date: formatDate(new Date(request.requestedDate)),
        type: request.requestType,
        appliedDate: formatDate(new Date(request.createdAt)),
        reason: request.reason,
        id: request.requestId,
      }));

      setPendingRequests(ownPendingRequests);
    } catch (error) {
      console.error("Error fetching requests:", error);
    }
  };

  const cancelRequest = async (requestId: number) => {
    openModal(
      "Confirm Cancellation",
      <Box textAlign="center">
        <p>Are you sure you want to cancel this request?</p>
      </Box>,
      <Box display="flex" justifyContent="center" mt="4">
        <Button
          style={{
            backgroundColor: "#52c41a",
            borderColor: "#52c41a",
            color: "white",
          }}
          onClick={() => handleCancel(requestId)}
        >
          Yes
        </Button>
        <Button
          type="primary"
          danger
          style={{ marginLeft: "20px" }}
          onClick={() => closeModal()}
        >
          No
        </Button>
      </Box>,
    );
  };

  const handleCancel = async (requestId: number) => {
    try {
      const response = await axios.post(
        `${backendUrl}/api/v1/cancelPendingRequests`,
        {
          staffId: Number(user?.staffId),
          requestId: Number(requestId),
        },
      );

      if (response.status == 200) {
        fetchRequests(user?.staffId); // Refresh the request list after withdrawal
        toast.open({
          message: "Request Cancelled",
          description: "Your request has been cancelled successfully.",
          type: "success",
        });
        closeModal();
      } else {
        toast.open({
          message: "Cancellation Failed",
          description:
            "There was a problem cancelling your request. Please try again.",
          type: "error",
        });
        console.error("Failed to cancel the request.");
      }
    } catch (error) {
      console.error("Error withdrawing request:", error);
    }
  };

  const columns = [
    {
      title: "Requested WFH Dates",
      dataIndex: "date",
      key: "date",
    },
    {
      title: "Request Type",
      dataIndex: "type",
      key: "type",
      render: (type: any) => {
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
      },
    },
    {
      title: "Date Applied",
      dataIndex: "appliedDate",
      key: "appliedDate",
    },
    {
      title: "Reason",
      dataIndex: "reason",
      key: "reason",
    },
    {
      title: "Action",
      key: "action",
      render: (_: any, request: any) => (
        <Button type="primary" danger onClick={() => cancelRequest(request.id)}>
          Cancel
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: "16px" }}>
      <Title level={3} style={{ marginBottom: "20px" }}>
        Status Of My Requests
      </Title>
      <Tabs defaultActiveKey="1">
        <TabPane tab="Pending" key="1">
          <Table
            columns={columns}
            dataSource={pendingRequests}
            pagination={false}
            rowKey={(request) => request.id}
          />
        </TabPane>
        <TabPane tab="Approved" key="2">
          <Table
            columns={columns}
            // dataSource={approvedRequests}
            pagination={false}
            rowKey={(request) => request.id}
          />
        </TabPane>
        <TabPane tab="Rejected" key="3">
          <Table
            columns={columns}
            // dataSource={rejectedRequests}
            pagination={false}
            rowKey={(request) => request.id}
          />
        </TabPane>
      </Tabs>
    </div>
  );
};

export const MyRequests = () => {
  return (
    <ModalProvider>
      <MyRequestsContent />
    </ModalProvider>
  );
};
