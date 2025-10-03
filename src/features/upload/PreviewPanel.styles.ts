import styled from "@emotion/styled";
import { Card } from "@components/Card";

export const Section = styled(Card)`
  margin-top: 20px;
`;

export const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;

  label {
    font-weight: 600;
    margin-right: 4px;
  }

  input, select {
    padding: 6px 8px;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: 6px;
    font-size: 14px;
  }
`;

export const ColPicker = styled.div`
  margin-bottom: 16px;
  padding: 12px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.surface};

  > div {
    margin-bottom: 8px;
  }

  label {
    display: block;
    margin: 4px 0;
  }
`;

export const Footer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  font-size: 14px;
`;

export const PartyInput = styled.input`
  padding: 6px 8px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 6px;
  font-size: 13px;
  width: 100%;
`;