import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

type AssessmentFooterProps = {
  nextHref: string;
};

export default function AssessmentFooter({ nextHref }: AssessmentFooterProps) {
  return (
    <footer className="mt-auto border-t border-border px-8 py-4">
      <div className="flex max-w-2xl items-center justify-end">
        <Link href={nextHref} className={buttonVariants()}>
          Next
        </Link>
      </div>
    </footer>
  );
}
