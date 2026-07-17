export default function Loading() {
  return (
    <main className="grid min-h-screen place-items-center bg-[var(--bg)]" aria-label="Chargement">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-[#ded8e4] border-t-[var(--violet)]" />
    </main>
  );
}
