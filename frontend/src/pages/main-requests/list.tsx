
import React from 'react';
import { Tabs } from 'antd';
import { IncomingList } from '../approve-reject'; 
import { ManageWithdrawals } from '../manage-withdrawals/list';
import { HandleReassignments } from '../handle-reassignments';

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
        <HandleReassignments/>
      </TabPane>
    </Tabs>
  );
};
