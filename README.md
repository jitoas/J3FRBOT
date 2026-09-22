# 🤖 Discord Bot Master (Node.js & Discord.js v14)

مشروع ديسكورد بوت متكامل واحترافي، مستقل تمامًا، مبني على أحدث معايير **Discord.js v14** و **Node.js** مع معمارية معيارية (Modular Architecture) جاهز للرفع على **GitHub** والتشغيل المباشر على **Render**.

---

## 🌟 المميزات والأنظمة المدمجة

1. **👋 نظام الترحيب الذكي (Welcome System & Custom Canvas Cards):**
   - إرسال بطاقة ترحيبية مصممة باستخدام Canvas مع Avatar العضو، اسمه، ترتيبه في السيرفر، وتأثيرات ضوئية.
   - دعم قوالب ألوان متعددة (`modern-dark`, `aurora-blue`, `sunset-purple`, `cyber-emerald`).
   - رسالة ترحيبية قابلة للتخصيص الكامل مع متغيرات `{user}`, `{server}`, `{count}`, `{username}`.
   - فصل منطق التصميم في Service مستقل لتسهيل تغيير القوالب مستقبلًا.

2. **📜 نظام السجلات الشامل (Comprehensive Logging System):**
   - مراقبة وتوثيق 15+ حدث مختلف في سيرفر ديسكورد بإمبدات (Embeds) منظمة ومميزة بألوان وتواقيت دقيقة:
     - `Member Join` (انضمام عضو مع عمر حسابه وعدد الأعضاء).
     - `Member Leave` / `Member Kick` (المغادرة أو الطرد مع جلب منفذ العملية والسبب من Audit Logs).
     - `Member Ban` / `Member Unban` (الحظر وفك الحظر مع السبب والمنفذ).
     - `Message Delete` (حذف رسالة بشكل آمن دون تسريب أسرار).
     - `Message Edit` (مقارنة محتوى الرسالة قبل وبعد التعديل).
     - `Role Create` / `Role Delete` / `Role Update` (إنشاء، حذف، وتعديل الرتب والألوان والصلاحيات).
     - `Channel Create` / `Channel Delete` / `Channel Update` (إنشاء، حذف، وتعديل القنوات النصية والصوتية).
     - `Server/Guild Update` (تحديث اسم وأيقونة السيرفر).
     - `Voice Join` / `Voice Leave` / `Voice Switch` (حركات القنوات الصوتية).
     - `Bot Join` (انضمام البوت لسيرفر جديد).

3. **🛡️ نظام الإشراف والأوامر التفاعلية (Moderation Slash Commands):**
   - `/kick <target> [reason]` : طرد عضو مع فحص هرمية الرتب وصلاحيات البوت.
   - `/ban <target> [reason] [days]` : حظر عضو مع إمكانية مسح رسائله السابقة حتى 7 أيام.
   - `/unban <user_id> [reason]` : فك الحظر عن عضو بواسطة ID مع التحقق من المعرّف.
   - `/setwelcome <channel> [enabled] [message] [theme]` : تهيئة قناة ونمط الترحيب.
   - `/setlogs <channel> [enabled]` : تحديد قناة السجلات الشاملة.
   - `/config` : فحص التهيأة الحالية للسيرفر في قاعدة البيانات.
   - `/ping` & `/help` : فحص سرعة الاستجابة واستعراض دليل الأوامر.
   - حماية كاملة ضد معاقبة مالك السيرفر أو النفس أو أصحاب الرتب الأعلى من البوت/المشرف.

4. **⭐ معمارية نظام المستويات (Level System Architecture - Future-Ready):**
   - معمارية معيارية مفصولة في `services/levelService.js`.
   - كولداون ضد السبام، معادلة حساب المستويات، وجداول جاهزة للـ Leaderboard وإعطاء الرتب مستقبلًا.

5. **🗄️ طبقة قاعدة البيانات المجردة (Database Abstraction Layer):**
   - معمارية المحولات (Adapter Pattern) تدعم التبديل السلس بين:
     - `json` (محول افتراضي فائق السرعة بدون أي إعدادات أو مفاتيح خارجية).
     - `sqlite` (جاهز للربط مع ملفات SQLite).
     - `postgres` / `supabase` (جاهز للربط عبر `DATABASE_URL`).
   - عزل تام لإعدادات كل سيرفر (`guildId`) على حدة.

6. **🚀 جاهزية النشر على Render و GitHub:**
   - خادم Express مدمج لفحص الصحة (`/health` & `/`) لضمان عدم توقف خدمة Render المجانية عند استخدام أداة فحص دورية (مثل UptimeRobot أو Cron-Job).
   - تسجيل الـ Slash Commands التلقائي عبر `npm run deploy-commands`.
   - معالجة الأخطاء الشاملة (`unhandledRejection`, `uncaughtException`, `SIGINT`, `SIGTERM`).

---

## 📁 هيكلية المشروع (Project Structure)

```text
├── bot/
│   ├── src/
│   │   ├── commands/
│   │   │   ├── moderation/       # /kick, /ban, /unban
│   │   │   │   ├── kick.js
│   │   │   │   ├── ban.js
│   │   │   │   └── unban.js
│   │   │   ├── config/           # /setwelcome, /setlogs, /config
│   │   │   │   ├── setwelcome.js
│   │   │   │   ├── setlogs.js
│   │   │   │   └── config.js
│   │   │   └── general/          # /ping, /help
│   │   │       ├── ping.js
│   │   │       └── help.js
│   │   ├── events/
│   │   │   ├── client/           # ready, interactionCreate
│   │   │   ├── guild/            # memberAdd, memberRemove, banAdd, banRemove, guildUpdate
│   │   │   ├── messages/         # messageDelete, messageUpdate, messageCreate (XP hook)
│   │   │   ├── channels/         # channelCreate, channelDelete, channelUpdate
│   │   │   ├── roles/            # roleCreate, roleDelete, roleUpdate
│   │   │   └── voice/            # voiceStateUpdate
│   │   ├── services/
│   │   │   ├── welcomeCardService.js  # Canvas Image Generator
│   │   │   ├── loggingService.js      # Audit Logs & Embed Formatter
│   │   │   ├── moderationService.js   # Moderation Actions & Validation
│   │   │   └── levelService.js        # XP Engine Architecture
│   │   ├── database/
│   │   │   ├── index.js               # Database Gateway
│   │   │   └── adapters/              # JSON, SQLite, Postgres Adapters
│   │   ├── utils/
│   │   │   ├── logger.js              # Colored Console Logger
│   │   │   ├── embedBuilder.js        # Discord Embed Builder
│   │   │   ├── permissions.js         # Hierarchy & Permission Validator
│   │   │   └── auditLogs.js           # Safe Discord Audit Log Parser
│   │   ├── config/
│   │   │   ├── botConfig.js           # Bot & Fallback Settings
│   │   │   └── intents.js             # Gateway Intents & Permissions
│   │   ├── server.js                  # Express Keep-Alive & Health Check
│   │   ├── deploy-commands.js         # Discord REST Slash Command Deployer
│   │   └── index.js                   # Application Entry Point & Lifecycle
│   └── package.json
├── .env.example
├── .gitignore
├── render.yaml
└── README.md
```

---

## 🛠️ التثبيت والتشغيل المحلي (Local Setup)

### 1. المتطلبات:
- تثبيت **Node.js** الإصدار 18 أو أحدث (`node -v`).

### 2. تثبيت الحزم (Dependencies):
```bash
npm install
```

### 3. إعداد متغيرات البيئة (`.env`):
قم بإنشاء ملف باسم `.env` في المجلد الرئيسي (أو انسخ من `.env.example`):
```env
DISCORD_TOKEN=MTE5...ضع_التوكن_الخاص_بالبوت_هنا
CLIENT_ID=119...ضع_معرف_البوت_هنا
PORT=3000
DB_TYPE=json
```

### 4. تسجيل أوامر Slash Commands:
قم بتشغيل أمر التسجيل لإرسال الأوامر إلى ديسكورد:
```bash
npm run deploy-commands
```
*(ملاحظة: يمكنك وضع `DEV_GUILD_ID=your_server_id` في `.env` أثناء التطوير لتسجيل الأوامر فورًا في سيرفرك التجريبي دون انتظار مزامنة ديسكورد العالمية).*

### 5. تشغيل البوت:
```bash
npm start
```

---

## 🔑 إعدادات بوابة مطوري ديسكورد (Discord Developer Portal)

1. توجه إلى [Discord Developer Portal](https://discord.com/developers/applications).
2. أنشئ تطبيقًا جديدًا بالضغط على **New Application**.
3. توجه إلى تبويب **Bot**:
   - اضغط **Reset Token** للحصول على الـ `DISCORD_TOKEN` (احفظه بأمان ولا تشاركه أبداً).
   - فعّل الـ **Privileged Gateway Intents** التالية (ضرورية جداً لعمل البوت):
     - ✅ **Presence Intent**
     - ✅ **Server Members Intent** (مطلوب لنظام الترحيب والسجلات)
     - ✅ **Message Content Intent** (مطلوب لسجلات تعديل الرسائل ونظام XP)
4. توجه إلى تبويب **General Information**:
   - انسخ الـ **Application ID** وضعه كـ `CLIENT_ID`.
5. لتوليد رابط دعوة البوت (OAuth2):
   - توجه إلى تبويب **OAuth2** > **URL Generator**.
   - اختر Scopes: `bot` و `applications.commands`.
   - اختر Bot Permissions التالية:
     - View Channels
     - Send Messages
     - Read Message History
     - Embed Links
     - Attach Files
     - View Audit Log
     - Manage Messages
     - Kick Members
     - Ban Members
     - Manage Roles
   - انسخ الرابط وافتح في المتصفح لإضافة البوت لسيرفرك!

---

## 🚀 النشر على GitHub ثم Render (Step-by-Step Deployment)

### الخطوة الأولى: رفع المشروع إلى GitHub
1. تأكد من وجود ملف `.gitignore` الذي يمنع رفع `.env` ومجلد `node_modules`.
2. افتح الطرفية (Terminal) في مجلد المشروع ونفذ:
```bash
git init
git add .
git commit -m "Initial commit: Discord Bot Master"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
git push -u origin main
```

### الخطوة الثانية: النشر على منصة Render
1. سجل دخول إلى [Render.com](https://render.com).
2. اضغط على **New +** ثم اختر **Web Service**.
3. اربط حساب GitHub واختر مستودع المشروع (Repository).
4. املأ الإعدادات التالية:
   - **Name:** `discord-bot-master`
   - **Environment:** `Node`
   - **Branch:** `main`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan Type:** `Free`
5. في قسم **Environment Variables** (مهم جدًا):
   - أضف `DISCORD_TOKEN` = *(التوكن الخاص بك)*
   - أضف `CLIENT_ID` = *(معرف البوت)*
   - أضف `PORT` = `3000`
   - أضف `NODE_ENV` = `production`
   - أضف `DB_TYPE` = `json`
6. اضغط **Deploy Web Service**.
7. بعد اكتمال البناء، اذهب إلى تبويب **Shell** في Render وشغل أمر تسجيل الأوامر لمرة واحدة:
```bash
node src/deploy-commands.js
```
8. **إبقاء البوت متصل 24/7 مجانًا:**
   - انسخ رابط الخدمة الذي يعطيك إياه Render (مثل: `https://discord-bot-master.onrender.com`).
   - اذهب إلى موقع مجاني مثل [UptimeRobot.com](https://uptimerobot.com) أو [cron-job.org](https://cron-job.org).
   - أضف Monitor من نوع `HTTP(s)` للرابط كل 5 دقائق لضمان استمرار عمل البوت باستمرار دون نوم.

---

## 💡 التوسع وإضافة Dashboard أو نظام XP مستقبلاً

- **إضافة أوامر جديدة:** ببساطة أنشئ ملفًا جديدًا في `src/commands/<category>/mycommand.js` بنفس نمط الأوامر الحالية ثم شغل `npm run deploy-commands`.
- **نظام المستويات:** ملف `src/services/levelService.js` مجهز بجميع دوال الحساب وتخزين الـ XP، ويمكنك ربطه بأوامر `/rank` و `/leaderboard`.
- **ربط Dashboard:** تم فصل طبقة الـ Database وقواعد البيانات بالكامل، مما يتيح بناء لوحة تحكم ويب تفاعلية والاتصال بنفس قاعدة البيانات دون تعديل كود البوت.
