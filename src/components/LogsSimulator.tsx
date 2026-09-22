import React, { useState } from 'react';
import { 
  ScrollText, 
  UserPlus, 
  UserMinus, 
  ShieldAlert, 
  Trash2, 
  Edit3, 
  FolderPlus, 
  FolderMinus, 
  Shield, 
  Volume2, 
  VolumeX, 
  Radio, 
  Server, 
  Unlock,
  CheckCircle2,
  Copy,
  Check
} from 'lucide-react';

interface LogEventSample {
  id: string;
  name: string;
  category: 'members' | 'messages' | 'channels' | 'roles' | 'voice' | 'guild';
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
  eventType: string;
  user?: {
    name: string;
    tag: string;
    id: string;
    avatar: string;
  };
  executor?: {
    name: string;
    tag: string;
    id: string;
  };
  fields: { name: string; value: string; inline?: boolean }[];
}

const LOG_EVENTS: LogEventSample[] = [
  {
    id: 'member-join',
    name: 'Member Join (انضمام عضو)',
    category: 'members',
    icon: UserPlus,
    title: '📥 انضمام عضو جديد إلى السيرفر',
    description: 'انضم <@948271038472910> إلى السيرفر.',
    color: '#57F287',
    eventType: 'انضمام عضو (Member Join)',
    user: {
      name: 'SarahCoder',
      tag: 'SarahCoder#1234',
      id: '948271038472910',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&h=128&fit=crop&crop=faces'
    },
    fields: [
      { name: '👤 العضو', value: 'SarahCoder#1234 (`948271038472910`)', inline: true },
      { name: '📅 عمر الحساب', value: '142 يوم', inline: true },
      { name: '👥 عدد الأعضاء الحالي', value: '1,453', inline: true }
    ]
  },
  {
    id: 'member-leave',
    name: 'Member Leave (مغادرة عضو)',
    category: 'members',
    icon: UserMinus,
    title: '📤 غادر عضو السيرفر',
    description: 'غادر JohnDoe#5678 السيرفر.',
    color: '#ED4245',
    eventType: 'مغادرة عضو (Member Leave)',
    user: {
      name: 'JohnDoe',
      tag: 'JohnDoe#5678',
      id: '812938471029384',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=128&h=128&fit=crop&crop=faces'
    },
    fields: [
      { name: '👤 العضو', value: 'JohnDoe#5678 (`812938471029384`)', inline: true },
      { name: '👥 عدد الأعضاء المتبقي', value: '1,452', inline: true }
    ]
  },
  {
    id: 'member-kick',
    name: 'Kick Member (طرد عضو)',
    category: 'members',
    icon: ShieldAlert,
    title: '👢 تم طرد عضو من السيرفر',
    description: 'تم طرد SpammerBot#0001 بواسطة المشرف.',
    color: '#FEE75C',
    eventType: 'طرد عضو (Member Kick)',
    user: {
      name: 'SpammerBot',
      tag: 'SpammerBot#0001',
      id: '992837461524332',
      avatar: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=128&h=128&fit=crop&crop=faces'
    },
    executor: {
      name: 'AdminSami',
      tag: 'AdminSami#9999',
      id: '109283746152431'
    },
    fields: [
      { name: '👤 العضو المطرود', value: 'SpammerBot#0001 (`992837461524332`)', inline: true },
      { name: '📝 السبب', value: 'إرسال روابط إعلانية متكررة (Spamming Invite Links)', inline: false }
    ]
  },
  {
    id: 'member-ban',
    name: 'Ban Member (حظر عضو)',
    category: 'members',
    icon: ShieldAlert,
    title: '🔨 تم حظر عضو من السيرفر',
    description: 'تم حظر ToxicUser#9999 نهائيًا من السيرفر.',
    color: '#ED4245',
    eventType: 'حظر عضو (Member Ban)',
    user: {
      name: 'ToxicUser',
      tag: 'ToxicUser#9999',
      id: '772839102938475',
      avatar: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=128&h=128&fit=crop&crop=faces'
    },
    executor: {
      name: 'HeadMod_Omar',
      tag: 'HeadMod_Omar#0001',
      id: '209384756102938'
    },
    fields: [
      { name: '👤 العضو المحظور', value: 'ToxicUser#9999 (`772839102938475`)', inline: true },
      { name: '📝 السبب', value: 'انتهاك قوانين السيرفر المتكرر بعد التحذيرات', inline: false }
    ]
  },
  {
    id: 'member-unban',
    name: 'Unban Member (فك حظر)',
    category: 'members',
    icon: Unlock,
    title: '🔓 تم إلغاء حظر عضو',
    description: 'تم فك الحظر عن TariqDev#4444.',
    color: '#57F287',
    eventType: 'إلغاء حظر (Member Unban)',
    user: {
      name: 'TariqDev',
      tag: 'TariqDev#4444',
      id: '662938471029384',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=128&h=128&fit=crop&crop=faces'
    },
    executor: {
      name: 'ServerOwner',
      tag: 'ServerOwner#0001',
      id: '100000000000000'
    },
    fields: [
      { name: '👤 العضو', value: 'TariqDev#4444 (`662938471029384`)', inline: true }
    ]
  },
  {
    id: 'message-delete',
    name: 'Message Delete (حذف رسالة)',
    category: 'messages',
    icon: Trash2,
    title: '🗑️ تم حذف رسالة',
    description: 'تم حذف رسالة أرسلها AlexGamer في القناة #general-chat.',
    color: '#ED4245',
    eventType: 'حذف رسالة (Message Delete)',
    user: {
      name: 'AlexGamer',
      tag: 'AlexGamer#8888',
      id: '552938471029384',
      avatar: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=128&h=128&fit=crop&crop=faces'
    },
    executor: {
      name: 'ModTariq',
      tag: 'ModTariq#1212',
      id: '309485729102938'
    },
    fields: [
      { name: '💬 القناة', value: '#general-chat (`110293847561928`)', inline: true },
      { name: '👤 صاحب الرسالة', value: 'AlexGamer#8888 (`552938471029384`)', inline: true },
      { name: '📄 محتوى الرسالة المحذوفة', value: '```\nمرحبا شباب هل يمكنكم الدخول على هذا الرابط الغريب https://fake-nitro...\n```', inline: false }
    ]
  },
  {
    id: 'message-update',
    name: 'Message Edit (تعديل رسالة)',
    category: 'messages',
    icon: Edit3,
    title: '✏️ تم تعديل رسالة',
    description: 'قام MemberOne بتعديل رسالته في القناة #dev-talk. [الانتقال للرسالة](#)',
    color: '#5865F2',
    eventType: 'تعديل رسالة (Message Edit)',
    user: {
      name: 'MemberOne',
      tag: 'MemberOne#3333',
      id: '442938471029384',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&h=128&fit=crop&crop=faces'
    },
    fields: [
      { name: '💬 القناة', value: '#dev-talk (`110293847561928`)', inline: true },
      { name: '👤 صاحب الرسالة', value: 'MemberOne#3333 (`442938471029384`)', inline: true },
      { name: '🔴 المحتوى السابق', value: '```\nالموعد غداً الساعة 5 عصراً\n```', inline: false },
      { name: '🟢 المحتوى الجديد', value: '```\nالموعد تم تأجيله إلى يوم الأحد الساعة 8 مساءً\n```', inline: false }
    ]
  },
  {
    id: 'role-update',
    name: 'Role Update (تعديل رتبة)',
    category: 'roles',
    icon: Shield,
    title: '⚙️ تم تعديل رتبة',
    description: 'تم تعديل بيانات الرتبة VIP Booster (`778899001122334`).',
    color: '#FEE75C',
    eventType: 'تعديل رتبة (Role Update)',
    executor: {
      name: 'ServerAdmin',
      tag: 'ServerAdmin#7777',
      id: '109283746152431'
    },
    fields: [
      { name: '📝 التغييرات', value: '**الاسم:** `VIP` ➔ `VIP Booster`\n**اللون:** `#eab308` ➔ `#ec4899`\n**تم تعديل صلاحيات إدارة الرموز التعبيرية**', inline: false }
    ]
  },
  {
    id: 'channel-create',
    name: 'Channel Create (إنشاء قناة)',
    category: 'channels',
    icon: FolderPlus,
    title: '📁 تم إنشاء قناة جديدة',
    description: 'تم إنشاء القناة #announcements (`998877665544332`).',
    color: '#57F287',
    eventType: 'إنشاء قناة (Channel Create)',
    executor: {
      name: 'ServerAdmin',
      tag: 'ServerAdmin#7777',
      id: '109283746152431'
    },
    fields: [
      { name: '🏷️ النوع', value: 'GuildText (قناة نصية)', inline: true },
      { name: '📂 التصنيف (Category)', value: 'OFFICIAL INFO', inline: true }
    ]
  },
  {
    id: 'voice-switch',
    name: 'Voice Switch (تبديل صوتية)',
    category: 'voice',
    icon: Radio,
    title: '🔀 تبديل قناة صوتية',
    description: 'انتقل GamerPro من 🔊 Gaming Room إلى 🎙️ Chill Lounge.',
    color: '#5865F2',
    eventType: 'تبديل قناة صوتية (Voice Switch)',
    user: {
      name: 'GamerPro',
      tag: 'GamerPro#2026',
      id: '332938471029384',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=128&h=128&fit=crop&crop=faces'
    },
    fields: [
      { name: '⬅️ القناة السابقة', value: '🔊 Gaming Room', inline: true },
      { name: '➡️ القناة الجديدة', value: '🎙️ Chill Lounge', inline: true }
    ]
  }
];

export const LogsSimulator: React.FC = () => {
  const [selectedEventId, setSelectedEventId] = useState(LOG_EVENTS[0].id);
  const [copied, setCopied] = useState(false);

  const selectedEvent = LOG_EVENTS.find(e => e.id === selectedEventId) || LOG_EVENTS[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-2">
          <ScrollText className="w-3.5 h-3.5" />
          نظام السجلات الشامل (Comprehensive Discord Event Logger)
        </div>
        <h2 className="text-xl font-bold text-white">محاكي سجلات الأحداث الـ 15+ (Audit & Event Logs)</h2>
        <p className="text-slate-400 text-sm mt-1">
          يراقب البوت جميع التغييرات في السيرفر ويرسل Embeds فورية لقناة <code className="text-emerald-300 font-mono">#logs</code> مع جلب منفذ العملية من Audit Logs وتنسيق أنيق.
        </p>
      </div>

      {/* Grid: Event Selector & Live Discord Embed Mockup */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Events List Selector */}
        <div className="lg:col-span-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-2">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2 py-1 mb-2">
            اختر نوع الحدث للمعاينة ({LOG_EVENTS.length} نموذج):
          </h3>
          
          <div className="space-y-1.5 max-h-[560px] overflow-y-auto pr-1">
            {LOG_EVENTS.map(event => {
              const Icon = event.icon;
              const isSelected = selectedEventId === event.id;
              return (
                <button
                  key={event.id}
                  id={`log-event-btn-${event.id}`}
                  onClick={() => setSelectedEventId(event.id)}
                  className={`w-full text-right p-3 rounded-xl text-sm font-medium transition-all flex items-center justify-between gap-3 border ${
                    isSelected
                      ? 'bg-slate-800 border-indigo-500 text-white shadow-md'
                      : 'bg-slate-950/50 border-transparent text-slate-300 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <div
                      className="p-1.5 rounded-lg text-white"
                      style={{ backgroundColor: `${event.color}25`, color: event.color }}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="truncate">{event.name}</span>
                  </div>
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: event.color }}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Discord Channel & Embed Mockup */}
        <div className="lg:col-span-8 bg-[#313338] border border-slate-700/60 rounded-2xl p-6 shadow-2xl flex flex-col justify-between font-sans">
          {/* Mock Discord Channel Bar */}
          <div className="flex items-center justify-between border-b border-[#3f4147] pb-3 mb-5 text-slate-300">
            <div className="flex items-center gap-2">
              <span className="text-lg text-slate-400 font-bold">#</span>
              <span className="font-bold text-white text-base">server-logs</span>
              <span className="text-xs text-slate-400 border-l border-slate-600 pl-2 ml-1">
                قناة سجلات البوت التلقائية
              </span>
            </div>
            <span className="text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-1 rounded-full font-mono">
              Live Embed View
            </span>
          </div>

          {/* Discord Message with Embed */}
          <div className="flex items-start gap-4 flex-1">
            <img
              src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=64&h=64&fit=crop"
              alt="Bot Avatar"
              className="w-10 h-10 rounded-full border border-indigo-500/30 flex-shrink-0"
            />
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white hover:underline cursor-pointer">Bot Master</span>
                <span className="bg-[#5865F2] text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded">BOT</span>
                <span className="text-xs text-slate-400">Today at 04:50 PM</span>
              </div>

              {/* Exact Discord Embed Rendering */}
              <div
                className="bg-[#2b2d31] rounded-lg p-4 border-l-4 max-w-2xl shadow-lg space-y-3 relative overflow-hidden"
                style={{ borderLeftColor: selectedEvent.color }}
              >
                {/* User Thumbnail if available */}
                {selectedEvent.user && (
                  <div className="absolute top-4 left-4">
                    <img
                      src={selectedEvent.user.avatar}
                      alt={selectedEvent.user.name}
                      className="w-14 h-14 rounded-full border-2 border-slate-700 shadow-md"
                    />
                  </div>
                )}

                {/* Embed Title */}
                <h4 className="font-bold text-white text-base flex items-center gap-2 pr-1">
                  {selectedEvent.title}
                </h4>

                {/* Embed Description */}
                <p className="text-slate-200 text-sm leading-relaxed max-w-[80%]">
                  {selectedEvent.description}
                </p>

                {/* Embed Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  {selectedEvent.fields.map((field, idx) => (
                    <div
                      key={idx}
                      className={`bg-[#1e1f22]/60 p-2.5 rounded-lg border border-slate-800 ${
                        field.inline ? '' : 'md:col-span-2'
                      }`}
                    >
                      <div className="text-xs font-bold text-slate-400 mb-1">{field.name}</div>
                      <div className="text-sm text-slate-200 font-medium whitespace-pre-line">{field.value}</div>
                    </div>
                  ))}

                  {/* Executor Field if present */}
                  {selectedEvent.executor && (
                    <div className="bg-[#1e1f22]/60 p-2.5 rounded-lg border border-slate-800 md:col-span-2">
                      <div className="text-xs font-bold text-slate-400 mb-1">🛡️ تم بواسطة (Executor من Audit Log)</div>
                      <div className="text-sm text-indigo-300 font-mono">
                        {selectedEvent.executor.tag} (`{selectedEvent.executor.id}`)
                      </div>
                    </div>
                  )}
                </div>

                {/* Embed Footer */}
                <div className="pt-2 border-t border-slate-700/50 flex items-center justify-between text-[11px] text-slate-400">
                  <span>حدث: {selectedEvent.eventType} • Bot Master Logs</span>
                  <span>Today at 04:50 PM</span>
                </div>
              </div>
            </div>
          </div>

          {/* Architecture info notice */}
          <div className="mt-6 bg-[#2b2d31]/80 rounded-xl p-3.5 border border-slate-700 text-xs text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>مستقل ومعياري في كود البوت داخل <code className="text-emerald-300 font-mono">src/services/loggingService.js</code></span>
            </span>
            <span className="text-slate-400">بدون تسريب أي معلومات حساسة</span>
          </div>
        </div>
      </div>
    </div>
  );
};
