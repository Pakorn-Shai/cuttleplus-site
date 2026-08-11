# Deployment Guide — Knowledge Hub

คู่มือนี้ครอบคลุมขั้นตอนการ deploy Knowledge Hub ไปยัง production environment ที่ใช้ **Vercel** (Next.js hosting) + **Neon** (managed PostgreSQL) + **Cloudflare R2** (S3-compatible object storage) + **OpenRouter** (AI provider)

## ภาพรวมสถาปัตยกรรม Production

```
                     ┌──────────────┐
                     │   Vercel     │
                     │  Next.js 16  │
                     │  Edge/Server │
                     └──────┬───────┘
                            │
          ┌─────────────────┼─────────────────┐
          ▼                 ▼                  ▼
   ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
   │ Neon (PG)    │ │ Cloudflare   │ │ OpenRouter   │
   │ Primary DB   │ │ R2 (S3)     │ │ AI API       │
   └──────────────┘ └──────────────┘ └──────────────┘
```

## 1. ตั้งค่า Neon PostgreSQL

1. สร้าง project ที่ [neon.tech](https://neon.tech)
2. สร้าง database ชื่อ `knowledge_hub`
3. Copy connection string (แบบ pooled connection สำหรับ serverless)

```bash
DATABASE_URL="postgresql://neondb_owner:password@ep-xxx-pooler.us-east-2.aws.neon.tech/knowledge_hub?sslmode=require"
```

4. สร้าง test database อีกฐานหนึ่งสำหรับ integration tests:

```bash
TEST_DATABASE_URL="postgresql://neondb_owner:password@ep-xxx-pooler.us-east-2.aws.neon.tech/knowledge_hub_test?sslmode=require"
```

## 2. ตั้งค่า Cloudflare R2 (Object Storage)

1. สร้าง R2 bucket เช่น `knowledge-hub-media`
2. สร้าง R2 API Token ที่มีสิทธิ์ Object Read & Write
3. ตั้งค่า CORS ใน R2:

```json
[
  {
    "AllowedOrigins": ["https://yourdomain.com"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }
]
```

4. เปิดใช้งาน Object Versioning (Bucket Settings → Versioning → Enable)

Environment variables:

```bash
S3_ENDPOINT="https://<account-id>.r2.cloudflarestorage.com"
S3_REGION="auto"
S3_ACCESS_KEY_ID="<r2-access-key-id>"
S3_SECRET_ACCESS_KEY="<r2-secret-access-key>"
S3_FORCE_PATH_STYLE="false"
S3_MEDIA_BUCKET="knowledge-hub-media"
```

## 3. ตั้งค่า OpenRouter AI

1. สมัคร [openrouter.ai](https://openrouter.ai) และสร้าง API key
2. ตั้งค่า spending limit (แนะนำ $5-10/mo สำหรับไซต์ขนาดเล็ก)

```bash
OPENROUTER_API_KEY="sk-or-v1-..."
OPENROUTER_MODEL="openai/gpt-4o-mini"
```

ระบบ default เป็น `openai/gpt-5.6-luna` (ตาม `OPENROUTER_MODEL` env) เปลี่ยน model ได้ตามต้องการ

## 4. ตั้งค่า Authentication

```bash
OWNER_EMAIL="you@example.com"
ADMIN_PASSWORD="<generate-strong-password>"
ADMIN_SESSION_SECRET="<openssl rand -hex 64>"
```

**ห้ามใช้รหัสซ้ำกับบัญชีอื่น หรือตั้งรหัสที่คาดเดาได้**

## 5. ตั้งค่า Scheduled Tasks (Cron)

สำหรับ Scheduled Publishing และ Automated Backup ต้องใช้ cron service เรียก `/api/admin/scheduled-publish` และ `/api/admin/backup/automated`

```bash
SCHEDULER_SECRET="<openssl rand -hex 32>"
```

**ใช้ Vercel Cron Jobs** (ง่ายที่สุด):

ใน `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/admin/scheduled-publish",
      "schedule": "* * * * *"
    },
    {
      "path": "/api/admin/backup/automated",
      "schedule": "0 4 * * *"
    }
  ]
}
```

หรือใช้ **GitHub Actions**:

```yaml
name: Scheduled Tasks
on:
  schedule:
    - cron: "*/5 * * * *" # Scheduled publish every 5 min
    - cron: "0 4 * * *" # Backup daily at 4 AM UTC
jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - run: |
          curl -X POST https://yourdomain.com/api/admin/scheduled-publish \
            -H "Authorization: Bearer ${{ secrets.SCHEDULER_SECRET }}"
  backup:
    runs-on: ubuntu-latest
    steps:
      - run: |
          curl -X POST https://yourdomain.com/api/admin/backup/automated \
            -H "Authorization: Bearer ${{ secrets.SCHEDULER_SECRET }}"
```

## 6. ตั้งค่า Automated Backup S3

ถ้าต้องการให้ cron backup อัปโหลดไป S3 โดยอัตโนมัติ (object versioning):

```bash
BACKUP_S3_BUCKET="knowledge-hub-backups"
BACKUP_S3_PREFIX="automated/"
```

ระบบจะใช้ credentials เดียวกับ `S3_*` env vars ด้านบน หากไม่ตั้งค่า `BACKUP_S3_BUCKET` ระบบจะทำ backup ในฐานข้อมูลเท่านั้น (บันทึกผ่าน audit log) และไม่เสียบ S3

**แนะนำ**: ตั้งค่า **Object Lock** หรือ **lifecycle policy** ใน R2 เพื่อป้องกันการลบ backup โดยไม่ตั้งใจ:

- Keep latest 90 backups
- Delete backups older than 90 days

## 7. ตั้งค่า Vercel Project

1. ติดตั้ง Vercel CLI: `npm i -g vercel`
2. Run `vercel` แล้ว link project
3. Add environment variables ทั้งหมดใน Vercel Dashboard → Settings → Environment Variables
4. ตั้งค่า Production Domain

```bash
# Deploy
vercel --prod
```

### Vercel-specific settings

- **Node.js Version**: 20.x ขึ้นไป
- **Build Command**: `npm run build` (auto)
- **Install Command**: `npm install` (auto)
- **Output Directory**: `.next` (auto)
- **Environment**: Production

## 8. ตั้งค่า Preview Environment

Preview deployments จะถูกป้องกัน indexing โดยอัตโนมัติ (ระบบตรวจ `VERCEL_ENV=preview`):

- `robots.ts` → `Disallow: /`
- `layout.tsx` → `<meta name="robots" content="noindex, nofollow">`

ไม่ต้องตั้งค่าเพิ่มเติม

## 9. Environment Variables ทั้งหมด

```bash
# === Required ===
DATABASE_URL=postgresql://...
OWNER_EMAIL=you@example.com
ADMIN_PASSWORD=<strong-password>
ADMIN_SESSION_SECRET=<64-char-hex>

# === AI (Required for AI features) ===
OPENROUTER_API_KEY=sk-or-v1-...

# === Object Storage (Required for Media upload) ===
S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
S3_REGION=auto
S3_ACCESS_KEY_ID=<key>
S3_SECRET_ACCESS_KEY=<secret>
S3_MEDIA_BUCKET=knowledge-hub-media

# === Scheduler (Required for Scheduled Publishing) ===
SCHEDULER_SECRET=<32-char-hex>

# === Optional ===
OPENROUTER_MODEL=openai/gpt-4o-mini
BACKUP_S3_BUCKET=knowledge-hub-backups
BACKUP_S3_PREFIX=automated/
S3_FORCE_PATH_STYLE=false
LOG_LEVEL=info
SLOW_QUERY_THRESHOLD_MS=500
NODE_ENV=production

# === Test only (do NOT set in production) ===
TEST_DATABASE_URL=postgresql://...
PREVIEW_ENV=true
```

## 10. Deploy ครั้งแรก

```bash
# 1. Clone project
git clone <repo-url>
cd knowledge-hub

# 2. Install dependencies
npm ci

# 3. Set all environment variables (copy .env.example or set in Vercel)

# 4. Generate Prisma client and run migrations
npx prisma generate
npx prisma migrate deploy

# 5. Seed initial data (owner user, sample taxonomy)
npm run db:seed

# 6. Build
npm run build

# 7. Deploy to Vercel
vercel --prod
```

## 11. Health Check

หลัง deploy ตรวจสอบ:

```bash
# Health endpoint
curl https://yourdomain.com/api/health
# → { "status": "ok", "timestamp": "...", "database": "connected" }

# Public home page
curl -I https://yourdomain.com/
# → 200 OK

# Admin login page
curl -I https://yourdomain.com/login
# → 200 OK

# Verify noindex on preview (should exist)
curl -I https://preview.yourdomain.com/ | grep -i x-robots-tag
```

## 12. Post-Deployment Checklist

- [ ] ล็อกอินผ่าน `/login` ด้วย OWNER_EMAIL และ ADMIN_PASSWORD สำเร็จ
- [ ] สร้างบทความ Draft → Publish → แสดงบน Public reader
- [ ] อัปโหลด Media → แสดงภาพในบทความ
- [ ] AI Generate → Accept → แสดงเนื้อหาใหม่
- [ ] Scheduled publish ทำงานตามเวลา (รอ cron รอบแรกหรือ manual trigger)
- [ ] Backup download ผ่าน `/admin/settings` และ restore แบบ dry-run สำเร็จ
- [ ] Automated backup cron ทำงานตามเวลา (ตรวจ audit log `AUTOMATED_BACKUP_CREATED`)

## 13. Monitoring & Alerts

### ระบบที่มีอยู่แล้ว

- **Structured logging**: ทุก log เป็น JSON บรรทัดเดียว ที่ Vercel Logs/CloudWatch
- **Slow query monitoring**: Prisma log ทุก query ที่เกิน `SLOW_QUERY_THRESHOLD_MS` (default 500ms)
- **Request correlation**: ทุก request มี `X-Request-Id` และ log ใช้ `correlationId`
- **AI cost tracking**: ดูได้ที่ `/admin/ai` → สถิติการใช้งาน AI

### แนะนำเพิ่ม

- ตั้ง alert สำหรับ Vercel 500 errors (ผ่าน Vercel Observability หรือ Sentry)
- ตรวจ Neon database metrics: connections, CPU, storage
- ตั้ง R2 billing alert สำหรับ bandwidth/storage
- ติดตาม OpenRouter credit usage ผ่าน dashboard

## 14. Rollback Procedure

### Application rollback (Vercel)

```bash
# Via Vercel CLI
vercel rollback

# หรือผ่าน Vercel Dashboard → Deployments → เลือก deployment → Promote to Production
```

### Database rollback (Neon)

Neon รองรับ **Instant Restore** และ **Time Travel**:

```bash
# ผ่าน Neon Console → Branches → Restore
# หรือถ้าใช้ automated backup:
# 1. ดาวน์โหลด backup ล่าสุดจาก S3
# 2. Restore ผ่าน Admin → Settings → Restore
```

### Media rollback (R2)

R2 มี object versioning ถ้าเปิดไว้:

- ไปที่ R2 Console → object → Versions → Revert

## 15. Updating Dependencies

```bash
# Check outdated packages
npm outdated

# Update all minor/patch
npm update

# Update major versions manually and test
npm install package@latest

# After updating, run full test suite
npm run typecheck
npm run lint
npm test
npm run test:integration
npm run test:e2e
npm run build
```

## 16. Scaling Notes

- **Neon**: Free tier รองรับ 500MB และ 100 concurrent connections — เพียงพอสำหรับไซต์ส่วนตัวถึงหลักพัน readers/day
- **Vercel**: Pro plan ($20/mo) เพียงพอสำหรับ traffic ปานกลาง เพิ่ม bandwidth/execution ตาม plan
- **R2**: Free tier 10GB storage + 10M Class B operations/เดือน — เพียงพอสำหรับ media library หลักพันรูป
- **OpenRouter**: ตั้ง spending limit เพื่อควบคุมค่าใช้จ่าย AI ($5/mo เพียงพอสำหรับ ~500 requests ด้วย GPT-4o-mini)
