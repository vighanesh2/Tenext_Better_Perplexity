"use client";

import ReactMarkdown from "react-markdown";
import type { NotebookItem } from "@/store/notebookStore";
import type { AdaptiveResponse, ResearchResponse, SystemDesignResponse, GeneralResponse } from "@/components/chat/types";
import { MermaidDiagram } from "@/components/chat/MermaidDiagram";

const SECTION_HEADING =
  "text-[12px] font-semibold uppercase tracking-wider text-gray-500 mb-2";
const SECTION_HEADING_AMBER =
  "text-[12px] font-semibold uppercase tracking-wider text-amber-400/90 mb-2";
const PROSE =
  "prose prose-invert prose-sm max-w-none [&_p]:mb-2";

function safeArray<T>(v: T[] | undefined | null): T[] {
  return Array.isArray(v) ? v : [];
}

function safeString(v: unknown): string {
  if (v == null) return "";
  return typeof v === "string" ? v : String(v);
}

function renderResearch(p: AdaptiveResponse, itemId: string) {
  const data = p as ResearchResponse;
  const summary = safeString(data?.summary);
  const keyInsights = safeArray(data?.keyInsights);
  const contradictions = safeArray(data?.contradictions);
  const sources = safeArray(data?.sources);

  return (
    <div className="space-y-4 text-[15px]">
      {summary && (
        <div className={PROSE}>
          <ReactMarkdown>{summary}</ReactMarkdown>
        </div>
      )}
      {keyInsights.length > 0 && (
        <div>
          <h4 className={SECTION_HEADING}>Key insights</h4>
          <ul className="list-disc pl-5 space-y-1 text-gray-300">
            {keyInsights.map((k, i) => (
              <li key={i}>{safeString(k)}</li>
            ))}
          </ul>
        </div>
      )}
      {contradictions.length > 0 && (
        <div>
          <h4 className={SECTION_HEADING_AMBER}>Contradictions</h4>
          <ul className="list-disc pl-5 space-y-1 text-gray-300">
            {contradictions.map((c, i) => (
              <li key={i}>{safeString(c)}</li>
            ))}
          </ul>
        </div>
      )}
      {sources.length > 0 && (
        <div>
          <h4 className={SECTION_HEADING}>Sources</h4>
          <div className="space-y-2">
            {sources.map((s, i) => (
              <a
                key={i}
                href={typeof s?.url === "string" ? s.url : "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-[14px] text-[#7ba3ff] hover:underline truncate"
              >
                {safeString(s?.title) || "Link"}
              </a>
            ))}
          </div>
        </div>
      )}
      {!summary && keyInsights.length === 0 && contradictions.length === 0 && sources.length === 0 && (
        <p className="text-gray-500 text-[14px]">No content available.</p>
      )}
    </div>
  );
}

function renderSystemDesign(p: AdaptiveResponse, itemId: string) {
  const data = p as SystemDesignResponse;
  const arch = safeString(data?.architectureDescription);
  const components = safeArray(data?.systemComponents);
  const scaling = data?.scalingAssumptions;
  const scalingMath = data?.scalingMath;
  const throughput = safeString(data?.throughputEstimation);
  const partition = safeString(data?.partitionStrategy);
  const tradeoffs = safeArray(data?.tradeoffs);
  const bottlenecks = safeArray(data?.bottlenecks);
  const diagram = safeString(data?.diagram);

  return (
    <div className="space-y-4 text-[15px]">
      {arch && (
        <div className={PROSE}>
          <ReactMarkdown>{arch}</ReactMarkdown>
        </div>
      )}
      {components.length > 0 && (
        <div>
          <h4 className={SECTION_HEADING}>Components</h4>
          <ul className="list-disc pl-5 space-y-1 text-gray-300">
            {components.map((c, i) => (
              <li key={i}>{safeString(c)}</li>
            ))}
          </ul>
        </div>
      )}
      {(scaling || scalingMath?.numericReasoning) && (
        <div>
          <h4 className={SECTION_HEADING}>Scaling</h4>
          <p className="text-gray-300 text-[14px]">
            {scaling
              ? `${Number(scaling.concurrentUsers ?? 0).toLocaleString()} users · ${Number(scaling.requestsPerSecond ?? 0).toLocaleString()} req/s`
              : "—"}
          </p>
          {scalingMath?.numericReasoning && (
            <p className="text-gray-400 text-[13px] mt-1">{scalingMath.numericReasoning}</p>
          )}
        </div>
      )}
      {throughput && (
        <div>
          <h4 className={SECTION_HEADING}>Throughput</h4>
          <p className="text-gray-300 text-[14px]">{throughput}</p>
        </div>
      )}
      {partition && (
        <div>
          <h4 className={SECTION_HEADING}>Partition</h4>
          <p className="text-gray-300 text-[14px]">{partition}</p>
        </div>
      )}
      {tradeoffs.length > 0 && (
        <div>
          <h4 className={SECTION_HEADING}>Tradeoffs</h4>
          <div className="overflow-x-auto rounded border border-white/10">
            <table className="w-full text-[13px] text-gray-300">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-2 px-3 font-semibold">Component</th>
                  <th className="text-left py-2 px-3 font-semibold">Latency</th>
                  <th className="text-left py-2 px-3 font-semibold">Throughput</th>
                </tr>
              </thead>
              <tbody>
                {tradeoffs.map((t, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td className="py-2 px-3">{safeString(t?.component)}</td>
                    <td className="py-2 px-3">{safeString(t?.latency)}</td>
                    <td className="py-2 px-3">{safeString(t?.throughput)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {bottlenecks.length > 0 && (
        <div>
          <h4 className={SECTION_HEADING_AMBER}>Bottlenecks</h4>
          <ul className="list-disc pl-5 space-y-1 text-gray-300">
            {bottlenecks.map((b, i) => (
              <li key={i}>{safeString(b)}</li>
            ))}
          </ul>
        </div>
      )}
      {diagram && (
        <div>
          <h4 className={SECTION_HEADING}>Diagram</h4>
          <MermaidDiagram code={diagram} id={itemId} />
        </div>
      )}
      {!arch && components.length === 0 && !scaling && !throughput && !partition && tradeoffs.length === 0 && bottlenecks.length === 0 && !diagram && (
        <p className="text-gray-500 text-[14px]">No content available.</p>
      )}
    </div>
  );
}

function renderGeneral(p: AdaptiveResponse) {
  const data = p as GeneralResponse;
  const answer = safeString(data?.answer);

  return (
    <div className="text-[15px] prose prose-invert prose-sm max-w-none">
      {answer ? <ReactMarkdown>{answer}</ReactMarkdown> : <p className="text-gray-500">No content available.</p>}
    </div>
  );
}

export function NotebookItemRenderer({ item }: { item: NotebookItem }) {
  const payload = item?.payload;
  if (!payload || typeof payload !== "object") {
    return <p className="text-gray-500 text-[14px]">Invalid or missing content.</p>;
  }

  const mode = payload.mode;
  if (mode === "research") return renderResearch(payload, item.id);
  if (mode === "system_design") return renderSystemDesign(payload, item.id);
  if (mode === "general") return renderGeneral(payload);

  return <p className="text-gray-500 text-[14px]">Unknown content type.</p>;
}
