import { ArrowRight, Gamepad2 } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-line bg-scan">
      <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-accent-violet/20 blur-[100px]" />
      <div className="relative mx-auto max-w-6xl px-4 py-16 sm:py-20">
        <div className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs text-ink-muted">
          <Gamepad2 className="h-3.5 w-3.5 text-accent-mint" />
          เติมเกม 24 ชม. อัตโนมัติ ไม่ต้องรอแอดมิน
        </div>

        <h1 className="mt-5 max-w-2xl font-display text-4xl font-semibold leading-[1.1] tracking-tight text-ink sm:text-5xl">
          เติมเกม เช่าเว็บไซต์ระบบร้านค้า
          <span className="text-accent-violet"> จบในที่เดียว</span>
        </h1>

        <p className="mt-4 max-w-xl font-body text-sm text-ink-muted sm:text-base">
          รองรับ FiveM, Valorant, Roblox, Minecraft และแอปพรีเมียม ราคาถูก
          ฟังก์ชันครบ ระบบส่งอัตโนมัติ ปลอดภัย ตรวจสอบได้ทุกออเดอร์
        </p>

        <div className="mt-7 flex flex-wrap items-center gap-3">
          <a
            href="#products"
            className="inline-flex items-center gap-2 rounded-xl bg-accent-violet px-5 py-3 font-display text-sm font-semibold text-white shadow-glow transition hover:brightness-110"
          >
            ดูสินค้าทั้งหมด
            <ArrowRight className="h-4 w-4" />
          </a>
          <a
            href="#"
            className="inline-flex items-center gap-2 rounded-xl border border-line px-5 py-3 font-display text-sm font-semibold text-ink transition hover:border-accent-violet/50"
          >
            แจ้งปัญหา / ติดต่อร้าน
          </a>
        </div>
      </div>
    </section>
  );
}
