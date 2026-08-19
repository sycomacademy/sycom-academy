import { consoleText } from "./constants";

/**
 * Chromium’s console sometimes mis-draws the first row when █ and box-drawing
 * mix. A zero-width word joiner (U+2060) at the start of that row fixes layout
 * without adding a visible rule like ASCII dashes.
 */
function primeConsoleAsciiFirstLine(ascii: string): string {
  const lines = ascii.split("\n");
  const [first, ...rest] = lines;
  if (first === undefined || first === "") {
    return ascii;
  }
  return ["\u2060" + first, ...rest].join("\n");
}

// const asciiStyle =
//   "color: #6366f1; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 9px; line-height: 1.12; font-weight: 700;";
// const taglineStyle = "color: #64748b; font-size: 13px; font-weight: 500; margin-top: 4px;";
// const linkStyle = "color: #2563eb; font-size: 12px; font-weight: 600;";

/**
 * Prints the Sycom ASCII banner in the browser console with styled `%c` segments
 * (same mechanism apps like Linear use for DevTools branding).
 */
export function logSycomConsoleBanner(): void {
  if (typeof console === "undefined") return;

  const segments = consoleText.trim().split(/\n\n+/);
  if (segments.length < 3) {
    console.log(primeConsoleAsciiFirstLine(consoleText.trim()));
    return;
  }

  const [ascii = "", tagline = "", linksBlock = ""] = segments;
  console.log(primeConsoleAsciiFirstLine(ascii));
  console.log(`${tagline.trim()}`);
  for (const line of linksBlock.trim().split("\n")) {
    console.log(`${line.trimEnd()}`);
  }
}
