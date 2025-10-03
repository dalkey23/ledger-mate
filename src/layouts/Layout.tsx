import React from "react";
import { Outlet } from "react-router-dom";
import styled from "@emotion/styled";
import Header from "../components/Header";

const Main = styled.main`
  max-width: 1280px;
  margin: 0 auto;
  padding: 16px;
`;

export default function Layout() {
  return (
    <>
      <Header />
      <Main>
        <Outlet />
      </Main>
    </>
  );
}
