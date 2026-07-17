import { acdeCards } from "@/lib/mock-data";

export function AcdePreview() {
  return (
    <section className="app-panel p-4">
      <h2 className="m-0 text-base font-semibold">Clarifier le besoin</h2>
      <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {acdeCards.map((card) => (
          <div className="rounded-xl border border-[var(--border)] p-3" key={card.letter}>
            <strong className="text-sm text-[var(--violet)]">{card.letter}. {card.title}</strong>
            <p className="mb-0 mt-1 text-xs leading-5 text-[var(--muted)]">{card.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
