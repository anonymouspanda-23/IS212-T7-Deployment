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
import { Status } from "@/helper/requestLogsVar";

const { Title } = Typography;
const { TabPane } = Tabs;

export const MyRequestsContent = () => {
  const { data: user } = useGetIdentity<EmployeeJWT>();
  const [pendingRequests, setPendingRequests] = useState([]);
  const [approvedRequests, setApprovedRequests] = useState([]);
  const [rejectedRequests, setRejectedRequests] = useState([]);
  const [withdrawnRequests, setWithdrawnRequests] = useState([]);
  const [revokedRequests, setRevokedRequests] = useState([]);
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
      const pendingResponse = await axios.get(
        `${backendUrl}/api/v1/getOwnPendingRequests`,
        { params: { myId: staffId } },
      );

      const ownPendingRequests = pendingResponse.data.map((request: any) => ({
        date: formatDate(new Date(request.requestedDate)),
        type: request.requestType,
        appliedDate: formatDate(new Date(request.createdAt)),
        reason: request.reason,
        id: request.requestId,
        status: "PENDING",
        initiatedWithdrawal: request.initiatedWithdrawal,
      }));

      setPendingRequests(ownPendingRequests);

      const scheduleResponse = await axios.get(
        `${backendUrl}/api/v1/getMySchedule`,
        { params: { myId: staffId } },
      );

      const approved = scheduleResponse.data
        .filter((request: any) => request.status === Status.APPROVED)
        .map((request: any) => ({
          date: formatDate(new Date(request.requestedDate)),
          type: request.requestType,
          appliedDate: formatDate(new Date(request.createdAt)),
          reason: request.reason,
          id: request.requestId,
          status: "APPROVED",
          initiatedWithdrawal: request.initiatedWithdrawal,
        }));

      const rejected = scheduleResponse.data
        .filter((request: any) => request.status === Status.REJECTED)
        .map((request: any) => ({
          date: formatDate(new Date(request.requestedDate)),
          type: request.requestType,
          appliedDate: formatDate(new Date(request.createdAt)),
          reason: request.reason,
          id: request.requestId,
          status: "REJECTED",
          initiatedWithdrawal: request.initiatedWithdrawal,
        }));

      const withdrawn = scheduleResponse.data
        .filter((request: any) => request.status === Status.WITHDRAWN)
        .map((request: any) => ({
          date: formatDate(new Date(request.requestedDate)),
          type: request.requestType,
          appliedDate: formatDate(new Date(request.createdAt)),
          reason: request.reason,
          id: request.requestId,
          status: "WITHDRAWN",
          initiatedWithdrawal: request.initiatedWithdrawal,
        }));

      const revoked = scheduleResponse.data
        .filter((request: any) => request.status === Status.REVOKED)
        .map((request: any) => ({
          date: formatDate(new Date(request.requestedDate)),
          type: request.requestType,
          appliedDate: formatDate(new Date(request.createdAt)),
          reason: request.reason,
          id: request.requestId,
          status: "REVOKED",
          initiatedWithdrawal: request.initiatedWithdrawal,
        }));

      setApprovedRequests(approved);
      setRejectedRequests(rejected);
      setWithdrawnRequests(withdrawn);
      setRevokedRequests(revoked);
    } catch (error) {
      toast.open({
        message: "Error",
        description: "Error fetching requests:",
        type: "error",
      });
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
        fetchRequests(user?.staffId);
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
        toast.open({
          message: "Error",
          description: "Failed to cancel request",
          type: "error",
        });
      }
    } catch (error) {
      toast.open({
        message: "Error",
        description: "Error cancelling requests:",
        type: "error",
      });
    }
  };

  const confirmWithdraw = async (requestId: number) => {
    openModal(
      "Confirm Withdrawal",
      <Box textAlign="center">
        <p>Are you sure you want to withdraw this request?</p>
      </Box>,
      <Box display="flex" justifyContent="center" mt="4">
        <Button
          style={{
            backgroundColor: "#52c41a",
            borderColor: "#52c41a",
            color: "white",
          }}
          onClick={() => handleWithdraw(requestId)}
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

  const handleWithdraw = async (requestId: number) => {
    try {
      const response = await axios.post(
        `${backendUrl}/api/v1/withdrawRequest`,
        {
          requestId,
        },
      );

      if (response.status === 200) {
        fetchRequests(user?.staffId);
        toast.open({
          message: "Request Withdrawn",
          description: "Your request has been successfully withdrawn.",
          type: "success",
        });
        closeModal();
      } else {
        toast.open({
          message: "Withdrawal Failed",
          description:
            "There was an issue withdrawing your request. Please try again.",
          type: "error",
        });
      }
    } catch (error) {
      toast.open({
        message: "Error",
        description: "An error occurred while withdrawing your request.",
        type: "error",
      });
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
      render: (_: any, request: any, index: number) => {
        if (request.status === Status.PENDING) {
          return (
            <Button
              type="primary"
              danger
              onClick={() => cancelRequest(request.id)}
            >
              Cancel
            </Button>
          );
        } else if (request.status === Status.APPROVED) {
          return (
            <Button
              type="primary"
              onClick={() => confirmWithdraw(request.id)}
            ></Button>
          );
        }
        return null;
      },
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
            columns={columns.map((col) =>
              col.key === "action"
                ? {
                    ...col,
                    render: (_: any, request: any) => {
                      if (request.initiatedWithdrawal) {
                        return (
                          <Button type="primary" disabled>
                            Pending Withdrawal
                          </Button>
                        );
                      } else {
                        return (
                          <Button
                            type="primary"
                            onClick={() => confirmWithdraw(request.id)}
                          >
                            Withdraw
                          </Button>
                        );
                      }
                    },
                  }
                : col,
            )}
            dataSource={approvedRequests}
            pagination={false}
            rowKey={(request) => request.id}
          />
        </TabPane>
        <TabPane tab="Rejected" key="3">
          <Table
            columns={columns.map((col) =>
              col.key === "action" ? { ...col, render: () => null } : col,
            )}
            dataSource={rejectedRequests}
            pagination={false}
            rowKey={(request) => request.id}
          />
        </TabPane>{" "}
        <TabPane tab="Withdrawn" key="4">
          <Table
            columns={columns.map((col) =>
              col.key === "action" ? { ...col, render: () => null } : col,
            )}
            dataSource={withdrawnRequests}
            pagination={false}
            rowKey={(request) => request.id}
          />
        </TabPane>{" "}
        <TabPane tab="Revoked" key="5">
          <Table
            columns={columns.map((col) =>
              col.key === "action" ? { ...col, render: () => null } : col,
            )}
            dataSource={revokedRequests}
            pagination={false}
            rowKey={(request) => request.id}
          />
        </TabPane>{" "}
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
