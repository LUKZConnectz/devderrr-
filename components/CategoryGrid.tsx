import { categories } from "@/lib/data";
import { Swords, Coins, Server, Blocks } from "lucide-react";

const icons: Record<string, React.ReactNode> = {
  fivem: <Swords className="h-5 w-5" />,
  valorant: <Swords className="h-5 w-5" />,
  roblox: <Coins className="h-5 w-5" />,
  minecraft: <Blocks className="h-5 w-5" />,
};

export default function CategoryGrid() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h2 className="font-display text-lg font-semibold text-ink">
            หมวดหมู่แนะนำ
          </h2>
          <p className="font-body text-xs text-ink-muted">Category Recommended</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {categories.map((c) => (
          <a
            key={c.id}
            href={`#${c.id}`}
            className="group rounded-2xl border border-line bg-surface p-4 transition hover:border-accent-violet/40"
          >
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent-violet/10 text-accent-violet transition group-hover:bg-accent-violet/20">
              {icons[c.id] ?? <Server className="h-5 w-5" />}
            </span>
            <p className="mt-3 font-body text-sm font-medium text-ink">{c.name}</p>
            <p className="font-mono text-xs text-ink-faint">{c.count} รายการ</p>
          </a>
        ))}
      </div>
    </section>
  );
}
