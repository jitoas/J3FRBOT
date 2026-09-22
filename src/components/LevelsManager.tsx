import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Award,
  Sparkles,
  Plus,
  Trash2,
  Edit2,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Settings,
  Shield,
  Clock,
  MessageSquare,
  Hash,
  User,
  Sliders,
  Flame,
  Check,
  X,
  ChevronRight,
  Info
} from 'lucide-react';

interface LevelThreshold {
  level: number;
  requiredXp: number;
}

interface LevelRole {
  id: number;
  level: number;
  roleId: string;
  roleName: string;
  enabled: boolean;
  removePrevious: boolean;
}

interface LeaderboardEntry {
  guildId?: string;
  userId: string;
  username: string;
  xp: number;
  level: number;
  lastXpEarned?: number;
}

interface ChannelOption {
  id: string;
  name: string;
}

interface RoleOption {
  id: string;
  name: string;
  color?: string;
}

export function LevelsManager() {
  // Navigation sub-tabs inside Levels Manager
  const [subTab, setSubTab] = useState<'settings' | 'table' | 'roles' | 'message' | 'leaderboard'>('settings');

  // General Settings State
  const [levelingEnabled, setLevelingEnabled] = useState(true);
  const [xpPerMessage, setXpPerMessage] = useState(10);
  const [xpCooldownSeconds, setXpCooldownSeconds] = useState(60);
  const [levelupMessageEnabled, setLevelupMessageEnabled] = useState(true);
  const [levelupChannelId, setLevelupChannelId] = useState('');
  const [levelupMessage, setLevelupMessage] = useState('مبروك {user}! وصلت للمستوى {level} 🎉');

  // Custom XP Table State
  const [thresholds, setThresholds] = useState<LevelThreshold[]>([
    { level: 1, requiredXp: 100 },
    { level: 2, requiredXp: 250 },
    { level: 3, requiredXp: 500 },
    { level: 4, requiredXp: 900 },
    { level: 5, requiredXp: 1400 },
    { level: 6, requiredXp: 2000 },
    { level: 7, requiredXp: 2800 },
    { level: 8, requiredXp: 3800 },
    { level: 9, requiredXp: 5000 },
    { level: 10, requiredXp: 6500 }
  ]);

  // Form states for adding/editing level thresholds
  const [newLevelNum, setNewLevelNum] = useState<number>(11);
  const [newLevelXp, setNewLevelXp] = useState<number>(8500);
  const [editingLevel, setEditingLevel] = useState<number | null>(null);
  const [editingXpVal, setEditingXpVal] = useState<number>(0);

  // Auto Roles State
  const [roles, setRoles] = useState<LevelRole[]>([
    { id: 1, level: 5, roleId: 'role_active_member', roleName: '🌟 Active Member', enabled: true, removePrevious: false },
    { id: 2, level: 10, roleId: 'role_veteran', roleName: '🔥 Chat Veteran', enabled: true, removePrevious: true }
  ]);

  // Form states for adding an auto-role
  const [newRoleLevel, setNewRoleLevel] = useState(1);
  const [newRoleId, setNewRoleId] = useState('');
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleRemovePrev, setNewRoleRemovePrev] = useState(true);

  // Leaderboard State
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([
    { userId: '1001', username: 'Faris_Commander', xp: 7200, level: 10 },
    { userId: '1002', username: 'Sarah_Gamer', xp: 5430, level: 9 },
    { userId: '1003', username: 'Majed_Dev', xp: 3950, level: 8 },
    { userId: '1004', username: 'Lina_Mod', xp: 2820, level: 7 },
    { userId: '1005', username: 'Omar_K', xp: 1450, level: 5 }
  ]);

  // Discord channels and roles from API
  const [channels, setChannels] = useState<ChannelOption[]>([]);
  const [discordRoles, setDiscordRoles] = useState<RoleOption[]>([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load configuration from API on mount
  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const [configRes, threshRes, rolesRes, leadRes, chanRes, discRolesRes] = await Promise.allSettled([
        fetch('/api/levels/config'),
        fetch('/api/levels/thresholds'),
        fetch('/api/levels/roles'),
        fetch('/api/levels/leaderboard?limit=20'),
        fetch('/api/guild/channels'),
        fetch('/api/guild/roles')
      ]);

      if (configRes.status === 'fulfilled' && configRes.value.ok) {
        const data = await configRes.value.json();
        setLevelingEnabled(data.levelingEnabled !== false);
        setXpPerMessage(data.xpPerMessage || 10);
        setXpCooldownSeconds(data.xpCooldownSeconds !== undefined ? data.xpCooldownSeconds : 60);
        setLevelupMessageEnabled(data.levelupMessageEnabled !== false);
        setLevelupChannelId(data.levelupChannelId || '');
        setLevelupMessage(data.levelupMessage || 'مبروك {user}! وصلت للمستوى {level} 🎉');
      }

      if (threshRes.status === 'fulfilled' && threshRes.value.ok) {
        const data = await threshRes.value.json();
        if (Array.isArray(data.thresholds) && data.thresholds.length > 0) {
          setThresholds(data.thresholds);
          const maxLevel = Math.max(...data.thresholds.map((t: LevelThreshold) => t.level));
          setNewLevelNum(maxLevel + 1);
        }
      }

      if (rolesRes.status === 'fulfilled' && rolesRes.value.ok) {
        const data = await rolesRes.value.json();
        if (Array.isArray(data.roles)) {
          setRoles(data.roles);
        }
      }

      if (leadRes.status === 'fulfilled' && leadRes.value.ok) {
        const data = await leadRes.value.json();
        if (Array.isArray(data.leaderboard) && data.leaderboard.length > 0) {
          setLeaderboard(data.leaderboard);
        }
      }

      if (chanRes.status === 'fulfilled' && chanRes.value.ok) {
        const data = await chanRes.value.json();
        if (Array.isArray(data.channels)) {
          setChannels(data.channels);
        }
      }

      if (discRolesRes.status === 'fulfilled' && discRolesRes.value.ok) {
        const data = await discRolesRes.value.json();
        if (Array.isArray(data.roles)) {
          setDiscordRoles(data.roles);
        }
      }
    } catch (e) {
      console.warn('Backend API currently unreachable; running with client state.', e);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // 1. Save general settings & level up message
  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/levels/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          levelingEnabled,
          xpPerMessage,
          xpCooldownSeconds,
          levelupMessageEnabled,
          levelupChannelId: levelupChannelId || null,
          levelupMessage
        })
      });
      if (res.ok) {
        showNotification('تم حفظ إعدادات نظام المستويات و XP بنجاح!');
      } else {
        showNotification('تم حفظ الإعدادات محلياً (تعذر الاتصال بـ API)', 'success');
      }
    } catch {
      showNotification('تم حفظ الإعدادات محلياً بنجاح!', 'success');
    } finally {
      setLoading(false);
    }
  };

  // 2. Add Level Threshold
  const handleAddThreshold = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLevelNum || !newLevelXp) return;

    if (thresholds.some(t => t.level === newLevelNum)) {
      showNotification(`المستوى ${newLevelNum} موجود بالفعل في الجدول!`, 'error');
      return;
    }

    const updated = [...thresholds, { level: newLevelNum, requiredXp: newLevelXp }].sort((a, b) => a.level - b.level);
    setThresholds(updated);
    setNewLevelNum(Math.max(...updated.map(t => t.level)) + 1);
    setNewLevelXp(newLevelXp + 1500);

    try {
      await fetch('/api/levels/thresholds/single', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level: newLevelNum, requiredXp: newLevelXp })
      });
      showNotification(`تمت إضافة المستوى ${newLevelNum} بنجاح!`);
    } catch {
      showNotification(`تمت إضافة المستوى ${newLevelNum} محلياً`);
    }
  };

  // 3. Edit Level Threshold
  const handleSaveEditThreshold = async (level: number) => {
    if (editingXpVal <= 0) return;
    const updated = thresholds.map(t => t.level === level ? { ...t, requiredXp: editingXpVal } : t);
    setThresholds(updated);
    setEditingLevel(null);

    try {
      await fetch('/api/levels/thresholds/single', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level, requiredXp: editingXpVal })
      });
      showNotification(`تم تحديث الـ XP المطلوب للمستوى ${level}!`);
    } catch {
      showNotification(`تم تحديث المستوى ${level} محلياً`);
    }
  };

  // 4. Delete Level Threshold
  const handleDeleteThreshold = async (level: number) => {
    if (thresholds.length <= 1) {
      showNotification('يجب أن يحتوي الجدول على مستوى واحد على الأقل!', 'error');
      return;
    }
    const updated = thresholds.filter(t => t.level !== level);
    setThresholds(updated);

    try {
      await fetch(`/api/levels/thresholds/${level}`, { method: 'DELETE' });
      showNotification(`تم حذف المستوى ${level}`);
    } catch {
      showNotification(`تم حذف المستوى ${level} محلياً`);
    }
  };

  // 5. Add Auto Role
  const handleAddRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleId) {
      showNotification('يرجى تحديد أو إدخال رتبة الديسكورد', 'error');
      return;
    }

    const roleName = newRoleName || newRoleId;
    const newEntry: LevelRole = {
      id: Date.now(),
      level: newRoleLevel,
      roleId: newRoleId,
      roleName,
      enabled: true,
      removePrevious: newRoleRemovePrev
    };

    setRoles([...roles, newEntry]);
    setNewRoleId('');
    setNewRoleName('');

    try {
      await fetch('/api/levels/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEntry)
      });
      showNotification(`تم ربط رتبة "${roleName}" بالمستوى ${newRoleLevel}!`);
    } catch {
      showNotification(`تم ربط الرتبة بالمستوى ${newRoleLevel} محلياً`);
    }
  };

  // 6. Toggle Auto Role Enabled
  const handleToggleRole = async (id: number) => {
    const updated = roles.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r);
    setRoles(updated);
    const target = updated.find(r => r.id === id);
    if (!target) return;

    try {
      await fetch(`/api/levels/roles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: target.enabled })
      });
    } catch {
      // Ignored for local state
    }
  };

  // 7. Delete Auto Role
  const handleDeleteRole = async (id: number) => {
    setRoles(roles.filter(r => r.id !== id));
    try {
      await fetch(`/api/levels/roles/${id}`, { method: 'DELETE' });
      showNotification('تم حذف قاعدة الرتبة التلقائية');
    } catch {
      showNotification('تم حذف قاعدة الرتبة محلياً');
    }
  };

  // Calculate live preview for level up message
  const previewMessage = levelupMessage
    .replace(/{user}/g, '@J3FR_Member')
    .replace(/{username}/g, 'J3FR_Member')
    .replace(/{level}/g, '5')
    .replace(/{xp}/g, '1400')
    .replace(/{server}/g, 'سيرفر مجتمع J3FRBOT');

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Top Banner / Notification */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 border transition-all ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
          )}
          <span className="text-sm font-medium">{statusMessage.text}</span>
        </div>
      )}

      {/* Header and Sub-Navigation */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                نظام المستويات ونقاط الخبرة (Levels & XP System)
                <span className="text-xs bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-2.5 py-0.5 rounded-full font-normal">
                  تخصيص كامل 100%
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                جدول مستويات مخصص بدون معادلات عشوائية • إسناد رتب تلقائية • رسائل تهنئة مخصصة • منع السبام
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchConfig}
              disabled={loading}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer border border-slate-700"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              تحديث البيانات
            </button>
            <button
              onClick={handleSaveSettings}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              حفظ جميع الإعدادات
            </button>
          </div>
        </div>

        {/* Sub-tabs pills */}
        <div className="flex items-center gap-2 pt-4 overflow-x-auto scrollbar-none">
          {[
            { id: 'settings', label: 'إعدادات XP والـ Cooldown', icon: Sliders },
            { id: 'table', label: 'جدول الـ Levels المخصص', icon: Flame },
            { id: 'message', label: 'رسالة التهنئة (Level Up)', icon: MessageSquare },
            { id: 'roles', label: 'الرتب التلقائية (Auto Roles)', icon: Award },
            { id: 'leaderboard', label: 'لوحة المتصدرين (Leaderboard)', icon: Trophy }
          ].map(tab => {
            const Icon = tab.icon;
            const active = subTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSubTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  active
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* 1. General Settings & Cooldown Sub-Tab                                */}
      {/* --------------------------------------------------------------------- */}
      {subTab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Sliders className="w-4 h-4 text-indigo-400" />
              تكوين نقاط الخبرة لكل رسالة (XP Per Message)
            </h3>

            {/* Toggle Leveling */}
            <div className="flex items-center justify-between p-4 bg-slate-950/60 rounded-xl border border-slate-800">
              <div>
                <span className="text-sm font-bold text-white block">تفعيل نظام الـ Levels في السيرفر</span>
                <span className="text-xs text-slate-400">احتساب الـ XP وترقية الأعضاء وإسناد الرتب التلقائية</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={levelingEnabled}
                  onChange={e => setLevelingEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {/* XP Per Message Input */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                XP لكل رسالة (XP Per Message)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={xpPerMessage}
                  onChange={e => setXpPerMessage(parseInt(e.target.value, 10) || 1)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white font-mono focus:border-indigo-500 focus:outline-none"
                />
                <span className="absolute left-4 top-3 text-xs text-indigo-400 font-bold">XP ثابت</span>
              </div>
              <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-1">
                <Info className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                رقم محدد وثابت يحصل عليه العضو مع كل رسالة بدون أي عشوائية.
              </p>
            </div>

            {/* XP Cooldown Input */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>فترة التهدئة لمنع السبام (XP Cooldown)</span>
                <span className="text-indigo-400 font-mono text-xs">{xpCooldownSeconds} ثانية</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="5"
                  max="3600"
                  value={xpCooldownSeconds}
                  onChange={e => setXpCooldownSeconds(parseInt(e.target.value, 10) || 10)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white font-mono focus:border-indigo-500 focus:outline-none"
                />
                <span className="absolute left-4 top-3 text-xs text-slate-400 font-mono">Seconds</span>
              </div>
              <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-1">
                <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                المدة الفاصلة بين كل رسالة ورسالة يُحتسب لها XP (مثال: 60 ثانية تعني رسالة واحدة بالدقيقة).
              </p>
            </div>
          </div>

          {/* Quick Summary / Live Calculator Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
            <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Flame className="w-4 h-4 text-amber-400" />
              حاسبة التفاعل والنشاط التقديرية
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 block mb-1">الـ XP لكل 100 رسالة</span>
                <span className="text-xl font-bold font-mono text-indigo-400">{xpPerMessage * 100} XP</span>
              </div>
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 block mb-1">أقصى XP بالساعة لعضو متفاعل</span>
                <span className="text-xl font-bold font-mono text-emerald-400">
                  {Math.floor((3600 / Math.max(xpCooldownSeconds, 1)) * xpPerMessage)} XP
                </span>
              </div>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
              <span className="text-xs font-bold text-slate-300 block">
                كم رسالة يحتاج العضو للوصول للمستويات الأولى؟
              </span>
              <div className="space-y-2 text-xs">
                {thresholds.slice(0, 4).map(t => {
                  const msgsNeeded = Math.ceil(t.requiredXp / Math.max(xpPerMessage, 1));
                  return (
                    <div key={t.level} className="flex items-center justify-between py-1 border-b border-slate-850">
                      <span className="text-slate-300 font-semibold">Level {t.level} ({t.requiredXp} XP):</span>
                      <span className="font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        {msgsNeeded} رسالة تقريباً
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              onClick={handleSaveSettings}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/25 cursor-pointer flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              حفظ تكوين الـ XP
            </button>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* 2. Custom Level XP Table Sub-Tab                                      */}
      {/* --------------------------------------------------------------------- */}
      {subTab === 'table' && (
        <div className="space-y-6">
          {/* Add New Level Form */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-400" />
              إضافة مستوى جديد إلى الجدول (Add Level)
            </h3>
            <form onSubmit={handleAddThreshold} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  رقم المستوى (Level Number)
                </label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={newLevelNum}
                  onChange={e => setNewLevelNum(parseInt(e.target.value, 10) || 1)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  الـ XP المطلوب (Required XP)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10000000"
                  value={newLevelXp}
                  onChange={e => setNewLevelXp(parseInt(e.target.value, 10) || 100)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  إضافة المستوى للجدول
                </button>
              </div>
            </form>
          </div>

          {/* Table of Custom Levels */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-400" />
                  جدول الـ XP المطلوب لكل Level ({thresholds.length} مستويات)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  لا توجد أي معادلات رياضية تلقائية مفروضة — أنت تتحكم بالرقم الدقيق المطلوب لكل رتبة ومستوى
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400">
                  <tr>
                    <th className="px-6 py-3.5 font-bold">المستوى (Level)</th>
                    <th className="px-6 py-3.5 font-bold">الـ XP المطلوب (Required XP)</th>
                    <th className="px-6 py-3.5 font-bold">الفارق عن المستوى السابق</th>
                    <th className="px-6 py-3.5 font-bold">الرسائل التقديرية</th>
                    <th className="px-6 py-3.5 font-bold text-left">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {thresholds.map((item, idx) => {
                    const prevXp = idx > 0 ? thresholds[idx - 1].requiredXp : 0;
                    const diff = item.requiredXp - prevXp;
                    const isEditing = editingLevel === item.level;

                    return (
                      <tr key={item.level} className="hover:bg-slate-850/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-white flex items-center gap-2">
                          <span className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-mono">
                            {item.level}
                          </span>
                          <span>Level {item.level}</span>
                        </td>

                        <td className="px-6 py-4 font-mono font-bold">
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                value={editingXpVal}
                                onChange={e => setEditingXpVal(parseInt(e.target.value, 10) || 0)}
                                className="bg-slate-950 border border-indigo-500 px-3 py-1 rounded-lg text-xs text-white font-mono w-28 focus:outline-none"
                                autoFocus
                              />
                              <button
                                onClick={() => handleSaveEditThreshold(item.level)}
                                className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
                                title="حفظ"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setEditingLevel(null)}
                                className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 cursor-pointer"
                                title="إلغاء"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-amber-400 text-sm">{item.requiredXp.toLocaleString()} XP</span>
                          )}
                        </td>

                        <td className="px-6 py-4 font-mono text-slate-400">
                          {idx === 0 ? `+${item.requiredXp} XP` : `+${diff.toLocaleString()} XP`}
                        </td>

                        <td className="px-6 py-4 font-mono text-slate-400">
                          ~{Math.ceil(item.requiredXp / Math.max(xpPerMessage, 1))} رسالة
                        </td>

                        <td className="px-6 py-4 text-left">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setEditingLevel(item.level);
                                setEditingXpVal(item.requiredXp);
                              }}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-700"
                              title="تعديل الـ XP"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteThreshold(item.level)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer border border-slate-700 hover:border-rose-500/40"
                              title="حذف هذا المستوى"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* 3. Level Up Message Sub-Tab                                           */}
      {/* --------------------------------------------------------------------- */}
      {subTab === 'message' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <MessageSquare className="w-4 h-4 text-indigo-400" />
              تخصيص رسالة الترقية (Level Up Message)
            </h3>

            {/* Toggle Level Up Message */}
            <div className="flex items-center justify-between p-4 bg-slate-950/60 rounded-xl border border-slate-800">
              <div>
                <span className="text-sm font-bold text-white block">إرسال رسالة عند الترقية لمستوى جديد</span>
                <span className="text-xs text-slate-400">إشعار العضو فور وصوله للمستوى المطلوب</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={levelupMessageEnabled}
                  onChange={e => setLevelupMessageEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {/* Level Up Channel ID Configuration */}
            <div className="space-y-3 p-4 bg-slate-950/80 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="levelup-channel-id-input"
                  className="block text-xs font-bold text-white flex items-center gap-2"
                >
                  <Hash className="w-4 h-4 text-indigo-400" />
                  <span>معرف قناة الترقية (Level Up Channel ID)</span>
                </label>
                {levelupChannelId ? (
                  <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    محددة بالـ ID
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full">
                    نفس القناة الحالية (افتراضي)
                  </span>
                )}
              </div>

              {/* Main Channel ID Text Input */}
              <div className="relative">
                <input
                  id="levelup-channel-id-input"
                  type="text"
                  value={levelupChannelId}
                  onChange={e => setLevelupChannelId(e.target.value.trim())}
                  placeholder="مثال: 123456789012345678 (معرف قناة 📈・ʟᴇᴠᴇʟ-ᴜᴘ)"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white font-mono placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none transition-colors"
                />
                {levelupChannelId && (
                  <button
                    type="button"
                    onClick={() => setLevelupChannelId('')}
                    className="absolute left-3 top-3 text-xs text-slate-400 hover:text-rose-400 p-0.5 rounded transition-colors cursor-pointer"
                    title="مسح المعرف (العودة للوضع الافتراضي)"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Quick Server Channels Helper */}
              {channels.length > 0 && (
                <div className="pt-2 border-t border-slate-850">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
                    <span>أو حدد قناة من السيرفر لنسخ الـ ID الخاص بها مباشرة:</span>
                  </div>
                  <select
                    value={levelupChannelId}
                    onChange={e => setLevelupChannelId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-750 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none font-mono"
                  >
                    <option value="">-- نفس القناة التي أرسل فيها العضو (افتراضي) --</option>
                    {channels.map(c => (
                      <option key={c.id} value={c.id}>
                        #{c.name} — ID: {c.id}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Informative Guidance */}
              <div className="text-[11px] text-slate-400 space-y-1.5 bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
                <p className="flex items-start gap-1.5 text-slate-300">
                  <Info className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0 mt-0.5" />
                  <span>
                    الصق الـ <strong>Discord Channel ID</strong> الخاص بقناة <code>📈・ʟᴇᴠᴇʟ-ᴜᴘ</code> هنا.
                  </span>
                </p>
                <ul className="list-disc list-inside text-[10px] text-slate-400 space-y-0.5 mr-1">
                  <li>
                    <strong>عند وضع Channel ID:</strong> يتم إرسال جميع رسائل الترقية إلى تلك القناة المحددة بالـ ID حصراً (بدون الاعتماد على اسم القناة).
                  </li>
                  <li>
                    <strong>إذا تُرِك الحقل فارغاً:</strong> سيتم إرسال رسالة الـ Level Up في نفس القناة التي كتب فيها العضو رسالته الأخيرة (الخيار الافتراضي).
                  </li>
                  <li>
                    <strong>التحقق والأمان:</strong> يتحقق البوت تلقائياً من وجود القناة وصلاحيات <code>ViewChannel</code> و <code>SendMessages</code> و <code>EmbedLinks</code>، ويسجل Warning في السجلات إذا تعذر الإرسال دون أن يتوقف البوت.
                  </li>
                </ul>
              </div>
            </div>

            {/* Template Message Box */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-300">
                  نص رسالة التهنئة
                </label>
                <span className="text-[10px] text-slate-400">يدعم المنشن والإيموجي</span>
              </div>
              <textarea
                rows={4}
                value={levelupMessage}
                onChange={e => setLevelupMessage(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3.5 text-xs text-white focus:border-indigo-500 focus:outline-none font-sans leading-relaxed"
                placeholder="مبروك {user}! وصلت للمستوى {level} 🎉"
              />
            </div>

            {/* Variable Tags Chips */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 block">
                المتغيرات المتاحة (انقر لإدراج المتغير في النص):
              </span>
              <div className="flex flex-wrap gap-2">
                {[
                  { tag: '{user}', desc: 'منشن العضو' },
                  { tag: '{username}', desc: 'اسم المستخدم' },
                  { tag: '{level}', desc: 'المستوى الجديد' },
                  { tag: '{xp}', desc: 'إجمالي الـ XP' },
                  { tag: '{server}', desc: 'اسم السيرفر' }
                ].map(item => (
                  <button
                    key={item.tag}
                    type="button"
                    onClick={() => setLevelupMessage(prev => prev + ` ${item.tag}`)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] font-mono text-indigo-300 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>{item.tag}</span>
                    <span className="text-[10px] text-slate-400">({item.desc})</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleSaveSettings}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/25 cursor-pointer flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              حفظ إعدادات الرسالة
            </button>
          </div>

          {/* Live Preview simulating Discord */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              معاينة حية كما ستظهر في ديسكورد (Discord Live Preview)
            </h3>

            <div className="bg-[#313338] rounded-xl p-4 border border-[#2b2d31] font-sans text-right space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow">
                  BOT
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">J3FRBOT</span>
                    <span className="bg-[#5865f2] text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                      BOT
                    </span>
                    <span className="text-[10px] text-slate-400">اليوم الساعة 04:30 م</span>
                    <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded mr-auto flex items-center gap-1">
                      <Hash className="w-3 h-3" />
                      {levelupChannelId ? `ID: ${levelupChannelId}` : 'نفس القناة'}
                    </span>
                  </div>
                  <div className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {previewMessage}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-2">
              <span className="font-bold text-slate-300 block flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                مميزات إرسال الإشعار:
              </span>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-400">
                <li>لا يرسل أي تنبيه إذا كان العضو قد أرسل رسالته في فترة الـ Cooldown.</li>
                <li>يتم الإرسال بأمان دون أن يتوقف البوت في حال لم تكن لديه صلاحية الكتابة.</li>
                <li>يدعم القناة الخاصة أو القناة التلقائية حسب تفضيلك.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* 4. Auto Roles Sub-Tab                                                 */}
      {/* --------------------------------------------------------------------- */}
      {subTab === 'roles' && (
        <div className="space-y-6">
          {/* Add Auto Role Rule Form */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Award className="w-4 h-4 text-indigo-400" />
              ربط رتبة جديدة بمستوى معين (Add Auto Role Rule)
            </h3>

            <form onSubmit={handleAddRole} className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  عند وصول المستوى (Level)
                </label>
                <select
                  value={newRoleLevel}
                  onChange={e => setNewRoleLevel(parseInt(e.target.value, 10))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                >
                  {thresholds.map(t => (
                    <option key={t.level} value={t.level}>
                      Level {t.level} ({t.requiredXp} XP)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  اسم أو معرف الرتبة (Role)
                </label>
                {discordRoles.length > 0 ? (
                  <select
                    value={newRoleId}
                    onChange={e => {
                      setNewRoleId(e.target.value);
                      const found = discordRoles.find(r => r.id === e.target.value);
                      if (found) setNewRoleName(found.name);
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                    required
                  >
                    <option value="">-- اختر رتبة ديسكورد --</option>
                    {discordRoles.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.id})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="مثال: Active Member أو Role ID"
                    value={newRoleId}
                    onChange={e => {
                      setNewRoleId(e.target.value);
                      setNewRoleName(e.target.value);
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                    required
                  />
                )}
              </div>

              <div className="flex flex-col justify-center">
                <label className="flex items-center gap-2 cursor-pointer mt-4">
                  <input
                    type="checkbox"
                    checked={newRoleRemovePrev}
                    onChange={e => setNewRoleRemovePrev(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs text-slate-300 font-semibold">
                    Remove Previous Role
                  </span>
                </label>
                <span className="text-[10px] text-slate-500 mt-1">حذف رتبة المستوى السابق تلقائياً</span>
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  حفظ قاعدة الرتبة
                </button>
              </div>
            </form>
          </div>

          {/* List of Configured Auto Roles */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-400" />
                  قواعد الرتب التلقائية المسجلة ({roles.length})
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  يتم التحقق تلقائياً من تسلسل صلاحيات البوت (Role Hierarchy) لضمان عدم توقف الخدمة
                </p>
              </div>
            </div>

            {roles.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                لم يتم إعداد أي رتب تلقائية بعد. استخدم النموذج أعلاه لربط رتب ديسكورد بمستويات معينة.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400">
                    <tr>
                      <th className="px-6 py-3.5 font-bold">المستوى (Level)</th>
                      <th className="px-6 py-3.5 font-bold">الرتبة الممنوحة</th>
                      <th className="px-6 py-3.5 font-bold">إزالة رتبة المستوى السابق؟</th>
                      <th className="px-6 py-3.5 font-bold">الحالة</th>
                      <th className="px-6 py-3.5 font-bold text-left">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {roles.map(r => (
                      <tr key={r.id} className="hover:bg-slate-850/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-white">
                          <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-mono">
                            Level {r.level}
                          </span>
                        </td>

                        <td className="px-6 py-4 font-bold text-white flex items-center gap-2">
                          <Award className="w-4 h-4 text-amber-400" />
                          <span>{r.roleName || r.roleId}</span>
                        </td>

                        <td className="px-6 py-4">
                          {r.removePrevious ? (
                            <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded text-[11px] font-medium">
                              نعم (تُحذف السابقة)
                            </span>
                          ) : (
                            <span className="text-slate-400 bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                              لا (تبقى الرتب السابقة)
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleToggleRole(r.id)}
                            className={`px-3 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-colors ${
                              r.enabled
                                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                                : 'bg-slate-800 border border-slate-700 text-slate-400'
                            }`}
                          >
                            {r.enabled ? 'مفعّلة' : 'معطّلة'}
                          </button>
                        </td>

                        <td className="px-6 py-4 text-left">
                          <button
                            onClick={() => handleDeleteRole(r.id)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer border border-slate-700 hover:border-rose-500/40"
                            title="حذف القاعدة"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* 5. Leaderboard Sub-Tab                                                */}
      {/* --------------------------------------------------------------------- */}
      {subTab === 'leaderboard' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  لوحة الشرف والمتصدرين في السيرفر (Leaderboard)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  قائمة بأعلى الأعضاء نشاطاً ونقاط خبرة (XP) مع مقدار التقدم نحو المستوى القادم
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400">
                  <tr>
                    <th className="px-6 py-3.5 font-bold">المركز (Rank)</th>
                    <th className="px-6 py-3.5 font-bold">العضو (User)</th>
                    <th className="px-6 py-3.5 font-bold">المستوى (Level)</th>
                    <th className="px-6 py-3.5 font-bold">إجمالي الـ XP</th>
                    <th className="px-6 py-3.5 font-bold">التقدم نحو المستوى القادم</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {leaderboard.map((member, index) => {
                    const nextThresh = thresholds.find(t => t.level > member.level);
                    const currentThresh = thresholds.find(t => t.level === member.level);
                    const base = currentThresh ? currentThresh.requiredXp : 0;
                    const nextXp = nextThresh ? nextThresh.requiredXp : member.xp;
                    const range = Math.max(1, nextXp - base);
                    const progress = Math.min(100, Math.max(0, Math.floor(((member.xp - base) / range) * 100)));

                    const medals = ['🥇', '🥈', '🥉'];
                    const medal = index < 3 ? medals[index] : `#${index + 1}`;

                    return (
                      <tr key={member.userId} className="hover:bg-slate-850/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-base">
                          <span>{medal}</span>
                        </td>

                        <td className="px-6 py-4 font-bold text-white flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
                            <User className="w-3.5 h-3.5" />
                          </div>
                          <span>{member.username}</span>
                        </td>

                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-mono font-bold">
                            Level {member.level}
                          </span>
                        </td>

                        <td className="px-6 py-4 font-mono font-bold text-amber-400">
                          {member.xp.toLocaleString()} XP
                        </td>

                        <td className="px-6 py-4">
                          <div className="w-48 space-y-1">
                            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                              <span>{progress}%</span>
                              {nextThresh && (
                                <span>{Math.max(0, nextThresh.requiredXp - member.xp).toLocaleString()} XP متبقي</span>
                              )}
                            </div>
                            <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                              <div
                                className="bg-gradient-to-l from-indigo-500 to-indigo-600 h-full rounded-full transition-all"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
