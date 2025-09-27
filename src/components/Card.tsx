import styled from "@emotion/styled";
export const Card = styled.section`
  background: ${({theme}) => theme.colors.surface};
  color: ${({theme}) => theme.colors.text};
  border: 1px solid ${({theme}) => theme.colors.border};
  border-radius: 16px;
  padding: 24px;
`;
