import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";

type AssessmentFooterProps = {
  backHref?: string;
  nextHref?: string;
  onNextClick?: () => void;
  nextDisabled?: boolean;
};

export default function AssessmentFooter({
  backHref,
  nextHref,
  onNextClick,
  nextDisabled,
}: AssessmentFooterProps) {
  return (
    <footer className="mt-auto border-t border-border px-8 py-4">
      <div
        className={`flex max-w-2xl items-center ${backHref ? "justify-between" : "justify-end"}`}
      >
        {backHref && (
          <Link href={backHref} className={buttonVariants({ variant: "outline" })}>
            Back
          </Link>
        )}
        {onNextClick ? (
          <Button type="button" onClick={onNextClick} disabled={nextDisabled}>
            Next
          </Button>
        ) : (
          nextHref && (
            <Link href={nextHref} className={buttonVariants()}>
              Next
            </Link>
          )
        )}
      </div>
    </footer>
  );
}
