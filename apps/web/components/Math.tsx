"use client";

import { useMemo } from "react";
import katex from "katex";

export function Math({ tex }: { tex: string }) {
  const html = useMemo(
    () => katex.renderToString(tex, { throwOnError: false }),
    [tex]
  );
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

export function Logo() {
  return <div className="mm-logo" aria-label="MechMate home">x</div>;
}

// Renders bot/answer text with $…$ (or $$…$$, \(…\), \[…\]) math segments
// typeset via KaTeX. Anything that fails to parse stays readable as text.
const MATH_RE = /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$|\\\([\s\S]+?\\\)|\\\[[\s\S]+?\\\])/g;
const MATH_TEST = /^\$\$[\s\S]+\$\$$|^\$[^$]+\$$|^\\\([\s\S]+\\\)$|^\\\[[\s\S]+\\\]$/;

function renderSegment(seg: string, i: number) {
  const m = seg.match(/^\$\$([\s\S]+)\$\$$/) ?? seg.match(/^\$([^$]+)\$$/) ?? seg.match(/^\\\(([\s\S]+)\\\)$/) ?? seg.match(/^\\\[([\s\S]+)\\\]$/);
  if (!m) return <span key={i}>{seg}</span>;
  const display = seg.startsWith("$$") || seg.startsWith("\\[");
  try {
    const html = katex.renderToString(m[1], { throwOnError: false, displayMode: display });
    return <span key={i} dangerouslySetInnerHTML={{ __html: html }} />;
  } catch {
    return <span key={i}>{seg}</span>;
  }
}

export function RichText({ text }: { text: string }) {
  const parts = text.split(MATH_RE).filter((p) => p !== "");
  return <>{parts.map((p, i) => (MATH_TEST.test(p) ? renderSegment(p, i) : <span key={i}>{p}</span>))}</>;
}
