import { products } from "@/lib/data";

function Baht({ value }: { value: number }) {
  return (
    <span className="font-mono">
      {value.toLocaleString("th-TH")}
      <span className="ml-0.5 text-xs text-ink-muted">฿</span>
    </span>
  );
}

function tagStyle(tag?: string) {
  if (tag === "ขายดี") return "bg-accent-amber/15 text-accent-amber";
  if (tag === "ใหม่") return "bg-accent-mint/15 text-accent-mint";
  if (tag === "ลดราคา") return "bg-accent-violet/15 text-accent-violet";
  return "";
}

export default function ProductGrid() {
  return (
    <section id="products" className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-4">
        <h2 className="font-display text-lg font-semibold text-ink">สินค้าแนะนำ</h2>
        <p className="font-body text-xs text-ink-muted">Products Recommended</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {products.map((p) => (
          <div
            key={p.id}
            className="card-sweep rounded-2xl border border-line bg-surface p-3 transition hover:-translate-y-0.5"
          >
            <div className="relative flex h-24 items-center justify-center rounded-xl bg-base">
              <span className="font-display text-xs uppercase tracking-widest text-ink-faint">
                {p.category}
              </span>
              {p.tag && (
                <span
                  className={`absolute left-2 top-2 rounded-md px-2 py-0.5 font-body text-[10px] font-medium ${tagStyle(
                    p.tag
                  )}`}
                >
                  {p.tag}
                </span>
              )}
            </div>

            <p className="mt-3 line-clamp-2 font-body text-sm font-medium text-ink">
              {p.name}
            </p>

            <div className="mt-2 flex items-center justify-between">
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono text-base font-semibold text-ink">
                  <Baht value={p.price} />
                </span>
                {p.oldPrice && (
                  <span className="font-mono text-xs text-ink-faint line-through">
                    {p.oldPrice.toLocaleString("th-TH")}
                  </span>
                )}
              </div>
              <span className="signal-bars" data-level={p.stockLevel} aria-label={`คงเหลือระดับ ${p.stockLevel}/4`}>
                <span />
                <span />
                <span />
                <span />
              </span>
            </div>

            <button className="mt-3 w-full rounded-lg bg-accent-violet/10 py-2 font-body text-sm font-medium text-accent-violet transition hover:bg-accent-violet hover:text-white">
              สั่งซื้อ
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
