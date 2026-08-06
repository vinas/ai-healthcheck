"use client";

import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import type { Report } from "@/lib/scoring";
import { ROADMAP_GUIDANCE } from "@/lib/narrative-guidance";
import type { RoadmapItem } from "@/components/admin/narrative/types";
import DraftButton from "@/components/admin/narrative/draft-button";

type RoadmapStepProps = {
  report: Report;
  items: RoadmapItem[];
  onChange: (items: RoadmapItem[]) => void;
  onDraft: () => void;
  drafting: boolean;
};

export default function RoadmapStep({ report, items, onChange, onDraft, drafting }: RoadmapStepProps) {
  function update(index: number, patch: Partial<RoadmapItem>) {
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }
  function add() {
    onChange([...items, { what: "", why: "", effort: "Medium" }]);
  }
  function remove(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-base font-semibold text-foreground">Recommended Roadmap</h2>
        <p className="text-sm text-muted-foreground">
          Aim for 3–5 prioritized recommendations based on the lowest-scoring stages and any flags.
        </p>
      </div>
      <div className="rounded-md border border-border bg-muted/30 p-3 text-sm">
        <p className="mb-1.5 font-medium text-foreground">Guidance</p>
        <ul className="list-disc pl-4 text-muted-foreground">
          {ROADMAP_GUIDANCE.map((line, i) => (
            <li key={i} className="mb-1 last:mb-0">
              {line}
            </li>
          ))}
        </ul>
        {report.topGaps.length > 0 && (
          <p className="mt-2 text-muted-foreground">
            <span className="font-medium text-foreground">Top gaps:</span>{" "}
            {report.topGaps.map((g) => `${g.stageLabel} (${g.level.toFixed(1)})`).join(", ")}
          </p>
        )}
        {report.varianceFlags.length > 0 && (
          <p className="mt-1 text-muted-foreground">
            <span className="font-medium text-foreground">Active flags:</span>{" "}
            {report.varianceFlags.map((f) => f.title).join(", ")}
          </p>
        )}
      </div>
      <div>
        <DraftButton onDraft={onDraft} drafting={drafting} />
      </div>
      <div className="flex flex-col gap-4">
        {items.map((item, i) => (
          <div key={i} className="flex flex-col gap-2 rounded-md border border-border p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Item {i + 1}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => remove(i)}
                title="Remove item"
              >
                <X size={14} />
              </Button>
            </div>
            <Input
              type="text"
              placeholder="What to do"
              value={item.what}
              onChange={(e) => update(i, { what: e.target.value })}
            />
            <Textarea
              placeholder="Why it matters"
              value={item.why}
              onChange={(e) => update(i, { why: e.target.value })}
            />
            <Select
              value={item.effort}
              onValueChange={(v: RoadmapItem["effort"] | null) => {
                if (v) update(i, { effort: v });
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue>
                  {(v: RoadmapItem["effort"]) => `Effort: ${v}`}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Low">Effort: Low</SelectItem>
                <SelectItem value="Medium">Effort: Medium</SelectItem>
                <SelectItem value="High">Effort: High</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-sm text-muted-foreground">No roadmap items yet.</p>
        )}
      </div>
      <div>
        <Button type="button" variant="outline" size="sm" onClick={add}>
          <Plus size={14} /> Add roadmap item
        </Button>
      </div>
    </div>
  );
}
