interface ProgressBarProps {
  value: number; // 0-100
  timeProgress?: number; // 0-100 (optional, for dual progress)
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function ProgressBar({
  value,
  timeProgress,
  showLabel = false,
  size = 'md',
}: ProgressBarProps) {
  const heights = {
    sm: 'h-1',
    md: 'h-3',
    lg: 'h-4',
  };

  return (
    <div className="space-y-3">
      {/* Money Progress */}
      <div className={`${heights[size]} w-full bg-surface-variant rounded-full overflow-hidden`}>
        <div
          className="h-full bg-primary neon-glow-primary rounded-full transition-all duration-500"
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>

      {/* Time Progress (optional) */}
      {timeProgress !== undefined && (
        <div className="flex items-center gap-3">
          <div className="flex-1 h-1 bg-surface-variant rounded-full overflow-hidden">
            <div
              className="h-full bg-secondary/60 rounded-full"
              style={{ width: `${Math.min(timeProgress, 100)}%` }}
            />
          </div>
          {showLabel && (
            <span className="text-[10px] font-bold text-on-surface-variant uppercase whitespace-nowrap">
              {timeProgress < 100 ? `${Math.round(100 - timeProgress)} Meses Restantes` : 'Completado'}
            </span>
          )}
        </div>
      )}
    </div>
  );
}