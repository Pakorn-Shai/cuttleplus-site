# Technical Spike Notes

## Confirmed

- Next.js App Router แยก Server Components และ Client Components ได้ตาม requirement
- Public reader render โดยไม่ import BlockNote bundle
- BlockNote รองรับ paragraph, headings, list, code block และ slash menu ใน prototype
- Theme registry สลับ token/shell implementation ได้โดยไม่แก้ content domain
- JSON-LD, metadata, sitemap และ robots สร้างผ่าน Next.js conventions ได้
- Prisma schema แสดง domain model และ validate แยกจาก runtime provider ได้

## Pending decisions

- Authentication library/configuration
- Managed PostgreSQL provider
- S3-compatible object storage provider
- HTML sanitizer and serializer strategy for custom blocks
- AI provider, structured output schema and diff library
- Deployment target and runtime compatibility
