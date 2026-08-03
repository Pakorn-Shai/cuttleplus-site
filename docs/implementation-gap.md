# Implementation Gap Report

อัปเดตล่าสุด: 3 สิงหาคม 2026

เอกสารนี้เปรียบเทียบโครงสร้างและพฤติกรรมที่มีในโค้ดกับ product blueprint ใน `README.md` โดยแยกงานที่จำเป็นต่อความน่าเชื่อถือของระบบออกจากแนวคิดระยะยาว Blueprint เป็นขอบเขตผลิตภัณฑ์ ไม่ใช่คำยืนยันว่าทุกข้อถูก implement แล้ว

รายการลงมือทำแบบ checkbox รวมทุกหมวดอยู่ที่ [Master Development Checklist](next-development-checklist.md)

## สิ่งที่มีแล้ว

- Public home, library, article, category, tag, search, about, sitemap และ robots
- Owner login, signed session และ Admin route guards
- Quick Capture/Inbox, Content Manager และ BlockNote editor พร้อม autosave
- Category, Tag, Series และ Collection management
- Revision history/restore, Markdown/JSON export และ slug redirects
- Media Library พร้อม local/S3-compatible adapters
- Site Settings, Theme activation และ public theme contract
- OpenRouter suggestion generation, diff review, job history และ audit log
- Versioned JSON backup download และ non-destructive validation
- PostgreSQL-backed rate limits, trusted-origin checks และ health endpoint
- Domain schema, validation, safe rendering และ Markdown/JSON export สำหรับ Executable Code, Formula Example และ Automation Script blocks

## ช่องว่างลำดับเร่งด่วน

### P0 — ความถูกต้องและการทดสอบ

1. AI Accept ยังต้องมี integration/E2E test ที่ยืนยันทั้ง `Content`, `ContentRevision`, Editor และ Preview จาก suggestion เดียวกัน
2. ยังไม่มี integration-test harness ที่ใช้ test database สำหรับ create/edit/publish/restore/upload workflows
3. ยังไม่มี browser E2E tests สำหรับ Login → Create → Publish → Public reader
4. Backup ยัง validate ได้อย่างเดียว ไม่มี confirmed restore, dry-run, backup-before-write และ restore drill

### P1 — ช่องว่างของ MVP workflow

1. Editor UI ยังไม่มี native blocks ครบตาม blueprint เช่น image, YouTube/embed, toggle, callout, quote, bookmark และ attachment บางชนิดมี reader type แต่ถูก flatten เมื่อกลับเข้า Editor
2. Relations, Sources และ Tag Alias มี data model แต่ UI workflow ยังไม่ครบ
3. Content Manager ยังไม่มี duplicate, permanent delete, bulk actions และ quick metadata edit
4. Inbox ยังไม่มี merge, bulk organize และ convert workflow แยกจากการเปิด Editor
5. Media Library ยังไม่มี search/filter, usage count, replace, dimensions และ insert-to-editor
6. Learning example blocks มี schema/export/Public renderer แล้ว แต่ยังไม่มี BlockNote custom-block authoring, Dataset Registry และ Admin sandbox
7. Formula/Automation blocks ยังไม่มี Admin UI สำหรับกรอก metadata, structured input/output และ verified date

### P1 — Operations

1. `SCHEDULED` และ `scheduledAt` มีใน schema แต่ยังไม่มี scheduler/worker หรือ idempotent publish job
2. ยังไม่มี error-reporting/observability integration, slow-query monitoring หรือ AI failure dashboard
3. ยังไม่มี automated database backup/object-storage versioning configuration ใน repository
4. ยังไม่มี deployment guide เฉพาะ platform และ preview-environment noindex policy

## Route gaps จาก Blueprint

| กลุ่ม | มีแล้ว | ยังไม่มี |
| --- | --- | --- |
| Public taxonomy | `/categories`, `/categories/[slug]`, `/tags`, `/tags/[slug]`, `/series`, `/series/[slug]`, `/collections`, `/collections/[slug]` | Relations/Sources ยังแสดงในบทความไม่ครบ |
| Public content | `/`, `/knowledge`, `/knowledge/[slug]`, `/search`, `/about` | `/projects`, `/archive` |
| Admin content | `/admin`, `/admin/inbox`, `/admin/content`, Editor/Preview/Revisions, `/admin/series` | `/admin/navigation`, `/admin/audit` |
| Admin system | Media, AI, Themes, Settings และ Backup ภายใน Settings | route แยก `/admin/backups` และ confirmed restore UI |
| APIs | Search, Content, Media, AI, Backup และ Health | Import, embed preview และ scheduled-job endpoint |

ชื่อ route ใน implementation ไม่จำเป็นต้องตรง blueprint ทุกตัว ตัวอย่างเช่น upload ใช้ `/api/admin/media` แทน `/api/uploads` และ backup อยู่ใน Settings ได้ ตราบใดที่ workflow ครบและสิทธิ์ถูกต้อง

## งานระยะหลัง MVP

รายการต่อไปนี้ควรทำหลัง workflow หลักมี integration/E2E coverage แล้ว:

- Semantic/vector search และ natural-language knowledge assistant
- Knowledge graph, contradiction detection และ suggested learning path
- Advanced SEO/AEO assistant, analytics และ content freshness automation
- Theme package installation/marketplace
- Notion/Word/PDF best-effort import
- Visual regression suite สำหรับทุก theme และ viewport

## ลำดับแนะนำ

1. AI Accept integration test และแก้ flow จนผ่าน
2. Critical-path browser E2E tests
3. Confirmed backup restore/import
4. Rich editor blocks และ Media insert
5. Executable examples: Dataset Registry → DuckDB/SQLite Admin sandbox → Run & Save Output → Public read-only renderer
6. Formula/Automation learning blocks และ shared structured-output renderer
7. Relations, Sources และ Tag Alias workflows
8. Scheduled publishing worker
9. Operations/monitoring และ platform deployment guide

## ขอบเขต Executable Examples ที่ตกลงแล้ว

- Owner เท่านั้นที่สร้าง แก้ และสั่งรัน code block ใน Admin
- Public reader อ่าน code และ saved output ได้ แต่พิมพ์ แก้ หรือส่งโค้ดมารันไม่ได้
- MVP ไม่เปิด public playground หรือ public re-run
- Sample datasets แยกจาก production database และเป็น versioned/read-only/resettable
- DuckDB/SQLite ใช้ Browser Worker ใน Admin; JavaScript ใช้ Web Worker ในระยะถัดไป
- T-SQL ใช้ Preview/Saved-output หรือ query DuckDB คู่ที่ Owner ตรวจเอง ห้ามแปลงแล้วอ้างว่าเหมือน SQL Server 100%
- SQL Server execution จริงต้องเป็น isolated sandbox แยกและไม่อยู่ใน MVP

## ขอบเขต Formula และ Automation Blocks ที่ตกลงแล้ว

- DAX, Power Query M, Excel และ Google Sheets ใช้ Formula Example Block แบบ Preview/Saved-output
- VBA และ Google Apps Script ใช้ Automation Script Block แบบ Preview/Saved-output
- Owner เป็นผู้สร้าง source, context, input และผลลัพธ์ตัวอย่างทั้งหมด
- Public อ่านและ Copy ได้ แต่ไม่มี Run, Edit หรือ Playground
- ไม่เชื่อม Power BI/Microsoft 365 API, VBA runtime, Google OAuth หรือ Apps Script Execution API
- ต้องแสดง engine/platform, compatibility, requirements, permissions/triggers และ verified date ตามชนิด
- ห้ามเก็บหรือเผย token, credential, private file ID และข้อมูลจริงจากบริการภายนอก
