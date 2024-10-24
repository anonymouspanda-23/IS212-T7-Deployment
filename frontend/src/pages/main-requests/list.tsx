// Main.tsx
import { Tabs } from "antd";
import React from "react";
import { IncomingList } from "../approve-reject"; // Ensure this path is correct based on your project structure
import { ManageWithdrawals } from "../manage-withdrawals/list";
const { TabPane } = Tabs;

export const MainRequests: React.FC = () => {
  return (
    <Tabs defaultActiveKey="1">
      <TabPane tab="Approve or Reject Requests" key="1">
        <IncomingList />
      </TabPane>
      <TabPane tab="Manage Withdrawals" key="2">
        <ManageWithdrawals />
      </TabPane>
      <TabPane tab="Reassignment Requests" key="3">
        {/* Add the Reassignment Requests component here */}
        <div>Reassignment Requests Component</div>
      </TabPane>
    </Tabs>
  );
};
