import type { RefineThemedLayoutV2HeaderProps } from "@refinedev/antd";
import { useGetIdentity } from "@refinedev/core";
import {
  Layout as AntdLayout,
  Avatar,
  Space,
  Switch,
  theme,
  Typography,
  Badge,
} from "antd";
import React, { useContext } from "react";
import { ColorModeContext } from "../../contexts/color-mode";
import { usePendingCount } from "@/pages/approve-reject/requestsCount";

import { Button } from "antd";
import {
  AlertOutlined,
  AlertTwoTone,
  DeleteOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const { Text } = Typography;
const { useToken } = theme;

type IUser = {
  id: number;
  name: string;
  avatar: string;
};

export const Header: React.FC<RefineThemedLayoutV2HeaderProps> = ({
  sticky = true,
}) => {
  const { token } = useToken();
  const { data: user } = useGetIdentity<IUser>();
  const { mode, setMode } = useContext(ColorModeContext);
  const navigate = useNavigate(); // Hook to handle navigation
  const count = 1;
  const [pendingCount] = usePendingCount(); // Read the global state

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

  return (
    <AntdLayout.Header style={headerStyles}>
      <Space>
        <Badge count={pendingCount} offset={[-8, 0]}>
          <Button
            type="primary"
            icon={<AlertOutlined />}
            style={{ marginRight: 8 }}
            onClick={() => navigate("/incomingRequests")} // Navigate to the route on click
          >
            Incoming WFH Requests
          </Button>
        </Badge>
        <Space style={{ marginLeft: "8px" }} size="middle">
          {user?.name && <Text strong>{user.name}</Text>}
          {user?.avatar && <Avatar src={user?.avatar} alt={user?.name} />}
        </Space>
        <Switch
          // checkedChildren="🌛"
          // unCheckedChildren="🔆"
          onChange={() => setMode(mode === "dark" ? "light" : "dark")}
          defaultChecked={mode === "dark"}
        />
      </Space>
    </AntdLayout.Header>
  );
};
