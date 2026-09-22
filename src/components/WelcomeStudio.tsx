import React, { useState, useEffect, useRef } from 'react';
import {
  Download,
  Upload,
  Trash2,
  Sliders,
  Check,
  Copy,
  User,
  Type,
  Hash,
  Sparkles,
  Move,
  Eye,
  EyeOff,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Server
} from 'lucide-react';

interface ElementPosition {
  enabled: boolean;
  x: number;
  y: number;
}

interface AvatarConfig extends ElementPosition {
  size: number;
}

interface TextConfig extends ElementPosition {
  fontSize: number;
  color: string;
  text?: string;
  format?: string;
}

interface CardConfig {
  avatar: AvatarConfig;
  username: TextConfig;
  welcomeText: TextConfig;
  memberCount: TextConfig;
}

const DEFAULT_CONFIG: CardConfig = {
  avatar: {
    enabled: true,
    x: 140,
    y: 180,
    size: 120
  },
  username: {
    enabled: true,
    x: 240,
    y: 180,
    fontSize: 34,
    color: '#ffffff'
  },
  welcomeText: {
    enabled: true,
    text: 'WELCOME',
    x: 240,
    y: 120,
    fontSize: 22,
    color: '#38bdf8'
  },
  memberCount: {
    enabled: false,
    format: 'Member #{count}',
    x: 240,
    y: 225,
    fontSize: 16,
    color: '#cbd5e1'
  }
};

const SAMPLE_AVATARS = [
  { label: 'Cyber Ninja', url: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=256&h=256&fit=crop&crop=faces' },
  { label: 'Astronaut', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&h=256&fit=crop&crop=faces' },
  { label: 'Anime Gamer', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=256&h=256&fit=crop&crop=faces' },
  { label: 'Discord Bot', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=256&h=256&fit=crop' }
];

// Pre-packaged sample custom backgrounds for instant testing
const SAMPLE_BACKGROUNDS = [
  {
    name: 'Anime Cyber City',
    url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1200&h=540&fit=crop'
  },
  {
    name: 'Minimal Deep Space',
    url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1200&h=540&fit=crop'
  },
  {
    name: 'Fantasy Sunset Mountain',
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&h=540&fit=crop'
  }
];

export const WelcomeStudio: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Guild & DB Persistence State
  const [guildId, setGuildId] = useState<string>('default_guild');
  const [guilds, setGuilds] = useState<Array<{ id: string; name: string; icon?: string }>>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Card Content Data
  const [username, setUsername] = useState('AlexGamer');
  const [serverName, setServerName] = useState('Community Kingdom');
  const [memberCount, setMemberCount] = useState(1452);
  const [avatarUrl, setAvatarUrl] = useState(SAMPLE_AVATARS[0].url);

  // Background state (No theme, pure image)
  const [bgImageSrc, setBgImageSrc] = useState<string>(SAMPLE_BACKGROUNDS[0].url);
  const [bgPath, setBgPath] = useState('./assets/welcome-bg.png');

  // Custom positioning & visibility configuration
  const [config, setConfig] = useState<CardConfig>(DEFAULT_CONFIG);
  const [activeTab, setActiveTab] = useState<'avatar' | 'username' | 'welcomeText' | 'memberCount' | 'background'>('background');

  // Dragging state on canvas
  const [isDragging, setIsDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isCopied, setIsCopied] = useState(false);

  // Load welcome config for specific guild
  const loadWelcomeConfig = async (targetGuildId: string) => {
    try {
      const res = await fetch(`/api/welcome/config?guildId=${encodeURIComponent(targetGuildId)}`);
      if (res.ok) {
        const data = await res.json();
        
        // Restore welcomeCardConfig (Avatar, Username, Welcome Text, Member Count)
        if (data.welcomeCardConfig) {
          const cc = data.welcomeCardConfig;
          setConfig({
            avatar: {
              enabled: cc.avatar?.enabled !== undefined ? Boolean(cc.avatar.enabled) : DEFAULT_CONFIG.avatar.enabled,
              x: Number.isFinite(cc.avatar?.x) ? Number(cc.avatar.x) : DEFAULT_CONFIG.avatar.x,
              y: Number.isFinite(cc.avatar?.y) ? Number(cc.avatar.y) : DEFAULT_CONFIG.avatar.y,
              size: Number.isFinite(cc.avatar?.size) ? Number(cc.avatar.size) : DEFAULT_CONFIG.avatar.size,
            },
            username: {
              enabled: cc.username?.enabled !== undefined ? Boolean(cc.username.enabled) : DEFAULT_CONFIG.username.enabled,
              x: Number.isFinite(cc.username?.x) ? Number(cc.username.x) : DEFAULT_CONFIG.username.x,
              y: Number.isFinite(cc.username?.y) ? Number(cc.username.y) : DEFAULT_CONFIG.username.y,
              fontSize: Number.isFinite(cc.username?.fontSize) ? Number(cc.username.fontSize) : DEFAULT_CONFIG.username.fontSize,
              color: cc.username?.color || DEFAULT_CONFIG.username.color,
            },
            welcomeText: {
              enabled: cc.welcomeText?.enabled !== undefined ? Boolean(cc.welcomeText.enabled) : DEFAULT_CONFIG.welcomeText.enabled,
              text: cc.welcomeText?.text !== undefined ? cc.welcomeText.text : (data.welcomeCustomText || DEFAULT_CONFIG.welcomeText.text),
              x: Number.isFinite(cc.welcomeText?.x) ? Number(cc.welcomeText.x) : DEFAULT_CONFIG.welcomeText.x,
              y: Number.isFinite(cc.welcomeText?.y) ? Number(cc.welcomeText.y) : DEFAULT_CONFIG.welcomeText.y,
              fontSize: Number.isFinite(cc.welcomeText?.fontSize) ? Number(cc.welcomeText.fontSize) : DEFAULT_CONFIG.welcomeText.fontSize,
              color: cc.welcomeText?.color || DEFAULT_CONFIG.welcomeText.color,
            },
            memberCount: {
              enabled: cc.memberCount?.enabled !== undefined ? Boolean(cc.memberCount.enabled) : DEFAULT_CONFIG.memberCount.enabled,
              format: cc.memberCount?.format || DEFAULT_CONFIG.memberCount.format,
              x: Number.isFinite(cc.memberCount?.x) ? Number(cc.memberCount.x) : DEFAULT_CONFIG.memberCount.x,
              y: Number.isFinite(cc.memberCount?.y) ? Number(cc.memberCount.y) : DEFAULT_CONFIG.memberCount.y,
              fontSize: Number.isFinite(cc.memberCount?.fontSize) ? Number(cc.memberCount.fontSize) : DEFAULT_CONFIG.memberCount.fontSize,
              color: cc.memberCount?.color || DEFAULT_CONFIG.memberCount.color,
            }
          });
        }

        // Restore welcomeBackgroundPath
        if (data.welcomeBackgroundPath !== undefined && data.welcomeBackgroundPath !== null) {
          const pathVal = String(data.welcomeBackgroundPath).trim();
          if (pathVal) {
            setBgImageSrc(pathVal);
            setBgPath(pathVal);
          } else {
            setBgImageSrc('');
            setBgPath('');
          }
        }
      }
    } catch (err) {
      console.error('Failed to load welcome configuration from database:', err);
    }
  };

  // Load configuration from API on mount
  useEffect(() => {
    let isMounted = true;

    const initData = async () => {
      setIsLoading(true);
      try {
        let activeGuildId = 'default_guild';
        try {
          const gRes = await fetch('/api/guilds');
          if (gRes.ok) {
            const gData = await gRes.json();
            if (isMounted && Array.isArray(gData.guilds) && gData.guilds.length > 0) {
              setGuilds(gData.guilds);
              activeGuildId = gData.guilds[0].id;
              setGuildId(activeGuildId);
              if (gData.guilds[0].name) {
                setServerName(gData.guilds[0].name);
              }
            }
          }
        } catch {
          // Keep default_guild
        }

        if (isMounted) {
          await loadWelcomeConfig(activeGuildId);
        }
      } catch (err) {
        console.error('Failed to initialize welcome studio:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    initData();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleGuildChange = async (newGuildId: string) => {
    setGuildId(newGuildId);
    const selected = guilds.find(g => g.id === newGuildId);
    if (selected?.name) {
      setServerName(selected.name);
    }
    setIsLoading(true);
    await loadWelcomeConfig(newGuildId);
    setIsLoading(false);
  };

  // Permanent persistence handler to PostgreSQL/Supabase
  const handleSaveConfig = async () => {
    setIsSaving(true);
    setStatusMessage(null);
    setSaveSuccess(false);

    try {
      const backgroundToSave = bgImageSrc || bgPath || '';
      const response = await fetch('/api/welcome/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guildId: guildId || 'default_guild',
          welcomeCardConfig: config,
          welcomeBackgroundPath: backgroundToSave,
          welcomeCustomText: config.welcomeText.text || 'WELCOME'
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setSaveSuccess(true);
        setStatusMessage({
          type: 'success',
          text: 'تم حفظ جميع إعدادات Welcome Studio وموقع العناصر والخلفية بنجاح وبشكل دائم في قاعدة البيانات!'
        });
        setTimeout(() => setSaveSuccess(false), 3500);
      } else {
        setStatusMessage({
          type: 'error',
          text: data.error || 'حدث خطأ أثناء حفظ الإعدادات في الخادم'
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'فشل الاتصال بالخادم لحفظ الإعدادات'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Upload custom background file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const resStr = event.target.result as string;
          setBgImageSrc(resStr);
          setBgPath(resStr);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Reset to default neutral canvas
  const handleClearBackground = () => {
    setBgImageSrc('');
    setBgPath('');
  };

  // Draw card on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 800;
    const height = 360;
    canvas.width = width;
    canvas.height = height;

    const render = (bgImg: HTMLImageElement | null, avImg: HTMLImageElement | null) => {
      // 1. Draw 100% Pure Background (NO OVERLAY, NO TINT, NO FRAME, NO GLOW)
      if (bgImg && bgImg.complete && bgImg.naturalWidth > 0) {
        ctx.drawImage(bgImg, 0, 0, width, height);
      } else {
        // Fallback clean neutral dark background
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, width, height);
      }

      // 2. Draw Avatar (if enabled)
      if (config.avatar.enabled) {
        const avX = config.avatar.x;
        const avY = config.avatar.y;
        const radius = Math.max(10, Math.floor(config.avatar.size / 2));

        ctx.save();
        ctx.beginPath();
        ctx.arc(avX, avY, radius, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();

        if (avImg && avImg.complete && avImg.naturalWidth > 0) {
          ctx.drawImage(avImg, avX - radius, avY - radius, radius * 2, radius * 2);
        } else {
          ctx.fillStyle = '#374151';
          ctx.fillRect(avX - radius, avY - radius, radius * 2, radius * 2);
        }
        ctx.restore();

        // Highlight ring if currently editing/dragging avatar
        if (activeTab === 'avatar') {
          ctx.save();
          ctx.beginPath();
          ctx.arc(avX, avY, radius + 3, 0, Math.PI * 2);
          ctx.strokeStyle = '#6366f1';
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);
          ctx.stroke();
          ctx.restore();
        }
      }

      // 3. Draw Welcome Text (if enabled)
      if (config.welcomeText.enabled && config.welcomeText.text?.trim()) {
        const text = config.welcomeText.text
          .replace(/{user}/g, username)
          .replace(/{server}/g, serverName)
          .replace(/{count}/g, memberCount.toString());

        ctx.save();
        ctx.font = `bold ${config.welcomeText.fontSize}px sans-serif`;
        ctx.fillStyle = config.welcomeText.color;
        ctx.textBaseline = 'middle';
        ctx.fillText(text, config.welcomeText.x, config.welcomeText.y);

        if (activeTab === 'welcomeText') {
          const metrics = ctx.measureText(text);
          ctx.strokeStyle = '#6366f1';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([3, 3]);
          ctx.strokeRect(
            config.welcomeText.x - 4,
            config.welcomeText.y - config.welcomeText.fontSize / 2 - 2,
            metrics.width + 8,
            config.welcomeText.fontSize + 4
          );
        }
        ctx.restore();
      }

      // 4. Draw Username (if enabled)
      if (config.username.enabled) {
        ctx.save();
        ctx.font = `bold ${config.username.fontSize}px sans-serif`;
        ctx.fillStyle = config.username.color;
        ctx.textBaseline = 'middle';
        ctx.fillText(username, config.username.x, config.username.y);

        if (activeTab === 'username') {
          const metrics = ctx.measureText(username);
          ctx.strokeStyle = '#6366f1';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([3, 3]);
          ctx.strokeRect(
            config.username.x - 4,
            config.username.y - config.username.fontSize / 2 - 2,
            metrics.width + 8,
            config.username.fontSize + 4
          );
        }
        ctx.restore();
      }

      // 5. Draw Member Count (if enabled)
      if (config.memberCount.enabled) {
        const formatTpl = config.memberCount.format || 'Member #{count}';
        const countText = formatTpl.replace(/{count}/g, memberCount.toLocaleString());

        ctx.save();
        ctx.font = `600 ${config.memberCount.fontSize}px sans-serif`;
        ctx.fillStyle = config.memberCount.color;
        ctx.textBaseline = 'middle';
        ctx.fillText(countText, config.memberCount.x, config.memberCount.y);

        if (activeTab === 'memberCount') {
          const metrics = ctx.measureText(countText);
          ctx.strokeStyle = '#6366f1';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([3, 3]);
          ctx.strokeRect(
            config.memberCount.x - 4,
            config.memberCount.y - config.memberCount.fontSize / 2 - 2,
            metrics.width + 8,
            config.memberCount.fontSize + 4
          );
        }
        ctx.restore();
      }
    };

    // Load assets
    const avImg = new window.Image();
    avImg.crossOrigin = 'anonymous';
    avImg.src = avatarUrl;

    if (bgImageSrc) {
      const bgImg = new window.Image();
      bgImg.crossOrigin = 'anonymous';
      bgImg.src = bgImageSrc;
      bgImg.onload = () => {
        if (avImg.complete) render(bgImg, avImg);
        else avImg.onload = () => render(bgImg, avImg);
      };
      bgImg.onerror = () => render(null, avImg);
    } else {
      avImg.onload = () => render(null, avImg);
      if (avImg.complete) render(null, avImg);
    }

  }, [bgImageSrc, avatarUrl, username, serverName, memberCount, config, activeTab]);

  // Canvas Dragging Handlers
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = 800 / rect.width;
    const scaleY = 360 / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    // Check hit on avatar
    if (config.avatar.enabled) {
      const dist = Math.hypot(mouseX - config.avatar.x, mouseY - config.avatar.y);
      if (dist <= config.avatar.size / 2) {
        setIsDragging('avatar');
        setActiveTab('avatar');
        setDragOffset({ x: mouseX - config.avatar.x, y: mouseY - config.avatar.y });
        return;
      }
    }

    // Check hit on username
    if (config.username.enabled) {
      if (
        mouseX >= config.username.x - 10 &&
        mouseX <= config.username.x + 250 &&
        mouseY >= config.username.y - 20 &&
        mouseY <= config.username.y + 20
      ) {
        setIsDragging('username');
        setActiveTab('username');
        setDragOffset({ x: mouseX - config.username.x, y: mouseY - config.username.y });
        return;
      }
    }

    // Check hit on welcome text
    if (config.welcomeText.enabled) {
      if (
        mouseX >= config.welcomeText.x - 10 &&
        mouseX <= config.welcomeText.x + 250 &&
        mouseY >= config.welcomeText.y - 20 &&
        mouseY <= config.welcomeText.y + 20
      ) {
        setIsDragging('welcomeText');
        setActiveTab('welcomeText');
        setDragOffset({ x: mouseX - config.welcomeText.x, y: mouseY - config.welcomeText.y });
        return;
      }
    }

    // Check hit on member count
    if (config.memberCount.enabled) {
      if (
        mouseX >= config.memberCount.x - 10 &&
        mouseX <= config.memberCount.x + 200 &&
        mouseY >= config.memberCount.y - 15 &&
        mouseY <= config.memberCount.y + 15
      ) {
        setIsDragging('memberCount');
        setActiveTab('memberCount');
        setDragOffset({ x: mouseX - config.memberCount.x, y: mouseY - config.memberCount.y });
        return;
      }
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = 800 / rect.width;
    const scaleY = 360 / rect.height;
    const mouseX = Math.round((e.clientX - rect.left) * scaleX - dragOffset.x);
    const mouseY = Math.round((e.clientY - rect.top) * scaleY - dragOffset.y);

    const clampedX = Math.max(10, Math.min(790, mouseX));
    const clampedY = Math.max(10, Math.min(350, mouseY));

    if (isDragging === 'avatar') {
      setConfig(prev => ({
        ...prev,
        avatar: { ...prev.avatar, x: clampedX, y: clampedY }
      }));
    } else if (isDragging === 'username') {
      setConfig(prev => ({
        ...prev,
        username: { ...prev.username, x: clampedX, y: clampedY }
      }));
    } else if (isDragging === 'welcomeText') {
      setConfig(prev => ({
        ...prev,
        welcomeText: { ...prev.welcomeText, x: clampedX, y: clampedY }
      }));
    } else if (isDragging === 'memberCount') {
      setConfig(prev => ({
        ...prev,
        memberCount: { ...prev.memberCount, x: clampedX, y: clampedY }
      }));
    }
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(null);
  };

  // Download image
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `welcome-${username.toLowerCase()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // Copy JSON config
  const handleCopyJson = () => {
    const exportData = {
      backgroundPath: bgPath,
      welcomeCardConfig: config
    };
    navigator.clipboard.writeText(JSON.stringify(exportData, null, 2));
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            استوديو الترحيب الحر (Custom Positioning & Pure Background)
          </div>
          <h2 className="text-xl font-bold text-white">تصميم بطاقة ترحيب بخلفيتك الخاصة بدون أي ثيمات أو طبقات معتمة</h2>
          <p className="text-slate-400 text-sm mt-1">
            الصورة التي ترفعها هي الخلفية الكاملة 100% دون أي إطار أو Overlay أو تغطية، مع تحكم كامل بموقع وحجم كل عنصر.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {guilds.length > 1 && (
            <div className="flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 text-xs">
              <Server className="w-4 h-4 text-indigo-400 shrink-0" />
              <select
                value={guildId}
                onChange={e => handleGuildChange(e.target.value)}
                className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
              >
                {guilds.map(g => (
                  <option key={g.id} value={g.id} className="bg-slate-900 text-white">
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            id="save-welcome-config-btn"
            onClick={handleSaveConfig}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-emerald-600/25 cursor-pointer"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>جاري الحفظ...</span>
              </>
            ) : saveSuccess ? (
              <>
                <Check className="w-4 h-4 text-white" />
                <span>تم الحفظ بنجاح!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>حفظ التعديلات (Save)</span>
              </>
            )}
          </button>

          <button
            id="copy-card-config-btn"
            onClick={handleCopyJson}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-semibold transition-all border border-slate-700 cursor-pointer"
          >
            {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-300" />}
            {isCopied ? 'تم نسخ الإعدادات!' : 'نسخ كود الإعدادات (JSON)'}
          </button>
          <button
            id="download-welcome-card-btn"
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-600/20 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            تحميل الصورة (PNG)
          </button>
        </div>
      </div>

      {/* Status Message Feedback */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-sm animate-fadeIn ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-red-500/10 border-red-500/30 text-red-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-xs hover:underline cursor-pointer opacity-80 hover:opacity-100"
          >
            إغلاق
          </button>
        </div>
      )}

      {/* Main Studio Viewport */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Canvas (800x360) */}
        <div className="lg:col-span-8 flex flex-col items-center justify-center bg-slate-950/80 border border-slate-800/80 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
          <div className="w-full flex items-center justify-between text-xs text-slate-400 mb-3 px-2">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              معاينة حية دقيقة (800 × 360 px) — يمكنك سحب العناصر بالماوس مباشرة
            </span>
            <span className="font-mono text-slate-500">welcomeCardService.js</span>
          </div>

          {/* Canvas Viewport */}
          <div className="w-full flex justify-center items-center py-2 select-none">
            <canvas
              id="welcome-card-canvas"
              ref={canvasRef}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
              className="max-w-full h-auto rounded-xl shadow-2xl border border-slate-800 cursor-crosshair transition-all"
              style={{ width: '100%', maxWidth: '800px', aspectRatio: '800/360' }}
            />
          </div>

          <div className="w-full flex items-center justify-between text-xs text-slate-500 mt-2 px-2">
            <span>💡 اسحب الصورة الشخصية أو النصوص داخل اللوحة لتغيير مكانها مباشرة.</span>
            <span>الخلفية: خالية تمامًا من أي فلاتر أو ألوان تلقائية</span>
          </div>

          {/* Discord Message Simulator */}
          <div className="w-full mt-5 bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex items-start gap-3">
            <img
              src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=64&h=64&fit=crop"
              alt="Bot"
              className="w-10 h-10 rounded-full border border-indigo-500/50"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-indigo-300">Bot Master</span>
                <span className="bg-indigo-600 text-white text-[10px] px-1.5 py-0.5 rounded font-bold">BOT</span>
                <span className="text-xs text-slate-500">Today at 12:00 PM</span>
              </div>
              <p className="text-sm text-slate-200 mt-1 font-sans">
                Welcome <span className="text-indigo-400 bg-indigo-500/10 px-1 rounded font-medium">@{username}</span> to <strong className="text-white">{serverName}</strong>! We are glad to have you here 🎉
              </p>
            </div>
          </div>
        </div>

        {/* Right: Controls & Positioning Toolset */}
        <div className="lg:col-span-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-400" />
              <h3 className="font-bold text-white text-base">تخصيص العناصر وموقعها</h3>
            </div>
          </div>

          {/* Navigation Tabs for Elements */}
          <div className="grid grid-cols-5 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('background')}
              className={`py-2 px-1 rounded-lg font-medium transition-all text-center ${
                activeTab === 'background' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              الخلفية
            </button>
            <button
              onClick={() => setActiveTab('avatar')}
              className={`py-2 px-1 rounded-lg font-medium transition-all text-center flex items-center justify-center gap-1 ${
                activeTab === 'avatar' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <User className="w-3 h-3" />
              Avatar
            </button>
            <button
              onClick={() => setActiveTab('username')}
              className={`py-2 px-1 rounded-lg font-medium transition-all text-center flex items-center justify-center gap-1 ${
                activeTab === 'username' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Type className="w-3 h-3" />
              الاسم
            </button>
            <button
              onClick={() => setActiveTab('welcomeText')}
              className={`py-2 px-1 rounded-lg font-medium transition-all text-center ${
                activeTab === 'welcomeText' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              الترحيب
            </button>
            <button
              onClick={() => setActiveTab('memberCount')}
              className={`py-2 px-1 rounded-lg font-medium transition-all text-center flex items-center justify-center gap-1 ${
                activeTab === 'memberCount' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Hash className="w-3 h-3" />
              الترتيب
            </button>
          </div>

          {/* 1. Background Settings Panel */}
          {activeTab === 'background' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">رفع صورة الخلفية الخاصة بك</label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    اختيار صورة من جهازك
                  </button>
                  {bgImageSrc && (
                    <button
                      onClick={handleClearBackground}
                      title="إزالة الصورة"
                      className="p-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl transition-all cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  المقاس الموصى به: 800×360 بكسل. لن يتم تطبيق أي لون أو غطاء معتم فوق الصورة.
                </p>
              </div>

              {/* Sample Backgrounds for Quick Testing */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2">أو اختر من خلفيات تجريبية:</label>
                <div className="grid grid-cols-3 gap-2">
                  {SAMPLE_BACKGROUNDS.map((sample, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setBgImageSrc(sample.url);
                        setBgPath(sample.url);
                      }}
                      className={`h-16 rounded-xl overflow-hidden border-2 transition-all relative ${
                        bgImageSrc === sample.url ? 'border-indigo-500 ring-2 ring-indigo-500/30' : 'border-slate-800 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={sample.url} alt={sample.name} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Background File Path Setting */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">مسار ملف الخلفية في السيرفر (Local Path أو رابط URL)</label>
                <input
                  type="text"
                  value={bgPath}
                  onChange={e => {
                    const val = e.target.value;
                    setBgPath(val);
                    if (val.startsWith('http://') || val.startsWith('https://') || val.startsWith('data:')) {
                      setBgImageSrc(val);
                    }
                  }}
                  placeholder="./assets/welcome-bg.png أو https://..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          {/* 2. Avatar Settings Panel */}
          {activeTab === 'avatar' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-xs font-semibold text-white flex items-center gap-2">
                  {config.avatar.enabled ? <Eye className="w-4 h-4 text-emerald-400" /> : <EyeOff className="w-4 h-4 text-slate-500" />}
                  تفعيل صورة الحساب (Avatar)
                </span>
                <input
                  type="checkbox"
                  checked={config.avatar.enabled}
                  onChange={e => setConfig(prev => ({ ...prev, avatar: { ...prev.avatar, enabled: e.target.checked } }))}
                  className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                />
              </div>

              {config.avatar.enabled && (
                <>
                  <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>الموقع الأفقي (X)</span>
                      <span className="font-mono text-indigo-400">{config.avatar.x}px</span>
                    </div>
                    <input
                      type="range"
                      min="30"
                      max="770"
                      value={config.avatar.x}
                      onChange={e => setConfig(prev => ({ ...prev, avatar: { ...prev.avatar, x: Number(e.target.value) } }))}
                      className="w-full accent-indigo-600"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>الموقع الرأسي (Y)</span>
                      <span className="font-mono text-indigo-400">{config.avatar.y}px</span>
                    </div>
                    <input
                      type="range"
                      min="30"
                      max="330"
                      value={config.avatar.y}
                      onChange={e => setConfig(prev => ({ ...prev, avatar: { ...prev.avatar, y: Number(e.target.value) } }))}
                      className="w-full accent-indigo-600"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>حجم الدائرة (Size / Diameter)</span>
                      <span className="font-mono text-indigo-400">{config.avatar.size}px</span>
                    </div>
                    <input
                      type="range"
                      min="40"
                      max="220"
                      value={config.avatar.size}
                      onChange={e => setConfig(prev => ({ ...prev, avatar: { ...prev.avatar, size: Number(e.target.value) } }))}
                      className="w-full accent-indigo-600"
                    />
                  </div>

                  {/* Sample Avatar Picker */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">صورة الحساب التجريبية</label>
                    <div className="flex items-center gap-2">
                      {SAMPLE_AVATARS.map((av, idx) => (
                        <button
                          key={idx}
                          onClick={() => setAvatarUrl(av.url)}
                          className={`w-9 h-9 rounded-full overflow-hidden border-2 transition-all ${
                            avatarUrl === av.url ? 'border-indigo-500 ring-2 ring-indigo-500/30 scale-105' : 'border-slate-800 opacity-60 hover:opacity-100'
                          }`}
                        >
                          <img src={av.url} alt={av.label} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* 3. Username Settings Panel */}
          {activeTab === 'username' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-xs font-semibold text-white flex items-center gap-2">
                  {config.username.enabled ? <Eye className="w-4 h-4 text-emerald-400" /> : <EyeOff className="w-4 h-4 text-slate-500" />}
                  تفعيل اسم العضو (Username)
                </span>
                <input
                  type="checkbox"
                  checked={config.username.enabled}
                  onChange={e => setConfig(prev => ({ ...prev, username: { ...prev.username, enabled: e.target.checked } }))}
                  className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                />
              </div>

              {config.username.enabled && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">اسم العضو التجريبي</label>
                    <input
                      type="text"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span>الموقع X</span>
                        <span className="font-mono text-indigo-400">{config.username.x}</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="700"
                        value={config.username.x}
                        onChange={e => setConfig(prev => ({ ...prev, username: { ...prev.username, x: Number(e.target.value) } }))}
                        className="w-full accent-indigo-600"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span>الموقع Y</span>
                        <span className="font-mono text-indigo-400">{config.username.y}</span>
                      </div>
                      <input
                        type="range"
                        min="20"
                        max="340"
                        value={config.username.y}
                        onChange={e => setConfig(prev => ({ ...prev, username: { ...prev.username, y: Number(e.target.value) } }))}
                        className="w-full accent-indigo-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span>حجم الخط</span>
                        <span className="font-mono text-indigo-400">{config.username.fontSize}px</span>
                      </div>
                      <input
                        type="range"
                        min="14"
                        max="64"
                        value={config.username.fontSize}
                        onChange={e => setConfig(prev => ({ ...prev, username: { ...prev.username, fontSize: Number(e.target.value) } }))}
                        className="w-full accent-indigo-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">لون الخط</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={config.username.color}
                          onChange={e => setConfig(prev => ({ ...prev, username: { ...prev.username, color: e.target.value } }))}
                          className="w-8 h-8 rounded-lg border border-slate-700 bg-transparent cursor-pointer"
                        />
                        <span className="text-xs font-mono text-slate-300">{config.username.color}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* 4. Welcome Text Settings Panel */}
          {activeTab === 'welcomeText' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-xs font-semibold text-white flex items-center gap-2">
                  {config.welcomeText.enabled ? <Eye className="w-4 h-4 text-emerald-400" /> : <EyeOff className="w-4 h-4 text-slate-500" />}
                  تفعيل النص الترحيبي (Welcome Text)
                </span>
                <input
                  type="checkbox"
                  checked={config.welcomeText.enabled}
                  onChange={e => setConfig(prev => ({ ...prev, welcomeText: { ...prev.welcomeText, enabled: e.target.checked } }))}
                  className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                />
              </div>

              {config.welcomeText.enabled && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">نص الترحيب</label>
                    <input
                      type="text"
                      value={config.welcomeText.text || ''}
                      onChange={e => setConfig(prev => ({ ...prev, welcomeText: { ...prev.welcomeText, text: e.target.value } }))}
                      placeholder="WELCOME أو أهلاً بك"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span>الموقع X</span>
                        <span className="font-mono text-indigo-400">{config.welcomeText.x}</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="700"
                        value={config.welcomeText.x}
                        onChange={e => setConfig(prev => ({ ...prev, welcomeText: { ...prev.welcomeText, x: Number(e.target.value) } }))}
                        className="w-full accent-indigo-600"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span>الموقع Y</span>
                        <span className="font-mono text-indigo-400">{config.welcomeText.y}</span>
                      </div>
                      <input
                        type="range"
                        min="20"
                        max="340"
                        value={config.welcomeText.y}
                        onChange={e => setConfig(prev => ({ ...prev, welcomeText: { ...prev.welcomeText, y: Number(e.target.value) } }))}
                        className="w-full accent-indigo-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span>حجم الخط</span>
                        <span className="font-mono text-indigo-400">{config.welcomeText.fontSize}px</span>
                      </div>
                      <input
                        type="range"
                        min="12"
                        max="48"
                        value={config.welcomeText.fontSize}
                        onChange={e => setConfig(prev => ({ ...prev, welcomeText: { ...prev.welcomeText, fontSize: Number(e.target.value) } }))}
                        className="w-full accent-indigo-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">لون الخط</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={config.welcomeText.color}
                          onChange={e => setConfig(prev => ({ ...prev, welcomeText: { ...prev.welcomeText, color: e.target.value } }))}
                          className="w-8 h-8 rounded-lg border border-slate-700 bg-transparent cursor-pointer"
                        />
                        <span className="text-xs font-mono text-slate-300">{config.welcomeText.color}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* 5. Member Count Settings Panel */}
          {activeTab === 'memberCount' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-xs font-semibold text-white flex items-center gap-2">
                  {config.memberCount.enabled ? <Eye className="w-4 h-4 text-emerald-400" /> : <EyeOff className="w-4 h-4 text-slate-500" />}
                  تفعيل عداد الأعضاء (Member Count)
                </span>
                <input
                  type="checkbox"
                  checked={config.memberCount.enabled}
                  onChange={e => setConfig(prev => ({ ...prev, memberCount: { ...prev.memberCount, enabled: e.target.checked } }))}
                  className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                />
              </div>

              {config.memberCount.enabled && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">صيغة النص (استخدم {'{count}'})</label>
                    <input
                      type="text"
                      value={config.memberCount.format || 'Member #{count}'}
                      onChange={e => setConfig(prev => ({ ...prev, memberCount: { ...prev.memberCount, format: e.target.value } }))}
                      placeholder="Member #{count} أو العضو رقم {count}"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span>الموقع X</span>
                        <span className="font-mono text-indigo-400">{config.memberCount.x}</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="700"
                        value={config.memberCount.x}
                        onChange={e => setConfig(prev => ({ ...prev, memberCount: { ...prev.memberCount, x: Number(e.target.value) } }))}
                        className="w-full accent-indigo-600"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span>الموقع Y</span>
                        <span className="font-mono text-indigo-400">{config.memberCount.y}</span>
                      </div>
                      <input
                        type="range"
                        min="20"
                        max="340"
                        value={config.memberCount.y}
                        onChange={e => setConfig(prev => ({ ...prev, memberCount: { ...prev.memberCount, y: Number(e.target.value) } }))}
                        className="w-full accent-indigo-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span>حجم الخط</span>
                        <span className="font-mono text-indigo-400">{config.memberCount.fontSize}px</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="36"
                        value={config.memberCount.fontSize}
                        onChange={e => setConfig(prev => ({ ...prev, memberCount: { ...prev.memberCount, fontSize: Number(e.target.value) } }))}
                        className="w-full accent-indigo-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">لون الخط</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={config.memberCount.color}
                          onChange={e => setConfig(prev => ({ ...prev, memberCount: { ...prev.memberCount, color: e.target.value } }))}
                          className="w-8 h-8 rounded-lg border border-slate-700 bg-transparent cursor-pointer"
                        />
                        <span className="text-xs font-mono text-slate-300">{config.memberCount.color}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
