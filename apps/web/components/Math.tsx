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
