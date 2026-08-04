# Architecture — Working MVP

## Scope

Implementation ปัจจุบันครอบคลุม Foundation และแกน Working MVP จาก project blueprint โดยเน้นเส้นทางหลัก:

`Login → Create → Write with BlockNote → Database autosave → Publish → Public reader → Browse List/Card`

ระบบมี S3-compatible object storage, OpenRouter AI workflow, Quick Capture/Inbox, Markdown/JSON content export, versioned database backup พร้อม non-destructive validation, Site Settings และ Theme activation แล้ว ส่วน import, confirmed restore, scheduled publishing และ advanced bulk operations ยังเป็นงานระยะถัดไป

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

Admin route มี `noindex`, signed HTTP-only session cookie, owner credential allowlist และตรวจสิทธิ์ซ้ำใน mutation API/Server Actions แล้ว Login และ mutation API สำคัญใช้ PostgreSQL-backed rate limiting ส่วน API upload/content ตรวจ trusted origin เพิ่มเติม Credential อยู่ใน environment variables เท่านั้น ก่อน Production ควรพิจารณา OAuth หากต้องการลดภาระจัดการรหัสผ่าน

## Next implementation sequence

1. เพิ่ม confirmed restore และ bulk import
2. เพิ่ม background worker/queue หาก AI workload โตเกิน synchronous MVP

## Taxonomy workflow

Admin จัดการ Category, Tag และ Collection ผ่าน Server Actions ที่ตรวจ owner session ซ้ำทุก mutation มี slug validation, unique constraint, audit log และป้องกันการลบ Category/Tag ที่ยังถูกใช้งาน Editor โหลด Category/Tag จาก Database แทนรายการ hard-code และ Collection สามารถกำหนด visibility พร้อมเลือกสมาชิกได้

## Rendering and revisions

การบันทึกเนื้อหาสร้าง derived artifacts จาก reader blocks เป็น sanitized-by-construction HTML, plain text และ heading index โดย escape ข้อมูลผู้ใช้ก่อนสร้าง HTML ทุกครั้ง หน้าบ้านยัง render ผ่าน typed React blocks และไม่ inject HTML ที่เก็บใน Database เนื้อหาเดิมสามารถ backfill ผ่าน `npm run db:backfill-renderer`

Admin มี Revision History และ restore workflow ซึ่งสำรองสถานะปัจจุบันก่อนย้อนกลับทุกครั้ง การเปลี่ยน slug ใน Editor จะสร้าง permanent redirect จาก URL เดิม และ public article route ตรวจ redirect ก่อนคืน 404

## Media storage

Media Library ตรวจ owner session และ trusted origin ก่อนรับ multipart upload จำกัดชนิดด้วย file signature จริงแทนการเชื่อ MIME จาก browser และไม่รับ SVG รองรับ local adapter สำหรับ development กับ S3-compatible adapter สำหรับ production ไฟล์จริงอยู่ใน object storage ส่วน Database เก็บ metadata และ audit log เท่านั้น การลบถูกปฏิเสธเมื่อ Media ยังเป็น cover ของ Content

## Production safeguards

ทุก response มี baseline security headers และ Production เปิด HSTS ระบบมี `/api/health` ที่ตรวจทั้ง application กับ PostgreSQL โดยคืนเฉพาะสถานะทั่วไป Login จำกัด 5 ครั้งต่อ 15 นาที, content autosave จำกัด 180 ครั้งต่อนาที และ media upload จำกัด 20 ครั้งต่อชั่วโมงผ่าน `RateLimitBucket` ใน PostgreSQL จึงทำงานร่วมกันได้หลาย application instances

## AI suggestion workflow

AI Workspace ใช้ OpenRouter Chat Completions กับ strict JSON Schema โดย model default คือ `openai/gpt-5.6-luna` และเปลี่ยนได้ผ่าน `OPENROUTER_MODEL` ทุก request สร้าง `AIJob` พร้อม input hash, provider/model, token usage, status และ error ส่วนผลลัพธ์ถูกเก็บเป็น `AISuggestion` สถานะ Pending โดยไม่แก้ Content

เมื่อ Owner กด Accept ระบบตรวจว่า content hash ยังตรงกับตอนสร้าง suggestion และใช้ `updatedAt` ป้องกัน autosave ที่เกิดพร้อมกัน จากนั้น transaction จะเก็บ revision ของสถานะเดิมก่อนปรับเฉพาะ text fields ที่อนุญาต ไม่เปลี่ยน code block แล้วจึงเปลี่ยน suggestion เป็น Accepted พร้อม audit log หากขั้นตอนไหนล้มเหลว transaction จะ rollback ทั้งหมด หาก Reject จะเปลี่ยนเฉพาะสถานะ suggestion เท่านั้น

## Test architecture

ใช้ Vitest แยก unit tests (`npm test`) ออกจาก PostgreSQL integration tests (`npm run test:integration`) และใช้ Playwright (`npm run test:e2e`) สำหรับ browser journey จริง เหตุผลที่เลือก Playwright คือรองรับ Next.js web server lifecycle, Server Actions, file upload และ browser tracing ใน runner เดียว ซึ่งตรงกับความเสี่ยงของ Login, BlockNote autosave, publish, revision restore, media และ AI review มากกว่าการจำลอง DOM

integration/E2E อ่านเฉพาะ `TEST_DATABASE_URL` และปฏิเสธ database ที่ชื่อไม่มีคำว่า `test` ก่อนแทนค่า runtime `DATABASE_URL` ทุกครั้ง E2E reset เฉพาะตารางในฐานทดสอบ, apply migrations และ seed fixture ใหม่ จึงรันซ้ำได้โดยไม่เรียก AI provider หรือเขียน production storage ชุด deterministic AI fixture ทดสอบเส้นทาง `suggestion → Admin Server Action → pre-change revision → Content → Editor/Preview` ส่วน browser smoke suite ครอบคลุม `Login → Create → Autosave → Publish → Public reader`, revision restore และ local media upload

## Learning example sandbox

ข้อมูลแอปและ saved output ยังคงอยู่ใน Neon PostgreSQL แต่ sample datasets ไม่ถูกสร้างใน production database ระบบเก็บ Dataset Registry แบบ versioned ใน code พร้อม schema, data dictionary, source/license และ SHA-256 checksum โดยแต่ละ execution จะสร้าง DuckDB-Wasm หรือ sql.js instance ใหม่ใน Admin browser, โหลด deterministic fixture แล้วทิ้ง instance หลังจบ จึง reset ได้โดยธรรมชาติและ Public ไม่ได้รับ editor หรือ runtime

DuckDB และ SQLite worker/WASM ถูกคัดลอกจาก dependency ไปยัง same-origin static assets ใน `postinstall`/`prebuild` เพื่อ deploy บน Vercel โดยไม่ต้องมี database process หรือ persistent filesystem ฝั่ง Function Sandbox ยอมรับเฉพาะ single read-only `SELECT`/`WITH`, ปิด external access หลังโหลด fixture, จำกัด DuckDB memory 128 MB, timeout 4 วินาที, 200 rows และ 50 columns พร้อม terminate worker ทุกครั้ง ปัจจุบัน `duckdb`, `sqlite` และ `tsql-compatible` รันได้จริง ส่วน `tsql` เป็น preview/saved-output เท่านั้น
