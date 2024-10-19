import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import { ConfigProvider } from 'antd';
import { BrowserRouter } from 'react-router-dom';
import { Refine } from "@refinedev/core";
import dataProvider from "@refinedev/simple-rest";

const AllProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <BrowserRouter>
      <Refine dataProvider={dataProvider("")}>
        <ConfigProvider>
          <ChakraProvider>
            {children}
          </ChakraProvider>
        </ConfigProvider>
      </Refine>
    </BrowserRouter>
  );
};

const customRender = (ui: React.ReactElement, options?: RenderOptions) =>
  render(ui, { wrapper: AllProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };
