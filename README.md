# Quiz Defense — ศึกหมอผีพิทักษ์อาคม

เกมการศึกษา 2D Tower Defense ผสม Quiz สำหรับเด็กประถม ธีมแฟนตาซีไทยแบบเป็นมิตร ใช้ React, TypeScript, Phaser, Vite, IndexedDB และ PWA/Service Worker โดยข้อมูลคำถามและความคืบหน้าเก็บในเบราว์เซอร์ ไม่มี Backend และไม่เรียก API ระหว่างเล่น

## สิ่งที่มีในต้นแบบ

- สนามต่อสู้ 5 เลน พร้อมการแตะเพื่อวางผู้พิทักษ์
- ตัวละครฝ่ายเรา 5 แบบ: กุมารวิญญาณ, ดอกบัวอาคม, บัวสะกดวิญญาณ, เสาหลักอาคม, ดอกบัวเพลิง
- ผี 10 แบบพร้อมความสามารถตามแผนพัฒนา:

| ผี | ความสามารถ |
|---|---|
| ผีตานี | อำพรางตัวทุก 8 วินาที นาน 2 วินาที (โจมตีไม่โดน) |
| ผีกระสือ | ลอยข้ามเสาหลักอาคม |
| ผีเปรต | HP สูงสุด และก้าวยาวพุ่งไปข้างหน้า 1 ช่องทุก 6 วินาที |
| ผีกระหัง | บินข้ามผู้พิทักษ์ทุกชนิด |
| ผีปอบ | ดูดพลังชีวิตผู้พิทักษ์ที่กัดมาฟื้นตัวเอง |
| ผีกองกอย | กระโดดเปลี่ยนเลน และกระโดดถี่ขึ้นเมื่อบาดเจ็บ |
| ผีโพรง | หายตัว 2 วินาทีเมื่อ HP เหลือครึ่ง (ครั้งเดียว) |
| ผีนางรำ | ร่ายรำสะกดผู้พิทักษ์ข้างหน้าในเลนให้หยุดโจมตี 2.5 วินาที |
| ผีหัวขาด | ผู้พิทักษ์ในรัศมีหวาดกลัว โจมตีช้าลงครึ่งหนึ่ง |
| ผีโขมด | แปลงเป็นควันทุก 7 วินาที ลดความเสียหาย 60% นาน 2 วินาที |

- บอสด่าน 3 / 6 / 9: นางรำเฝ้าประตู (สะกดผู้พิทักษ์ทั้งเลน 3 วินาที), ผีพรายเจ้าแม่น้ำ (คลื่นน้ำทั่วสนาม), ผีสมิง (กลายร่างเป็นเสือพร้อมเสือบริวาร)
- ผีที่ผ่านฐานทำให้เสียพลังชีวิตฐาน 1 (บอส 2)
- พลังอาคมจากการตอบคำถามถูกเท่านั้น; มีโบนัสตอบถูกต่อเนื่อง
- ศัตรูโจมตีตัวละครและเดินถึงฐานได้ มีระบบชนะ/แพ้ คะแนน และดาว
- 3 ด่าน โดยด่านถัดไปปลดล็อกหลังผ่านด่านก่อนหน้า
- Question Manager: เพิ่ม/แก้ไข/ลบคำถาม, 4 ตัวเลือก, เฉลย, วิชา, ชั้นเรียน, ความยาก, ค้นหาและกรอง
- Import/Export ชุดคำถาม JSON/CSV และไฟล์สำรองทั้งระบบ
- IndexedDB บันทึกชุดคำถาม คะแนน ดาว ด่านที่ปลดล็อก และการตั้งค่า
- PWA Service Worker precache สำหรับไฟล์ build เพื่อเปิดแอปหลังติดตั้งและเตรียมแคชแล้ว
- ไม่มีภาพ/ฟอนต์/CDN ภายนอกที่จำเป็นระหว่างเล่น; ภาพผีและบอสเป็นไฟล์ WebP ใน `public/ghosts` และ `public/bosses` ซึ่ง Service Worker precache ไว้ (ภาพสมิงร่างเสือและลายเสือยังเป็นภาพชั่วคราว)

## ต้องมี

- Node.js 20 หรือ 22
- npm
- อินเทอร์เน็ตสำหรับติดตั้ง dependencies ครั้งแรกเท่านั้น

## ติดตั้งและพัฒนา

```bash
npm install
npm run dev
```

เปิด URL ที่ Vite แสดงใน terminal

## ตรวจสอบและ Build

```bash
npm test
npm run build
npm run preview
```

ผล build อยู่ใน `dist/`

## เผยแพร่บน Vercel

1. สร้าง repository แยกชื่อ `quiz-defense` บน GitHub แล้วอัปโหลดโฟลเดอร์นี้ (อย่ารวมกับ CRC Dashboard)
2. ใน Vercel เลือก **Add New → Project** แล้ว Import repository `quiz-defense`
3. Framework preset: Vite; Build Command: `npm run build`; Output Directory: `dist`
4. เมื่อ deploy แล้วเปิดเว็บออนไลน์หนึ่งครั้ง รอ Service Worker install/activate และตรวจสถานะ “ออฟไลน์พร้อมใช้” ก่อนทดสอบตัดอินเทอร์เน็ต
5. สำหรับ iPad เปิด URL ด้วย Safari → Share → Add to Home Screen; เปิดแอปที่เพิ่มไว้ตอนออนไลน์ครั้งแรก แล้วกลับมาทดลองใน Airplane Mode

## การทำงานออฟไลน์และข้อจำกัด

- Service Worker precache ไฟล์ build; IndexedDB เก็บข้อมูลภายใน origin/เบราว์เซอร์นี้
- ต้องเปิดแอปออนไลน์อย่างน้อยครั้งแรกหลัง deployment/อัปเดต เพื่อดาวน์โหลด cache เวอร์ชันล่าสุด
- การส่งไฟล์ JSON/CSV ไปยัง iPad ทำได้ด้วย AirDrop, iCloud Drive หรือ Files; จากนั้นเลือก Import ภายในเกม
- อย่าล้าง Website Data ของ Safari หากยังไม่ export ข้อมูลสำรอง เพราะ IndexedDB ผูกกับข้อมูลเว็บไซต์ในเครื่อง
- การติดตั้ง PWA และการเก็บ cache แตกต่างกันตามเวอร์ชัน iPadOS/Safari; ต้องทดสอบบน iPad จริงก่อนใช้งานในห้องเรียน
- ยังไม่ได้ยืนยันผลการทดสอบบน iPad จริงในสภาพแวดล้อมการสร้างต้นแบบนี้

## รูปแบบ JSON สำหรับแลกเปลี่ยนชุดคำถาม

```json
{
  "app": "quiz-defense",
  "schemaVersion": 1,
  "exportedAt": "2026-10-26T00:00:00.000Z",
  "sets": [{
    "id": "starter-set",
    "name": "ชุดเริ่มต้น",
    "description": "คำถามสำหรับ ป.3",
    "subject": "หลายวิชา",
    "updatedAt": "2026-10-26T00:00:00.000Z",
    "questionIds": ["q1"]
  }],
  "questions": [{
    "id": "q1",
    "setId": "starter-set",
    "question": "2 + 2 ได้เท่าไร?",
    "choices": ["2", "3", "4", "5"],
    "answerIndex": 2,
    "explanation": "2 + 2 = 4",
    "subject": "คณิตศาสตร์",
    "grade": "ป.2",
    "difficulty": "ง่าย"
  }]
}
```

`answerIndex` เริ่มจาก 0 (A=0, B=1, C=2, D=3)

## CSV

ต้องมีหัวคอลัมน์ตามลำดับหรือมีชื่อครบ: `setName, question, choiceA, choiceB, choiceC, choiceD, answerIndex, explanation, subject, grade, difficulty` ตัวอย่างอยู่ใน `public/samples/questions.csv`

## โครงสร้างสำคัญ

```text
src/
  App.tsx                  หน้าจอและ flow ของผู้เล่น
  components/
    GameCanvas.tsx         mount Phaser canvas
    QuestionManager.tsx    CRUD คำถามและชุดคำถาม
  game/
    GameScene.ts            loop ต่อสู้ วางตัวละคร กระสุน ศัตรู และด่าน
    config.ts               ราคา พลังชีวิต ความสามารถ และค่าด่าน
  data/defaultQuestions.ts  คำถามตั้งต้น
  storage/database.ts       IndexedDB, ตรวจสอบ JSON, Import/Export
  utils/csv.ts              parser/serializer CSV พร้อม quote handling
  styles.css                UI ธีมอาคมสำหรับจอสัมผัส
public/
  manifest.webmanifest
  icons/
```

## สถานะการทดสอบและเผยแพร่

- TypeScript data/storage modules: ตรวจผ่านด้วย TypeScript compiler
- TS/TSX syntax scan: ตรวจผ่าน
- Strict source type check: ตรวจผ่านด้วย temporary declarations สำหรับไลบรารีภายนอกที่ยังติดตั้งไม่ได้ จึงไม่ใช่ผลทดสอบจาก React/Phaser types ของจริง
- Core checks: ผ่านการตรวจ JSON sample, parse CSV ที่มี comma/escaped quotes, CSV round-trip, import แบบเพิ่ม/แทนที่ และการปฏิเสธข้อมูลผิดรูปแบบ
- ZIP source archive: ตรวจความสมบูรณ์ของ archive ผ่าน
- `npm install`, `npm test`, `npm run build` จริง: ยังรันไม่ได้ใน environment สร้างไฟล์นี้ เพราะ DNS/network resolve `registry.npmjs.org` ไม่สำเร็จ (`EAI_AGAIN`); ต้องรันในเครื่องหรือ build environment ที่เข้าถึง npm registry ได้
- GitHub/Vercel: source ยังไม่ได้ push หรือ deploy; ต้องสร้าง repository แยก `quiz-defense` ก่อน แล้วเชื่อมกับ Vercel
- ทดสอบ iPad จริง/การเปิดหลังตัดอินเทอร์เน็ต: ยังไม่ยืนยัน และต้องตรวจบน iPad/iPadOS จริงก่อนใช้งานจริง
