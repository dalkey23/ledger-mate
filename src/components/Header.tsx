import React from "react";
import { NavLink, Link } from "react-router-dom";
import styled from "@emotion/styled";

const HeaderWrap = styled.header`
  position: sticky;
  top: 0;
  z-index: 50;
  backdrop-filter: blur(6px);
  background: ${({ theme }) => theme.colors.bg};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const HeaderInner = styled.div`
  max-width: 1280px;
  margin: 0 auto;
  padding: 10px 16px;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 12px;
`;

const Brand = styled(Link)`
  justify-self: start;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-weight: 800;
  letter-spacing: -0.02em;
  text-decoration: none;
  color: ${({ theme }) => theme.colors.text};
  font-size: 18px;
`;

const Nav = styled.nav`
  justify-self: center;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 4px;
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.surface};
`;

const NavItem = styled(NavLink)`
  padding: 8px 12px;
  border-radius: 10px;
  text-decoration: none;
  font-weight: 600;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.subText};

  &.active {
    color: ${({ theme }) => theme.colors.bg};
    background: ${({ theme }) => theme.colors.primary};
  }
`;



export default function Header() {
    return (
        <HeaderWrap>
            <HeaderInner>
                <Brand to="/">Ledger-Mate</Brand>

                <Nav aria-label="Primary">
                    <NavItem to="/upload" end>Upload</NavItem>
                    <NavItem to="/records" end>Records</NavItem>
                </Nav>
            </HeaderInner>
        </HeaderWrap>
    );
}
