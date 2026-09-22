import React, { useState } from 'react';
import { 
  Rocket, 
  Key, 
  ShieldCheck, 
  ExternalLink, 
  Terminal, 
  Copy, 
  Check, 
  Server, 
  CheckCircle2, 
  Globe, 
  Github,
  AlertCircle
} from 'lucide-react';

export const DeploymentGuide: React.FC = () => {
  const [clientIdInput, setClientIdInput] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Exact Discord bitwise permissions integer for requested permissions:
  // View Channels (1024), Send Messages (2048), Read Message History (65536),
  // Embed Links (16384), Attach Files (32768), View Audit Log (128),
  // Manage Messages (8192), Kick Members (2), Ban Members (4), Manage Roles (268435456)
  const PERMISSIONS_INTEGER = '268560558';

  const generatedInviteLink = clientIdInput.trim()
    ? `https://discord.com/api/oauth2/authorize?client_id=${clientIdInput.trim()}&permissions=${PERMISSIONS_INTEGER}&scope=bot%20applications.commands`
    : '';

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold mb-2">
          <Rocket className="w-3.5 h-3.5" />
          دليل التشغيل والنشر المتكامل (Deployment & Developer Guide)
        </div>
        <h2 className="text-xl font-bold text-white">خطوات إعداد البوت ورفعه على GitHub ونشره على Render</h2>
        <p className="text-slate-400 text-sm mt-1">
          اتبع هذا الدليل خطوة بخطوة لتشغيل البوت في سيرفرك وربطه بـ Render ليعمل 24/7 مجانًا.
        </p>
      </div>

      {/* STEP 1: Discord Developer Portal */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 font-bold flex items-center justify-center text-sm">
            1
          </div>
          <div>
            <h3 className="font-bold text-white text-base">إنشاء البوت في بوابة مطوري ديسكورد (Discord Developer Portal)</h3>
            <p className="text-xs text-slate-400">الحصول على Token و Client ID وتفعيل الـ Privileged Intents</p>
          </div>
        </div>

        <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
          <ol className="list-decimal list-inside space-y-2 pr-2">
            <li>توجه إلى موقع <a href="https://discord.com/developers/applications" target="_blank" rel="noreferrer" className="text-indigo-400 underline font-medium inline-flex items-center gap-1">Discord Developer Portal <ExternalLink className="w-3 h-3" /></a></li>
            <li>اضغط على <strong>New Application</strong> واكتب اسم البوت ثم اضغط <strong>Create</strong>.</li>
            <li>من القائمة الجانبية ادخل إلى قسم <strong>Bot</strong>:
              <ul className="list-disc list-inside pr-4 text-xs text-slate-400 space-y-1 mt-1">
                <li>اضغط على <strong>Reset Token</strong> ثم انسخ التوكن الناتج (ضعه في <code className="text-indigo-300 font-mono">DISCORD_TOKEN</code>).</li>
                <li><strong>هام جدًا:</strong> مرر لأسفل إلى قسم <strong>Privileged Gateway Intents</strong> وفعّل:
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-1.5 font-medium text-slate-200">
                    <span className="bg-slate-950 p-2 rounded-lg border border-slate-800 flex items-center gap-1.5 text-xs text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Presence Intent
                    </span>
                    <span className="bg-slate-950 p-2 rounded-lg border border-slate-800 flex items-center gap-1.5 text-xs text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Server Members Intent
                    </span>
                    <span className="bg-slate-950 p-2 rounded-lg border border-slate-800 flex items-center gap-1.5 text-xs text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Message Content Intent
                    </span>
                  </div>
                </li>
              </ul>
            </li>
            <li>من قسم <strong>General Information</strong> انسخ الـ <strong>Application ID</strong> وضعه كـ <code className="text-indigo-300 font-mono">CLIENT_ID</code>.</li>
          </ol>
        </div>

        {/* Invite Link Generator */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 mt-3 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
            <Globe className="w-4 h-4 text-indigo-400" />
            توليد رابط دعوة البوت الرسمي (OAuth2 Invite Link Generator)
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="الصق CLIENT_ID الخاص ببوتك هنا..."
              value={clientIdInput}
              onChange={e => setClientIdInput(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
            />
            {generatedInviteLink ? (
              <a
                href={generatedInviteLink}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md"
              >
                فتح رابط الدعوة <ExternalLink className="w-3 h-3" />
              </a>
            ) : (
              <span className="px-4 py-2 bg-slate-800 text-slate-500 rounded-xl text-xs font-semibold text-center">
                أدخل المعرّف لتوليد الرابط
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400">
            الصلاحيات المضمنة بالرابط: <code className="text-indigo-400">Kick, Ban, Manage Roles, Manage Messages, Embeds, Attachments, Audit Logs, Voice, Channels</code> (بدون Administrator).
          </p>
        </div>
      </div>

      {/* STEP 2: Local Run & Command Registration */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 font-bold flex items-center justify-center text-sm">
            2
          </div>
          <div>
            <h3 className="font-bold text-white text-base">التشغيل المحلي وتسجيل أوامر الـ Slash Commands</h3>
            <p className="text-xs text-slate-400">تنفيذ أوامر التثبيت وبناء السجلات والأوامر</p>
          </div>
        </div>

        <div className="space-y-3 text-sm text-slate-300">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>أ) تثبيت المكتبات (Dependencies):</span>
              <button
                onClick={() => copyToClipboard('npm install', 1)}
                className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
              >
                {copiedIndex === 1 ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                نسخ
              </button>
            </div>
            <pre className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-xs text-emerald-400">
              npm install
            </pre>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>ب) تسجيل أوامر الـ Slash Commands مع ديسكورد:</span>
              <button
                onClick={() => copyToClipboard('node bot/src/deploy-commands.js', 2)}
                className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
              >
                {copiedIndex === 2 ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                نسخ
              </button>
            </div>
            <pre className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-xs text-emerald-400">
              node bot/src/deploy-commands.js
            </pre>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>ج) تشغيل البوت:</span>
              <button
                onClick={() => copyToClipboard('node bot/src/index.js', 3)}
                className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
              >
                {copiedIndex === 3 ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                نسخ
              </button>
            </div>
            <pre className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-xs text-emerald-400">
              node bot/src/index.js
            </pre>
          </div>
        </div>
      </div>

      {/* STEP 3: GitHub Push */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 font-bold flex items-center justify-center text-sm">
            3
          </div>
          <div>
            <h3 className="font-bold text-white text-base">رفع المشروع على GitHub (Git Push)</h3>
            <p className="text-xs text-slate-400">يضمن ملف .gitignore عدم تسريب أي أسرار إطلاقًا</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>أوامر الرفع إلى مستودع GitHub:</span>
            <button
              onClick={() => copyToClipboard(`git init\ngit add .\ngit commit -m "Initial commit: Discord Bot Master"\ngit branch -M main\ngit remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git\ngit push -u origin main`, 4)}
              className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
            >
              {copiedIndex === 4 ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              نسخ جميع الأوامر
            </button>
          </div>
          <pre className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 font-mono text-xs text-indigo-300 leading-relaxed">
{`git init
git add .
git commit -m "Initial commit: Discord Bot Master"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
git push -u origin main`}
          </pre>
        </div>
      </div>

      {/* STEP 4: Render Deployment */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 font-bold flex items-center justify-center text-sm">
            4
          </div>
          <div>
            <h3 className="font-bold text-white text-base">النشر على منصة Render وتشغيله 24/7</h3>
            <p className="text-xs text-slate-400">إعداد Web Service واستخدام Health Check لمنع السكون</p>
          </div>
        </div>

        <div className="space-y-3 text-sm text-slate-300">
          <ol className="list-decimal list-inside space-y-2">
            <li>سجل دخول إلى <a href="https://render.com" target="_blank" rel="noreferrer" className="text-indigo-400 underline font-medium">Render.com</a>.</li>
            <li>اضغط <strong>New +</strong> ثم اختر <strong>Web Service</strong>.</li>
            <li>اختر مستودع GitHub الذي قمت برفعه.</li>
            <li>املأ الحقول التالية:
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs font-mono space-y-1 mt-1.5">
                <div><strong>Name:</strong> discord-bot-master</div>
                <div><strong>Environment:</strong> Node</div>
                <div><strong>Build Command:</strong> npm install</div>
                <div><strong>Start Command:</strong> npm start</div>
                <div><strong>Plan Type:</strong> Free</div>
              </div>
            </li>
            <li>في قسم <strong>Environment Variables</strong> أضف:
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs font-mono space-y-1 mt-1.5 text-amber-300">
                <div>DISCORD_TOKEN = (التوكن الخاص بك)</div>
                <div>CLIENT_ID = (معرّف البوت)</div>
                <div>NODE_ENV = production</div>
                <div>PORT = 3000</div>
                <div>DB_TYPE = json</div>
              </div>
            </li>
            <li>اضغط <strong>Deploy Web Service</strong>.</li>
            <li>
              <strong>لضمان عدم نوم الخدمة (Keep Alive 24/7):</strong>
              <p className="text-xs text-slate-400 mt-1">
                انسخ رابط الخدمة الذي يعطيك إياه Render، وضعه في موقع فحص مجاني مثل <a href="https://uptimerobot.com" target="_blank" rel="noreferrer" className="text-indigo-400 underline">UptimeRobot.com</a> بفحص <code className="text-emerald-300">HTTP(s)</code> كل 5 دقائق لمسار <code className="text-emerald-300 font-mono">/health</code>.
              </p>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
};
