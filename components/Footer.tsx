import { MessageCircle, Zap } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <a href="/" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent-violet/15 text-accent-violet">
              <Zap className="h-4 w-4" strokeWidth={2.5} />
            </span>
            <span className="font-display text-base font-semibold text-ink">
              [YOUR-SHOP-NAME]
            </span>
          </a>

          <a
            href="#"
            className="inline-flex items-center gap-1.5 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1.5 font-body text-xs text-red-400 transition hover:bg-red-500/20"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            แจ้งปัญหาร้านค้า / ติดต่อร้านค้าไม่ได้
          </a>
        </div>

        <div className="my-5 border-t border-line" />

        <div className="flex flex-col items-center justify-between gap-3 font-body text-xs text-ink-muted sm:flex-row">
          <p>© 2026 [YOUR-SHOP-NAME]. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a href="/privacy" className="transition hover:text-ink">นโยบายความเป็นส่วนตัว</a>
            <a href="/terms" className="transition hover:text-ink">ข้อตกลงการใช้งาน</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
