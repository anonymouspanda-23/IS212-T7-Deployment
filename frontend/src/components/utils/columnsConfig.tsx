import React from "react";
import { Tag } from "antd";
import { EmployeeJWT } from "@/interfaces/employee";

export const getColumns = (user: EmployeeJWT | null) => [
  {
    title: "Staff Name",
    dataIndex: "staffName",
    key: "staffName",
    render: (text: string, record: any) => {
      const isCurrentUser = record.staffId === user?.staffId;
      return (
        <span
          style={{
            color: isCurrentUser ? "green" : "inherit",
            fontWeight: isCurrentUser ? "bold" : "normal",
          }}
        >
          {isCurrentUser ? `${text} (ME)` : text}
        </span>
      );
    },
  },
  {
    title: "Manager Name",
    dataIndex: "managerName",
    key: "managerName",
  },
  {
    title: "Department",
    dataIndex: "dept",
    key: "dept",
  },
  {
    title: "Position (Team)",
    dataIndex: "position",
    key: "pos",
  },
  {
    title: "Request Type",
    dataIndex: "requestType",
    key: "requestType",
    render: (requestType: string) => {
      let color = "";
      switch (requestType) {
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
      return <Tag color={color}>{requestType}</Tag>;
    },
  },
  {
    title: "Reason",
    dataIndex: "reason",
    key: "reason",
  },
];