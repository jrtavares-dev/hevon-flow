export default function HevonSkeleton({ width = '100%', height = 16, radius = 6, className = '', style = {} }) {
  return (
    <span
      aria-hidden="true"
      className={`hevon-skeleton ${className}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        borderRadius: typeof radius === 'number' ? `${radius}px` : radius,
        ...style,
      }}
    />
  );
}
