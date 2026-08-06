# Master Development Checklist — งานค้างทั้งหมด

วันที่เตรียมแผน: 3 สิงหาคม 2026

ใช้เริ่มงานต่อ: 4 สิงหาคม 2026

เอกสารนี้รวมงานค้างทั้งหมดที่พบจากสถานะ implementation ปัจจุบันเทียบกับ `README.md`, `docs/architecture.md` และ `docs/implementation-gap.md` ณ วันที่จัดทำ ให้ติ๊กเมื่อมีทั้ง code, test และผลตรวจรับแล้ว ไม่ใช่เพียงสร้าง UI หรือ schema สำเร็จ

รายการนี้เป็น master backlog จึงรวมทั้งงานจำเป็นก่อน Production, งานหลัง MVP และ route ใน blueprint ที่อาจตัดสินใจไม่สร้างได้ หากตัดออกให้เปลี่ยนเป็น `[x]` พร้อมเขียน `ตัดออก — เหตุผล` เพื่อเก็บการตัดสินใจไว้ ไม่ควรลบรายการทิ้ง

## สถานะตั้งต้น

- [x] Public/Admin พื้นฐาน, taxonomy, Series และ Collections
- [x] BlockNote editor, autosave, Preview และ content lifecycle พื้นฐาน
- [x] Revision restore และ Markdown/JSON export
- [x] Media storage adapter, Site Settings และ Themes
- [x] AI Generate, Diff Review, Accept/Reject foundation และ audit log
- [x] Versioned backup download และ non-destructive validation
- [x] Learning-block schema, validation, safe renderer และ export
- [x] Content Block schema/registry maintainability refactor
- [x] Unit tests, typecheck, lint และ production build ผ่าน ณ วันที่จัดทำเอกสาร

## พรุ่งนี้ — เป้าหมายหลัก P0

### 1. พิสูจน์และแก้ AI Accept end-to-end

- [x] สร้าง test database หรือ isolated test fixture ที่ไม่แตะข้อมูลใช้งานจริง
- [x] สร้างบทความ Draft พร้อม title, excerpt และ reader/editor blocks
- [x] สร้าง AI suggestion แบบ deterministic โดยไม่เรียก provider จริง
- [x] เรียก Accept ผ่าน action/API เดียวกับหน้า Admin
- [x] ยืนยันว่า `Content` ถูกอัปเดตจริง
- [x] ยืนยันว่ามี `ContentRevision` ก่อนเปลี่ยนข้อมูล
- [x] ยืนยันว่า suggestion เปลี่ยนเป็น `ACCEPTED` เฉพาะเมื่อ transaction สำเร็จ
- [x] โหลดข้อมูลกลับมาใหม่และยืนยันว่า Editor แสดงข้อความใหม่
- [x] ยืนยันว่า Preview/Public artifact แสดงข้อความใหม่
- [x] เพิ่มกรณี content ถูกแก้หลัง Generate แล้ว Accept ต้องถูกปฏิเสธ
- [x] เพิ่มกรณี transaction ล้มเหลวแล้ว Content/suggestion ต้องไม่ค้างครึ่งทาง
- [x] แก้ root cause หาก test ข้อใดไม่ผ่าน

เกณฑ์เสร็จ: test เดียวต้องพิสูจน์เส้นทาง `suggestion → Accept → revision → Content → Editor/Preview` และอาการ “Accept แล้วข้อความไม่เปลี่ยน” ต้องทำซ้ำไม่ได้

### 2. วาง integration/E2E test foundation

- [x] เลือก test runner สำหรับ browser E2E และบันทึกเหตุผลในเอกสาร architecture
- [x] เพิ่มคำสั่ง `test:integration` และ `test:e2e` แยกจาก unit tests
- [x] สร้าง environment/test database reset ที่รันซ้ำได้
- [x] ป้องกัน test suite เชื่อมต่อ production database
- [x] ทำ fixture สำหรับ Owner login และ sample content
- [x] เพิ่ม critical smoke test: Login → Create → Autosave → Publish → Public reader
- [x] เพิ่ม test Revision restore
- [x] เพิ่ม test Media upload โดยใช้ temporary/local storage

เกณฑ์เสร็จ: test รันซ้ำได้โดยไม่พึ่งข้อมูลเดิม ไม่เรียก AI จริง และไม่เขียน production storage

ผลตรวจรับ 4 สิงหาคม 2026: Vitest integration 3/3 และ Playwright E2E 4/4 ผ่านบน PostgreSQL database แยกชื่อ `knowledge_hub_test`

## งานถัดไป — ความปลอดภัยของข้อมูล

### 3. Confirmed backup restore/import

- [x] ออกแบบ restore service แยก validation, planning และ writing
- [x] เพิ่ม dry-run พร้อมสรุปจำนวน record ที่จะ create/update/skip
- [x] ตรวจ backup version และ referential integrity ก่อนเขียน
- [x] บังคับสร้าง backup ปัจจุบันก่อน restore
- [x] เพิ่ม confirmation ที่ระบุผลกระทบชัดเจน
- [x] เขียนข้อมูลด้วย transaction ตามขอบเขตที่ปลอดภัย
- [x] เพิ่ม audit log โดยไม่บันทึก secret หรือข้อมูลอ่อนไหวเกินจำเป็น
- [x] เพิ่ม integration tests สำหรับ valid, invalid และ interrupted restore
- [x] เขียน recovery/rollback procedure และทดลอง restore drill

เกณฑ์เสร็จ: restore จาก backup ที่ทดสอบแล้วได้ครบ และความล้มเหลวไม่ทำให้ฐานข้อมูลอยู่ในสภาพครึ่งหนึ่ง

ผลตรวจรับ 6 สิงหาคม 2026: Restore ใช้กลยุทธ์ full-replace แยก 3 เฟส (`validateBackupIntegrity` pure / `planRestore` read-only / `executeRestore` transaction) ที่ `src/core/backup/restore.ts` พร้อม API `/api/admin/backup/restore` (dry-run + execute) และ UI ที่ `/admin/settings` ระบบสร้าง pre-restore backup ก่อนเขียนเสมอและคืนให้ดาวน์โหลด, เขียนทั้ง 20 ตารางใน transaction เดียว (timeout 120 s), บันทึก audit `DATABASE_RESTORED` เฉพาะ metadata ไม่มี secret, integration tests 7 กรณีครอบคลุม valid/dry-run/broken integrity/dangling parent/transaction rollback/schema/category hierarchy ผ่านครบ; rollback ทำโดย restore pre-restore backup ที่ดาวน์โหลดไว้

## งานถัดไป — Editor และ Content Workflow

### 4. Rich Block Editor

- [ ] ทำ native BlockNote blocks สำหรับ callout และ toggle โดยไม่ flatten เมื่อเปิดแก้ไขใหม่
- [ ] เพิ่ม quote block
- [ ] เพิ่ม image block และเลือกภาพจาก Media Library
- [ ] เพิ่ม YouTube/embed block พร้อม URL validation
- [ ] เพิ่ม bookmark และ attachment ตามความจำเป็นจริง
- [ ] เพิ่ม fallback/migration สำหรับ document version เก่า
- [ ] ทดสอบ save → reload → edit → export ของทุก block
- [ ] ตรวจ keyboard, mobile, loading, empty และ error states

### 5. Content management workflows

- [ ] Relations UI และการแสดงผลในบทความ
- [ ] Sources UI และการแสดงผลในบทความ
- [ ] Tag Alias workflow
- [ ] Content duplicate
- [ ] Permanent delete พร้อม confirmation/audit
- [ ] Bulk actions และ quick metadata edit
- [ ] Inbox merge, bulk organize และ convert workflow
- [ ] Media search/filter, dimensions, usage count, replace และ insert-to-editor
- [ ] Dashboard แสดงเนื้อหาไม่มี Tag, SEO ไม่ครบ และ Media ไม่ถูกใช้งาน
- [ ] Quick Capture รองรับ source URL, pasted code และ image upload
- [ ] Content Manager Card view และ Table view หากข้อมูลเริ่มมาก
- [ ] Category hierarchy/subcategory หากยังต้องการตาม blueprint
- [ ] Tag merge และ slug redirect workflow

## งานถัดไป — Learning Examples

### 6. Admin authoring สำหรับ Learning Blocks

- [x] สร้าง BlockNote custom block สำหรับ Executable Code
- [x] สร้าง Formula Example block สำหรับ DAX, Power Query M, Excel และ Google Sheets
- [x] สร้าง Automation Script block สำหรับ VBA และ Google Apps Script
- [x] ทำ editor fields สำหรับ dialect/engine/platform และ execution mode
- [x] ทำ structured input/output editor แบบ Table, Text, JSON และ Error
- [x] เพิ่ม compatibility, prerequisites, host requirements, permissions/triggers และ verified date
- [x] รักษา block metadata เมื่อ save/reload และเมื่อ AI suggestion ทำงาน
- [x] เพิ่ม Copy, responsive table และ accessibility ใน Public reader
- [x] เพิ่ม export/import regression tests
- [x] เพิ่ม privacy validation ป้องกัน token, credential และ private identifiers

เกณฑ์เสร็จ: Owner สร้างและแก้ทั้งสาม block จาก Admin ได้ ส่วน Public อ่าน/Copy saved output ได้แต่ไม่มี Edit, Run หรือ Playground

### 7. Dataset Registry และ SQL sandbox

- [x] ออกแบบ Dataset Registry: id, version, schema, dictionary, license และ checksum
- [x] เพิ่ม sample datasets แบบ deterministic: Sales, Inventory และ Employees/Supply Chain
- [x] แยก dataset ออกจาก production database และทำ reset ได้
- [x] เพิ่ม DuckDB/SQLite Browser Worker เฉพาะ Admin
- [x] ปิด network และจำกัด timeout, memory, row count และ output size
- [x] terminate worker เมื่อ timeout
- [x] ทำ Run → Review → Save Structured Output
- [x] แสดง dataset/runtime version และ executed time
- [x] เพิ่ม deterministic regression tests ของ query/output
- [x] รองรับ `tsql` แบบ Preview/Saved-output เท่านั้น
- [x] รองรับ `tsql-compatible` ด้วย original query และ DuckDB-compatible query ที่ Owner ตรวจเอง
- [x] ไม่รวม SQL Server execution จริงใน MVP

เกณฑ์เสร็จ: Owner รันเฉพาะ DuckDB/SQLite ใน sandbox และบันทึกผลได้ โดย Public เห็นเพียง source กับผลที่บันทึกแล้ว

ผลตรวจรับ 4 สิงหาคม 2026: DuckDB-Wasm และ SQLite/sql.js Run → Review → Save → reload → Preview ผ่าน Playwright E2E; Formula/Automation native block, metadata และ structured output ผ่าน E2E เช่นกัน

## งานถัดไป — Operations

### 8. Scheduled publishing

- [x] สร้าง scheduler/worker หรือ cron endpoint พร้อม authentication
- [x] ทำ publish job ให้ idempotent และรองรับ retry
- [x] ใช้ timezone/UTC อย่างชัดเจน
- [x] เพิ่ม audit log และ failure visibility
- [x] เพิ่ม tests สำหรับ due, not-due, duplicate run และ failed run

ผลตรวจรับ 7 สิงหาคม 2026: Scheduler อยู่ที่ `src/core/content/scheduler.ts` เปรียบเทียบ `scheduledAt <= now` เป็น UTC ทั้งหมด แต่ละรายการถูก claim ด้วย `updateMany` ที่มี guard `status = "SCHEDULED"` จึง idempotent และปลอดภัยต่อ cron ซ้ำ/ซ้อน รายการที่ล้มเหลวค้าง SCHEDULED เพื่อ retry รอบถัดไป cron endpoint คือ `POST /api/admin/scheduled-publish` ยืนยันสิทธิ์ด้วย owner session หรือ `Authorization: Bearer <SCHEDULER_SECRET>` (timing-safe) พร้อม rate limit; UI ตั้งเวลา/ยกเลิกอยู่ในหน้า Content list; integration tests 6 กรณีครอบคลุม due/unlisted/not-due/duplicate/failed-run/retry ผ่านครบ

### 9. Production readiness

- [ ] เพิ่ม structured error reporting และ request correlation
- [ ] เพิ่ม slow-query/database monitoring
- [ ] เพิ่ม AI failure/usage dashboard
- [ ] กำหนด automated PostgreSQL backup และ object-storage versioning
- [ ] เขียน deployment guide ตาม platform ที่เลือกจริง
- [ ] ตั้ง preview environment เป็น `noindex`
- [ ] เพิ่ม accessibility และ visual regression coverage สำหรับ themes/viewport สำคัญ

## Public Experience ที่ยังไม่ครบ

### 10. Public reader และ discovery

- [ ] Article แสดง Sources/References จาก data model
- [ ] Related Content จาก relation หรือกฎที่ตรวจสอบได้
- [ ] Previous/Next Content นอก Series หากยังต้องการ
- [ ] Revision notice สำหรับบทความที่อัปเดตสำคัญ
- [ ] Share/Copy Link พร้อม feedback ที่เข้าถึงได้
- [ ] Owner/Author profile จาก Settings แทนชื่อที่ hard-code ในหน้าและ structured data
- [ ] Reader controls: font size, content width และ line height
- [ ] Focus mode; Light/Dark mode ระดับเว็บไซต์มีแล้ว
- [ ] เปิด/ปิด Toggle ทั้งหมด
- [ ] Scroll progress และ Back to top
- [ ] จำ reader settings ใน browser
- [ ] Category featured content และ List/Card switch
- [ ] Related Tags และ Tag Alias resolution
- [ ] Series cover และ Owner reading progress หากยังต้องการ
- [ ] Search filter: type, category, tag, series, created/updated date, code และ media
- [ ] Search sort by relevance/updated date และ keyword highlighting
- [ ] Search index Sources, Alias และ AI keywords
- [ ] ตรวจ/เพิ่ม basic typo tolerance และ prefix search
- [ ] About page ใช้ข้อมูลจริงจาก Settings: skills, experience, projects, contacts, stack และ learning journey
- [ ] หน้า `/projects`
- [ ] หน้า `/archive`
- [ ] พิจารณา Changelog, Privacy และ Terms แล้วบันทึกว่าจะสร้างหรือตัดออก
- [ ] Custom 404 ที่ตรงกับแต่ละ theme

### 11. Navigation และ Site Settings

- [ ] Navigation model ที่ไม่ผูกกับ Theme: label, URL, type, parent, position และ visibility
- [ ] Admin Navigation UI ที่ `/admin/navigation`
- [ ] รองรับ internal page, category, series, collection, external URL และ custom item
- [ ] Theme render navigation tree ผ่าน contract เดียวกัน
- [ ] Site logo และ favicon management
- [ ] Default language, timezone และ date format settings
- [ ] Footer และ social links settings
- [ ] Default SEO settings
- [ ] Analytics settings โดยไม่ติดตาม Private content
- [ ] Upload limit และ feature-flag settings
- [ ] ตรวจ Theme Preview, Reset Settings, compatibility/version และ missing-feature UI ให้ครบ
- [ ] Theme ZIP/Marketplace คงไว้หลัง MVP และห้ามรัน third-party code ที่ไม่ได้ build

## AI ที่ยังไม่ครบ

### 12. AI workflow และการควบคุมค่าใช้จ่าย

- [ ] Rewrite modes ครบตามที่ต้องใช้จริง: Concise, Tutorial, Beginner, Technical, Public และ Proofread
- [ ] Actions เพิ่มเติม: Summarize, Expand, Shorten, Explain, Steps, Checklist, FAQ และ Key Takeaways
- [ ] Suggest Category, Tags, Series, Relations, merge/split และ internal links
- [ ] Metadata suggestions: slug, meta title/description, OG, alt text และ content type
- [ ] Diff แบบ inline และ block-by-block นอกเหนือจากมุมมองปัจจุบัน
- [ ] Accept/Reject ราย block และ selected changes
- [ ] Edit suggestion และ Restore Original
- [ ] Lock heading/code/number และ flag สิ่งที่ AI ไม่แน่ใจ
- [ ] ยืนยัน safety rules ด้วย automated tests: ไม่แต่ง source, ไม่เปลี่ยน code/ตัวเลข และไม่ publish เอง
- [ ] AI Settings UI สำหรับ provider/model/task/token/timeout/retry
- [ ] Provider abstraction และ fallback provider หากยังต้องการหลาย provider
- [ ] Prompt template version management
- [ ] Retry งานล้มเหลวจาก AI Workspace
- [ ] Estimated cost, usage summary และ error dashboard
- [ ] Monthly budget/usage limit และ warning
- [ ] Cache/deduplicate งานจาก input hash
- [ ] Background queue/worker เมื่อ synchronous workload ไม่พอ

## SEO, AEO และ GEO ที่ยังไม่ครบ

### 13. Metadata และ content quality

- [ ] ตรวจ metadata ต่อ content: meta title, description, canonical, OG และ Twitter card
- [ ] ตรวจ structured data ที่มีจริง: WebSite, Person, Article/TechArticle และ BreadcrumbList
- [ ] เพิ่ม CollectionPage/ProfilePage/ImageObject/VideoObject เฉพาะเมื่อข้อมูลบนหน้าครบ
- [ ] FAQPage เฉพาะหน้าที่เป็น FAQ จริงและเป็นไปตามข้อกำหนดปัจจุบัน
- [ ] SEO review UI และ recommendation โดยไม่บังคับแก้เนื้อหา
- [ ] ตรวจ missing alt, heading structure, thin content, missing source และ freshness
- [ ] Broken-link check
- [ ] Internal-link suggestions
- [ ] AEO blocks: Summary, Direct Answer, Takeaways, Definition, Steps, FAQ, Mistakes และ Limitations
- [ ] ตรวจ indexing rule ของ Public, Unlisted, Private และ Preview environments ด้วย tests
- [ ] Dynamic Open Graph image หากยังต้องการตาม route blueprint

## Media, Embed และ Files ที่ยังไม่ครบ

### 14. Media processing และ external content

- [ ] Drag-and-drop upload และ retry/error recovery ที่ละเอียดกว่าสถานะพื้นฐานปัจจุบัน
- [ ] เก็บ width/height และสร้าง responsive image variants
- [ ] สร้าง placeholder และ image optimization pipeline
- [ ] รองรับ AVIF/GIF ตาม file-size policy
- [ ] ตัดสินใจเรื่อง sanitized SVG; ค่าเริ่มต้นยังคงไม่รับ SVG
- [ ] External image: hotlink, download-to-library และ source credit
- [ ] YouTube URL parser, preview, caption และ privacy-enhanced embed
- [ ] `/api/embed-preview` พร้อม SSRF protection, private-IP block, timeout และ response-size limit
- [ ] Link preview metadata และ fetch status
- [ ] File attachments: PDF/TXT/CSV/XLSX/DOCX/source files ตาม policy
- [ ] Private media แยก bucket/prefix และใช้ signed URL หรือ authenticated route
- [ ] Media manifest export

## Import, Export และ Data Portability ที่ยังไม่ครบ

### 15. Import/export workflows

- [ ] Markdown import
- [ ] Plain Text import
- [ ] Basic sanitized HTML import
- [ ] JSON system import พร้อม version migration
- [ ] Full content archive export
- [ ] Single Content HTML export
- [ ] Dataset/output export
- [ ] Import API และ Admin UI พร้อม preview/dry-run
- [ ] Unsupported Block fallback ที่เก็บข้อมูลต้นฉบับโดยไม่ทิ้งเงียบ ๆ
- [ ] Notion Markdown/CSV import หลัง MVP
- [ ] Word/PDF best-effort import หลัง MVP
- [ ] Static public export หากมี use case จริง

## Security และสิทธิ์ที่ยังต้องเสริม

### 16. Security hardening

- [ ] Security review ของ authentication, authorization และ mutation endpoints
- [ ] Session revoke/logout-all workflow
- [ ] พิจารณา Google OAuth/Passkey/MFA สำหรับ Owner แล้วบันทึกการตัดสินใจ
- [ ] Preview share token ที่หมดอายุได้ หากต้องแชร์ Private preview
- [ ] แยก Public/Private object storage access
- [ ] ตรวจ AI job authorization ก่อนอ่าน content ด้วย integration tests
- [ ] ตรวจ search scope ไม่รั่ว Private/Unlisted ด้วย integration tests
- [ ] Content Security Policy ที่เหมาะกับ Editor, media และ embed
- [ ] Dependency/vulnerability scanning ใน CI
- [ ] ตรวจ production errors ไม่เผย stack, SQL หรือ secret
- [ ] Admin Audit Log UI ที่ `/admin/audit`

## Performance, Accessibility และ Quality Coverage

### 17. Performance

- [ ] ตรวจ cache/revalidation หลัง publish, unpublish, slug และ taxonomy changes
- [ ] ยืนยันว่า Public ไม่โหลด Editor bundle
- [ ] Lazy-load embeds และ optimize images
- [ ] ลด client JavaScript และแยก theme CSS ตามความเหมาะสม
- [ ] Virtualize/paginate Admin content และ Media เมื่อข้อมูลมาก
- [ ] Background processing สำหรับ AI/import งานยาว
- [ ] ตรวจ database indexes และ query plans ด้วย dataset ขนาดใกล้ใช้งานจริง
- [ ] เพิ่ม full-text index หากการค้นหาปัจจุบันไม่รองรับปริมาณจริง
- [ ] กำหนด performance budgets/Core Web Vitals และวัดใน CI หรือ monitoring

### 18. Accessibility

- [ ] Keyboard flow สำหรับ Editor, Slash Menu, dialogs และ Admin actions
- [ ] Visible focus และ focus restoration
- [ ] Color contrast ของ Clarity และ Notebook
- [ ] Heading structure และ landmark audit
- [ ] Accessible names และ ARIA สำหรับ Toggle/interactive controls
- [ ] Alt-text workflow และ validation
- [ ] Code Copy feedback สำหรับ screen reader
- [ ] `prefers-reduced-motion`
- [ ] Theme accessibility checklist และ automated axe coverage

### 19. Test coverage ที่ยังขาด

- [ ] Unit: theme contract, SEO metadata, AI output/cost, permission และ visibility edge cases
- [ ] Rendering: nested toggle, links, embeds, images, invalid JSON และ old schema version
- [ ] Integration: create/edit/autosave/revision/publish/unpublish/upload/embed/search/theme activation
- [ ] E2E: code, image, YouTube, toggle, AI rewrite, List/Card, Search, Theme และ Revision restore
- [ ] Visual: Home desktop/mobile, Library, Article, Code, Toggle, Dark mode, About และ 404 ทุก theme
- [ ] CI pipeline รัน typecheck, lint, unit, integration, E2E และ build ตามระดับความเสี่ยง

## Route/API gaps จาก Blueprint

Route ใน blueprint ไม่จำเป็นต้องสร้างแยก หาก workflow อยู่ใน route อื่นครบแล้ว ให้ติ๊กพร้อมบันทึก mapping แทน

- [ ] `/projects`
- [ ] `/archive`
- [ ] `/admin/navigation`
- [ ] `/admin/audit`
- [ ] พิจารณา `/admin/backups`; ปัจจุบัน Backup อยู่ใน Settings
- [ ] Import endpoint/UI
- [ ] Embed preview endpoint
- [x] Scheduled-job endpoint — `POST /api/admin/scheduled-publish` (7 ส.ค. 2026)
- [ ] Preview share endpoint/token หากต้องใช้
- [ ] Dynamic Open Graph image route หากต้องใช้

## Backlog หลัง MVP

- [ ] Semantic/vector search
- [ ] Natural-language knowledge assistant
- [ ] Knowledge graph และ contradiction detection
- [ ] Suggested learning paths และ learning summaries
- [ ] Advanced SEO/AEO assistant และ content freshness automation
- [ ] Analytics
- [ ] Theme package installation/marketplace
- [ ] Notion/Word/PDF best-effort import
- [ ] ศึกษา isolated SQL Server sandbox แยกต่างหาก หากมีความจำเป็นจริง
- [ ] Content density: Compact/Standard/Comfortable
- [ ] Series reading progress
- [ ] Static public export
- [ ] Theme marketplace/third-party theme installation พร้อม sandbox/security model

## Checklist ก่อนจบแต่ละรอบงาน

- [ ] Requirement และขอบเขตยังตรงกับ README/เอกสารนี้
- [ ] ไม่มี secret, credential หรือข้อมูลจริงหลุดเข้า fixture/log/output
- [ ] Migration มีวิธี rollback หรือ recovery
- [ ] Error, loading และ empty states ครบตามขอบเขต
- [ ] Mobile และ keyboard ใช้งานได้ในส่วนที่แก้
- [ ] Unit/integration/E2E tests ที่เกี่ยวข้องผ่าน
- [ ] `npm run typecheck`
- [ ] `npm run lint`
- [ ] `npm test`
- [ ] `npm run build`
- [ ] อัปเดต README, implementation gap และ checklist นี้ตามสถานะจริง

## บันทึกรอบงาน

ใช้ส่วนนี้จดก่อนหยุด เพื่อเริ่มรอบถัดไปได้ทันที:

- วันที่: 7 สิงหาคม 2026
- เป้าหมายรอบนี้: ปิดงานข้อ 3 (Confirmed backup restore/import) และข้อ 8 (Scheduled publishing)
- ทำเสร็จ: restore service 3 เฟส + API + UI + tests 7 กรณี; scheduler service (UTC, idempotent claim, retry), cron endpoint `/api/admin/scheduled-publish` (Bearer/owner auth), Server Actions ตั้งเวลา/ยกเลิก, UI ใน Content list, status "scheduled" ใน repository/types, integration tests 6 กรณี, อัปเดตเอกสาร
- กำลังทำ: —
- ปัญหาที่พบ: `inserted` ถูกอ้างอิงก่อน initialization ใน restore transaction (แก้เป็นใช้ `written`), test database ต้อง start container `knowledge-hub-test-db` ที่ port 55432
- ไฟล์สำคัญที่แก้: `src/core/backup/restore.ts` (ใหม่), `src/app/api/admin/backup/restore/route.ts` (ใหม่), `src/components/admin/backup-restore.tsx` (ใหม่), `src/core/content/scheduler.ts` (ใหม่), `src/app/api/admin/scheduled-publish/route.ts` (ใหม่), `src/app/admin/content/actions.ts`, `src/app/admin/content/page.tsx`, `src/core/content/types.ts`, `src/core/content/repository.ts`, `src/app/admin/settings/page.tsx`, `src/app/globals.css`, `tests/integration/backup-restore.test.ts` (ใหม่), `tests/integration/scheduled-publish.test.ts` (ใหม่)
- คำสั่งตรวจสอบและผลลัพธ์: `npm run typecheck` ผ่าน, `npm run lint` ผ่าน, `npm test` 39/39 ผ่าน, `npm run test:integration` 16/16 ผ่าน, `npm run build` ผ่าน
- ขั้นแรกของรอบถัดไป: งานข้อ 9 — Production readiness (structured error reporting, request correlation, monitoring, deployment guide) หรือข้อ 4 — Rich Block Editor ตามลำดับที่เลือก
