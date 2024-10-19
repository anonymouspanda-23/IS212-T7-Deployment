import { Box } from "@chakra-ui/react";
import { AuthPage } from "@refinedev/antd";
import React from "react";

const Login = () => {
  return (
    <AuthPage
      type="login"
      registerLink={false}
      forgotPasswordLink={false}
      wrapperProps={{
        style: {
          background: "#131049",
          color: "white",
        },
      }}
      renderContent={(content: React.ReactNode) => {
        return <Box>{content}</Box>;
      }}
    />
  );
};

export default Login;
