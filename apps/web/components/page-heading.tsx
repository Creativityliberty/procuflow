import { Plus } from "lucide-react";
import Link from "next/link";

type PageHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: string;
  actionHref?: string;
};

export function PageHeading({
  eyebrow,
  title,
  description,
  action,
  actionHref = "#"
}: PageHeadingProps) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div>
        {eyebrow ? (
          <p className="mb-1 mt-0 text-xs font-semibold text-[var(--violet)]">{eyebrow}</p>
        ) : null}
        <h1 className="m-0 text-2xl font-bold leading-tight text-[var(--ink)]">{title}</h1>
        {description ? (
          <p className="mb-0 mt-1 max-w-3xl text-sm leading-6 text-[var(--muted)]">{description}</p>
        ) : null}
      </div>
      {action ? (
        <Link href={actionHref} className="primary-button">
          <Plus size={17} />
          {action}
        </Link>
      ) : null}
    </header>
  );
}
