type BrandMarkProps = {
  className?: string;
  label?: boolean;
};

export function BrandMark({ className = "", label = false }: BrandMarkProps) {
  return (
    <span
      className={`brand-mark ${className}`}
      aria-label={label ? "ProcuFlow" : undefined}
      aria-hidden={label ? undefined : true}
    >
      <svg viewBox="0 0 32 32" role="img" aria-hidden="true">
        <path d="M6.5 6.5 17 16 6.5 25.5" />
        <path d="M14.5 6.5 25 16 14.5 25.5" />
      </svg>
    </span>
  );
}
