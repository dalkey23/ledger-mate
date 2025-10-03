
export type SemanticColors = {
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  error: string;
  info: string;

  bg: string;
  surface: string;
  text: string;
  subText: string;
  border: string;
  link: string;
  linkHover: string;
};

export interface AppTheme {
  colors: SemanticColors;
}

export const baseTheme: AppTheme = {
  colors: {
    primary: "#2E4739",  
    secondary: "#FFD700", 
    success: "#4CAF50",
    warning: "#FFC107",
    error:   "#F44336",
    info:    "#2196F3",

    bg: "#FFFFFF",
    surface: "#F5F5F5",
    text: "#1A1A1A",
    subText: "#666666",
    border: "#E5E5E5",
    link: "#2E4739",      
    linkHover: "#FFD700", 
  },
};

export default baseTheme;
