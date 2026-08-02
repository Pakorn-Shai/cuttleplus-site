# Personal Knowledge Web

เว็บคลังความรู้ส่วนตัวที่เน้นการอ่านง่าย การจัดระเบียบ และการค้นหาสิ่งที่เคยเรียนรู้ พัฒนาด้วย Next.js, TypeScript, BlockNote และ Prisma

> **สถานะปัจจุบัน:** Foundation prototype พร้อม Public/Admin, BlockNote editor, taxonomy, safe rendering, Revision History, Media Library/S3, production safeguards และ OpenRouter AI Suggestion/Diff Review รายละเอียดขอบเขตและลำดับงานถัดไปอยู่ที่ [docs/architecture.md](docs/architecture.md)

## ทดลองผ่าน Local

### สิ่งที่ต้องมี

- Node.js `20.9` ขึ้นไป
- npm (มาพร้อม Node.js)

### ติดตั้งและเปิด Development Server

```bash
cp .env.example .env
npm ci
npm run dev
```

จากนั้นเปิด [http://localhost:3000](http://localhost:3000) ในเบราว์เซอร์ หาก port `3000` ถูกใช้งานอยู่ Next.js จะเลือก port ถัดไปและแสดง URL จริงใน terminal

โปรเจกต์อ่านและเขียนข้อมูลผ่าน PostgreSQL/Prisma แล้ว หลังตั้ง `DATABASE_URL` ให้รัน `npm run db:migrate` และ `npm run db:seed` ก่อนเปิดเว็บครั้งแรก

### URL สำหรับตรวจสอบ

| ส่วน | URL | สิ่งที่ควรเห็น |
| --- | --- | --- |
| หน้าแรก | [http://localhost:3000](http://localhost:3000) | Hero, หมวดหมู่ และเนื้อหาล่าสุด |
| คลังความรู้ | [http://localhost:3000/knowledge](http://localhost:3000/knowledge) | List/Card view, filter และ sample content |
| ค้นหา | [http://localhost:3000/search](http://localhost:3000/search) | ค้นจากชื่อ เนื้อหา หมวดหมู่ และ tag |
| หมวดหมู่ | [http://localhost:3000/categories](http://localhost:3000/categories) | รายการหมวดหมู่และจำนวนบทความ |
| เกี่ยวกับ | [http://localhost:3000/about](http://localhost:3000/about) | หน้าแนะนำ Knowledge Hub |
| Admin | [http://localhost:3000/admin](http://localhost:3000/admin) | Dashboard และเมนูจัดการต้นแบบ |
| Editor | [http://localhost:3000/admin/content/new](http://localhost:3000/admin/content/new) | BlockNote editor prototype |
| Media Library | [http://localhost:3000/admin/media](http://localhost:3000/admin/media) | อัปโหลด JPEG/PNG/WebP/GIF และจัดการ metadata |
| AI Workspace | [http://localhost:3000/admin/ai](http://localhost:3000/admin/ai) | สร้าง ตรวจ diff และ Accept/Reject suggestion |
| Search API | [http://localhost:3000/api/search?q=SQL](http://localhost:3000/api/search?q=SQL) | ผลการค้นหาในรูป JSON |
| Health Check | [http://localhost:3000/api/health](http://localhost:3000/api/health) | สถานะ Application และ Database |

Admin บางเมนูยังเป็น placeholder แต่ Content Manager, Editor autosave, revision, publish/archive, Category/Tag/Collection management และ owner session guard เชื่อม Database แล้ว ต้องตั้ง `ADMIN_PASSWORD` และ `ADMIN_SESSION_SECRET` ก่อนเข้า `/admin`

## คำสั่งที่ใช้บ่อย

| คำสั่ง | หน้าที่ |
| --- | --- |
| `npm run dev` | เปิด development server พร้อม hot reload |
| `npm run build` | สร้าง production build |
| `npm start` | เปิด production server หลังจาก build แล้ว |
| `npm run typecheck` | ตรวจ TypeScript โดยไม่สร้างไฟล์ output |
| `npm run lint` | ตรวจรูปแบบและข้อผิดพลาดด้วย ESLint |
| `npm test` | รัน unit tests ด้วย Vitest |
| `npm run db:generate` | สร้าง Prisma Client จาก schema |
| `npm run db:validate` | ตรวจความถูกต้องของ Prisma schema |
| `npm run db:migrate` | Apply migrations ที่ยังไม่ถูกใช้กับ Database |
| `npm run db:seed` | สร้าง Owner, หมวดหมู่ และข้อมูลเริ่มต้น |
| `npm run db:backfill-renderer` | สร้าง HTML/plain text/heading artifacts ให้เนื้อหาเดิม |

ตรวจคุณภาพทั้งหมดก่อนส่งงาน:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

ตรวจแบบ production ผ่าน local:

```bash
npm run build
npm start
```

แล้วเปิด [http://localhost:3000](http://localhost:3000) เช่นเดียวกับ development mode

## Environment Variables

คัดลอก `.env.example` เป็น `.env` ก่อนเริ่มพัฒนา และห้าม commit ไฟล์ `.env` ที่มี secret จริง

| ตัวแปร | ใช้สำหรับ | สถานะใน Prototype |
| --- | --- | --- |
| `DATABASE_URL` | PostgreSQL connection string สำหรับ Prisma | จำเป็นสำหรับ Public และ Admin |
| `NEXT_PUBLIC_SITE_URL` | base URL สำหรับ metadata, robots และ sitemap | ใช้แล้ว; local ใช้ `http://localhost:3000` |
| `OWNER_EMAIL` | อีเมลเจ้าของระบบและชื่อผู้ใช้หน้า Login | แนะนำ; ใช้ `ADMIN_USERNAME` แทนได้ระหว่างย้ายระบบ |
| `ADMIN_USERNAME` | ชื่อผู้ใช้เดิมจาก CuttlePlus | ใช้เป็น fallback เมื่อไม่มี `OWNER_EMAIL` |
| `ADMIN_PASSWORD` | รหัสผ่าน Owner | จำเป็นสำหรับ Admin; ห้าม commit |
| `ADMIN_SESSION_SECRET` | ใช้ลงลายเซ็น session cookie; อย่างน้อย 32 ตัวอักษร | จำเป็นสำหรับ Admin; ห้าม commit |
| `STORAGE_ENDPOINT` | S3-compatible endpoint เช่น Cloudflare R2 | จำเป็นเมื่อ provider ไม่ใช่ AWS S3 |
| `STORAGE_REGION` | Region ของ S3; R2 ใช้ `auto` | จำเป็นใน Production |
| `STORAGE_BUCKET` | Bucket สำหรับไฟล์ Media | จำเป็นใน Production |
| `STORAGE_ACCESS_KEY_ID` | Access key ของ object storage | จำเป็นใน Production; ห้าม commit |
| `STORAGE_SECRET_ACCESS_KEY` | Secret key ของ object storage | จำเป็นใน Production; ห้าม commit |
| `STORAGE_PUBLIC_BASE_URL` | Public/CDN base URL ของ bucket | จำเป็นใน Production |
| `MAX_UPLOAD_BYTES` | ขนาด upload สูงสุด; default 5 MB และระบบ cap ที่ 10 MB | ไม่บังคับ |
| `OPENROUTER_API_KEY` | API key สำหรับ AI suggestion | จำเป็นเมื่อใช้ AI; ห้าม commit |
| `OPENROUTER_BASE_URL` | OpenRouter API base URL | default `https://openrouter.ai/api/v1` |
| `OPTIMIZER_MODEL` | model slug สำหรับ suggestion | default `openai/gpt-5.6-luna`; รองรับ `OPENROUTER_MODEL` เดิมเป็น fallback |
| `AI_MAX_TOKENS` | จำนวน output tokens สูงสุด | default `4096` |
| `AI_TEMPERATURE` | ระดับความสุ่มของคำตอบ (0-2) | default `0.2` |
| `AI_TIMEOUT` | timeout ของ provider หน่วยมิลลิวินาที | default `60000` |

## โครงสร้างโปรเจกต์ปัจจุบัน

```text
.
├── docs/                       # Architecture, technical spike และ theme contract
├── prisma/
│   └── schema.prisma           # Target database schema
├── src/
│   ├── app/                    # Next.js App Router: public, admin และ API routes
│   ├── components/             # Admin, public reader และ editor UI
│   ├── core/
│   │   ├── content/            # Domain types, slug policy และ repository contract
│   │   └── themes/             # Theme contracts ที่แยกจาก business logic
│   ├── lib/                    # Sample data สำหรับ prototype
│   └── themes/                 # Theme implementations และ registry
├── tests/                      # Unit tests ของ domain rules
├── .env.example                # ตัวอย่าง environment variables
├── next.config.ts              # Next.js configuration
├── package.json                # Scripts และ dependencies
└── vitest.config.ts            # Test configuration
```

เอกสารที่เกี่ยวข้อง:

- [Architecture](docs/architecture.md) — ขอบเขต implementation และลำดับพัฒนาถัดไป
- [Technical Spike](docs/technical-spike.md) — ผลทดลองและการตัดสินใจเชิงเทคนิค
- [Theme Contract](docs/theme-contract.md) — ขอบเขตและสัญญาระหว่าง Core กับ Theme

---

# แผนพัฒนา Personal Knowledge Web

> **สถานะเอกสาร:** Project Plan / System Blueprint<br>
> **เวอร์ชัน:** 0.1<br>
> **วันที่จัดทำ:** 30 กรกฎาคม 2026<br>
> **ชื่อโปรเจกต์:** ชื่อชั่วคราว — จะกำหนดชื่อและแบรนด์ใหม่ภายหลัง<br>
> **แนวทางการพัฒนา:** Greenfield Project — สร้างใหม่ทั้งหมด ไม่ใช้โค้ด โครงสร้างฐานข้อมูล หรือระบบ Theme จาก CuttlePlus เดิม

---

## 1. บทสรุปโปรเจกต์

โปรเจกต์นี้คือเว็บแอปสำหรับเก็บ จัดระเบียบ ค้นหา และเผยแพร่ความรู้ส่วนตัว โดยมีรูปแบบการเขียนคล้าย Notion แต่ลดส่วนที่ไม่จำเป็นสำหรับการทำงานหลายคนออก เน้นให้เจ้าของเว็บสามารถกลับมาอ่านความรู้ของตัวเองได้ง่าย เข้าใจเร็ว และค้นหาสิ่งที่เคยเรียนรู้ได้สะดวก

เนื้อหาภายในเว็บอาจครอบคลุมหลายหมวด เช่น:

- Excel
- Google Sheets
- Data Analysis
- Power BI
- SQL
- Python
- Programming
- Artificial Intelligence
- Marketing
- ERP
- Supply Chain
- Game Development
- Project Notes
- Learning Journal
- ความรู้ทั่วไปอื่น ๆ

เว็บแบ่งเป็นสองส่วนชัดเจน:

1. **หน้าบ้าน (Public Website)**<br>
   สำหรับอ่าน ค้นหา และเผยแพร่เนื้อหาที่กำหนดเป็น Public

2. **หลังบ้าน (Admin Application)**<br>
   สำหรับเขียน จัดระเบียบ ตรวจสอบ ใช้ AI ช่วยปรับเนื้อหา และบริหารเว็บไซต์

เป้าหมายอันดับแรกคือ:

> **ทำให้เจ้าของเว็บอ่านและเข้าใจความรู้ของตัวเองได้ง่ายที่สุด ก่อนพิจารณาเรื่องอันดับการค้นหา**

SEO, AEO และ GEO จะถูกออกแบบให้เป็นส่วนสนับสนุน โดยไม่บังคับให้เนื้อหาเปลี่ยนเป็นภาษาการตลาดหรือเต็มไปด้วยคำค้นจนอ่านยาก

---

# 2. ข้อตกลงสำคัญของโปรเจกต์

## 2.1 สร้างใหม่ทั้งหมด

โปรเจกต์นี้จะไม่เก็บหรือย้ายระบบจาก CuttlePlus เดิมมาใช้โดยตรง ได้แก่:

- ไม่ใช้ Source Code เดิม
- ไม่ใช้ Database Schema เดิม
- ไม่ใช้ Admin UI เดิม
- ไม่ใช้ระบบ Theme เดิม
- ไม่ใช้ระบบ Menu เดิม
- ไม่ผูกชื่อหรือแบรนด์กับ CuttlePlus
- ไม่จำเป็นต้องใช้ Infrastructure เดิม หากมีทางเลือกที่เหมาะสมกว่า

สิ่งที่นำมาใช้ได้มีเพียงประสบการณ์และบทเรียนจากการพัฒนาโปรเจกต์เดิมเท่านั้น

## 2.2 ชื่อโปรเจกต์เป็นชื่อชั่วคราว

ระหว่างพัฒนาให้ใช้ชื่อภายใน เช่น:

- `personal-knowledge-web`
- `knowledge-vault`
- `knowledge-hub`

ชื่อจริง โลโก้ สี และโดเมน สามารถกำหนดภายหลังโดยไม่กระทบโครงสร้างระบบ

## 2.3 Theme ต้องเปลี่ยนได้

ระบบต้องรองรับ Theme ตั้งแต่ระดับสถาปัตยกรรม แต่ไม่จำเป็นต้องสร้าง Theme Marketplace ในเวอร์ชันแรก

แนวทางคือ:

- Theme มีผลเฉพาะหน้าบ้าน
- หลังบ้านใช้ Admin Design System เดียวที่คงที่
- เพิ่ม Theme ใหม่ผ่านโค้ดหรือ Package ได้
- Theme ใช้ข้อมูลเนื้อหาร่วมกัน
- เปลี่ยน Theme แล้ว URL และเนื้อหาเดิมต้องไม่เสีย
- Theme ต้องมี Manifest และ Compatibility Version
- Theme แต่ละตัวมีค่าตั้งของตัวเองได้
- ห้ามให้ Theme แก้ไข Business Logic หรือฐานข้อมูลโดยตรง

---

# 3. วิสัยทัศน์ของผลิตภัณฑ์

## 3.1 Product Vision

> เว็บคลังความรู้ส่วนตัวที่เขียนได้อิสระเหมือนสมุดโน้ต จัดระเบียบได้เหมือน Knowledge Base อ่านง่ายเหมือนบทความ และมี AI เป็นผู้ช่วยเรียบเรียงหลังจากเจ้าของเขียนเสร็จ

## 3.2 คุณค่าหลัก

### Capture

บันทึกสิ่งที่เรียนรู้ได้เร็ว โดยไม่จำเป็นต้องจัดหมวดหมู่ทุกอย่างตั้งแต่แรก

### Organize

จัดความรู้ด้วย Category, Tag, Series, Collection, Related Content และ AI Suggestions

### Understand

ออกแบบหน้าอ่านให้สบายตา มีสารบัญ สรุป ตัวอย่าง Code และหัวข้อแบบพับเก็บได้

### Retrieve

ค้นหาจากชื่อ เนื้อหา Code Tag หมวดหมู่ และภาษาธรรมชาติได้

### Improve

AI ช่วยเรียบเรียงเนื้อหาใหม่หลังเขียนเสร็จ โดยไม่เขียนทับต้นฉบับทันที

### Publish

เลือกเผยแพร่บางเนื้อหาให้คนทั่วไปอ่าน พร้อมโครงสร้าง SEO, AEO และ GEO ที่เหมาะสม

---

# 4. เป้าหมายและสิ่งที่ไม่ใช่เป้าหมาย

## 4.1 เป้าหมาย

- มี Block Editor ที่ใช้งานใกล้เคียง Notion
- เขียนบทความ เทคนิค ขั้นตอน และ Code ได้สะดวก
- รองรับหัวข้อแบบพับและขยาย
- รองรับรูปภาพ ลิงก์ วิดีโอ YouTube และไฟล์แนบ
- มี List View และ Card View
- มีหน้าบ้านและหลังบ้านแยกกัน
- ใช้ AI ช่วยปรับเนื้อหาหลังเขียนเสร็จ
- เก็บต้นฉบับและประวัติการแก้ไขได้
- รองรับ Private, Unlisted และ Public
- ค้นหาเนื้อหาได้รวดเร็ว
- Export ข้อมูลออกได้
- เปลี่ยน Theme หน้าบ้านได้
- รองรับ SEO, AEO และ GEO สำหรับเนื้อหาสาธารณะ
- ออกแบบให้ขยาย Semantic Search และ AI Knowledge Assistant ได้ในอนาคต

## 4.2 สิ่งที่ไม่ใช่เป้าหมายในระยะแรก

- ไม่ทำระบบ Workspace แบบ Notion
- ไม่ทำ Real-time Collaboration
- ไม่ทำระบบสมาชิกสำหรับผู้เขียนหลายคน
- ไม่ทำ Social Network
- ไม่ทำ Comment System ใน MVP
- ไม่ทำ Theme Marketplace
- ไม่อนุญาตให้อัปโหลด Theme ZIP แล้วรัน Code บน Server
- ไม่ให้ AI เผยแพร่เนื้อหาเอง
- ไม่สร้าง AI Agent ที่แก้ข้อมูลทั้งหมดโดยไม่ผ่านการตรวจ
- ไม่สร้าง Mobile App แบบ Native ในช่วงแรก
- ไม่เน้นการสร้างรายได้
- ไม่เน้นโฆษณา การสมัครสมาชิก หรือ Paywall

---

# 5. กลุ่มผู้ใช้งาน

## 5.1 Owner / Admin

มีผู้ใช้งานหลักหนึ่งคน สามารถ:

- เขียนและแก้ไขเนื้อหา
- จัดหมวดหมู่
- กำหนดสถานะและการมองเห็น
- อัปโหลดไฟล์
- ใช้ AI
- เปลี่ยน Theme
- จัดการ SEO
- ดู Revision History
- Export และ Backup ข้อมูล
- ตั้งค่าเว็บไซต์

## 5.2 Public Reader

ผู้เข้าชมทั่วไปสามารถ:

- อ่านเนื้อหา Public
- ค้นหาเนื้อหา Public
- เลือก List View หรือ Card View
- ดูหมวดหมู่และ Tag
- ดูบทความที่เกี่ยวข้อง
- ปรับรูปแบบการอ่าน
- เปิดลิงก์หรือสื่อที่ฝังในบทความ

## 5.3 Unlisted Reader

ผู้ที่ได้รับลิงก์สามารถอ่านเนื้อหา Unlisted ได้ แต่:

- เนื้อหาไม่แสดงในหน้า Library
- ไม่แสดงใน Sitemap
- ตั้งค่า `noindex`
- ไม่แสดงใน Related Content สาธารณะ
- ไม่ค้นพบผ่าน Public Search ตามค่าเริ่มต้น

---

# 6. หลักการออกแบบระบบ

## 6.1 Readability First

ทุก Feature ต้องตอบคำถามว่า:

> Feature นี้ช่วยให้กลับมาอ่านแล้วเข้าใจง่ายขึ้นหรือไม่

แนวทาง:

- ความกว้างของเนื้อหาไม่กว้างเกินไป
- ขนาดตัวอักษรอ่านง่าย
- ระยะห่างหัวข้อชัดเจน
- Code อ่านง่ายและ Copy ได้
- มีสารบัญ
- มีส่วนสรุป
- ไม่แสดง Widget ที่ไม่จำเป็น
- ไม่มีโฆษณาคั่นเนื้อหา
- Dark Mode และ Light Mode
- รองรับจอ Desktop, Tablet และ Mobile

## 6.2 Content Ownership

ข้อมูลต้องย้ายออกจากระบบได้:

- Export Markdown
- Export HTML
- Export JSON
- Export Media Manifest
- Backup Database
- Import กลับได้
- ไม่ผูกข้อมูลไว้กับ Editor Library เพียงอย่างเดียว

## 6.3 AI as Assistant

AI มีหน้าที่เสนอ ไม่ใช่ตัดสินใจแทน:

- ไม่เขียนทับต้นฉบับอัตโนมัติ
- ไม่เปลี่ยน Code โดยไม่ได้รับอนุญาต
- ไม่สร้างแหล่งอ้างอิงปลอม
- ไม่เผยแพร่เอง
- แสดง Diff ก่อนยืนยัน
- บันทึกว่าเนื้อหาส่วนใดผ่าน AI
- สามารถย้อนกลับได้

## 6.4 Public and Private Separation

- Route หลังบ้านต้องมี Authentication
- Private Content ไม่ถูก Render ใน Public Route
- Private Content ไม่อยู่ใน Sitemap
- Private Content ไม่ถูกส่งเข้า Public Search Index
- AI Provider ต้องได้รับเฉพาะข้อมูลที่ผู้ใช้สั่งให้ประมวลผล
- Log ต้องไม่บันทึก Secret หรือเนื้อหาส่วนตัวเกินความจำเป็น

## 6.5 Theme Independence

Theme ต้องรับข้อมูลผ่าน Contract ที่กำหนด ไม่อ่านฐานข้อมูลโดยตรง

---

# 7. ขอบเขตหน้าบ้าน

## 7.1 หน้าแรก

องค์ประกอบที่ควรตั้งค่าได้:

- Hero Section
- ชื่อเว็บไซต์
- คำอธิบายสั้น
- รูปหรือ Illustration
- หมวดหมู่แนะนำ
- เนื้อหาล่าสุด
- เนื้อหาเด่น
- Series แนะนำ
- Project หรือ About Preview
- ปุ่มเข้าสู่ Knowledge Library
- Footer

แต่ละ Theme สามารถจัด Layout ต่างกันได้ โดยใช้ข้อมูลชุดเดียวกัน

## 7.2 Knowledge Library

รองรับสองมุมมอง:

### List View

เหมาะกับการค้นหาและอ่านรายการจำนวนมาก

ข้อมูลที่แสดงได้:

- Icon ประเภทเนื้อหา
- ชื่อ
- คำอธิบายสั้น
- Category
- Tags
- วันที่อัปเดต
- ระยะเวลาอ่าน
- สถานะเนื้อหาใหม่หรืออัปเดต
- Cover แบบย่อหรือไม่แสดงภาพ

### Card View

เหมาะกับการสำรวจเนื้อหา

ข้อมูลที่แสดงได้:

- Cover Image
- ชื่อเนื้อหา
- Excerpt
- Category
- Tags
- วันที่อัปเดต
- Reading Time
- ประเภทเนื้อหา

### การตั้งค่ามุมมอง

- จำค่ามุมมองล่าสุดใน Browser
- เปลี่ยน List/Card ได้ทันที
- Theme สามารถกำหนดรูปแบบ Card ได้
- รองรับ Compact, Standard และ Comfortable Density ในอนาคต

## 7.3 หน้าบทความ

องค์ประกอบ:

- Breadcrumb
- Title
- Subtitle หรือ Excerpt
- Cover Image
- Author
- วันที่เผยแพร่
- วันที่แก้ไขล่าสุด
- Reading Time
- Category และ Tags
- Table of Contents
- เนื้อหา
- Source / References
- Previous / Next Content
- Related Content
- Revision Notice หากบทความมีการอัปเดตสำคัญ
- Structured Data
- Share Link
- Copy Link

## 7.4 Reader Controls

- เพิ่มและลดขนาดตัวอักษร
- เปลี่ยนความกว้างเนื้อหา
- ปรับระยะบรรทัด
- Light Mode
- Dark Mode
- Focus Mode
- เปิด Toggle ทั้งหมด
- ปิด Toggle ทั้งหมด
- Scroll Progress
- กลับขึ้นด้านบน
- จำค่าการอ่านใน Browser

## 7.5 Category

- รายละเอียดหมวดหมู่
- Cover หรือ Icon
- รายการเนื้อหา
- เลือก List/Card
- Subcategory อาจเพิ่มภายหลัง
- Featured Content

## 7.6 Tag

- รายการเนื้อหาที่ใช้ Tag
- Tag Description
- Related Tags
- Tag Alias เพื่อรวมคำที่มีความหมายเหมือนกันในอนาคต

## 7.7 Series

ใช้รวมบทความที่ควรอ่านตามลำดับ เช่น:

- SQL Server ตั้งแต่พื้นฐานถึงขั้นสูง
- Power BI Dashboard
- Python for Data Analysis
- การสร้างเว็บด้วย Next.js

องค์ประกอบ:

- ชื่อ Series
- คำอธิบาย
- Cover
- ลำดับบท
- Progress สำหรับเจ้าของเว็บในอนาคต
- Previous / Next Lesson

## 7.8 Search

ค้นหาจาก:

- Title
- Excerpt
- Plain Text
- Heading
- Code
- Category
- Tag
- Series
- Source
- Alias
- Keyword ที่ AI สร้างไว้

Filter:

- Content Type
- Category
- Tag
- Series
- วันที่สร้าง
- วันที่แก้ไข
- มี Code หรือไม่
- มี Media หรือไม่

## 7.9 About Me

ประกอบด้วย:

- ข้อมูลแนะนำตัว
- Skills
- ประสบการณ์
- สิ่งที่กำลังศึกษา
- Project
- Contact Links
- Social Links
- Technology Stack
- Learning Journey

Theme สามารถเปลี่ยนการจัดวางหน้า About ได้

## 7.10 หน้าอื่น ๆ

- Archive
- All Topics
- All Tags
- All Series
- Projects
- Changelog
- Custom 404
- Privacy
- Terms หากจำเป็น

---

# 8. ขอบเขตหลังบ้าน

## 8.1 Dashboard

แสดง:

- จำนวนเนื้อหาทั้งหมด
- Draft
- Inbox
- Public
- Private
- Unlisted
- เนื้อหาที่แก้ไขล่าสุด
- AI Suggestions ที่ยังไม่ตรวจ
- เนื้อหาที่ไม่มี Category
- เนื้อหาที่ไม่มี Tag
- เนื้อหาที่ SEO ยังไม่ครบ
- Media ที่ไม่ได้ใช้งาน
- Quick Create
- Quick Capture
- Search

## 8.2 Quick Capture

ใช้บันทึกข้อมูลอย่างรวดเร็ว:

- Title ไม่บังคับ
- Plain Text หรือ Markdown สั้น
- URL แหล่งที่มา
- Paste Code
- Upload Image
- เลือก Content Type แบบง่าย
- บันทึกเข้า Inbox

ระบบสามารถตั้งชื่อชั่วคราวจากวันที่และข้อความบรรทัดแรก

## 8.3 Inbox

พื้นที่สำหรับเนื้อหาที่ยังไม่จัดระเบียบ

ทำได้:

- เปิดแก้ไข
- Merge
- Convert เป็น Content
- ส่งให้ AI วิเคราะห์
- เพิ่ม Category
- เพิ่ม Tags
- Archive
- Delete
- Bulk Action

## 8.4 Content Manager

รองรับ:

- List View
- Card View
- Table View ในอนาคต
- Search
- Filter
- Sort
- Bulk Update
- Duplicate
- Archive
- Restore
- Delete
- Preview
- Open Editor
- Quick Edit Metadata

คอลัมน์หลักใน List View:

- Title
- Type
- Status
- Visibility
- Category
- Tags
- AI Status
- SEO Score
- Updated At
- Published At

## 8.5 Editor

เป็นหน้าหลักสำหรับสร้างและแก้ไขเนื้อหา รายละเอียดอยู่ในหัวข้อ Editor Architecture

## 8.6 Taxonomy Manager

จัดการ:

- Category
- Tag
- Series
- Collection
- Tag Alias
- Category Icon
- Category Color
- Category Description
- Merge Tags
- Redirect Slug เมื่อเปลี่ยนชื่อ

## 8.7 Media Library

รองรับ:

- Upload
- Drag and Drop
- Search
- Filter ตามประเภทไฟล์
- Alt Text
- Caption
- Credit
- Source URL
- File Size
- Dimensions
- Usage Count
- Replace File
- Delete เมื่อไม่มีการใช้งาน
- Copy URL
- Insert เข้า Editor

## 8.8 AI Workspace

แสดง:

- งาน AI ล่าสุด
- Suggestions ที่รอตรวจ
- Tokens หรือค่าใช้จ่ายโดยประมาณ
- Provider ที่ใช้
- Prompt Template
- Error Log
- Retry
- Original vs Suggested
- Accept / Reject
- AI Usage Limit

## 8.9 Theme Manager

ทำได้ใน MVP:

- ดู Theme ที่ติดตั้ง
- Preview
- Activate
- ตั้งค่าของ Theme
- Reset Theme Settings
- ดู Compatibility
- ดู Version
- ตรวจ Missing Feature

ยังไม่ทำใน MVP:

- Upload Theme ZIP
- Install Theme จาก Marketplace
- รัน Third-party Code ที่ไม่ผ่านการ Build

## 8.10 Site Settings

- Site Name
- Site Description
- Logo
- Favicon
- Default Theme
- Default Language
- Timezone
- Date Format
- Navigation
- Footer
- Social Links
- Default SEO
- Analytics
- AI Provider
- Upload Limits
- Export / Backup
- Feature Flags

---

# 9. Editor Architecture

## 9.1 Editor ที่แนะนำ

ใช้ **BlockNote** เป็นฐานของ Block Editor เนื่องจากมีโครงสร้าง Block, Slash Menu, Code Block, Embed และรองรับ Custom Block/Custom Schema

เหตุผลในการเลือก:

- UX ใกล้เคียง Notion
- รองรับ Block-based Document
- เพิ่ม Block ใหม่ได้
- ปรับ Slash Menu ได้
- รองรับ React
- เก็บเอกสารเป็น JSON
- สร้าง HTML และ Plain Text ได้
- เหมาะกับการทำ Custom Knowledge Blocks

> หมายเหตุ: ก่อนเริ่ม Implementation จริงควรทำ Technical Spike เพื่อยืนยันทุก Feature ที่ต้องการ โดยเฉพาะ Toggle Heading, ขนาดตัวอักษรแบบกำหนดเอง, Import/Export และการแสดงผล Server-side

## 9.2 Block พื้นฐาน

### Typography

- Paragraph
- Heading 1–6
- Bold
- Italic
- Underline
- Strikethrough
- Inline Code
- Superscript
- Subscript
- Text Color
- Background Color
- Text Alignment
- Font Size Preset
- Clear Formatting

### Lists

- Bullet List
- Numbered List
- Checklist
- Nested List

### Structure

- Quote
- Divider
- Table
- Columns ในอนาคต
- Spacer แบบจำกัด
- Table of Contents Block

### Knowledge Blocks

- Callout
- Note
- Tip
- Warning
- Important
- Definition
- Example
- Summary
- Key Takeaways
- Step
- FAQ Item
- Source / Citation
- Pros and Cons
- Keyboard Shortcut
- Formula Note

### Toggle

- Toggle Block
- Toggle Heading
- Nested Toggle
- Open/Closed Default
- Expand All / Collapse All ในหน้าอ่าน

### Code

- Code Block
- Language Selector
- Syntax Highlight
- Copy Button
- Line Numbers
- Word Wrap
- File Name
- Caption
- Highlight Lines
- Diff Block ในอนาคต
- Result / Output Block

ภาษาที่ควรเตรียม:

- SQL
- Python
- JavaScript
- TypeScript
- HTML
- CSS
- JSON
- YAML
- Bash
- PowerShell
- DAX
- Power Query M
- VBA
- Google Apps Script
- Excel Formula
- Markdown
- Plain Text

### Media

- Image Upload
- External Image URL
- Image Caption
- Image Alt Text
- Image Alignment
- Image Width
- YouTube Embed
- Generic Video Embed
- Link Preview
- File Attachment
- PDF Attachment
- Gallery ในอนาคต

## 9.3 Slash Menu

รองรับคำสั่งภาษาไทยและอังกฤษ เช่น:

```text
/text
/heading
/code
/image
/youtube
/table
/toggle
/callout
/quote
/divider
/file
/summary
/faq
```

และ:

```text
/ข้อความ
/หัวข้อ
/โค้ด
/รูปภาพ
/ยูทูบ
/ตาราง
/พับหัวข้อ
/กล่องข้อความ
/คำพูด
/เส้นคั่น
/ไฟล์
/สรุป
/คำถาม
```

## 9.4 Toolbar

### Floating Toolbar

- Bold
- Italic
- Underline
- Strike
- Inline Code
- Link
- Text Color
- Background Color
- AI Rewrite Selection

### Block Toolbar

- Change Block Type
- Duplicate
- Move Up
- Move Down
- Delete
- Convert
- Ask AI
- Lock from AI
- Copy Link to Block

## 9.5 Drag and Drop

- ลากย้าย Block
- ลากย้าย Block เข้า Toggle
- ลากรูปเข้าสู่ Editor
- Paste Image จาก Clipboard
- Paste URL แล้วเลือก Embed หรือ Link
- Undo/Redo หลังลาก

## 9.6 Autosave

แนวทาง:

- เก็บ Draft ใน Browser ชั่วคราว
- Debounce Save ไป Server
- แสดงสถานะ `Saving`, `Saved`, `Error`
- ไม่ Save ทุก Keystroke
- ตรวจ Version Conflict
- สร้าง Revision ตามช่วงเวลาและเหตุการณ์สำคัญ
- เตือนก่อนออกจากหน้าเมื่อยัง Save ไม่สำเร็จ

## 9.7 Content Storage

เก็บอย่างน้อยสามรูปแบบ:

| Field         | วัตถุประสงค์              |
| ------------- | ------------------------- |
| `contentJson` | ต้นฉบับ Block Document    |
| `contentHtml` | Render หน้าบ้านและ Export |
| `plainText`   | Search, AI และ Preview    |

หลักการ:

- `contentJson` เป็น Source of Truth
- `contentHtml` และ `plainText` สร้างใหม่ได้
- Serializer ต้องมี Version
- เมื่อเปลี่ยน Editor Schema ต้องมี Migration Strategy
- Custom Block ทุกตัวต้องมี Fallback HTML และ Plain Text

## 9.8 Revision History

สร้าง Revision เมื่อ:

- Publish
- Unpublish
- กด Save Version
- Accept AI Rewrite
- Restore Revision
- เปลี่ยน Visibility
- ผ่านเวลาที่กำหนดและมีการแก้ไขมากพอ

Revision เก็บ:

- Content JSON
- HTML
- Plain Text
- Metadata
- ผู้แก้ไข
- เหตุผล
- Source เช่น Manual, AI, Restore
- Created At

## 9.9 Block Lock

ผู้ใช้สามารถ Lock Block เพื่อไม่ให้ AI แก้ เช่น:

- Code
- Quote
- ค่าตัวเลข
- สูตร
- ข้อความสำคัญ
- ข้อความจากแหล่งอ้างอิง

---

# 10. AI Content Workflow

## 10.1 หลักการ

AI เข้ามาช่วย **หลังจากเจ้าของเขียนเนื้อหาเสร็จ** หรือเมื่อเลือก Block บางส่วน

Workflow:

```text
เขียนเนื้อหา
    ↓
บันทึก Draft
    ↓
กด “ให้ AI ช่วยปรับ”
    ↓
เลือกเป้าหมายการปรับ
    ↓
AI สร้าง Suggested Version
    ↓
แสดง Diff ระหว่างต้นฉบับกับคำแนะนำ
    ↓
Accept / Reject ราย Block
    ↓
บันทึกเป็น Revision ใหม่
    ↓
ตรวจ SEO/AEO/GEO
    ↓
Publish หรือเก็บเป็น Private
```

## 10.2 Rewrite Modes

### Readability First

ค่ามาตรฐานของระบบ:

- อ่านง่าย
- ประโยคไม่ยาวเกินไป
- รักษาความหมายเดิม
- รักษา Code
- จัดหัวข้อให้เป็นลำดับ
- เพิ่มคำอธิบายเฉพาะที่จำเป็น
- ไม่เปลี่ยนเป็นภาษาการตลาด

### Concise

- ตัดข้อความซ้ำ
- ลดคำฟุ่มเฟือย
- เก็บสาระสำคัญ

### Tutorial

- จัดเป็นขั้นตอน
- เพิ่ม Prerequisite
- เพิ่มตัวอย่าง
- เพิ่มผลลัพธ์ที่คาดหวัง

### Beginner Friendly

- อธิบายศัพท์
- ลด Jargon
- เพิ่มตัวอย่างง่าย
- ไม่ลดความถูกต้องทางเทคนิค

### Technical Article

- จัดโครงสร้างเป็น Problem, Context, Solution, Example, Limitation
- รักษารายละเอียดทางเทคนิค

### Public Article

- เพิ่มบทนำ
- เพิ่ม Summary
- ปรับหัวข้อ
- เพิ่มคำอธิบายสำหรับผู้อ่านที่ไม่มีบริบท
- เสนอ Internal Link

### Proofread Only

- ตรวจคำผิด
- ปรับไวยากรณ์
- ไม่จัดโครงสร้างใหม่

## 10.3 AI Actions

### เนื้อหา

- Rewrite
- Summarize
- Expand
- Shorten
- Explain
- Add Example
- Create Steps
- Create Checklist
- Generate FAQ
- Generate Key Takeaways
- Explain Code
- Suggest Better Heading
- Detect Missing Context
- Detect Repetition

### การจัดระเบียบ

- Suggest Category
- Suggest Tags
- Suggest Series
- Suggest Related Content
- Detect Duplicate Notes
- Suggest Merge
- Suggest Split
- Suggest Internal Links
- Generate Search Keywords

### Metadata

- Generate Excerpt
- Generate Slug
- Generate Meta Title
- Generate Meta Description
- Generate OG Description
- Generate Image Alt Text
- Generate Reading Summary
- Suggest Content Type

## 10.4 Diff View

ควรมีสามมุมมอง:

1. Side-by-side
2. Inline Diff
3. Block-by-block

Action:

- Accept Block
- Reject Block
- Accept Selected Changes
- Accept All
- Reject All
- Edit Suggestion
- Restore Original

## 10.5 AI Safety Rules

System Prompt ภายในต้องกำหนดว่า:

- ห้ามแต่งข้อเท็จจริงที่ไม่มีในต้นฉบับ
- ห้ามสร้างแหล่งอ้างอิงปลอม
- หากไม่แน่ใจให้ Flag
- ห้ามเปลี่ยน Code โดยค่าเริ่มต้น
- ห้ามเปลี่ยนตัวเลขโดยไม่แจ้ง
- ต้องรักษาภาษาเดิม เว้นแต่ผู้ใช้สั่ง
- ต้องรักษา Heading และ Block ที่ Lock
- ต้องส่งผลลัพธ์เป็น Structured JSON
- ต้องระบุ Block ที่แก้
- ต้องไม่เผยแพร่เอง

## 10.6 AI Provider Abstraction

ไม่ผูกระบบกับผู้ให้บริการรายเดียว

สร้าง Interface เช่น:

```ts
interface AIProvider {
  id: string;
  generateText(input: AITextRequest): Promise<AITextResponse>;
  generateStructured<T>(input: AIStructuredRequest): Promise<T>;
  embed?(input: EmbeddingRequest): Promise<EmbeddingResponse>;
}
```

รองรับภายหลัง:

- OpenAI
- OpenRouter
- Google
- Anthropic
- Local Model
- Provider อื่น

ระบบตั้งค่าได้:

- Default Provider
- Default Model
- Model ตามงาน
- Token Limit
- Monthly Budget
- Timeout
- Retry
- Fallback Provider

## 10.7 AI Job Log

เก็บ:

- Job Type
- Content ID
- Revision ID
- Provider
- Model
- Prompt Template Version
- Input Hash
- Output
- Token Usage
- Estimated Cost
- Status
- Error
- Created At
- Completed At

ไม่ควรเก็บ API Key ใน Database แบบ Plain Text

## 10.8 ค่าใช้จ่าย AI

แนวทางควบคุม:

- แสดงจำนวนครั้งที่ใช้
- แสดง Token โดยประมาณ
- ตั้ง Budget ต่อเดือน
- เตือนเมื่อใกล้ Limit
- Cache งานเดิมจาก Input Hash
- ไม่ส่ง Media ขนาดใหญ่โดยไม่จำเป็น
- ส่งเฉพาะ Block ที่ต้องปรับ
- เลือก Model ขนาดเล็กสำหรับ Tag หรือ Metadata
- ใช้ Model ที่มีความสามารถสูงเฉพาะ Rewrite งานใหญ่

---

# 11. การจัดระเบียบความรู้

## 11.1 Content Types

ใช้ตาราง Content กลางและกำหนด `contentType`

ประเภทเริ่มต้น:

- Quick Note
- Knowledge Note
- Tutorial
- Article
- Code Snippet
- Troubleshooting
- Cheat Sheet
- Reference
- Learning Log
- Project Note
- Case Study
- Checklist

## 11.2 Category

ใช้หมวดหลัก ไม่ควรซ้อนลึกเกินไปใน MVP

ตัวอย่าง:

- Data & Analytics
- Programming
- AI
- Business
- Marketing
- ERP & Supply Chain
- Game Development
- Productivity
- Projects
- Learning Journal
- Other

รองรับ Parent Category แต่ UI ช่วงแรกจำกัดประมาณ 2 ระดับ

## 11.3 Tags

ใช้สำหรับรายละเอียด เช่น:

- SQL Server
- DAX
- Power Query
- Flask
- Next.js
- API
- Dashboard
- Automation

ความสามารถ:

- Merge Tag
- Alias
- Rename
- Slug Redirect
- Usage Count
- AI Suggestion

## 11.4 Series

เนื้อหาที่ควรอ่านตามลำดับ

## 11.5 Collections

รวมเนื้อหาตามวัตถุประสงค์โดยไม่จำเป็นต้องมีลำดับ เช่น:

- เครื่องมือที่ใช้บ่อย
- SQL ที่ใช้ในการทำงาน
- เรื่องที่ต้องกลับมาทบทวน
- ความรู้สำหรับโปรเจกต์หนึ่ง

## 11.6 Relations

ความสัมพันธ์ระหว่างเนื้อหา:

- Related
- Prerequisite
- Follow-up
- Alternative
- Supersedes
- Duplicate
- Part of

## 11.7 Sources

แต่ละบทความรองรับหลายแหล่งข้อมูล:

- URL
- ชื่อแหล่ง
- ผู้เขียน
- วันที่เผยแพร่
- วันที่เข้าถึง
- Note
- Source Type
- Verified Status

---

# 12. Visibility และ Content Status

## 12.1 Visibility

| Visibility | การใช้งาน                      |
| ---------- | ------------------------------ |
| Private    | เจ้าของเว็บเท่านั้น            |
| Unlisted   | เข้าผ่านลิงก์ ไม่อยู่ใน Index  |
| Public     | เผยแพร่และค้นหาได้             |
| Protected  | ใส่รหัสผ่าน — พิจารณาระยะต่อไป |

## 12.2 Status

- Inbox
- Draft
- In Review
- Ready
- Scheduled
- Published
- Archived
- Deleted

## 12.3 Publish Rules

ก่อน Publish ระบบตรวจ:

- มี Title
- มี Slug
- Slug ไม่ซ้ำ
- Visibility เป็น Public หรือ Unlisted
- ไม่มี Upload ที่ยังไม่เสร็จ
- ไม่มี AI Job ที่กำลังเขียนทับ Version
- Metadata ขั้นต่ำครบ
- Source Link ไม่เสียในระดับที่ตรวจได้
- Content HTML สร้างสำเร็จ
- Structured Data Valid ในระดับ Schema ภายใน

---

# 13. Theme Plugin Architecture

## 13.1 เป้าหมาย

- เปลี่ยนหน้าตาหน้าบ้านได้
- เพิ่ม Theme ใหม่ได้โดยไม่แก้ Core Business Logic
- Theme ใช้ข้อมูลเดียวกัน
- Theme มีค่าตั้งเฉพาะ
- Theme มี Preview
- Theme ระบุ Feature ที่รองรับ
- Theme Version ไม่ผูกกับ Content Schema โดยตรง

## 13.2 ขอบเขต Theme

Theme สามารถกำหนด:

- Layout
- Header
- Footer
- Navigation
- Home Sections
- Knowledge List
- Knowledge Card
- Article Layout
- Typography
- Color Tokens
- Spacing
- Border Radius
- Shadow
- Code Theme
- Reader Width
- About Layout
- Series Layout
- Empty State
- 404 Page

Theme ไม่สามารถ:

- Query Database โดยตรง
- เปลี่ยน Authentication
- แก้ Validation
- อ่าน Secret
- เรียก AI Provider โดยตรง
- เปลี่ยนสิทธิ์ Content
- รัน Migration
- เขียนไฟล์บน Server

## 13.3 Theme Package Structure

```text
src/
└── themes/
    ├── registry.ts
    ├── contracts.ts
    ├── default/
    │   ├── manifest.ts
    │   ├── theme.ts
    │   ├── tokens.css
    │   ├── settings.schema.ts
    │   ├── preview.png
    │   └── components/
    │       ├── Header.tsx
    │       ├── Footer.tsx
    │       ├── HomePage.tsx
    │       ├── KnowledgeCard.tsx
    │       ├── KnowledgeListItem.tsx
    │       └── ArticlePage.tsx
    └── minimal/
        └── ...
```

## 13.4 Theme Manifest

ตัวอย่าง Contract:

```ts
export interface ThemeManifest {
  id: string;
  name: string;
  version: string;
  author: string;
  description?: string;
  previewImage?: string;
  engineVersion: string;
  supportedFeatures: ThemeFeature[];
  settingsSchemaVersion: number;
}
```

## 13.5 Theme Runtime Contract

```ts
export interface PublicTheme {
  manifest: ThemeManifest;
  tokens: ThemeTokens;
  components: {
    Header: React.ComponentType<HeaderProps>;
    Footer: React.ComponentType<FooterProps>;
    HomePage: React.ComponentType<HomePageProps>;
    KnowledgeCard: React.ComponentType<KnowledgeCardProps>;
    KnowledgeListItem: React.ComponentType<KnowledgeListItemProps>;
    ArticlePage: React.ComponentType<ArticlePageProps>;
  };
}
```

## 13.6 Theme Settings

ค่าตัวอย่าง:

- Primary Color
- Accent Color
- Font Family
- Content Width
- Header Style
- Card Radius
- Show Hero
- Show Cover
- Show Reading Time
- Show Tags
- Code Theme
- Home Section Order

เก็บใน Database เป็น JSON ที่ผ่าน Validation ตาม Schema ของ Theme

## 13.7 การติดตั้ง Theme

### MVP

Theme ถูกเพิ่มผ่าน Source Code แล้ว Build ใหม่

ข้อดี:

- ปลอดภัย
- Type-safe
- ทดสอบได้
- ไม่มี Arbitrary Code Upload

### อนาคต

อาจรองรับ:

- Private NPM Package
- Git Submodule
- Signed Theme Package
- Theme Marketplace

แต่ต้องมี Sandbox และ Security Review ก่อนเปิดให้ติดตั้งผ่านหน้า Admin

## 13.8 Theme Compatibility

ใช้ `engineVersion` และ Feature Contract

ตัวอย่าง:

```text
Theme Engine: 1.x
Theme: 1.2.0
Required Engine: >=1.0 <2.0
```

หาก Theme ไม่รองรับ Feature เช่น Series Page ระบบต้องใช้ Core Fallback Component

## 13.9 Admin Theme

หลังบ้านไม่ใช้ Public Theme เพื่อป้องกัน:

- Admin UI พังเมื่อ Theme มีปัญหา
- UX การจัดการไม่สม่ำเสมอ
- Theme เข้าถึงข้อมูลภายในเกินขอบเขต
- การทดสอบยาก

---

# 14. SEO, AEO และ GEO

## 14.1 หลักการ

ลำดับความสำคัญ:

1. เจ้าของเว็บอ่านง่าย
2. เนื้อหาถูกต้องและมีประโยชน์
3. ผู้อ่านทั่วไปเข้าใจ
4. Search Engine เข้าใจ
5. AI Search เข้าใจและสามารถอ้างอิงได้

SEO/AEO/GEO จะไม่บังคับใช้กับ Private Content

## 14.2 SEO พื้นฐาน

ต่อหนึ่งหน้า Public:

- Title
- Meta Title
- Meta Description
- Canonical URL
- Slug
- Open Graph
- Twitter/X Card Metadata
- Author
- Published Date
- Modified Date
- Robots
- Sitemap
- Breadcrumb
- Image Alt Text
- Internal Links
- Semantic HTML
- Status Code ที่ถูกต้อง
- Redirect เมื่อเปลี่ยน Slug

## 14.3 Structured Data

ประเภทที่พิจารณา:

- WebSite
- Person
- Article
- TechArticle
- BreadcrumbList
- CollectionPage
- ProfilePage
- VideoObject เมื่อมีข้อมูลครบ
- ImageObject
- FAQPage เฉพาะกรณีที่หน้าเป็น FAQ จริงและตรงตามข้อกำหนดที่ใช้อยู่ในขณะพัฒนา

Structured Data ต้องสร้างจากเนื้อหาจริง ไม่สร้างข้อมูลที่หน้าไม่ได้แสดง

## 14.4 AEO

องค์ประกอบที่ AI ช่วยเสนอ:

- Summary
- Direct Answer
- Key Takeaways
- Definition
- Steps
- FAQ
- Prerequisite
- Common Mistakes
- Example
- Limitation
- Related Questions

ระบบไม่บังคับให้ทุกบทความมี FAQ

## 14.5 GEO

แนวทาง:

- Heading เป็นลำดับ
- คำตอบชัดเจน
- มีบริบท
- มีตัวอย่าง
- แยก Code กับคำอธิบาย
- มีแหล่งข้อมูล
- มีวันที่อัปเดต
- ระบุผู้เขียน
- ใช้ Semantic HTML
- Public Content ต้อง Render อ่านได้จาก Server
- ไม่ซ่อนสาระสำคัญทั้งหมดไว้หลัง Interaction
- ใช้ Canonical ที่ถูกต้อง
- Internal Link ใช้ Anchor Text ที่สื่อความหมาย

## 14.6 AI SEO Assistant

ตรวจ:

- Title ยาวหรือคลุมเครือเกินไป
- Excerpt
- Meta Description
- Heading Structure
- Missing Alt Text
- Internal Link
- Duplicate Title
- Duplicate Slug
- Thin Content
- Missing Source
- Content Freshness
- Broken Link
- Search Intent โดยประมาณ
- คำศัพท์ที่ไม่ได้อธิบาย
- ความอ่านง่าย

ผลลัพธ์เป็น Recommendation ไม่ใช่การบังคับ

## 14.7 Indexing Rules

### Public

- `index, follow`
- อยู่ใน Sitemap
- แสดงใน Public Search

### Unlisted

- `noindex, nofollow` ตามค่าเริ่มต้น
- ไม่อยู่ใน Sitemap
- ไม่อยู่ใน Public Search

### Private

- ไม่มี Public Route
- ไม่อยู่ใน Sitemap
- ไม่ Render ให้ Anonymous User
- ไม่ใช้เพียง `noindex` เป็นกลไกป้องกัน

---

# 15. Search Architecture

## 15.1 ระยะ MVP

ใช้ PostgreSQL Full-text Search หรือ Search Index ภายใน Database

Index:

- Title
- Excerpt
- Plain Text
- Heading Text
- Code Text
- Category
- Tags
- Series
- Source Name

ความสามารถ:

- Prefix Search
- Typo Tolerance ระดับพื้นฐาน
- Highlight Keyword
- Filter
- Sort by Relevance
- Sort by Updated Date

## 15.2 ระยะต่อไป

Semantic Search:

- สร้าง Embedding ตาม Chunk
- เก็บ Content ID, Block ID และ Revision ID
- ค้นด้วยภาษาธรรมชาติ
- ตอบพร้อม Internal Citation
- ลิงก์ไปยัง Heading หรือ Block ต้นทาง
- Re-index เมื่อ Publish Revision ใหม่
- ลบ Vector เมื่อ Content ถูกลบหรือเปลี่ยน Visibility

## 15.3 Knowledge Assistant

ตัวอย่างคำถาม:

- เคยเขียนเรื่อง `STRING_AGG` ไว้ที่ไหน
- มีสูตร Excel เกี่ยวกับวันที่อะไรบ้าง
- สรุปสิ่งที่เรียนรู้เกี่ยวกับ Power BI ในเดือนนี้
- มีโน้ตใดขัดแย้งกันหรือไม่
- หาบทความที่เกี่ยวกับ Forecast และ Inventory

กฎ:

- ตอบจากคลังความรู้เท่านั้นเมื่ออยู่ในโหมด Knowledge
- แสดงแหล่งอ้างอิงภายใน
- แยกข้อความที่สรุปกับข้อความที่อนุมาน
- ไม่เปิดเผย Private Content ให้ Public User

---

# 16. Media และ Embed

## 16.1 รูปภาพ

รองรับ:

- JPEG
- PNG
- WebP
- AVIF ตามความเหมาะสม
- GIF โดยจำกัดขนาด
- SVG เฉพาะกรณี Sanitized

กระบวนการ:

1. Validate MIME Type
2. Validate File Size
3. Generate Safe File Name
4. Upload Object Storage
5. เก็บ Metadata
6. Generate Responsive Variants
7. สร้าง Placeholder
8. กรอก Alt Text
9. Insert Block

## 16.2 External Image

ข้อควรระวัง:

- Hotlink อาจหาย
- URL อาจเปลี่ยน
- มี Privacy และ Tracking
- อาจโหลดช้า

ระบบควรมีตัวเลือก:

- ใช้ URL เดิม
- Download มาเก็บใน Media Library
- แสดง Source Credit

## 16.3 YouTube

เมื่อ Paste URL:

- ตรวจ Provider
- ดึง Video ID
- แสดง Preview
- บันทึก URL ต้นฉบับ
- Render ด้วย Privacy-enhanced Embed หากเหมาะสม
- รองรับ Caption และคำอธิบาย
- ไม่ Autoplay โดยค่าเริ่มต้น

## 16.4 Link Preview

เก็บ:

- URL
- Title
- Description
- Image
- Site Name
- Fetched At
- Fetch Status

Security:

- ป้องกัน SSRF
- จำกัด Protocol
- Block Private IP
- Timeout
- Limit Response Size
- Sanitize Metadata

## 16.5 File Attachment

รองรับเริ่มต้น:

- PDF
- TXT
- CSV
- XLSX
- DOCX
- ZIP ตาม Policy
- Source Code Text Files

ไฟล์ Private ต้องใช้ Signed URL หรือผ่าน Auth Route

---

# 17. Authentication และ Security

## 17.1 Authentication

เนื่องจากมี Admin คนเดียว แนวทางที่แนะนำ:

- Login ด้วย Google OAuth
- Allowlist เฉพาะ Email เจ้าของ
- Database Session
- Secure Cookie
- Session Expiration
- Revoke Session
- Optional Passkey หรือ MFA ในอนาคต

ไม่จำเป็นต้องเปิด Register

## 17.2 Authorization

Role เริ่มต้น:

- Owner

เตรียม Permission Contract ไว้ แต่ไม่สร้าง UI หลาย Role จนกว่าจะจำเป็น

## 17.3 Security Controls

- CSRF Protection ตามกลไก Framework
- Secure, HttpOnly, SameSite Cookie
- Rate Limit หน้า Login
- Rate Limit AI Endpoint
- Input Validation
- Output Encoding
- HTML Sanitization
- File Validation
- SSRF Protection
- Content Security Policy
- Security Headers
- Secret อยู่ใน Environment Variables
- Audit Log สำหรับ Action สำคัญ
- Database Backup
- Dependency Scanning
- Error Message ไม่เปิดเผย Stack ใน Production

## 17.4 Private Content

- Query ต้องมี Visibility Guard
- Preview URL ใช้ Token ที่หมดอายุได้หากต้องแชร์
- Object Storage แยก Public และ Private
- AI Job ต้องตรวจสิทธิ์ก่อนอ่าน Content
- Search Index แยก Scope

---

# 18. Technology Stack ที่แนะนำ

> Stack สามารถปรับหลัง Technical Spike โดยยึด Requirement เป็นหลัก

## 18.1 Application

- Next.js App Router
- React
- TypeScript แบบ Strict
- Server Components สำหรับหน้าสาธารณะที่เหมาะสม
- Client Components เฉพาะ Editor และ Interaction
- Route Handlers / Server Actions ตามความเหมาะสม

## 18.2 Styling

- Tailwind CSS หรือ CSS Modules ร่วมกับ Design Tokens
- CSS Variables สำหรับ Theme Tokens
- Admin Design System แยกจาก Public Theme
- Component primitives ที่รองรับ Accessibility

## 18.3 Editor

- BlockNote
- Shiki หรือ Engine ที่เข้ากันสำหรับ Syntax Highlight
- Custom Blocks สำหรับ Toggle, Callout, Summary, FAQ และ Source

## 18.4 Database

- PostgreSQL
- Prisma ORM
- Migration แบบ Version-controlled
- Database Provider เลือกตามราคา ความเสถียร Backup และ Compatibility

ตัวเลือกที่เหมาะ:

- Neon PostgreSQL
- Prisma Postgres
- Supabase PostgreSQL
- Managed PostgreSQL อื่น

ไม่ควรผูก Logic กับ Provider เฉพาะราย

## 18.5 Object Storage

- Cloudflare R2 หรือ S3-compatible Storage
- แยก Bucket/Prefix สำหรับ Public และ Private
- Signed URL สำหรับ Private Files

## 18.6 Deployment

ตัวเลือกหลัก:

### Option A: Vercel

เหมาะกับ Next.js และลดความซับซ้อนของ Deployment

### Option B: Cloudflare Workers

เหมาะเมื่อให้ความสำคัญกับ Edge และต้องการใช้ Ecosystem ของ Cloudflare แต่ต้องทดสอบ Compatibility ของ ORM, Editor SSR และ Runtime Libraries

ข้อเสนอเริ่มต้น:

> ทำให้ Application เป็น Runtime-portable ก่อน แล้วเลือก Hosting หลังจบ Technical Spike

## 18.7 AI

- Provider Adapter
- Structured Output Validation
- Queue หรือ Job Table
- Budget Control
- Fallback Model
- Prompt Versioning

## 18.8 Analytics

- Privacy-friendly Analytics
- Search Query Analytics
- Content View Count
- ไม่ติดตาม Private Content
- Admin Event Log แยกจาก Public Analytics

---

# 19. โครงสร้าง Repository

```text
personal-knowledge-web/
├── docs/
│   ├── project-plan.md
│   ├── architecture.md
│   ├── editor-schema.md
│   ├── theme-contract.md
│   └── ai-prompts.md
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── public/
├── scripts/
│   ├── export-content.ts
│   ├── rebuild-search.ts
│   └── validate-themes.ts
├── src/
│   ├── app/
│   │   ├── (public)/
│   │   ├── (admin)/
│   │   ├── api/
│   │   ├── sitemap.ts
│   │   └── robots.ts
│   ├── components/
│   │   ├── admin/
│   │   ├── editor/
│   │   ├── reader/
│   │   └── ui/
│   ├── core/
│   │   ├── auth/
│   │   ├── content/
│   │   ├── media/
│   │   ├── search/
│   │   ├── seo/
│   │   └── themes/
│   ├── features/
│   │   ├── ai/
│   │   ├── categories/
│   │   ├── collections/
│   │   ├── content/
│   │   ├── dashboard/
│   │   ├── media/
│   │   ├── series/
│   │   ├── settings/
│   │   └── tags/
│   ├── themes/
│   │   ├── registry.ts
│   │   └── default/
│   ├── lib/
│   ├── server/
│   ├── styles/
│   └── types/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── .env.example
├── package.json
├── README.md
└── tsconfig.json
```

---

# 20. Route Plan

## 20.1 Public Routes

```text
/
 /knowledge
 /knowledge/[slug]
 /categories
 /categories/[slug]
 /tags
 /tags/[slug]
 /series
 /series/[slug]
 /collections/[slug]
 /search
 /about
 /projects
 /archive
```

## 20.2 Admin Routes

```text
/admin
/admin/inbox
/admin/content
/admin/content/new
/admin/content/[id]/edit
/admin/categories
/admin/tags
/admin/series
/admin/collections
/admin/media
/admin/ai
/admin/themes
/admin/navigation
/admin/settings
/admin/backups
/admin/audit
```

## 20.3 System Routes

```text
/api/uploads
/api/embed-preview
/api/ai/rewrite
/api/ai/analyze
/api/search
/api/preview
/sitemap.xml
/robots.txt
/opengraph-image
```

---

# 21. Data Model

## 21.1 Core Entities

### User

```text
id
email
name
image
role
createdAt
updatedAt
```

### Session

ขึ้นอยู่กับ Authentication Library

### Content

```text
id
title
subtitle
slug
excerpt
contentType
status
visibility
contentJson
contentHtml
plainText
editorSchemaVersion
coverMediaId
categoryId
featured
readingTime
publishedAt
scheduledAt
createdAt
updatedAt
deletedAt
```

### ContentRevision

```text
id
contentId
revisionNumber
title
excerpt
contentJson
contentHtml
plainText
metadataJson
source
reason
createdBy
createdAt
```

### Category

```text
id
name
slug
description
icon
color
parentId
sortOrder
createdAt
updatedAt
```

### Tag

```text
id
name
slug
description
createdAt
updatedAt
```

### TagAlias

```text
id
tagId
alias
normalizedAlias
```

### ContentTag

```text
contentId
tagId
```

### Series

```text
id
name
slug
description
coverMediaId
visibility
createdAt
updatedAt
```

### SeriesItem

```text
seriesId
contentId
position
```

### Collection

```text
id
name
slug
description
visibility
createdAt
updatedAt
```

### CollectionItem

```text
collectionId
contentId
position
note
```

### ContentRelation

```text
id
sourceContentId
targetContentId
relationType
createdAt
```

### Media

```text
id
storageProvider
bucket
objectKey
publicUrl
mimeType
fileName
fileSize
width
height
altText
caption
credit
sourceUrl
visibility
createdAt
updatedAt
```

### Source

```text
id
contentId
url
title
author
publisher
publishedAt
accessedAt
sourceType
note
verified
createdAt
```

### AISuggestion

```text
id
contentId
revisionId
jobId
suggestionType
targetBlockId
originalJson
suggestedJson
status
createdAt
reviewedAt
```

### AIJob

```text
id
contentId
jobType
provider
model
promptVersion
inputHash
status
inputTokens
outputTokens
estimatedCost
errorMessage
createdAt
completedAt
```

### ThemeActivation

```text
id
themeId
themeVersion
settingsJson
activatedAt
updatedAt
```

### SiteSetting

```text
key
valueJson
updatedAt
```

### SlugRedirect

```text
id
sourcePath
targetPath
statusCode
createdAt
```

### AuditLog

```text
id
userId
action
entityType
entityId
metadataJson
createdAt
```

---

# 22. Content Rendering Pipeline

```text
Block Editor JSON
      ↓
Validate Editor Schema
      ↓
Sanitize
      ↓
Generate HTML
      ↓
Generate Plain Text
      ↓
Extract Headings
      ↓
Generate Table of Contents
      ↓
Calculate Reading Time
      ↓
Extract Search Document
      ↓
Generate Structured Data
      ↓
Store Revision
      ↓
Publish / Preview
```

ต้องมี Test สำหรับ:

- Custom Blocks
- Nested Toggle
- Code
- Links
- Embeds
- Images
- Export
- Import
- Invalid JSON
- Old Schema Version

---

# 23. Navigation System

Navigation ไม่ควรผูกกับ Theme

Model:

- Label
- URL
- Type
- Parent
- Position
- Visibility
- Open New Tab
- Icon
- Required Feature

Theme รับ Navigation Tree ไป Render

ประเภท:

- Internal Page
- Category
- Series
- Collection
- External URL
- Custom

---

# 24. Import และ Export

## 24.1 Import

รองรับตามลำดับ:

### MVP

- Markdown
- Plain Text
- HTML แบบพื้นฐาน

### ระยะต่อไป

- Notion Markdown Export
- Notion CSV Database Export
- JSON ของระบบ
- Word หรือ PDF แบบ Best-effort

## 24.2 Export

- Single Content Markdown
- Single Content HTML
- Single Content JSON
- Full Content Archive
- Media Manifest
- Database Backup
- Static Public Export ในอนาคต

## 24.3 Notion Import

ต้อง Mapping:

- Heading
- Paragraph
- Lists
- Code
- Quote
- Toggle
- Image
- File
- Bookmark
- Table
- Callout

Block ที่ Mapping ไม่ได้ให้สร้าง Unsupported Block พร้อมข้อมูลต้นฉบับ ห้ามทิ้งข้อมูลเงียบ ๆ

---

# 25. Performance

## 25.1 Public Page

เป้าหมาย:

- Render จาก Server
- Cache Public Content
- Revalidate เมื่อ Publish
- Optimize Image
- Lazy-load Embed
- ไม่โหลด Editor Bundle ในหน้าบ้าน
- Theme CSS แยกเท่าที่เหมาะสม
- ลด Client JavaScript

## 25.2 Admin

- Lazy-load Editor
- Virtualize List เมื่อข้อมูลมาก
- Debounce Search
- Paginate Media
- Background Processing สำหรับ AI และ Import
- Optimistic UI เฉพาะ Action ที่ย้อนกลับได้

## 25.3 Database

- Index Slug
- Index Status + Visibility
- Index UpdatedAt
- Index Category
- Composite Index สำหรับหน้ารายการ
- Full-text Index
- Query Plan Review เมื่อข้อมูลเริ่มมาก

---

# 26. Accessibility

- ใช้งาน Keyboard ได้
- Slash Menu รองรับ Keyboard
- Focus State ชัดเจน
- Color Contrast ผ่านเกณฑ์
- Alt Text
- Heading Structure
- Button มี Accessible Name
- Toggle ใช้ ARIA ที่เหมาะสม
- Dialog จัด Focus ถูกต้อง
- Code Copy มี Feedback
- Motion ลดได้ตาม System Preference
- Theme ต้องผ่าน Accessibility Checklist

---

# 27. Testing Strategy

## 27.1 Unit Tests

- Slug
- Content Validation
- HTML Serializer
- Plain Text Serializer
- Theme Contract
- SEO Metadata
- AI Output Parser
- Cost Calculation
- Permission Guard
- Visibility Rules

## 27.2 Integration Tests

- Create Content
- Edit Content
- Autosave
- Revision
- Publish
- Unpublish
- Upload
- Embed Preview
- AI Suggestion
- Accept AI Change
- Search Index
- Theme Activation

## 27.3 End-to-End Tests

- Login
- สร้างบทความ
- แทรก Code
- แทรกรูป
- แทรก YouTube
- สร้าง Toggle
- ใช้ AI Rewrite
- Publish
- เปิดหน้าบ้าน
- เปลี่ยน List/Card
- Search
- เปลี่ยน Theme
- Restore Revision

## 27.4 Visual Regression

Theme ทุกตัวต้อง Capture:

- Home Desktop/Mobile
- Library List/Card
- Article
- Code Block
- Toggle
- Dark Mode
- About
- 404

---

# 28. Logging, Monitoring และ Backup

## 28.1 Logging

- Application Error
- API Error
- AI Error
- Upload Error
- Authentication Event
- Publish Event
- Theme Error

ไม่ Log:

- API Key
- Session Token
- เนื้อหา Private เต็มฉบับ
- Password
- Signed URL ที่ยังใช้ได้

## 28.2 Monitoring

- Uptime
- Error Rate
- AI Failure Rate
- Upload Failure
- Database Connection
- Slow Query
- Broken Public Page
- Sitemap Generation

## 28.3 Backup

- Automated Database Backup
- Export Content ตามรอบ
- Object Storage Versioning หากรองรับ
- Restore Test
- Backup Encryption
- Document ขั้นตอนกู้ระบบ

ควรทดสอบ Restore จริง ไม่ใช่เพียงตรวจว่ามีไฟล์ Backup

---

# 29. Development Environments

- Local
- Preview
- Production

แยก:

- Database
- Object Storage Prefix/Bucket
- OAuth Callback
- AI Budget
- Analytics
- Domain

Preview Deployment ต้องไม่ Index:

```text
noindex, nofollow
```

---

# 30. Development Phases

## Phase 0 — Discovery และ Technical Spike

### เป้าหมาย

ยืนยัน Stack และความเป็นไปได้ก่อนสร้างระบบเต็ม

### งาน

- สร้าง Repository ใหม่
- ตั้ง Coding Standard
- ทดลอง Next.js กับ Hosting ที่พิจารณา
- ทดลอง PostgreSQL + ORM
- ทดลอง BlockNote
- ทดลอง Custom Toggle
- ทดลอง Code Block
- ทดลอง Image Upload
- ทดลอง YouTube Embed
- ทดลอง JSON → HTML → Plain Text
- ทดลอง SSR Reader
- ทดลอง Theme Registry
- ทดลอง AI Structured Output
- ทดลอง Revision Diff
- ตัดสินใจ Hosting

### Acceptance Criteria

- Editor ทำ Feature สำคัญได้
- Content Render หน้าบ้านได้โดยไม่โหลด Editor
- Theme สลับได้อย่างน้อย 2 Theme ทดลอง
- Private Route ป้องกันได้
- AI ส่งผลลัพธ์แบบ Block ได้
- Deployment Preview ใช้งานได้

---

## Phase 1 — Foundation

### งาน

- Project Structure
- Database Schema
- Authentication
- Admin Layout
- Public Layout
- Design Tokens
- Theme Contract
- Default Theme
- Site Settings
- Navigation
- Error Handling
- Audit Log พื้นฐาน

### Acceptance Criteria

- Owner Login ได้
- Anonymous เข้า Admin ไม่ได้
- หน้าบ้านเปิดได้
- เปลี่ยน Theme ได้
- Settings ถูกบันทึก
- Environment แยก Local/Preview/Production

---

## Phase 2 — Core Content System

### งาน

- Content CRUD
- Content Type
- Status
- Visibility
- Slug
- Category
- Tag
- Series
- Collections
- Content Manager
- List View
- Card View
- Quick Capture
- Inbox
- Preview
- Publish
- Slug Redirect

### Acceptance Criteria

- สร้าง Draft ได้
- Private ไม่แสดงหน้าบ้าน
- Unlisted เปิดผ่านลิงก์ได้และไม่ Index
- Public อยู่ใน Library
- สลับ List/Card ได้
- Filter และ Search Metadata ได้

---

## Phase 3 — Editor MVP

### งาน

- BlockNote Integration
- Typography
- Lists
- Color
- Font Size Preset
- Heading
- Toggle
- Callout
- Code
- Table
- Link
- Image
- YouTube
- File
- Slash Menu ไทย/อังกฤษ
- Autosave
- Unsaved Warning
- Revision
- Export Markdown/HTML/JSON

### Acceptance Criteria

- เขียนบทความเทคนิคได้ครบ
- Code Copy ได้
- Toggle ทำงานทั้ง Editor และ Reader
- Paste URL YouTube แล้ว Embed ได้
- Upload Image สำเร็จ
- Refresh หน้าแล้วข้อมูลไม่หาย
- Restore Revision ได้
- Export แล้วเปิดอ่านได้

---

## Phase 4 — Public Reader Experience

### งาน

- Home
- Library
- Article
- Category
- Tag
- Series
- Search
- About
- Related Content
- Reader Controls
- Light/Dark
- Table of Contents
- Reading Progress
- Responsive
- Accessibility Pass

### Acceptance Criteria

- อ่านได้ดีบนมือถือและ Desktop
- Theme แสดงทุกหน้าหลัก
- List/Card จำค่าได้
- Search Public Content ได้
- Private Content ไม่รั่ว
- Reader Controls ใช้งานได้

---

## Phase 5 — AI Assistant

### งาน

- Provider Adapter
- AI Settings
- Rewrite Modes
- Structured Output
- Block Lock
- AI Job
- Diff View
- Accept/Reject
- Category/Tag Suggestion
- Summary
- Excerpt
- Metadata
- Usage Log
- Budget Limit
- Retry

### Acceptance Criteria

- AI ไม่เขียนทับต้นฉบับโดยตรง
- ผู้ใช้รับเฉพาะบาง Block ได้
- Code ที่ Lock ไม่เปลี่ยน
- ย้อน Revision ก่อน AI ได้
- ค่าใช้จ่าย/Token ถูกบันทึก
- Error ไม่ทำให้ Content หาย

---

## Phase 6 — SEO, AEO และ GEO

### งาน

- Dynamic Metadata
- Canonical
- Sitemap
- Robots
- Open Graph
- Structured Data
- Breadcrumb
- Slug Redirect
- SEO Review
- Missing Alt Text
- Internal Link Suggestion
- Summary / Key Takeaways / FAQ Suggestions
- Public HTML Validation

### Acceptance Criteria

- Public Content มี Metadata ครบ
- Private และ Unlisted ไม่อยู่ใน Sitemap
- Structured Data สร้างจากข้อมูลจริง
- เปลี่ยน Slug แล้ว Redirect
- AI Recommendation ไม่เปลี่ยนเนื้อหาเอง

---

## Phase 7 — Import, Backup และ Hardening

### งาน

- Notion Import
- Bulk Markdown Import
- Full Export
- Backup UI
- Restore Procedure
- Security Review
- Performance Test
- Broken Link Checker
- Media Cleanup
- Audit Review
- Dependency Update Plan

### Acceptance Criteria

- Import Notion ตัวอย่างได้
- Block ที่ไม่รองรับไม่สูญหาย
- Full Export สำเร็จ
- Restore ทดสอบผ่าน
- ไม่มี Critical Security Issue
- ระบบรับข้อมูลเป้าหมายได้

---

## Phase 8 — Knowledge Intelligence

ทำหลัง MVP ใช้งานจริงแล้ว

- Semantic Search
- Embeddings
- Ask My Knowledge
- Internal Citation
- Duplicate Detection
- Knowledge Map
- Learning Timeline
- Monthly Learning Summary
- Review Reminder
- Content Freshness
- Contradiction Detection
- Suggested Learning Path

---

# 31. MVP ที่ควรเปิดใช้งานครั้งแรก

MVP Production ควรประกอบด้วย:

- Owner Authentication
- หน้าบ้านและหลังบ้าน
- Default Theme
- Theme Contract
- Content CRUD
- Quick Capture
- Inbox
- Block Editor
- Heading
- Text Formatting
- Color
- Toggle
- Code
- Link
- Image
- YouTube
- Category
- Tag
- Private / Unlisted / Public
- Draft / Published / Archived
- List View
- Card View
- Reader Page
- Search
- About
- Autosave
- Revision
- AI Rewrite
- Diff
- AI Category/Tag
- Basic SEO
- Sitemap
- Robots
- Structured Article Metadata
- Export Markdown/JSON
- Database Backup

ไม่ควรรอ Semantic Search หรือ Knowledge Map ก่อนเปิดใช้ เพราะคุณค่าหลักเกิดขึ้นได้จากการเขียน อ่าน และค้นหาแบบปกติแล้ว

---

# 32. Initial Product Backlog

## Epic A — Foundation

- A01 สร้าง Repository
- A02 ตั้ง TypeScript Strict
- A03 ตั้ง Lint/Format/Test
- A04 ตั้ง Database
- A05 ตั้ง Authentication
- A06 สร้าง Admin Shell
- A07 สร้าง Public Shell
- A08 ตั้ง Environment

## Epic B — Theme Engine

- B01 Theme Contract
- B02 Theme Registry
- B03 Default Theme
- B04 Theme Settings Schema
- B05 Theme Preview
- B06 Activate Theme
- B07 Fallback Components
- B08 Compatibility Check

## Epic C — Content

- C01 Content Model
- C02 Create/Edit/Delete
- C03 Status
- C04 Visibility
- C05 Slug
- C06 Category
- C07 Tags
- C08 Series
- C09 Collections
- C10 Revision
- C11 Preview
- C12 Publish

## Epic D — Editor

- D01 Editor Integration
- D02 Typography
- D03 Color
- D04 Font Size
- D05 Code
- D06 Toggle
- D07 Callout
- D08 Table
- D09 Link
- D10 Image
- D11 YouTube
- D12 File
- D13 Slash Menu
- D14 Autosave
- D15 Export

## Epic E — Public Experience

- E01 Home
- E02 Library
- E03 List View
- E04 Card View
- E05 Article
- E06 Category
- E07 Tag
- E08 Series
- E09 Search
- E10 About
- E11 Reader Settings
- E12 Responsive

## Epic F — AI

- F01 Provider Interface
- F02 AI Settings
- F03 Rewrite
- F04 Summarize
- F05 Category/Tags
- F06 SEO Metadata
- F07 Diff
- F08 Accept/Reject
- F09 Block Lock
- F10 Usage Log
- F11 Budget Guard

## Epic G — SEO/AEO/GEO

- G01 Metadata
- G02 Sitemap
- G03 Robots
- G04 Canonical
- G05 Open Graph
- G06 Structured Data
- G07 Breadcrumb
- G08 Redirect
- G09 SEO Review
- G10 Internal Links
- G11 AEO Blocks

## Epic H — Operations

- H01 Upload Security
- H02 Logging
- H03 Monitoring
- H04 Backup
- H05 Restore
- H06 Import
- H07 Export
- H08 Performance
- H09 Accessibility
- H10 Security Review

---

# 33. Definition of Done

Feature ถือว่าเสร็จเมื่อ:

- Requirement ผ่าน
- Code Review แล้ว
- Type Check ผ่าน
- Lint ผ่าน
- Unit/Integration Test ผ่านตามขอบเขต
- Error State ครบ
- Loading State ครบ
- Empty State ครบ
- Mobile ใช้งานได้
- Keyboard ใช้งานได้ในส่วนสำคัญ
- ไม่มีข้อมูล Private รั่ว
- Logging ไม่เก็บ Secret
- Documentation อัปเดต
- Migration ทดสอบแล้ว
- Rollback หรือ Recovery Plan มีใน Feature สำคัญ

---

# 34. ความเสี่ยงและแนวทางลดความเสี่ยง

## Editor Lock-in

**ความเสี่ยง:** ข้อมูลผูกกับ BlockNote Schema

**แนวทาง:**

- เก็บ Schema Version
- มี Export Markdown/HTML
- มี Serializer แยก
- Custom Block มี Fallback
- ไม่ใช้ Component JSX เป็นข้อมูลหลัก

## AI เปลี่ยนความหมาย

**ความเสี่ยง:** Rewrite แล้วข้อมูลผิด

**แนวทาง:**

- Diff
- Accept ราย Block
- Lock Code/Number
- Prompt ห้ามแต่งข้อมูล
- Revision
- Flag Uncertain

## Theme ทำเว็บพัง

**ความเสี่ยง:** Theme ใหม่ไม่รองรับ Feature

**แนวทาง:**

- Contract
- Compatibility
- Fallback
- Visual Test
- Theme มีผลเฉพาะหน้าบ้าน
- Admin คงที่

## Media สูญหาย

**ความเสี่ยง:** External URL หมดอายุ

**แนวทาง:**

- Copy เข้า Storage
- Media Manifest
- Backup
- Broken Link Check

## Scope ใหญ่เกินไป

**ความเสี่ยง:** สร้าง Notion Clone จนไม่เสร็จ

**แนวทาง:**

- เน้น Single Owner
- ไม่มี Collaboration
- ไม่มี Marketplace ใน MVP
- เปิดใช้หลัง Core Editor + Reader + AI Rewrite
- เก็บ Feature ขั้นสูงไว้ Phase 8

## Hosting Compatibility

**ความเสี่ยง:** Runtime บางตัวไม่รองรับ Library

**แนวทาง:**

- Technical Spike
- หลีกเลี่ยง Runtime-specific Logic
- Adapter สำหรับ Storage และ AI
- ทดสอบ Preview Deployment เร็ว

---

# 35. การตัดสินใจที่กำหนดแล้ว

- สร้างใหม่ทั้งหมด
- ไม่ใช้ CuttlePlus เดิม
- ชื่อและแบรนด์กำหนดภายหลัง
- มีหน้าบ้านและหลังบ้าน
- เจ้าของเว็บเป็นผู้เขียนหลักหนึ่งคน
- คนทั่วไปอ่าน Public Content ได้
- Editor เป็นแบบ Block
- ต้องมี Code, Color, Heading, Toggle, Image, Link และ YouTube
- มี List View และ Card View
- AI ช่วยหลังเขียนเสร็จ
- AI ไม่เขียนทับต้นฉบับทันที
- Readability สำคัญกว่า SEO
- รองรับ SEO, AEO และ GEO
- Theme เปลี่ยนและเพิ่มใหม่ได้
- Theme มีผลเฉพาะหน้าบ้าน
- หลังบ้านใช้ Design System คงที่
- Content ต้อง Export ได้

---

# 36. ประเด็นที่ตัดสินใจระหว่าง Technical Spike

- Hosting: Vercel หรือ Cloudflare Workers
- PostgreSQL Provider
- Object Storage Provider
- Authentication Library
- AI Provider เริ่มต้น
- BlockNote License/Feature Set ที่ใช้จริง
- Diff Library
- Syntax Highlight Engine
- Search Implementation ระยะ MVP
- Analytics Provider
- Image Processing Pipeline
- Queue Implementation สำหรับ AI

ประเด็นเหล่านี้ไม่จำเป็นต้องขวางการออกแบบ Domain Model

---

# 37. ลำดับเริ่มงานที่แนะนำ

1. สร้าง Repository ใหม่
2. เขียน Architecture Decision Records
3. ทำ Technical Spike ของ Editor
4. ทำ Technical Spike ของ Theme Engine
5. ทำ Prototype หน้า Article
6. ทดสอบ JSON → HTML → Plain Text
7. ทดสอบ AI Rewrite แบบราย Block
8. เลือก Hosting และ Database
9. สร้าง Authentication
10. สร้าง Content Model
11. พัฒนา Core Editor
12. พัฒนา Public Reader
13. เพิ่ม AI Workflow
14. เพิ่ม SEO/AEO/GEO
15. Import เนื้อหาจริงชุดเล็ก
16. ใช้งานส่วนตัวและเก็บ Feedback
17. ปรับก่อนเปิด Public

---

# 38. Prototype แรกที่ควรสร้าง

Prototype ไม่ควรเริ่มจาก Dashboard แต่ควรเริ่มจากเส้นทางหลัก:

```text
Login
  ↓
Create Content
  ↓
Write with Block Editor
  ↓
Insert Code / Image / Toggle / YouTube
  ↓
Save Draft
  ↓
AI Rewrite
  ↓
Review Diff
  ↓
Publish
  ↓
Read on Public Theme
  ↓
Switch List/Card
```

หากเส้นทางนี้ใช้งานดี โปรเจกต์จะมีแกนหลักที่ถูกต้อง

---

# 39. ตัวชี้วัดความสำเร็จ

เนื่องจากไม่ได้เน้นรายได้ ตัวชี้วัดควรเป็นการใช้งานจริง:

- บันทึกความรู้ใหม่ได้ภายในเวลาสั้น
- ค้นหาความรู้เก่าเจอ
- อ่านเนื้อหาเก่าแล้วเข้าใจ
- จำนวน Note ที่ออกจาก Inbox
- จำนวนบทความที่มี Category/Tag
- จำนวนครั้งที่ AI Suggestion ถูกยอมรับ
- เวลาเฉลี่ยจาก Draft ถึง Ready
- จำนวน Broken Link
- จำนวน Content ที่ไม่มี Backup
- ความถี่ในการกลับมาใช้งาน
- จำนวน Public Content ที่มีผู้เข้าชมจาก Search เป็นตัวชี้วัดรอง

---

# 40. สรุปสถาปัตยกรรม

```text
Browser
├── Public Website
│   ├── Active Theme
│   ├── Library List/Card
│   ├── Article Reader
│   ├── Search
│   └── SEO/AEO/GEO Output
│
└── Admin Application
    ├── Dashboard
    ├── Inbox
    ├── Content Manager
    ├── Block Editor
    ├── AI Review
    ├── Media
    ├── Theme Manager
    └── Settings

Application Core
├── Authentication
├── Content Service
├── Revision Service
├── Theme Registry
├── Rendering Pipeline
├── Search Service
├── AI Provider Layer
├── Media Service
├── SEO Service
└── Audit Service

Infrastructure
├── PostgreSQL
├── Object Storage
├── AI Providers
├── Deployment Platform
├── Monitoring
└── Backup
```

---

# 41. ข้อสรุปสุดท้าย

ระบบนี้ไม่ใช่การสร้าง Notion ใหม่ทั้งระบบ แต่เป็นการเลือกเฉพาะประสบการณ์การเขียนแบบ Block ที่เหมาะกับการเก็บความรู้ส่วนตัว แล้วเพิ่มองค์ประกอบที่ตอบโจทย์การอ่าน การค้นหา และการเผยแพร่

หัวใจของโปรเจกต์มีสี่ส่วน:

1. **เขียนง่าย** — Block Editor, Code, Toggle, Media และ Slash Menu
2. **อ่านง่าย** — Reader Mode, Table of Contents, List/Card และ Theme
3. **จัดระเบียบง่าย** — Category, Tag, Series, Collection, Search และ AI Suggestions
4. **ปรับปรุงอย่างปลอดภัย** — AI Rewrite แบบ Diff, Revision และไม่เขียนทับต้นฉบับ

Theme Architecture จะถูกวางตั้งแต่ต้น แต่ MVP จะเริ่มด้วย Default Theme ที่มีคุณภาพหนึ่ง Theme และ Theme ตัวอย่างอีกหนึ่ง Theme เพื่อพิสูจน์ว่า Core System ไม่ผูกกับหน้าตาใดหน้าตาหนึ่ง

SEO, AEO และ GEO จะถูกสร้างบนพื้นฐานของเนื้อหาที่อ่านง่าย ถูกต้อง มีโครงสร้าง และมีประโยชน์ โดยไม่ลดคุณค่าหลักของเว็บในฐานะคลังความรู้ส่วนตัว

---

# 42. เอกสารอ้างอิงทางเทคนิค

- BlockNote Documentation: https://www.blocknotejs.org/docs
- BlockNote Custom Blocks: https://www.blocknotejs.org/docs/features/custom-schemas/custom-blocks
- BlockNote Code Blocks: https://www.blocknotejs.org/docs/features/blocks/code-blocks
- BlockNote Embeds: https://www.blocknotejs.org/docs/features/blocks/embeds
- BlockNote Suggestion Menus: https://www.blocknotejs.org/docs/react/components/suggestion-menus
- Next.js App Router: https://nextjs.org/docs/app
- Next.js Metadata: https://nextjs.org/docs/app/getting-started/metadata-and-og-images
- Next.js Sitemap: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap
- Next.js Robots: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots
- Prisma Documentation: https://www.prisma.io/docs
- Cloudflare Next.js Workers Guide: https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/
