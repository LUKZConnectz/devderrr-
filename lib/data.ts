export type Category = {
  id: string;
  name: string;
  nameEn: string;
  count: number;
};

export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  oldPrice?: number;
  stockLevel: 1 | 2 | 3 | 4;
  tag?: "ใหม่" | "ขายดี" | "ลดราคา";
};

export const categories: Category[] = [
  { id: "fivem", name: "สคริปต์ FiveM", nameEn: "FiveM Scripts", count: 18 },
  { id: "valorant", name: "แรงค์ Valorant", nameEn: "Valorant", count: 9 },
  { id: "roblox", name: "โรบัคส์ Roblox", nameEn: "Robux", count: 14 },
  { id: "minecraft", name: "เซิร์ฟเวอร์ Minecraft", nameEn: "MC Hosting", count: 7 },
];

export const products: Product[] = [
  { id: "p1", name: "สคริปต์ร้านค้า FiveM Full UI", category: "FiveM Scripts", price: 590, oldPrice: 890, stockLevel: 4, tag: "ขายดี" },
  { id: "p2", name: "Valorant Points 1750 VP", category: "Valorant", price: 349, stockLevel: 3 },
  { id: "p3", name: "Robux 800 (โอนอัตโนมัติ)", category: "Robux", price: 259, stockLevel: 2, tag: "ลดราคา" },
  { id: "p4", name: "เช่าเซิร์ฟเวอร์ Minecraft 4GB / เดือน", category: "MC Hosting", price: 129, stockLevel: 4 },
  { id: "p5", name: "สคริปต์ MDT ตำรวจ FiveM", category: "FiveM Scripts", price: 450, stockLevel: 1, tag: "ใหม่" },
  { id: "p6", name: "Valorant Points 3650 VP", category: "Valorant", price: 699, stockLevel: 2 },
  { id: "p7", name: "Robux 1700 (โอนอัตโนมัติ)", category: "Robux", price: 519, stockLevel: 3 },
  { id: "p8", name: "เช่าเซิร์ฟเวอร์ Minecraft 8GB / เดือน", category: "MC Hosting", price: 219, stockLevel: 3, tag: "ขายดี" },
];

export const stats = [
  { label: "คำสั่งซื้อสำเร็จ", value: "12,480", suffix: "+" },
  { label: "ลูกค้าประจำ", value: "3,102", suffix: "+" },
  { label: "เวลาส่งเฉลี่ย", value: "1.4", suffix: " นาที" },
  { label: "คะแนนรีวิว", value: "4.9", suffix: " / 5" },
];
