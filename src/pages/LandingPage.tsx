import React from "react";
import { Link } from "react-router-dom";
import styled from "@emotion/styled";
import { Container } from "../components/Container";
import { Card } from "../components/Card";

const Title = styled.h1` margin: 0 0 8px; font-size: 40px; letter-spacing: -0.02em; `;

const LandingPage: React.FC = () => {
  return (
    <Container>
      <Card>
        <Title>LedgerMate</Title>
        <div style={{ display: "flex", gap: 12 }}>
          <Link to="/upload">엑셀 업로드</Link>
          <Link to="/records">내역 확인</Link>
        </div>
      </Card>
    </Container>

  );
};

export default LandingPage;
