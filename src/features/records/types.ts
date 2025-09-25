export type Kind = "비용" | "매출" | "확인요망" | "" | "-";

export type SavedRecord = {
  id?: number;
  계좌: string;
  거래일시: string;
  기재내용: string;
  "지급(원)": number;
  "입금(원)": number;
  구분: Kind;
  거래처: string;
  비고: string;
};
