import type { RefineThemedLayoutV2HeaderProps } from "@refinedev/antd";
import { useGetIdentity } from "@refinedev/core";
import {
  Layout as AntdLayout,
  Avatar,
  Space,
  Switch,
  theme,
  Typography,
  Badge, Dropdown
} from "antd";
import React, { useContext, useEffect, useMemo, useState } from "react";
import { ColorModeContext } from "../../contexts/color-mode";
import { usePendingCount } from "@/pages/approve-reject/requestsCount";
import { usePendingWithdrawalsCount } from "@/pages/manage-withdrawals/requestsCount";
import { useReassignmentsCounts } from "@/pages/handle-reassignments/requestsCount";
import { Button } from "antd";
import { AlertOutlined, MenuOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const { Text } = Typography;
const { useToken } = theme;

type IUser = {
  id: number;
  name: string;
  avatar: string;
  role: number;
};

export const Header: React.FC<RefineThemedLayoutV2HeaderProps> = ({
  sticky = true,
}) => {
  const { token } = useToken();
  const { data: user } = useGetIdentity<IUser>();
  const { mode, setMode } = useContext(ColorModeContext);
  const navigate = useNavigate(); // Hook to handle navigation
  const { pendingCount } = usePendingCount();
  const { pendingWithdrawalsCount } = usePendingWithdrawalsCount();
  const { totalPendingCount } = useReassignmentsCounts();
  const cutoff = 992;

  const [isMobile, setIsMobile] = useState(window.innerWidth <= cutoff);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= cutoff);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const headerStyles: React.CSSProperties = {
    backgroundColor: "transparent",
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    padding: "0px 24px",
    height: "64px",
  };

  if (sticky) {
    headerStyles.position = "sticky";
    headerStyles.top = 0;
    headerStyles.zIndex = 1;
  }

  const totalCount = useMemo(() => {
    return pendingCount + pendingWithdrawalsCount + totalPendingCount;
  }, [pendingCount, pendingWithdrawalsCount, totalPendingCount]);

  const menuItems = [
    {
      key: '1',
      label: (
        <div hidden={user?.role == 2}>
          <Badge count={totalCount} offset={[-8, 0]}>
            <Button
              type="primary"
              icon={<AlertOutlined />}
              onClick={() => navigate("/mainRequests")}
            >
              Incoming Requests
            </Button>
          </Badge>
        </div>
      ),
    },
    {
      key: '2',
      label: (
        <Switch
          checkedChildren="🌛"
          unCheckedChildren="🔆"
          onChange={() => setMode(mode === "dark" ? "light" : "dark")}
          defaultChecked={mode === "dark"}
        />
      ),
    },
  ];

  return (
    <AntdLayout.Header style={headerStyles}>
      { isMobile ? (
        <Space>
          <Space style={{ marginLeft: "8px" }} size="middle">
            {user?.name && <Text strong>{user.name}</Text>}
            {user?.avatar && <Avatar src={user?.avatar} alt={user?.name} />}
          </Space>
          <Badge count={totalCount} offset={[0, 0]}>
            <Dropdown menu={{ items: menuItems }} trigger={['click']}>
              <Button icon={<MenuOutlined />} />
            </Dropdown>
          </Badge>
        </Space>
      ) : (
        <Space>

          <div hidden={user?.role == 2}>
            <Badge count={totalCount} offset={[-8, 0]}>
              <Button
                type="primary"
                icon={<AlertOutlined />}
                style={{ marginRight: 8 }}
                onClick={() => navigate("/mainRequests")} // Navigate to the route on click
              >
                Incoming Requests
              </Button>
            </Badge>
          </div>

          <Space style={{ marginLeft: "8px" }} size="middle">
            {user?.name && <Text strong>{user.name}</Text>}
            {user?.avatar && <Avatar src={user?.avatar} alt={user?.name} />}
          </Space>
          <Switch
            checkedChildren="🌛"
            unCheckedChildren="🔆"
            onChange={() => setMode(mode === "dark" ? "light" : "dark")}
            defaultChecked={mode === "dark"}
          />
        </Space>
      ) }
    </AntdLayout.Header>
  );
};
