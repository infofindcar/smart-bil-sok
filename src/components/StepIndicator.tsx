interface StepIndicatorProps {
  current: number;
  total: number;
}

export const StepIndicator = ({ current, total }: StepIndicatorProps) => {
  const progress = (current / total) * 100;

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs text-muted-foreground font-medium">
          Steg {current} av {total}
        </span>
        <span className="text-xs text-primary font-medium">
          {Math.round(progress)}%
        </span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};
