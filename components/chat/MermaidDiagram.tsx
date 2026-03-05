"use client";

import { useLayoutEffect, useState } from "react";

export function MermaidDiagram({ code, id }: { code: string; id: string }) {
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useLayoutEffect(() => {
    if (!code?.trim() || typeof window === "undefined") return;
    setError(null);
    const diagramId = `mermaid-${id.replace(/[^a-z0-9]/gi, "")}`;
    import("mermaid")
      .then((m) => {
        m.default.initialize({
          startOnLoad: false,
          theme: "dark",
          themeVariables: {
            primaryColor: "#1f3dbc",
            primaryTextColor: "#e5e7eb",
            primaryBorderColor: "#4b5563",
            lineColor: "#6b7280",
          },
        });
        return m.default.render(diagramId, code.trim());
      })
      .then(({ svg: result }) => setSvg(result))
      .catch((err) => setError(err?.message ?? "Failed to render diagram"));
  }, [code, id]);

  if (error) {
    return (
      <pre className="rounded-lg bg-white/5 border border-white/10 p-4 text-[14px] text-gray-400 overflow-x-auto">
        {code}
      </pre>
    );
  }
  if (!svg) {
    return (
      <div className="rounded-lg bg-white/5 border border-white/10 p-8 flex items-center justify-center text-gray-500">
        Loading diagram…
      </div>
    );
  }
  return (
    <div
      className="mermaid-container flex justify-center overflow-x-auto rounded-lg bg-white/[0.03] border border-white/10 p-4 [&_svg]:max-w-full"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
