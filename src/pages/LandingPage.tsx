import React from "react";
import { Link } from "react-router-dom";
const LandingPage: React.FC = () => {
  return (
    <section>
      <h1>Ledger Mate</h1>
      <p>엑셀 업로드 또는 내역 확인으로 이동하세요.</p>
      <div>
        <Link to="/upload">엑셀 업로드</Link>
        <Link to="/records">내역 확인</Link>
      </div>
    </section>
  );
};

export default LandingPage;
