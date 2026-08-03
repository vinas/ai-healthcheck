"use client";

import { Button } from "@/components/ui/button";

type StepFooterProps = {
  onBack?: () => void;
  onNext?: () => void;
  disabled?: boolean;
};

export default function StepFooter({ onBack, onNext, disabled }: StepFooterProps) {
  return (
    <footer className="mt-auto border-t border-border px-8 py-4">
      <div className={`flex max-w-2xl items-center ${onBack ? "justify-between" : "justify-end"}`}>
        {onBack && (
          <Button type="button" variant="outline" onClick={onBack} disabled={disabled}>
            Back
          </Button>
        )}
        {onNext && (
          <Button type="button" onClick={onNext} disabled={disabled}>
            Next
          </Button>
        )}
      </div>
    </footer>
  );
}
