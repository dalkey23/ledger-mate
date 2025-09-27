import { Global, css, useTheme } from "@emotion/react";
import type { AppTheme } from "../theme";

export default function GlobalStyles() {
  const t = useTheme() as AppTheme;
  return (
    <Global styles={css`
      *, *::before, *::after { box-sizing: border-box; }
      html, body, #root { height: 100%; }
      body { margin: 0; }
      img, picture, video, canvas, svg { display: block; max-width: 100%; }
      input, button, textarea, select { font: inherit; }
      body {
        background: ${t.colors.bg};
        color: ${t.colors.text};
        font-family: system-ui, Avenir, Helvetica, Arial, sans-serif;
        line-height: 1.5;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }
      a { color: ${t.colors.link}; text-decoration: none; }
      a:hover { color: ${t.colors.linkHover}; text-decoration: underline; }
      :focus-visible { outline: 3px solid ${t.colors.secondary}; outline-offset: 2px; }
      @media (prefers-reduced-motion: reduce) {
        * { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important; scroll-behavior: auto !important; }
      }
    `}/>
  );
}
