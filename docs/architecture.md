# Architecture — Foundation Prototype

## Scope

Implementation รอบแรกครอบคลุม Phase 0, Foundation และแกน Prototype จาก project blueprint โดยเน้นเส้นทางหลัก:

`Login → Create → Write with BlockNote → Database autosave → Publish → Public reader → Browse List/Card`

ยังไม่อ้างว่าเป็น Production MVP เต็มรูปแบบ เพราะ object storage, taxonomy workflows, import/export และ AI provider ยังต้องพัฒนาต่อ

## Boundaries

- `src/core/content` — Domain types, slug policy และ repository contract
- `src/core/themes` — Theme contracts เท่านั้น ไม่มี database access
- `src/themes` — Theme implementations และ registry; ปัจจุบันมี Clarity และ Notebook
- `src/app/(public)` — Server-rendered public routes; อ่านผ่าน `ContentRepository`
- `src/app/admin` — Admin application design system แยกจาก public themes
- `src/components/editor` — Client-only BlockNote integration; ไม่ถูกโหลดบน public reader
- `prisma/schema.prisma` — Version-controlled target schema ตาม Core Entities ใน blueprint

## Database runtime

`PrismaContentRepository` เชื่อม PostgreSQL ผ่าน Prisma 7 และ `@prisma/adapter-pg` โดยมี baseline migration, seed data และ repository contract แยกจาก UI Editor บันทึก raw BlockNote document และ reader blocks ลง `Content.contentJson` พร้อม plain text สำหรับค้นหา

Repository บังคับ visibility rule:

- Public library/search เห็นเฉพาะ `visibility=public` และ `status=published`
- Direct article route เปิด `unlisted` ได้เมื่อมี slug
- Private คืนค่า `null` เสมอใน public route
- Sitemap สร้างจาก `listPublic()` จึงไม่มี Private/Unlisted

## Security status

Admin route มี `noindex`, signed HTTP-only session cookie, owner credential allowlist และตรวจสิทธิ์ซ้ำใน mutation API/Server Actions แล้ว Credential อยู่ใน environment variables เท่านั้น ก่อน Production ควรเพิ่ม rate limiting, CSRF/origin policy ที่ deployment edge และพิจารณา OAuth หากต้องการลดภาระจัดการรหัสผ่าน

## Next implementation sequence

1. เพิ่ม Category/Tag/Collection management ที่ใช้งานจริง
2. เพิ่ม renderer pipeline JSON → sanitized HTML → plain text → headings
3. เพิ่ม Revision History UI, restore และ slug redirects
4. เพิ่ม storage adapter และ secure uploads
5. เพิ่ม rate limiting, security headers และ deployment health checks
6. เพิ่ม AI provider adapter, job table และ diff review โดยไม่แก้ต้นฉบับโดยตรง
