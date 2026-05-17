import { Suspense } from "react";

export const metadata = {
  title: "Evaluation Dashboard",
  description: "Live RAG evaluation scores — Recall@10, groundedness, and behavior probes across 8 conversation traces.",
};

export default function EvalLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={null}>{children}</Suspense>;
}
