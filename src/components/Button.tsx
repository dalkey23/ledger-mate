import styled from "@emotion/styled";

export const Button = styled.button<{ variant?: "primary"|"secondary" }>`
  border-radius: 12px;
  padding: 12px 16px;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid transparent;
  transition: opacity .2s ease, transform .02s ease;

  ${({ theme, variant = "primary" }) =>
    variant === "primary"
      ? `
        background: ${theme.colors.primary};
        color: #fff;
        border-color: ${theme.colors.primary};
      `
      : `
        background: ${theme.colors.surface};
        color: ${theme.colors.text};
        border-color: ${theme.colors.border};
      `
  }

  &:hover { opacity: .95; }
  &:active { transform: translateY(1px); }
`;
