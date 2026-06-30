export function fieldLabel(key: string): string {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1 $2")
    .replace(/_/g, " ");
}

export function isFieldVisible(key: string): boolean {
  return !["Version", "Author", "Description"].includes(key);
}

export const LABEL_TH: Record<string, string> = {
  "--background": "พื้นหลังหลักของหน้าเว็บ",
  "--foreground": "สีตัวอักษรหลัก",
  "--card": "พื้นหลังการ์ด",
  "--card-foreground": "สีตัวอักษรบนการ์ด",
  "--popover": "พื้นหลังกล่องป๊อปโอเวอร์/ดรอปดาวน์",
  "--popover-foreground": "สีตัวอักษรบนป๊อปโอเวอร์",
  "--primary": "สีปุ่มหลัก/ลิงก์สำคัญ",
  "--primary-foreground": "สีตัวอักษรบนปุ่มหลัก",
  "--secondary": "สีปุ่มรอง/ปุ่มทั่วไป",
  "--secondary-foreground": "สีตัวอักษรบนปุ่มรอง",
  "--muted": "สีพื้นหลังองค์ประกอบย่อย",
  "--muted-foreground": "สีตัวอักษรจาง/คำอธิบายย่อย",
  "--accent": "สีไฮไลต์ตอนเมาส์ชี้ (Hover)",
  "--accent-foreground": "สีตัวอักษรตอนเมาส์ชี้",
  "--destructive": "สีปุ่มลบ/ข้อความแจ้งเตือนผิดพลาด",
  "--destructive-foreground": "สีตัวอักษรบนปุ่มลบ",
  "--border": "สีเส้นขอบทั่วไป",
  "--input": "สีเส้นขอบช่องกรอกข้อมูล",
  "--ring": "สีเส้นขอบเรืองแสงตอนคลิกโฟกัส",
  "--chart-1": "สีแผนภูมิ ลำดับที่ 1",
  "--chart-2": "สีแผนภูมิ ลำดับที่ 2",
  "--chart-3": "สีแผนภูมิ ลำดับที่ 3",
  "--chart-4": "สีแผนภูมิ ลำดับที่ 4",
  "--chart-5": "สีแผนภูมิ ลำดับที่ 5",
  "--sidebar": "พื้นหลังแถบข้าง",
  "--sidebar-foreground": "สีตัวอักษรแถบข้าง",
  "--sidebar-primary": "สีไฮไลต์เมนูแถบข้าง",
  "--sidebar-primary-foreground": "สีตัวอักษรเมนูไฮไลต์แถบข้าง",
  "--sidebar-accent": "สีแถบข้างตอนเมาส์ชี้",
  "--sidebar-accent-foreground": "สีตัวอักษรแถบข้างตอนเมาส์ชี้",
  "--sidebar-border": "สีเส้นขอบแถบข้าง",
  "--sidebar-ring": "สีเส้นขอบเรืองแสงแถบข้าง",
  "--font-sans": "ฟอนต์ไม่มีหัว (Sans-serif)",
  "--font-serif": "ฟอนต์มีหัว (Serif)",
  "--font-mono": "ฟอนต์รหัสโค้ด (Monospace)",
  "--radius": "ความโค้งมนของมุมกล่อง/ปุ่ม",
  "--shadow-x": "ระยะเงาแนวนอน",
  "--shadow-y": "ระยะเงาแนวตั้ง",
  "--shadow-blur": "ความฟุ้งของเงา",
  "--shadow-spread": "การแผ่กระจายของเงา",
  "--shadow-opacity": "ความเข้มจางของเงา",
  "--shadow-color": "สีของเงา",
};
