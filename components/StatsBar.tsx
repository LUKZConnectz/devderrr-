import { stats } from "@/lib/data";

export default function StatsBar() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-8">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-line bg-surface p-4"
          >
            <p className="font-body text-xs text-ink-muted">{s.label}</p>
            <p className="mt-2 font-mono text-2xl font-medium text-ink">
              {s.value}
              <span className="text-accent-mint">{s.suffix}</span>
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
