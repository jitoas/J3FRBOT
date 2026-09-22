import React, { useState } from 'react';
import { Terminal, Shield, CheckCircle2, AlertTriangle, XCircle, Send, Play, Lock, Hash } from 'lucide-react';

export const CommandsSimulator: React.FC = () => {
  const [activeCommand, setActiveCommand] = useState<'timeout' | 'kick' | 'ban' | 'unban' | 'setcommands' | 'setwelcome' | 'setlogs' | 'config' | 'ping'>('timeout');
  
  // Execution context
  const [currentChannel, setCurrentChannel] = useState<'#bot-commands' | '#general' | '#welcome' | '#server-logs'>('#bot-commands');
  const [configuredCommandsChannel, setConfiguredCommandsChannel] = useState<string>('#bot-commands');
  
  // Inputs
  const [targetUser, setTargetUser] = useState('SpammerUser#1234');
  const [targetRole, setTargetRole] = useState<'member' | 'mod' | 'owner'>('member');
  const [reason, setReason] = useState('إزعاج وتكرار رسائل سبام');
  const [duration, setDuration] = useState('10m');
  const [banDays, setBanDays] = useState(1);
  const [unbanId, setUnbanId] = useState('987654321098765432');
  const [welcomeChannel, setWelcomeChannel] = useState('#welcome');
  const [logsChannel, setLogsChannel] = useState('#server-logs');
  const [commandsChannelInput, setCommandsChannelInput] = useState('#bot-commands');
  const [usePrefixMode, setUsePrefixMode] = useState(false);
  
  const [executionOutput, setExecutionOutput] = useState<{
    status: 'success' | 'error' | 'warning';
    title: string;
    details: string;
    timestamp: string;
  } | null>(null);

  const isStaffOrModCommand = ['timeout', 'kick', 'ban', 'unban', 'setcommands', 'setwelcome', 'setlogs'].includes(activeCommand);

  const runCommand = () => {
    const timestamp = new Date().toLocaleTimeString();

    // 1. Channel Restriction Check (COMMANDS_CHANNEL_ID Rule)
    if (isStaffOrModCommand && configuredCommandsChannel && currentChannel !== configuredCommandsChannel) {
      setExecutionOutput({
        status: 'warning',
        title: '⚠️ قناة غير مسموح بها لأوامر البوت والستاف',
        details: `أوامر الإدارة والبوت مسموحة فقط في قناة ${configuredCommandsChannel}.\nالقناة الحالية: ${currentChannel}\nيرجى الانتقال إلى القناة المخصصة للستاف لتنفيذ الأمر.`,
        timestamp
      });
      return;
    }

    // 2. Command Implementations
    if (activeCommand === 'timeout') {
      if (targetRole === 'owner') {
        setExecutionOutput({
          status: 'error',
          title: '❌ فشل العزل المؤقت (Timeout)',
          details: 'فشل التحقق من الرتب: لا يمكن اتخاذ إجراء تأديبي ضد مالك السيرفر (Server Owner).',
          timestamp
        });
      } else if (targetRole === 'mod') {
        setExecutionOutput({
          status: 'error',
          title: '❌ فشل العزل المؤقت (Timeout)',
          details: 'فشل التحقق من هرمية الرتب: رتبة العضو المستهدف أعلى أو مساوية لرتبة المشرف أو البوت.',
          timestamp
        });
      } else {
        const commandUsed = usePrefixMode ? `ti @${targetUser} ${duration} ${reason}` : `/timeout user:@${targetUser} duration:${duration} reason:${reason}`;
        setExecutionOutput({
          status: 'success',
          title: '⏳ تم تطبيق العزل المؤقت بنجاح (Timeout)',
          details: `تم عزل ${targetUser} مؤقتًا ومنعه من التفاعل.\nالمدة: ${duration}\nالسبب: ${reason}\nالمشرف: Moderator#0001\nالقناة: ${currentChannel}\nالأمر: \`${commandUsed}\`\nتم إرسال إشعار فوري إلى قناة السجلات (#server-logs).`,
          timestamp
        });
      }
    } else if (activeCommand === 'kick') {
      if (targetRole === 'owner') {
        setExecutionOutput({
          status: 'error',
          title: '❌ فشل طرد العضو',
          details: 'فشل التحقق من الرتب: لا يمكن اتخاذ إجراء تأديبي ضد مالك السيرفر (Guild Owner).',
          timestamp
        });
      } else if (targetRole === 'mod') {
        setExecutionOutput({
          status: 'error',
          title: '❌ فشل طرد العضو',
          details: 'فشل التحقق من هرمية الرتب: رتبة العضو المستهدف أعلى أو مساوية لرتبة المشرف/البوت.',
          timestamp
        });
      } else {
        setExecutionOutput({
          status: 'success',
          title: '✅ تم طرد العضو بنجاح',
          details: `تم طرد ${targetUser} من السيرفر.\nالسبب: ${reason}\nالمشرف: Moderator#0001\nالقناة: ${currentChannel}\nتم تسجيل العملية تلقائيًا في قناة السجلات.`,
          timestamp
        });
      }
    } else if (activeCommand === 'ban') {
      if (targetRole === 'owner' || targetRole === 'mod') {
        setExecutionOutput({
          status: 'error',
          title: '❌ فشل حظر العضو',
          details: 'لا يمكن حظر عضو يمتلك رتبة مساوية أو أعلى من رتبتك في السيرفر.',
          timestamp
        });
      } else {
        setExecutionOutput({
          status: 'success',
          title: '✅ تم حظر العضو بنجاح',
          details: `تم حظر ${targetUser} نهائيًا.\nالسبب: ${reason}\nحذف الرسائل السابقة: ${banDays} يوم\nالمشرف: Moderator#0001\nالقناة: ${currentChannel}`,
          timestamp
        });
      }
    } else if (activeCommand === 'unban') {
      if (!/^\d{17,20}$/.test(unbanId)) {
        setExecutionOutput({
          status: 'error',
          title: '❌ معرّف غير صالح',
          details: 'يرجى كتابة معرّف صحيح للمستخدم (User ID يتكون من 17 إلى 20 رقمًا).',
          timestamp
        });
      } else {
        setExecutionOutput({
          status: 'success',
          title: '✅ تم فك الحظر بنجاح',
          details: `تم إلغاء الحظر عن المستخدم ID: \`${unbanId}\`.\nالسبب: ${reason}\nالمشرف: Admin#0001`,
          timestamp
        });
      }
    } else if (activeCommand === 'setcommands') {
      setConfiguredCommandsChannel(commandsChannelInput);
      setExecutionOutput({
        status: 'success',
        title: '🔒 تم حصر أوامر البوت والستاف',
        details: `تم تعيين القناة المخصصة: ${commandsChannelInput}\nمن الآن فصاعدًا، لن يستجيب البوت لأي أمر إداري أو ستاف خارج هذه القناة نهائيًا، مع إرسال تنبيه للمستخدمين في القنوات الأخرى.`,
        timestamp
      });
    } else if (activeCommand === 'setwelcome') {
      setExecutionOutput({
        status: 'success',
        title: '✅ تم تحديث إعدادات الترحيب',
        details: `القناة: ${welcomeChannel}\nالحالة: 🟢 مفعل\nالخلفية: صورة مخصصة حرة 100% دون أي ثيمات أو طبقات معتمة\nالعناصر: تم تفعيل التموضع الحر (Custom Positioning)\nتم حفظ التهيأة في قاعدة بيانات السيرفر.`,
        timestamp
      });
    } else if (activeCommand === 'setlogs') {
      setExecutionOutput({
        status: 'success',
        title: '✅ تم تعيين قناة السجلات',
        details: `القناة: ${logsChannel}\nالحالة: 🟢 مفعل\nسيتم إرسال كافة سجلات الأحداث الـ 15+ إلى هذه القناة فورًا.`,
        timestamp
      });
    } else if (activeCommand === 'config') {
      setExecutionOutput({
        status: 'success',
        title: '⚙️ إعدادات السيرفر الحالية',
        details: `• قناة الترحيب (Welcome): ${welcomeChannel} (خلفية مخصصة حرة بدون ثيم)\n• قناة السجلات (Logs): ${logsChannel}\n• قناة الأوامر (Bot Commands): ${configuredCommandsChannel || 'غير مقيدة'}\n• نظام المستويات: ⚪ جاهز للتفعيل (XP Rate: 1.0x)`,
        timestamp
      });
    } else if (activeCommand === 'ping') {
      setExecutionOutput({
        status: 'success',
        title: '🏓 Pong! سرعة الاستجابة',
        details: `تأخير الاستجابة (Roundtrip): 38ms\nاتصال WebSocket: 19ms\nحالة الخادم: متصل ومستقر على Render`,
        timestamp
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold mb-2">
          <Terminal className="w-3.5 h-3.5" />
          محاكي أوامر البوت وفحص القنوات المستقلة
        </div>
        <h2 className="text-xl font-bold text-white">تجربة أوامر الإشراف وفحص حظر التنفيذ خارج قناة الستاف</h2>
        <p className="text-slate-400 text-sm mt-1">
          يتحقق البوت من هرمية الرتب، ومن تنفيذ الأوامر الإدارية داخل القناة المخصصة فقط (COMMANDS_CHANNEL_ID) مع فصل قنوات Welcome و Logs.
        </p>
      </div>

      {/* Channel Context Bar */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
          <Hash className="w-4 h-4 text-indigo-400" />
          <span>اختر القناة التي ترسل الأمر منها (محاكاة الشات):</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {(['#bot-commands', '#general', '#welcome', '#server-logs'] as const).map(ch => (
            <button
              key={ch}
              onClick={() => setCurrentChannel(ch)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all border ${
                currentChannel === ch
                  ? ch === configuredCommandsChannel
                    ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300'
                    : 'bg-indigo-600 border-indigo-500 text-white'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {ch} {ch === configuredCommandsChannel && '🔒 (مخصصة للستاف)'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Command Selector & Inputs */}
        <div className="lg:col-span-6 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2">اختر الأمر لاختباره:</label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {[
                { id: 'timeout', label: '/timeout (ti)', color: 'text-amber-400' },
                { id: 'kick', label: '/kick', color: 'text-orange-400' },
                { id: 'ban', label: '/ban', color: 'text-red-400' },
                { id: 'unban', label: '/unban', color: 'text-emerald-400' },
                { id: 'setcommands', label: '/setcommands', color: 'text-rose-400' },
                { id: 'setwelcome', label: '/setwelcome', color: 'text-indigo-400' },
                { id: 'setlogs', label: '/setlogs', color: 'text-cyan-400' },
                { id: 'config', label: '/config', color: 'text-slate-300' },
                { id: 'ping', label: '/ping', color: 'text-purple-400' }
              ].map(cmd => (
                <button
                  key={cmd.id}
                  onClick={() => {
                    setActiveCommand(cmd.id as any);
                    setExecutionOutput(null);
                  }}
                  className={`px-2 py-2.5 rounded-xl text-xs font-mono font-bold transition-all border text-center ${
                    activeCommand === cmd.id
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span className={activeCommand === cmd.id ? 'text-white' : cmd.color}>{cmd.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Inputs based on Command */}
          <div className="space-y-4 pt-2 border-t border-slate-800">
            {activeCommand === 'timeout' && (
              <div className="flex items-center justify-between bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-300">طريقة الاستدعاء:</span>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setUsePrefixMode(false)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold ${!usePrefixMode ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    /timeout (Slash)
                  </button>
                  <button
                    type="button"
                    onClick={() => setUsePrefixMode(true)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold ${usePrefixMode ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    ti (Prefix)
                  </button>
                </div>
              </div>
            )}

            {activeCommand === 'setcommands' && (
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">تحديد قناة أوامر الستاف والبوت الحصرية</label>
                <input
                  type="text"
                  value={commandsChannelInput}
                  onChange={e => setCommandsChannelInput(e.target.value)}
                  placeholder="#bot-commands"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  أوامر الإشراف (/kick, /ban, /unban, /timeout, ti) ستصبح مقيدة بهذه القناة فقط.
                </p>
              </div>
            )}

            {(activeCommand === 'kick' || activeCommand === 'ban' || activeCommand === 'timeout') && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">العضو المستهدف (Target Member)</label>
                  <input
                    type="text"
                    value={targetUser}
                    onChange={e => setTargetUser(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                    رتبة العضو المستهدف (لاختبار هرمية الرتب Hierarchy):
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'member', label: 'عضو عادي (أقل رتبة)' },
                      { id: 'mod', label: 'مشرف (رتبة أعلى)' },
                      { id: 'owner', label: 'مالك السيرفر (Owner)' }
                    ].map(r => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setTargetRole(r.id as any)}
                        className={`px-2 py-2 rounded-xl text-xs font-medium border transition-all ${
                          targetRole === r.id
                            ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                {activeCommand === 'timeout' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">مدة العزل (Duration: s, m, h, d)</label>
                    <div className="grid grid-cols-4 gap-2 mb-2">
                      {['10s', '5m', '1h', '1d'].map(d => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setDuration(d)}
                          className={`py-1.5 rounded-lg text-xs font-mono font-bold border transition-all ${duration === d ? 'bg-indigo-600/30 border-indigo-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      value={duration}
                      onChange={e => setDuration(e.target.value)}
                      placeholder="e.g. 10m, 2h, 1d"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">سبب العقوبة (Reason)</label>
                  <input
                    type="text"
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {activeCommand === 'ban' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">حذف رسائل سابقة (Days: 0-7)</label>
                    <input
                      type="number"
                      min="0"
                      max="7"
                      value={banDays}
                      onChange={e => setBanDays(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                )}
              </>
            )}

            {activeCommand === 'unban' && (
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">معرف المستخدم (User ID)</label>
                <input
                  type="text"
                  value={unbanId}
                  onChange={e => setUnbanId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}

            {activeCommand === 'setwelcome' && (
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">قناة الترحيب المخصصة</label>
                <input
                  type="text"
                  value={welcomeChannel}
                  onChange={e => setWelcomeChannel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  ملاحظة: Welcome ترسل فقط في WELCOME_CHANNEL_ID وتستخدم خلفية حرة بدون أي ثيم.
                </p>
              </div>
            )}

            {activeCommand === 'setlogs' && (
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">قناة السجلات المخصصة</label>
                <input
                  type="text"
                  value={logsChannel}
                  onChange={e => setLogsChannel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  ملاحظة: السجلات ترسل فقط في LOG_CHANNEL_ID ومستقلة تمامًا.
                </p>
              </div>
            )}

            <button
              onClick={runCommand}
              className="w-full mt-4 flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-indigo-600/20 cursor-pointer"
            >
              <Play className="w-4 h-4" />
              تنفيذ الأمر في {currentChannel}
            </button>
          </div>
        </div>

        {/* Right: Output Console / Discord Response */}
        <div className="lg:col-span-6 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-white text-base">رد البوت في الشات (Bot Interaction)</h3>
              </div>
              <span className="text-xs font-mono text-slate-400">القناة الحالية: {currentChannel}</span>
            </div>

            <div className="mt-4">
              {executionOutput ? (
                <div
                  className={`p-4 rounded-xl border space-y-2 ${
                    executionOutput.status === 'success'
                      ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
                      : executionOutput.status === 'warning'
                      ? 'bg-amber-950/20 border-amber-500/40 text-amber-200'
                      : 'bg-rose-950/20 border-rose-500/40 text-rose-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {executionOutput.status === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                    {executionOutput.status === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400" />}
                    {executionOutput.status === 'error' && <XCircle className="w-5 h-5 text-rose-400" />}
                    <h4 className="font-bold text-sm text-white">{executionOutput.title}</h4>
                    <span className="text-[10px] text-slate-400 font-mono ml-auto">{executionOutput.timestamp}</span>
                  </div>
                  <pre className="text-xs font-sans whitespace-pre-wrap leading-relaxed opacity-95 text-slate-300">
                    {executionOutput.details}
                  </pre>
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-800 rounded-xl text-slate-500">
                  <Terminal className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-xs">اضغط على زر "تنفيذ الأمر" لاختبار الاستجابة وفحص حظر القنوات وهرمية الرتب.</p>
                </div>
              )}
            </div>
          </div>

          {/* Hierarchy Rule Legend */}
          <div className="mt-6 pt-4 border-t border-slate-800 text-xs text-slate-400 space-y-1.5">
            <div className="font-semibold text-slate-300">قواعد نظام القنوات الثلاث وهرمية الرتب:</div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span><strong>WELCOME_CHANNEL_ID:</strong> الترحيب والبطاقة فقط (بدون أي أوامر).</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
              <span><strong>LOG_CHANNEL_ID:</strong> السجلات فقط (أكثر من 15 حدث مراقبة).</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
              <span><strong>COMMANDS_CHANNEL_ID:</strong> أوامر الإشراف والستاف حصريًا؛ يرفض البوت أي أمر خارجها.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
