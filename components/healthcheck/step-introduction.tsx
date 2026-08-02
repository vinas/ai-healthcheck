type StepIntroductionProps = {
  heading: string;
  children: React.ReactNode;
};

export default function StepIntroduction({ heading, children }: StepIntroductionProps) {
  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <h2 className="text-lg font-semibold text-foreground">{heading}</h2>
      {children}
    </div>
  );
}
