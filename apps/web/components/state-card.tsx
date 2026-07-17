import { AlertCircle, Inbox, LoaderCircle } from "lucide-react";
import Link from "next/link";

type StateCardProps = {
  title: string;
  description: string;
  tone?: "empty" | "loading" | "error";
  action?: string;
  actionHref?: string;
};

const icons = {
  empty: Inbox,
  loading: LoaderCircle,
  error: AlertCircle
};

export function StateCard({
  title,
  description,
  tone = "empty",
  action,
  actionHref = "#"
}: StateCardProps) {
  const Icon = icons[tone];

  return (
    <section className="app-panel grid min-h-64 place-items-center p-6 text-center">
      <div className="max-w-md">
        <span className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-[var(--violet-soft)] text-[var(--violet)]">
          <Icon size={21} />
        </span>
        <h2 className="mb-1 mt-4 text-base font-semibold">{title}</h2>
        <p className="m-0 text-sm leading-6 text-[var(--muted)]">{description}</p>
        {action ? (
          <Link href={actionHref} className="primary-button mt-4">
            {action}
          </Link>
        ) : null}
      </div>
    </section>
  );
}
