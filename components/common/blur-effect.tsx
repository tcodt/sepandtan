interface BlurEffectProps {
  color?: string;
  size?: number;
  blur?: number;
  opacity?: number;
  position?: React.CSSProperties;
  className?: string;
}

export default function BlurEffect({
  color = "hsl(var(--primary))",
  size = 300,
  blur = 120,
  opacity = 0.4,
  position = { top: 0, left: 0 },
  className = "",
}: BlurEffectProps) {
  return (
    <div
      className={`absolute rounded-full pointer-events-none -z-10 ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        filter: `blur(${blur}px)`,
        opacity,
        ...position,
      }}
    />
  );
}
