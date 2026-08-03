"use client";

import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

type DraftButtonProps = {
  onDraft: () => void;
  drafting: boolean;
};

export default function DraftButton({ onDraft, drafting }: DraftButtonProps) {
  return (
    <Button type="button" variant="outline" size="sm" onClick={onDraft} disabled={drafting}>
      <Sparkles size={14} /> {drafting ? "Drafting…" : "Draft with AI"}
    </Button>
  );
}
