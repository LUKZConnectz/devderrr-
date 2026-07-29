# [YOUR-SHOP-NAME] — เว็บไซต์เติมเกม/เช่าเว็บไซต์

โครงหน้าเว็บแบบเดียวกับร้านเติมเกม/เช่าเว็บไซต์ทั่วไป (Hero → สถิติ → หมวดหมู่ → สินค้าแนะนำ → Footer)
สร้างด้วย Next.js 14 (App Router) + TypeScript + Tailwind CSS โครงและโค้ดเป็นต้นฉบับใหม่ทั้งหมด
(ไม่ได้คัดลอกแบรนด์/เนื้อหาจากร้านอื่น) — ชื่อร้านเป็น placeholder ให้แก้เป็นของพี่เอง

## เริ่มใช้งาน

```bash
npm install
npm run dev
```

เปิด http://localhost:3000

## สิ่งที่ต้องแก้ก่อนใช้จริง

1. **ชื่อร้าน/แบรนด์**: ค้นหาคำว่า `[YOUR-SHOP-NAME]` ในโปรเจกต์แล้วแทนที่ทุกจุด
   - `app/layout.tsx` (title, description)
   - `components/NavBar.tsx`
   - `components/Footer.tsx`
2. **สินค้า/หมวดหมู่จริง**: แก้ไขที่ `lib/data.ts`
3. **ลิงก์ติดต่อ/Discord**: แก้ href ใน `components/Footer.tsx`
4. **โลโก้**: ตอนนี้ใช้ไอคอนสายฟ้า (lucide-react) แทนโลโก้ ใส่รูปจริงได้ที่ `components/NavBar.tsx`

## โครงสร้างไฟล์

```
app/
  layout.tsx       ← metadata + font loading
  page.tsx         ← ประกอบหน้าแรก
  globals.css      ← สไตล์พื้นฐาน + signature effects
components/
  NavBar.tsx       ← เมนูบน + toggle มืด/สว่าง
  Hero.tsx         ← ส่วนหัวหลัก
  StatsBar.tsx     ← แถบสถิติ
  CategoryGrid.tsx ← หมวดหมู่แนะนำ
  ProductGrid.tsx  ← กริดสินค้า (มี "signal bars" บอกสต็อกแบบมิเตอร์เกม)
  Footer.tsx       ← ท้ายหน้า
lib/
  data.ts          ← ข้อมูลตัวอย่าง (สินค้า/หมวดหมู่/สถิติ) — แก้เป็นข้อมูลจริง
```

## ดีไซน์

- โทนสี: พื้นหลังกรมท่าเข้ม (#0B0E14), การ์ด (#141821), accent สีม่วงไฟฟ้า (#7C5CFF) และมิ้นต์ (#00E5A0) สื่อถึง UI เกม
- ฟอนต์: Chakra Petch (หัวข้อ, แนวเทคนิค), Sarabun (เนื้อหาไทย), JetBrains Mono (ราคา/ตัวเลข)
- ลายเซ็นดีไซน์: "signal bars" ข้างราคาสินค้า จำลองมิเตอร์สัญญาณ/สต็อกแบบเกม แทนป้าย "มีสินค้า" ธรรมดา
