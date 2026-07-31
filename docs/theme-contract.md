# Theme Contract

Public theme ถูก resolve จาก `src/themes/registry.ts` และต้องประกอบด้วย:

- Manifest: id, semantic version, engine compatibility, supported features และ settings schema version
- Tokens: accent, typography, content width และ radius
- Components: ปัจจุบันเริ่มจาก Shell และจะขยายตาม fallback contract

Theme ห้าม query database, อ่าน secret, เปลี่ยน auth/validation หรือเรียก AI โดยตรง ข้อมูล public ต้องถูกเตรียมจาก Core/Application layer ก่อนส่งให้ theme เสมอ
