'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import {
  ScanLine, List, Clock, Wrench, LogOut, Menu, X, QrCode, Check,
  XCircle, Trash2, CheckCircle, AlertTriangle, BarChart3, DollarSign, TrendingUp, Camera, RefreshCcw
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { ToastPopup } from './ToastPopup';
import { format12Hour, formatTimeRange, formatTimeRange24, convertTo24Hour, convertTo12Hour } from '@/utils/timeUtils';
import type { Slot, Booking, Closure, Game, Category } from '@/types';
import { api } from '@/lib/api';

interface AdminPanelProps {
  masterSlots: Slot[];
  setMasterSlots: (slots: Slot[]) => void;
  allBookings: Booking[];
  setBookings: (bookings: Booking[]) => void;
  closures: Closure[];
  setClosures: (closures: Closure[]) => void;
  games: Game[];
  setGames: (games: Game[]) => void;
  categories: Category[];
  setCategories: (categories: Category[]) => void;
  apiBaseUrl?: string;
  adminToken?: string | null;
  onLogout: () => void;
}

export const AdminPanel = ({
  masterSlots, setMasterSlots, allBookings, setBookings, closures, setClosures,
  games, setGames, categories, setCategories, onLogout, apiBaseUrl, adminToken
}: AdminPanelProps) => {
  const [activeTab, setActiveTab] = useState('checkin');
  const [checkInId, setCheckInId] = useState('');
  const [notification, setNotification] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedAdminCategory, setSelectedAdminCategory] = useState(categories[0]?.id || '');
  const [selectedAdminGame, setSelectedAdminGame] = useState(games[0]?.id || '');
  const [isRemoveAllOpen, setIsRemoveAllOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTone, setConfirmTone] = useState<'danger' | 'neutral'>('danger');
  const [confirmTitle, setConfirmTitle] = useState('Are you sure?');
  const [confirmMessage, setConfirmMessage] = useState<string>('');
  const [confirmConfirmLabel, setConfirmConfirmLabel] = useState<string>('Confirm');
  const confirmActionRef = useRef<null | (() => Promise<void> | void)>(null);
  const [slotFormData, setSlotFormData] = useState({
    startHour: '',
    endHour: '',
    startPeriod: 'PM' as 'AM' | 'PM',
    endPeriod: 'PM' as 'AM' | 'PM',
    timeFormat: '12h'
  });

  // Generator UI (Slots tab)
  const [slotGenDate, setSlotGenDate] = useState(new Date().toISOString().split('T')[0]);
  const [genOpenHour, setGenOpenHour] = useState(6);
  const [genCloseHour, setGenCloseHour] = useState(23);
  const [genDurationMins, setGenDurationMins] = useState<60 | 90 | 120>(60);
  const [genDayPrice, setGenDayPrice] = useState(1200);
  const [genPeakPrice, setGenPeakPrice] = useState(1500);
  const [genPeakStartHour, setGenPeakStartHour] = useState(18);
  const [genReplaceExisting, setGenReplaceExisting] = useState(false);

  // Catalog tab state
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newGameName, setNewGameName] = useState('');
  const [newGameCategoryId, setNewGameCategoryId] = useState('');
  const [editCategoryId, setEditCategoryId] = useState<string | null>(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [editGameId, setEditGameId] = useState<string | null>(null);
  const [editGameName, setEditGameName] = useState('');
  const [editGameCategoryId, setEditGameCategoryId] = useState<string>('');

  // QR Scan (embedded in admin dashboard)
  const scanReaderId = 'admin-qr-reader';
  const qrRef = useRef<Html5Qrcode | null>(null);
  const scanBusyRef = useRef(false);
  const [scanStatus, setScanStatus] = useState<'IDLE' | 'SCANNING' | 'VALID' | 'INVALID' | 'EXPIRED' | 'ALREADY_USED' | 'ERROR'>('IDLE');
  const [scanMessage, setScanMessage] = useState<string>('Ready to scan.');
  const [scanLast, setScanLast] = useState<string | null>(null);

  const [closureForm, setClosureForm] = useState({
    type: 'full' as 'full' | 'partial',
    date: '',
    startHour: 18,
    endHour: 22,
    reason: 'Maintenance',
    note: ''
  });

  // -----------------------------
  // Analytics (derived from bookings)
  // -----------------------------
  const nonCancelledBookings = allBookings.filter(b => b.status !== 'Cancelled');
  const totalRevenue = nonCancelledBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
  const statusCounts = allBookings.reduce(
    (acc, b) => {
      acc[b.status] = (acc[b.status] || 0) + 1;
      return acc;
    },
    {} as Record<Booking['status'], number>
  );

  const revenueByDateMap = nonCancelledBookings.reduce((acc, b) => {
    const key = b.date;
    acc[key] = (acc[key] || 0) + (b.totalPrice || 0);
    return acc;
  }, {} as Record<string, number>);

  const revenueByDate = Object.entries(revenueByDateMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-10)
    .map(([date, value]) => ({ label: date.slice(5), value }));

  const revenueByGameMap = nonCancelledBookings.reduce((acc, b) => {
    const key = b.gameName || 'Unknown';
    acc[key] = (acc[key] || 0) + (b.totalPrice || 0);
    return acc;
  }, {} as Record<string, number>);

  const topGamesByRevenue = Object.entries(revenueByGameMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, value]) => ({ name, value }));

  const maxRevenuePoint = Math.max(1, ...revenueByDate.map(p => p.value));

  const StatCard = ({ label, value, icon }: { label: string; value: React.ReactNode; icon: React.ReactNode }) => (
    <div className="bg-black border border-white/10 p-5 flex items-center gap-4">
      <div className="w-10 h-10 border border-white/10 flex items-center justify-center text-zinc-300">
        {icon}
      </div>
      <div>
        <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{label}</div>
        <div className="text-2xl font-black italic tracking-tight text-white">{value}</div>
      </div>
    </div>
  );

  const MiniBarChart = ({ data }: { data: Array<{ label: string; value: number }> }) => (
    <div className="bg-black border border-white/10 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Revenue (last {data.length} days)</h3>
        <span className="text-xs text-zinc-600">{data.length ? '€' + data.reduce((s, d) => s + d.value, 0) : '—'}</span>
      </div>
      <div className="grid grid-cols-10 gap-2 items-end h-28">
        {data.map((d) => {
          const h = Math.round((d.value / maxRevenuePoint) * 100);
          return (
            <div key={d.label} className="flex flex-col items-center gap-2">
              <div className="w-full bg-zinc-900 border border-white/5 h-24 flex items-end">
                <div className="w-full bg-white/90" style={{ height: `${h}%` }} />
              </div>
              <div className="text-[10px] text-zinc-600 font-mono">{d.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const StatusBreakdown = () => (
    <div className="bg-black border border-white/10 p-6">
      <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-4">Bookings by status</h3>
      <div className="space-y-3 text-sm">
        {(['Confirmed', 'Checked In', 'Cancelled'] as Booking['status'][]).map((s) => (
          <div key={s} className="flex items-center justify-between border-b border-white/5 pb-2">
            <span className="text-zinc-400">{s}</span>
            <span className="font-mono text-white">{statusCounts[s] || 0}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const TopGames = () => (
    <div className="bg-black border border-white/10 p-6">
      <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-4">Top games by revenue</h3>
      <div className="space-y-3 text-sm">
        {topGamesByRevenue.length === 0 ? (
          <div className="text-zinc-600 italic">No revenue yet</div>
        ) : (
          topGamesByRevenue.map((g) => (
            <div key={g.name} className="flex items-center justify-between border-b border-white/5 pb-2">
              <span className="text-zinc-400">{g.name}</span>
              <span className="font-mono text-white">€{g.value}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const scanColors = useMemo(() => {
    if (scanStatus === 'VALID') return { border: 'border-green-500', bg: 'bg-green-950/20', text: 'text-green-400' };
    if (scanStatus === 'ALREADY_USED') return { border: 'border-yellow-500', bg: 'bg-yellow-950/20', text: 'text-yellow-300' };
    if (scanStatus === 'EXPIRED') return { border: 'border-orange-500', bg: 'bg-orange-950/20', text: 'text-orange-300' };
    if (scanStatus === 'INVALID' || scanStatus === 'ERROR') return { border: 'border-red-500', bg: 'bg-red-950/20', text: 'text-red-400' };
    return { border: 'border-white/10', bg: 'bg-zinc-900/40', text: 'text-zinc-300' };
  }, [scanStatus]);

  const stopScanner = async () => {
    const q = qrRef.current;
    if (!q) return;
    try {
      if (q.isScanning) await q.stop();
    } catch {
      // ignore
    }
    try {
      await q.clear();
    } catch {
      // ignore
    }
  };

  const startScanner = async () => {
    if (!apiBaseUrl || !adminToken) {
      setScanStatus('ERROR');
      setScanMessage('Not authenticated or backend not configured.');
      return;
    }

    setScanStatus('SCANNING');
    setScanMessage('Point your camera at the QR code…');

    if (!qrRef.current) {
      qrRef.current = new Html5Qrcode(scanReaderId);
    }

    await stopScanner();

    await qrRef.current.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 260, height: 260 } },
      async (decodedText) => {
        if (scanBusyRef.current) return;
        scanBusyRef.current = true;
        setScanLast(decodedText);
        try {
          const res = await api.admin.verifyScan(apiBaseUrl, adminToken, decodedText);
          setScanStatus(res.status);
          if (res.status === 'VALID') setScanMessage(`VALID — ${res.booking?.id} checked in.`);
          if (res.status === 'ALREADY_USED') setScanMessage('ALREADY USED — this booking was already scanned.');
          if (res.status === 'EXPIRED') setScanMessage('EXPIRED — booking is not for current time/date.');
          if (res.status === 'INVALID') setScanMessage('INVALID — booking token is not valid.');
        } catch (e: any) {
          setScanStatus('ERROR');
          setScanMessage(e?.message || 'Scan verification failed.');
        } finally {
          scanBusyRef.current = false;
          await stopScanner();
        }
      },
      () => {
        // ignore scan noise
      }
    );
  };

  useEffect(() => {
    // Keep selected game in-sync with selected category
    if (!selectedAdminCategory) return;
    const firstGameInCategory = games.find(g => g.categoryId === selectedAdminCategory);
    if (firstGameInCategory && firstGameInCategory.id !== selectedAdminGame) {
      setSelectedAdminGame(firstGameInCategory.id);
    }
  }, [selectedAdminCategory, games, selectedAdminGame]);

  // If the catalog refreshes (mock -> backend) ensure our selected IDs still exist.
  // This prevents invalid legacy IDs like "g1" from being sent to the backend.
  useEffect(() => {
    if (!categories.length || !games.length) return;

    const categoryExists = categories.some(c => c.id === selectedAdminCategory);
    const nextCategoryId = categoryExists ? selectedAdminCategory : categories[0]!.id;
    if (nextCategoryId !== selectedAdminCategory) {
      setSelectedAdminCategory(nextCategoryId);
    }

    const selectedGame = games.find(g => g.id === selectedAdminGame);
    const gameMatchesCategory = selectedGame ? selectedGame.categoryId === nextCategoryId : false;
    if (!selectedGame || !gameMatchesCategory) {
      const firstGameForCategory = games.find(g => g.categoryId === nextCategoryId) || games[0];
      if (firstGameForCategory && firstGameForCategory.id !== selectedAdminGame) {
        setSelectedAdminGame(firstGameForCategory.id);
      }
    }
  }, [categories, games, selectedAdminCategory, selectedAdminGame]);

  const hours = Array.from({ length: 24 }, (_, h) => h);
  const todayIso = new Date().toISOString().split('T')[0];
  const currentHour = new Date().getHours();
  const isTodaySelected = slotGenDate === todayIso;

  const refreshCatalogFromServer = async () => {
    if (!apiBaseUrl) return;
    try {
      const data = await api.catalog(apiBaseUrl);
      setCategories(data.categories);
      setGames(data.games);
      setMasterSlots(data.slots);
    } catch {
      // ignore
    }
  };

  const openConfirm = (opts: {
    title: string;
    message: string;
    confirmLabel?: string;
    tone?: 'danger' | 'neutral';
    onConfirm: () => Promise<void> | void;
  }) => {
    confirmActionRef.current = opts.onConfirm;
    setConfirmTitle(opts.title);
    setConfirmMessage(opts.message);
    setConfirmConfirmLabel(opts.confirmLabel || 'Confirm');
    setConfirmTone(opts.tone || 'danger');
    setConfirmOpen(true);
  };

  const runConfirm = async () => {
    const fn = confirmActionRef.current;
    setConfirmOpen(false);
    confirmActionRef.current = null;
    if (!fn) return;
    await fn();
  };

  const handleGenerateSlots = () => {
    if (!selectedAdminGame) {
      setNotification({ type: 'error', title: 'No Game Selected', message: 'Select a game before generating slots.' });
      return;
    }

    // For "today", only generate slots strictly after the current hour.
    // Example: if it's 3 PM (15), the earliest generated slot is 4 PM (16).
    const effectiveOpenHour = isTodaySelected ? Math.max(genOpenHour, currentHour + 1) : genOpenHour;
    if (isTodaySelected && effectiveOpenHour !== genOpenHour) {
      setNotification({
        type: 'info',
        title: 'Adjusted Open Time',
        message: `For today, open time was adjusted to ${format12Hour(effectiveOpenHour)} to avoid past hours.`,
      });
      setGenOpenHour(effectiveOpenHour);
    }
    if (genOpenHour >= genCloseHour) {
      setNotification({ type: 'error', title: 'Invalid Time Range', message: 'Open time must be before close time.' });
      return;
    }
    if (effectiveOpenHour >= genCloseHour) {
      setNotification({
        type: 'error',
        title: 'No Future Slots',
        message: 'For today, close time must be after the current time to generate any slots.',
      });
      return;
    }
    if (genDurationMins === 90) {
      setNotification({
        type: 'error',
        title: 'Unsupported Duration',
        message: '90-minute slots are not supported yet (current model is hour-based). Please use 60m or 120m.'
      });
      return;
    }
    if (genDurationMins !== 60 && genDurationMins !== 120) {
      setNotification({ type: 'error', title: 'Invalid Duration', message: 'Please select a valid duration.' });
      return;
    }
    if (genDayPrice <= 0 || genPeakPrice <= 0) {
      setNotification({ type: 'error', title: 'Invalid Pricing', message: 'Prices must be positive numbers.' });
      return;
    }

    // If backend admin token is available, use server-side generation so data persists
    if (apiBaseUrl && adminToken) {
      (async () => {
        try {
          const res = await api.admin.generateSlots(apiBaseUrl, adminToken, {
            gameId: selectedAdminGame,
            openHour: effectiveOpenHour,
            closeHour: genCloseHour,
            durationMins: genDurationMins === 120 ? '120' : '60',
            dayPrice: Math.round(genDayPrice),
            peakPrice: Math.round(genPeakPrice),
            peakStartHour: genPeakStartHour,
            replaceExisting: genReplaceExisting,
          });

          const base = genReplaceExisting
            ? masterSlots.filter(s => s.gameId !== selectedAdminGame)
            : masterSlots.slice();

          setMasterSlots([...base, ...res.slots]);
          setNotification({ type: 'success', title: 'Slots Generated', message: `Generated ${res.slots.length} slot(s).` });
        } catch (err: any) {
          setNotification({ type: 'error', title: 'Failed', message: err?.message || 'Could not generate slots.' });
        }
      })();
      return;
    }

    const stepHours = genDurationMins / 60;
    const generated: Slot[] = [];
    for (let h = effectiveOpenHour; h + stepHours <= genCloseHour; h += stepHours) {
      const startHour = h;
      const endHour = h + stepHours;
      const price = startHour >= genPeakStartHour ? genPeakPrice : genDayPrice;
      generated.push({
        id: '0', // temp id assigned below
        gameId: selectedAdminGame,
        time: formatTimeRange(startHour, endHour),
        startHour,
        price: Math.round(price),
        active: true,
      });
    }

    if (generated.length === 0) {
      setNotification({ type: 'error', title: 'No Slots Generated', message: 'Adjust open/close time to generate at least one slot.' });
      return;
    }

    const base = genReplaceExisting
      ? masterSlots.filter(s => s.gameId !== selectedAdminGame)
      : masterSlots.slice();

    const existingStarts = new Set(base.filter(s => s.gameId === selectedAdminGame).map(s => s.startHour));
    const nowTs = Date.now();
    const toAdd = genReplaceExisting ? generated : generated.filter(s => !existingStarts.has(s.startHour));
    const withIds = toAdd.map((s, idx) => ({ ...s, id: String(nowTs + idx) }));

    setMasterSlots([...base, ...withIds]);
    setNotification({
      type: 'success',
      title: 'Slots Generated',
      message: genReplaceExisting ? 'Replaced slots for this game.' : `Added ${withIds.length} new slot(s).`,
    });
  };

  const handleSaveSlotChanges = () => {
    setNotification({ type: 'success', title: 'Saved', message: 'Slot changes saved.' });
  };

  const handleDeleteSlot = async (slotId: string) => {
    openConfirm({
      title: 'Remove slot?',
      message: 'This will permanently delete the slot.',
      confirmLabel: 'Yes, remove',
      tone: 'danger',
      onConfirm: async () => {
        try {
          if (apiBaseUrl && adminToken) {
            await api.admin.deleteSlot(apiBaseUrl, adminToken, slotId);
          }
          setMasterSlots(masterSlots.filter(s => s.id !== slotId));
          setNotification({ type: 'info', title: 'Slot Removed', message: 'Slot deleted.' });
        } catch (err: any) {
          setNotification({ type: 'error', title: 'Failed', message: err?.message || 'Could not delete slot.' });
        }
      },
    });
  };

  const handleRemoveAllSlotsForGame = () => {
    if (!selectedAdminGame) return;

    const hasActiveBookingsForGame = allBookings.some(
      b => b.gameId === selectedAdminGame && b.status !== 'Cancelled'
    );
    if (hasActiveBookingsForGame) {
      setNotification({
        type: 'error',
        title: 'Cannot Remove Slots',
        message: 'This game has active bookings. Cancel those bookings first before removing all slots.'
      });
      return;
    }

    const count = masterSlots.filter(s => s.gameId === selectedAdminGame).length;
    if (count === 0) return;

    setIsRemoveAllOpen(true);
  };

  const confirmRemoveAllSlotsForGame = async () => {
    if (!selectedAdminGame) return;
    const count = masterSlots.filter(s => s.gameId === selectedAdminGame).length;
    try {
      if (apiBaseUrl && adminToken) {
        await api.admin.removeAllSlots(apiBaseUrl, adminToken, selectedAdminGame);
      }
      setMasterSlots(masterSlots.filter(s => s.gameId !== selectedAdminGame));
      setNotification({ type: 'info', title: 'All Slots Removed', message: `Removed ${count} slot(s) for this game.` });
      setIsRemoveAllOpen(false);
    } catch (err: any) {
      setNotification({ type: 'error', title: 'Failed', message: err?.message || 'Could not remove all slots.' });
    }
  };

  useEffect(() => {
    if (!isRemoveAllOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsRemoveAllOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isRemoveAllOpen]);

  useEffect(() => {
    if (!confirmOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setConfirmOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [confirmOpen]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Start/stop camera scanner based on active tab
  useEffect(() => {
    if (activeTab !== 'scan') {
      stopScanner();
      return;
    }

    setScanStatus('IDLE');
    setScanMessage('Ready to scan.');
    setScanLast(null);
    startScanner();

    return () => {
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const toggleSlotStatus = async (id: string) => {
    const slot = masterSlots.find(s => s.id === id);
    if (!slot) return;
    const nextActive = !slot.active;
    try {
      if (apiBaseUrl && adminToken) {
        const res = await api.admin.patchSlot(apiBaseUrl, adminToken, id, { active: nextActive });
        setMasterSlots(masterSlots.map(s => (s.id === id ? res.slot : s)));
        return;
      }
    } catch (err: any) {
      setNotification({ type: 'error', title: 'Update Failed', message: err?.message || 'Unable to update slot.' });
      return;
    }
    setMasterSlots(masterSlots.map(s => (s.id === id ? { ...s, active: nextActive } : s)));
  };

  const updatePrice = async (id: string, newPrice: string) => {
    const price = Number(newPrice);
    setMasterSlots(masterSlots.map(s => (s.id === id ? { ...s, price } : s)));
    try {
      if (apiBaseUrl && adminToken) {
        const res = await api.admin.patchSlot(apiBaseUrl, adminToken, id, { price });
        setMasterSlots(masterSlots.map(s => (s.id === id ? res.slot : s)));
      }
    } catch (err: any) {
      setNotification({ type: 'error', title: 'Update Failed', message: err?.message || 'Unable to update slot.' });
    }
  };

  const addSlot = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);

    const startHourRaw = parseInt(slotFormData.startHour || (formData.get('startHour') as string));
    const endHourRaw = parseInt(slotFormData.endHour || (formData.get('endHour') as string));
    const price = parseFloat(formData.get('price') as string);
    const timeFormat = slotFormData.timeFormat || (formData.get('timeFormat') as string);

    // Convert 12h (AM/PM) inputs to 24h hours for storage + backend API.
    // Note: We only support same-day slots (end must be after start).
    const startHour =
      timeFormat === '12h'
        ? convertTo24Hour(startHourRaw, slotFormData.startPeriod)
        : startHourRaw;
    const endHour =
      timeFormat === '12h'
        ? convertTo24Hour(endHourRaw, slotFormData.endPeriod)
        : endHourRaw;

    // Prevent creating slots in the past for "today" (uses the currently selected date in the Slots tab).
    // Note: Slots are hour-based. We treat the current hour as already started and disallow it.
    if (isTodaySelected && startHour <= currentHour) {
      setNotification({
        type: 'error',
        title: 'Past Time Not Allowed',
        message: `For today, start time must be after the current time (${format12Hour(currentHour)}).`,
      });
      return;
    }

    // Validation
    if (isNaN(startHourRaw) || isNaN(endHourRaw)) {
      setNotification({ type: 'error', title: 'Invalid Time', message: 'Please enter valid start and end times.' });
      return;
    }

    if (timeFormat === '12h') {
      if (startHourRaw < 1 || startHourRaw > 12 || endHourRaw < 1 || endHourRaw > 12) {
        setNotification({ type: 'error', title: 'Invalid Time', message: 'Hours must be between 1 and 12 for AM/PM format.' });
        return;
      }
    } else {
      if (startHour < 0 || startHour > 23 || endHour < 0 || endHour > 23) {
        setNotification({ type: 'error', title: 'Invalid Time', message: 'Hours must be between 0 and 23.' });
        return;
      }
    }

    if (startHour >= endHour) {
      setNotification({
        type: 'error',
        title: 'Invalid Time Range',
        message: 'End time must be after start time (same day).',
      });
      return;
    }

    if (endHour - startHour > 12) {
      setNotification({ type: 'error', title: 'Invalid Duration', message: 'Slot duration cannot exceed 12 hours.' });
      return;
    }

    if (isNaN(price) || price <= 0) {
      setNotification({ type: 'error', title: 'Invalid Price', message: 'Price must be a positive number.' });
      return;
    }

    if (price > 10000) {
      setNotification({ type: 'error', title: 'Invalid Price', message: 'Price cannot exceed €10,000.' });
      return;
    }

    // Check for duplicate slot time
    const existingSlot = masterSlots.find(
      s => s.gameId === selectedAdminGame && s.startHour === startHour
    );
    if (existingSlot) {
      setNotification({ type: 'error', title: 'Duplicate Slot', message: 'A slot already exists at this start time for this game.' });
      return;
    }

    // Generate time display based on format preference
    const timeDisplay = timeFormat === '12h'
      ? formatTimeRange(startHour, endHour)
      : formatTimeRange24(startHour, endHour);

    // Persist to backend if we have an admin JWT; otherwise fall back to local state.
    if (apiBaseUrl && adminToken) {
      (async () => {
        try {
          const res = await api.admin.createSlot(apiBaseUrl, adminToken, {
            gameId: selectedAdminGame,
            startHour,
            endHour,
            price: Math.round(price),
            active: true,
          });
          setMasterSlots([...masterSlots, res.slot]);
          setNotification({ type: 'success', title: 'Slot Added', message: `New slot created: ${res.slot.time} (€${res.slot.price})` });
          setSlotFormData({ startHour: '', endHour: '', startPeriod: 'PM', endPeriod: 'PM', timeFormat: '12h' });
          (e.target as HTMLFormElement).reset();
        } catch (err: any) {
          setNotification({ type: 'error', title: 'Failed', message: err?.message || 'Could not create slot.' });
        }
      })();
      return;
    }

    const newSlot: Slot = {
      id: String(Date.now()),
      gameId: selectedAdminGame,
      time: timeDisplay,
      startHour,
      endHour,
      price: Math.round(price),
      active: true,
    };

    setMasterSlots([...masterSlots, newSlot]);
    setNotification({ type: 'success', title: 'Slot Added', message: `New slot created: ${timeDisplay} (€${Math.round(price)})` });
    setSlotFormData({ startHour: '', endHour: '', startPeriod: 'PM', endPeriod: 'PM', timeFormat: '12h' });
    (e.target as HTMLFormElement).reset();
  };

  const addClosure = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const payload: Omit<Closure, 'id'> = {
      type: closureForm.type,
      date: closureForm.date,
      reason: closureForm.reason,
      note: closureForm.note,
      ...(closureForm.type === 'partial'
        ? { startHour: Number(closureForm.startHour), endHour: Number(closureForm.endHour) }
        : {}),
    };

    try {
      if (apiBaseUrl && adminToken) {
        const res = await api.admin.createClosure(apiBaseUrl, adminToken, payload);
        setClosures([...closures, res.closure]);
      } else {
        const newClosure: Closure = { id: `CL-${Date.now()}`, ...payload };
        setClosures([...closures, newClosure]);
      }
      setNotification({ type: 'success', title: 'Closure Active', message: 'The closure rule has been applied.' });
      setClosureForm({ ...closureForm, note: '' });
    } catch (err: any) {
      setNotification({ type: 'error', title: 'Failed', message: err?.message || 'Could not create closure.' });
    }
  };

  const deleteClosure = async (id: string) => {
    openConfirm({
      title: 'Remove closure?',
      message: 'This will permanently remove the closure rule.',
      confirmLabel: 'Yes, remove',
      tone: 'danger',
      onConfirm: async () => {
        try {
          if (apiBaseUrl && adminToken) {
            await api.admin.deleteClosure(apiBaseUrl, adminToken, id);
          }
          setClosures(closures.filter(c => c.id !== id));
          setNotification({ type: 'info', title: 'Removed', message: 'Closure removed.' });
        } catch (err: any) {
          setNotification({ type: 'error', title: 'Failed', message: err?.message || 'Could not delete closure.' });
        }
      },
    });
  };

  const handleStatusChange = async (bookingId: string, newStatus: Booking['status']) => {
    const booking = allBookings.find(b => b.id === bookingId);

    if (booking?.status === 'Cancelled' && newStatus !== 'Cancelled') {
      setNotification({ type: 'error', title: 'Action Denied', message: 'Cannot restore a cancelled booking.' });
      return;
    }

    try {
      if (apiBaseUrl && adminToken) {
        await api.admin.patchBookingStatus(apiBaseUrl, adminToken, bookingId, newStatus);
      }
      const updatedBookings = allBookings.map(b => (b.id === bookingId ? { ...b, status: newStatus } : b));
      setBookings(updatedBookings);
      setNotification({ type: 'success', title: 'Status Updated', message: `Booking marked as ${newStatus}` });
    } catch (err: any) {
      setNotification({ type: 'error', title: 'Failed', message: err?.message || 'Could not update booking.' });
    }
  };

  const handleDeleteBooking = async (bookingId: string) => {
    openConfirm({
      title: 'Delete booking record?',
      message: 'This will permanently delete the booking record. This cannot be undone.',
      confirmLabel: 'Yes, delete',
      tone: 'danger',
      onConfirm: async () => {
        try {
          if (apiBaseUrl && adminToken) {
            await api.admin.deleteBooking(apiBaseUrl, adminToken, bookingId);
          }
          setBookings(allBookings.filter(b => b.id !== bookingId));
          setNotification({ type: 'info', title: 'Booking Deleted', message: 'Record removed permanently.' });
        } catch (err: any) {
          setNotification({ type: 'error', title: 'Failed', message: err?.message || 'Could not delete booking.' });
        }
      },
    });
  };

  const handleCheckIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const booking = allBookings.find(b => b.id === checkInId.trim());
    if (!booking) {
      setNotification({ type: 'error', title: 'Scan Failed', message: 'Invalid or missing Order ID.' });
      return;
    }
    if (booking.status === 'Cancelled') {
      setNotification({ type: 'error', title: 'Cancelled', message: 'This booking was cancelled.' });
      return;
    }
    if (booking.status === 'Checked In') {
      setNotification({ type: 'error', title: 'Already Used', message: `Order ${booking.id} was already checked in.` });
      return;
    }

    if (apiBaseUrl && adminToken) {
      try {
        await api.admin.checkIn(apiBaseUrl, adminToken, booking.id);
      } catch (err: any) {
        setNotification({ type: 'error', title: 'Check-in Failed', message: err?.message || 'Unable to check in.' });
        return;
      }
    }

    await handleStatusChange(booking.id, 'Checked In');
    setNotification({
      type: 'success',
      title: 'Check-in Verified',
      message: 'Access granted successfully.',
      details: {
        game: booking.gameName,
        user: booking.user || 'Guest User',
        id: booking.id,
        slots: booking.slots.join(', ')
      }
    });
    setCheckInId('');
  };

  const SidebarContent = () => (
    <>
      <div className="h-20 flex items-center px-6 border-b border-white/5">
        <span className="font-bold text-lg italic tracking-tighter">4CANTERA ADMIN</span>
        <button className="ml-auto md:hidden" onClick={() => setIsSidebarOpen(false)}><X size={20} /></button>
      </div>
      <div className="p-4 space-y-1">
        <button onClick={() => { setActiveTab('checkin'); setIsSidebarOpen(false); }} className={`w-full flex items-center px-4 py-3 text-xs font-bold uppercase tracking-wider ${activeTab === 'checkin' ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'}`}>
          <ScanLine size={16} className="mr-3" /> Check-In
        </button>
        <button
          onClick={() => { setActiveTab('scan'); setIsSidebarOpen(false); }}
          className={`w-full flex items-center px-4 py-3 text-xs font-bold uppercase tracking-wider ${activeTab === 'scan' ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'}`}
        >
          <QrCode size={16} className="mr-3" /> Scan QR
        </button>
        <button onClick={() => { setActiveTab('analytics'); setIsSidebarOpen(false); }} className={`w-full flex items-center px-4 py-3 text-xs font-bold uppercase tracking-wider ${activeTab === 'analytics' ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'}`}>
          <BarChart3 size={16} className="mr-3" /> Analytics
        </button>
        <button onClick={() => { setActiveTab('catalog'); setIsSidebarOpen(false); }} className={`w-full flex items-center px-4 py-3 text-xs font-bold uppercase tracking-wider ${activeTab === 'catalog' ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'}`}>
          <List size={16} className="mr-3" /> Catalog
        </button>
        <button onClick={() => { setActiveTab('bookings'); setIsSidebarOpen(false); }} className={`w-full flex items-center px-4 py-3 text-xs font-bold uppercase tracking-wider ${activeTab === 'bookings' ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'}`}>
          <List size={16} className="mr-3" /> Bookings
        </button>
        <button onClick={() => { setActiveTab('slots'); setIsSidebarOpen(false); }} className={`w-full flex items-center px-4 py-3 text-xs font-bold uppercase tracking-wider ${activeTab === 'slots' ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'}`}>
          <Clock size={16} className="mr-3" /> Slots
        </button>
        <button onClick={() => { setActiveTab('closures'); setIsSidebarOpen(false); }} className={`w-full flex items-center px-4 py-3 text-xs font-bold uppercase tracking-wider ${activeTab === 'closures' ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'}`}>
          <Wrench size={16} className="mr-3" /> Facilities
        </button>
      </div>
      <div className="absolute bottom-0 w-full p-4 border-t border-white/5">
        <button onClick={onLogout} className="flex items-center text-zinc-500 hover:text-red-500 text-xs font-bold uppercase tracking-wider">
          <LogOut size={14} className="mr-2" /> Logout
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col md:flex-row relative">
      <ToastPopup notification={notification} onClose={() => setNotification(null)} />

      {confirmOpen && (
        <div className="fixed inset-0 z-[85] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close"
            onClick={() => setConfirmOpen(false)}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />
          <div className="relative w-full max-w-lg bg-black border border-white/10 shadow-2xl animate-fade-in">
            <div className="p-6 md:p-7 border-b border-white/5 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 border flex items-center justify-center ${
                    confirmTone === 'danger'
                      ? 'border-red-500/30 bg-red-950/20 text-red-400'
                      : 'border-white/10 bg-zinc-950 text-zinc-300'
                  }`}
                >
                  {confirmTone === 'danger' ? <AlertTriangle size={18} /> : <CheckCircle size={18} />}
                </div>
                <div>
                  <h3 className="text-lg font-black uppercase italic tracking-tighter">{confirmTitle}</h3>
                  <p className="text-xs text-zinc-500 mt-1">{confirmMessage}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="text-zinc-500 hover:text-white"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 md:p-7 border-t border-white/5 flex flex-col-reverse sm:flex-row gap-3 justify-end">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="border border-white/10 text-white px-5 py-3 text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => runConfirm()}
                className={`px-5 py-3 text-xs font-bold uppercase tracking-widest transition-colors ${
                  confirmTone === 'danger'
                    ? 'border border-red-500/40 bg-red-600 text-white hover:bg-red-700'
                    : 'border border-white/10 bg-white text-black hover:bg-zinc-200'
                }`}
              >
                {confirmConfirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {isRemoveAllOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close"
            onClick={() => setIsRemoveAllOpen(false)}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />
          <div className="relative w-full max-w-lg bg-black border border-white/10 shadow-2xl animate-fade-in">
            <div className="p-6 md:p-7 border-b border-white/5 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 border border-red-500/30 bg-red-950/20 flex items-center justify-center text-red-400">
                  <AlertTriangle size={18} />
                </div>
                <div>
                  <h3 className="text-lg font-black uppercase italic tracking-tighter">Remove all slots?</h3>
                  <p className="text-xs text-zinc-500 mt-1">
                    This will permanently delete <span className="text-white font-bold">{masterSlots.filter(s => s.gameId === selectedAdminGame).length}</span> slot(s)
                    for <span className="text-white font-bold">{games.find(g => g.id === selectedAdminGame)?.name || 'this game'}</span>.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRemoveAllOpen(false)}
                className="text-zinc-500 hover:text-white"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 md:p-7 space-y-3">
              <div className="bg-zinc-900/40 border border-white/5 p-4 text-sm text-zinc-300">
                - This action can’t be undone.<br />
                - If you want to regenerate slots, use <span className="text-white font-bold">Generate Slots</span> instead.
              </div>
            </div>

            <div className="p-6 md:p-7 border-t border-white/5 flex flex-col-reverse sm:flex-row gap-3 justify-end">
              <button
                type="button"
                onClick={() => setIsRemoveAllOpen(false)}
                className="border border-white/10 text-white px-5 py-3 text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmRemoveAllSlotsForGame}
                className="border border-red-500/40 bg-red-600 text-white px-5 py-3 text-xs font-bold uppercase tracking-widest hover:bg-red-700 transition-colors"
              >
                Yes, remove all
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="md:hidden h-16 bg-black border-b border-white/10 flex items-center px-4 justify-between">
        <span className="font-bold italic tracking-tighter">ADMIN DASHBOARD</span>
        <button onClick={() => setIsSidebarOpen(true)}><Menu /></button>
      </div>

      <div className="w-64 border-r border-white/5 bg-black hidden md:block relative">
        <SidebarContent />
      </div>

      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 bg-black md:hidden animate-slide-in-left">
          <SidebarContent />
        </div>
      )}

      <div className="flex-1 p-4 md:p-8 overflow-y-auto">
        <h1 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter mb-8">
          {activeTab === 'checkin'
            ? 'Ground Check-In'
            : activeTab === 'scan'
              ? 'Scan QR'
            : activeTab === 'analytics'
              ? 'Analytics'
              : activeTab === 'catalog'
                ? 'Catalog'
              : activeTab === 'slots'
                ? 'Manage Availability'
                : activeTab === 'bookings'
                  ? 'Booking Registry'
                  : 'Facility Closure'}
        </h1>

        {activeTab === 'analytics' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard label="Total Revenue" value={`€${totalRevenue}`} icon={<DollarSign size={18} />} />
              <StatCard label="Total Bookings" value={allBookings.length} icon={<TrendingUp size={18} />} />
              <StatCard label="Active (non-cancelled)" value={nonCancelledBookings.length} icon={<CheckCircle size={18} />} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <MiniBarChart data={revenueByDate.length ? revenueByDate : [{ label: '—', value: 0 }]} />
              </div>
              <StatusBreakdown />
            </div>

            <TopGames />
          </div>
        )}

        {activeTab === 'catalog' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Categories */}
            <div className="lg:col-span-5 bg-black border border-white/10 p-6 md:p-7">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black uppercase italic tracking-tighter">Categories</h3>
                <button
                  type="button"
                  onClick={refreshCatalogFromServer}
                  className="bg-white/10 border border-white/10 px-4 py-2 text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-colors inline-flex items-center gap-2"
                  disabled={!apiBaseUrl}
                >
                  <RefreshCcw size={14} /> Refresh
                </button>
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!apiBaseUrl || !adminToken) {
                    setNotification({ type: 'error', title: 'Not Authenticated', message: 'Please log in as admin.' });
                    return;
                  }
                  const name = newCategoryName.trim();
                  if (!name) return;
                  try {
                    await api.admin.createCategory(apiBaseUrl, adminToken, { name });
                    setNewCategoryName('');
                    await refreshCatalogFromServer();
                    setNotification({ type: 'success', title: 'Created', message: 'Category created.' });
                  } catch (err: any) {
                    setNotification({ type: 'error', title: 'Failed', message: err?.message || 'Could not create category.' });
                  }
                }}
                className="flex gap-3 mb-6"
              >
                <input
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g. Football"
                  className="flex-1 bg-zinc-900 border border-zinc-700 px-4 py-3 text-white outline-none focus:border-white text-sm"
                />
                <button className="bg-white text-black px-5 py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200">
                  Add
                </button>
              </form>

              <div className="space-y-3">
                {categories.map((c) => {
                  const isEditing = editCategoryId === c.id;
                  return (
                    <div key={c.id} className="border border-white/10 bg-zinc-950 p-4 flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-1">Category</div>
                        {isEditing ? (
                          <input
                            value={editCategoryName}
                            onChange={(e) => setEditCategoryName(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-700 px-3 py-2 text-white outline-none focus:border-white text-sm"
                          />
                        ) : (
                          <div className="text-white font-bold">{c.name}</div>
                        )}
                        <div className="text-[10px] text-zinc-600 font-mono mt-2 break-all">{c.id}</div>
                      </div>
                      <div className="flex flex-col gap-2 items-end">
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              onClick={async () => {
                                if (!apiBaseUrl || !adminToken) return;
                                try {
                                  await api.admin.updateCategory(apiBaseUrl, adminToken, c.id, { name: editCategoryName.trim() });
                                  setEditCategoryId(null);
                                  setEditCategoryName('');
                                  await refreshCatalogFromServer();
                                  setNotification({ type: 'success', title: 'Saved', message: 'Category updated.' });
                                } catch (err: any) {
                                  setNotification({ type: 'error', title: 'Failed', message: err?.message || 'Could not update category.' });
                                }
                              }}
                              className="px-3 py-2 text-xs font-bold uppercase tracking-widest border border-white text-white hover:bg-white hover:text-black transition-colors"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => { setEditCategoryId(null); setEditCategoryName(''); }}
                              className="px-3 py-2 text-xs font-bold uppercase tracking-widest border border-zinc-800 text-zinc-500 hover:border-zinc-500 transition-colors"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => { setEditCategoryId(c.id); setEditCategoryName(c.name); }}
                              className="px-3 py-2 text-xs font-bold uppercase tracking-widest border border-white/10 text-white hover:bg-white hover:text-black transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                if (!apiBaseUrl || !adminToken) return;
                                openConfirm({
                                  title: 'Delete category?',
                                  message: `This will permanently delete "${c.name}". You must delete its games first.`,
                                  confirmLabel: 'Yes, delete',
                                  tone: 'danger',
                                  onConfirm: async () => {
                                    try {
                                      await api.admin.deleteCategory(apiBaseUrl, adminToken, c.id);
                                      await refreshCatalogFromServer();
                                      setNotification({ type: 'info', title: 'Deleted', message: 'Category deleted.' });
                                    } catch (err: any) {
                                      setNotification({ type: 'error', title: 'Failed', message: err?.message || 'Could not delete category.' });
                                    }
                                  },
                                });
                              }}
                              className="px-3 py-2 text-xs font-bold uppercase tracking-widest border border-zinc-800 text-zinc-500 hover:text-red-500 hover:border-red-500 transition-colors"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
                {categories.length === 0 && <div className="text-zinc-600 italic text-sm">No categories.</div>}
              </div>
            </div>

            {/* Games */}
            <div className="lg:col-span-7 bg-black border border-white/10 p-6 md:p-7">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black uppercase italic tracking-tighter">Games (slot types)</h3>
                <div className="text-[10px] text-zinc-600 uppercase tracking-widest">5v5 / 7v7 / etc.</div>
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!apiBaseUrl || !adminToken) {
                    setNotification({ type: 'error', title: 'Not Authenticated', message: 'Please log in as admin.' });
                    return;
                  }
                  const name = newGameName.trim();
                  const categoryId = (newGameCategoryId || categories[0]?.id || '').trim();
                  if (!name || !categoryId) return;
                  try {
                    await api.admin.createGame(apiBaseUrl, adminToken, { categoryId, name });
                    setNewGameName('');
                    setNewGameCategoryId('');
                    await refreshCatalogFromServer();
                    setNotification({ type: 'success', title: 'Created', message: 'Game created.' });
                  } catch (err: any) {
                    setNotification({ type: 'error', title: 'Failed', message: err?.message || 'Could not create game.' });
                  }
                }}
                className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-6"
              >
                <select
                  value={newGameCategoryId || categories[0]?.id || ''}
                  onChange={(e) => setNewGameCategoryId(e.target.value)}
                  className="md:col-span-4 bg-zinc-900 border border-zinc-700 px-4 py-3 text-white outline-none focus:border-white text-sm"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <input
                  value={newGameName}
                  onChange={(e) => setNewGameName(e.target.value)}
                  placeholder="e.g. 5v5 Football"
                  className="md:col-span-6 bg-zinc-900 border border-zinc-700 px-4 py-3 text-white outline-none focus:border-white text-sm"
                />
                <button className="md:col-span-2 bg-white text-black px-5 py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200">
                  Add
                </button>
              </form>

              <div className="space-y-3">
                {games
                  .slice()
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((g) => {
                    const isEditing = editGameId === g.id;
                    const catName = categories.find((c) => c.id === g.categoryId)?.name || '—';
                    return (
                      <div key={g.id} className="border border-white/10 bg-zinc-950 p-4 flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-white font-bold truncate">{isEditing ? editGameName : g.name}</div>
                            <div className="text-[10px] text-zinc-500 uppercase tracking-widest whitespace-nowrap">{catName}</div>
                          </div>

                          {isEditing && (
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mt-3">
                              <select
                                value={editGameCategoryId}
                                onChange={(e) => setEditGameCategoryId(e.target.value)}
                                className="md:col-span-5 bg-zinc-900 border border-zinc-700 px-3 py-2 text-white outline-none focus:border-white text-sm"
                              >
                                {categories.map((c) => (
                                  <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                              </select>
                              <input
                                value={editGameName}
                                onChange={(e) => setEditGameName(e.target.value)}
                                className="md:col-span-7 bg-zinc-900 border border-zinc-700 px-3 py-2 text-white outline-none focus:border-white text-sm"
                              />
                            </div>
                          )}

                          <div className="text-[10px] text-zinc-600 font-mono mt-2 break-all">{g.id}</div>
                        </div>

                        <div className="flex flex-col gap-2 items-end">
                          {isEditing ? (
                            <>
                              <button
                                type="button"
                                onClick={async () => {
                                  if (!apiBaseUrl || !adminToken) return;
                                  try {
                                    await api.admin.updateGame(apiBaseUrl, adminToken, g.id, {
                                      name: editGameName.trim(),
                                      categoryId: editGameCategoryId,
                                    });
                                    setEditGameId(null);
                                    setEditGameName('');
                                    setEditGameCategoryId('');
                                    await refreshCatalogFromServer();
                                    setNotification({ type: 'success', title: 'Saved', message: 'Game updated.' });
                                  } catch (err: any) {
                                    setNotification({ type: 'error', title: 'Failed', message: err?.message || 'Could not update game.' });
                                  }
                                }}
                                className="px-3 py-2 text-xs font-bold uppercase tracking-widest border border-white text-white hover:bg-white hover:text-black transition-colors"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => { setEditGameId(null); setEditGameName(''); setEditGameCategoryId(''); }}
                                className="px-3 py-2 text-xs font-bold uppercase tracking-widest border border-zinc-800 text-zinc-500 hover:border-zinc-500 transition-colors"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditGameId(g.id);
                                  setEditGameName(g.name);
                                  setEditGameCategoryId(g.categoryId);
                                }}
                                className="px-3 py-2 text-xs font-bold uppercase tracking-widest border border-white/10 text-white hover:bg-white hover:text-black transition-colors"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  if (!apiBaseUrl || !adminToken) return;
                                  openConfirm({
                                    title: 'Delete game?',
                                    message: `This will permanently delete "${g.name}". You must delete its slots first.`,
                                    confirmLabel: 'Yes, delete',
                                    tone: 'danger',
                                    onConfirm: async () => {
                                      try {
                                        await api.admin.deleteGame(apiBaseUrl, adminToken, g.id);
                                        await refreshCatalogFromServer();
                                        setNotification({ type: 'info', title: 'Deleted', message: 'Game deleted.' });
                                      } catch (err: any) {
                                        setNotification({ type: 'error', title: 'Failed', message: err?.message || 'Could not delete game.' });
                                      }
                                    },
                                  });
                                }}
                                className="px-3 py-2 text-xs font-bold uppercase tracking-widest border border-zinc-800 text-zinc-500 hover:text-red-500 hover:border-red-500 transition-colors"
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                {games.length === 0 && <div className="text-zinc-600 italic text-sm">No games.</div>}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'scan' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 bg-zinc-950 border border-white/10 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Camera size={16} className="text-zinc-400" />
                  <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Camera</span>
                </div>
                <button
                  type="button"
                  onClick={() => startScanner()}
                  className="bg-white/10 border border-white/10 px-4 py-2 text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-colors inline-flex items-center gap-2"
                  disabled={!apiBaseUrl || !adminToken}
                >
                  <RefreshCcw size={14} /> Scan again
                </button>
              </div>

              <div className="p-5">
                <div id={scanReaderId} className="w-full" />
                <div className="text-[10px] text-zinc-500 mt-3 uppercase tracking-widest">
                  Tip: allow camera permission. Use the rear camera for best results.
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 space-y-6">
              <div className={`border ${scanColors.border} ${scanColors.bg} rounded-2xl p-5`}>
                <div className="flex items-start gap-3">
                  {scanStatus === 'VALID' ? (
                    <CheckCircle className="text-green-400 mt-0.5" />
                  ) : scanStatus === 'ALREADY_USED' || scanStatus === 'EXPIRED' ? (
                    <AlertTriangle className="text-yellow-300 mt-0.5" />
                  ) : scanStatus === 'INVALID' || scanStatus === 'ERROR' ? (
                    <XCircle className="text-red-400 mt-0.5" />
                  ) : (
                    <QrCode className="text-zinc-400 mt-0.5" />
                  )}
                  <div>
                    <div className={`text-xs font-bold uppercase tracking-widest ${scanColors.text}`}>{scanStatus}</div>
                    <div className="text-sm text-zinc-200 mt-2">{scanMessage}</div>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-900/40 border border-white/10 rounded-2xl p-5">
                <div className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-3">Last scanned</div>
                <div className="font-mono text-xs text-zinc-300 break-all">
                  {scanLast || '—'}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'checkin' && (
          <div className="max-w-xl">
            <div className="bg-black border border-white/10 p-6 md:p-8 text-center mb-8">
              <QrCode size={48} className="mx-auto text-zinc-500 mb-4" />
              <h3 className="text-xl font-bold uppercase italic tracking-tighter mb-2">Scan or Enter ID</h3>
              <p className="text-zinc-500 text-sm mb-6">Enter Order ID from customer&apos;s QR code.</p>
              <form onSubmit={handleCheckIn} className="flex flex-col sm:flex-row gap-4">
                <input autoFocus type="text" placeholder="e.g. BK-1234" value={checkInId} onChange={(e) => setCheckInId(e.target.value)} className="flex-1 bg-zinc-900 border border-zinc-700 p-4 text-white text-center font-mono text-lg uppercase outline-none focus:border-white rounded-none" />
                <button type="submit" className="bg-white text-black px-8 py-4 font-bold uppercase tracking-widest hover:bg-zinc-200">Verify</button>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'slots' && (
          <div>
            {/* Category + Game selector (kept + combined with new UI) */}
            <div className="mb-6 space-y-4">
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide border-b border-white/5">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedAdminCategory(cat.id)}
                    className={`py-3 text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-colors ${selectedAdminCategory === cat.id ? 'text-white' : 'text-zinc-600 hover:text-zinc-300'}`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {games.filter(g => g.categoryId === selectedAdminCategory).map(game => (
                  <button
                    key={game.id}
                    onClick={() => setSelectedAdminGame(game.id)}
                    className={`px-4 py-2 text-xs font-bold uppercase tracking-widest border transition-all whitespace-nowrap ${selectedAdminGame === game.id ? 'bg-white text-black border-white' : 'border-zinc-800 text-zinc-500 hover:border-zinc-500'}`}
                  >
                    {game.name}
                  </button>
                ))}
              </div>
            </div>

            {/* New UI: Slot Generator (left) + Daily Schedule (right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
              {/* Generator */}
              <div className="lg:col-span-4 bg-black border border-white/10 p-6 md:p-7">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-black uppercase italic tracking-tighter">Generator</h3>
                  <div className="w-9 h-9 border border-white/10 flex items-center justify-center text-zinc-400">
                    <Wrench size={16} />
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Select Date</label>
                    <input
                      type="date"
                      value={slotGenDate}
                      min={todayIso}
                      onChange={(e) => {
                        const next = e.target.value;
                        if (next && next < todayIso) {
                          setSlotGenDate(todayIso);
                          setNotification({
                            type: 'error',
                            title: 'Invalid Date',
                            message: 'You cannot select a past date.',
                          });
                          return;
                        }
                        setSlotGenDate(next);
                      }}
                      className="w-full bg-zinc-900 border border-zinc-700 px-4 py-3 text-white outline-none focus:border-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Open Time</label>
                      <select
                        value={genOpenHour}
                        onChange={(e) => setGenOpenHour(parseInt(e.target.value))}
                        className="w-full bg-zinc-900 border border-zinc-700 px-3 py-3 text-white outline-none focus:border-white"
                      >
                        {hours.map(h => (
                          <option key={h} value={h}>{format12Hour(h)}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Close Time</label>
                      <select
                        value={genCloseHour}
                        onChange={(e) => setGenCloseHour(parseInt(e.target.value))}
                        className="w-full bg-zinc-900 border border-zinc-700 px-3 py-3 text-white outline-none focus:border-white"
                      >
                        {hours.map(h => (
                          <option key={h} value={h}>{format12Hour(h)}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Slot Duration (Minutes)</label>
                    <div className="grid grid-cols-3 gap-3">
                      {[60, 90, 120].map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setGenDurationMins(m as 60 | 90 | 120)}
                          className={`py-3 text-xs font-bold uppercase tracking-widest border transition-colors ${genDurationMins === m ? 'bg-white text-black border-white' : 'border-zinc-800 text-zinc-500 hover:border-zinc-500'}`}
                        >
                          {m}m
                        </button>
                      ))}
                    </div>
                    {genDurationMins === 90 && (
                      <p className="text-[10px] text-red-400 mt-2">90m generation is disabled for now (hour-based slots).</p>
                    )}
                  </div>

                  <div className="border-t border-white/5 pt-5">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Pricing Strategy</h4>
                      <span className="text-[10px] text-zinc-600">Peak from {format12Hour(genPeakStartHour)}</span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 px-4 py-3">
                        <span className="text-zinc-500 text-xs font-bold uppercase">Day</span>
                        <input
                          type="number"
                          value={genDayPrice}
                          onChange={(e) => setGenDayPrice(parseFloat(e.target.value))}
                          className="ml-auto bg-transparent w-24 text-right font-mono text-white outline-none"
                        />
                      </div>
                      <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 px-4 py-3">
                        <span className="text-zinc-500 text-xs font-bold uppercase">Peak</span>
                        <input
                          type="number"
                          value={genPeakPrice}
                          onChange={(e) => setGenPeakPrice(parseFloat(e.target.value))}
                          className="ml-auto bg-transparent w-24 text-right font-mono text-white outline-none"
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs text-zinc-500">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={genReplaceExisting}
                            onChange={(e) => setGenReplaceExisting(e.target.checked)}
                            className="w-4 h-4 accent-white"
                          />
                          Replace existing slots
                        </label>
                        <select
                          value={genPeakStartHour}
                          onChange={(e) => setGenPeakStartHour(parseInt(e.target.value))}
                          className="bg-zinc-900 border border-zinc-800 px-2 py-1 text-white outline-none"
                        >
                          {hours.map(h => (
                            <option key={h} value={h}>{format12Hour(h)}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleGenerateSlots}
                    className="w-full bg-white text-black px-6 py-4 font-bold uppercase tracking-widest text-xs hover:bg-zinc-200 transition-colors"
                  >
                    + Generate Slots
                  </button>
                </div>
              </div>

              {/* Daily Schedule */}
              <div className="lg:col-span-8 bg-black border border-white/10 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
                  <div>
                    <h3 className="text-lg font-black tracking-tight">Daily Schedule</h3>
                    <p className="text-xs text-zinc-500 mt-1">
                      {masterSlots.filter(s => s.gameId === selectedAdminGame).length} slots •{' '}
                      {allBookings.filter(b => b.date === slotGenDate && b.gameId === selectedAdminGame && b.status !== 'Cancelled').length} booked
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleRemoveAllSlotsForGame}
                      disabled={masterSlots.filter(s => s.gameId === selectedAdminGame).length === 0}
                      className="border border-red-500/40 text-red-400 px-4 py-2 text-xs font-bold uppercase tracking-widest hover:border-red-500 hover:text-red-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Remove All
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveSlotChanges}
                      className="bg-white/10 border border-white/10 text-white px-4 py-2 text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-colors"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {masterSlots
                      .filter(s => {
                        if (s.gameId !== selectedAdminGame) return false;
                        // For "today", hide past-hour slots to avoid confusion (schedule is hour-based).
                        if (isTodaySelected && s.startHour <= currentHour) return false;
                        return true;
                      })
                      .sort((a, b) => a.startHour - b.startHour)
                      .map((slot) => {
                        const booked = allBookings.some(b =>
                          b.date === slotGenDate &&
                          b.gameId === selectedAdminGame &&
                          b.status !== 'Cancelled' &&
                          b.slots.includes(slot.time)
                        );
                        return (
                          <div
                            key={slot.id}
                            className={`border p-4 flex items-start justify-between gap-4 ${booked ? 'border-red-500/30 bg-red-950/10' : slot.active ? 'border-white/10 bg-zinc-950' : 'border-zinc-800 bg-zinc-950/40 opacity-75'}`}
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <span className={`w-2 h-2 rounded-full ${booked ? 'bg-red-500' : slot.active ? 'bg-green-500' : 'bg-zinc-600'}`} />
                                <div className="text-sm font-bold italic text-white truncate">{slot.time}</div>
                              </div>
                              <div className="text-xs text-zinc-500">
                                {booked ? 'BOOKED' : slot.active ? 'OPEN' : 'DISABLED'}
                              </div>
                              <div className="mt-3 flex items-center gap-2">
                                <span className="text-zinc-500 text-xs">€</span>
                                <input
                                  type="number"
                                  value={slot.price}
                                  onChange={(e) => updatePrice(slot.id, e.target.value)}
                                  className="bg-transparent border border-white/10 px-3 py-2 w-28 font-mono text-sm text-white outline-none focus:border-white"
                                />
                              </div>
                            </div>

                            <div className="flex flex-col gap-2 items-end">
                              <button
                                type="button"
                                disabled={booked}
                                onClick={() => toggleSlotStatus(slot.id)}
                                className={`px-3 py-2 text-xs font-bold uppercase tracking-widest border transition-colors ${slot.active ? 'border-white text-white hover:bg-white hover:text-black' : 'border-zinc-800 text-zinc-500 hover:border-zinc-500'} ${booked ? 'opacity-40 cursor-not-allowed' : ''}`}
                              >
                                {slot.active ? 'Active' : 'Disabled'}
                              </button>
                              <button
                                type="button"
                                disabled={booked}
                                onClick={() => handleDeleteSlot(slot.id)}
                                className={`px-3 py-2 text-xs font-bold uppercase tracking-widest border border-zinc-800 text-zinc-500 hover:text-red-500 hover:border-red-500 transition-colors ${booked ? 'opacity-40 cursor-not-allowed' : ''}`}
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  {masterSlots.filter(s => {
                    if (s.gameId !== selectedAdminGame) return false;
                    if (isTodaySelected && s.startHour <= currentHour) return false;
                    return true;
                  }).length === 0 && (
                    <div className="text-zinc-500 italic text-sm py-10 text-center">
                      {isTodaySelected
                        ? 'No future slots for today — adjust open/close time or pick a future date.'
                        : 'No slots for this game yet — use the Generator to create them.'}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Keep existing manual slot creation + list (advanced) */}
            <details className="bg-black border border-white/10 p-6 md:p-8 mb-6">
              <summary className="cursor-pointer text-sm font-bold uppercase tracking-widest text-zinc-300 flex items-center gap-2">
                <Clock size={16} />
                Advanced: Add Slot Manually
              </summary>

              <form onSubmit={addSlot} className="space-y-6 mt-6">
                {/* Time Format Selection */}
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Time Format</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="timeFormat"
                        value="12h"
                        checked={slotFormData.timeFormat === '12h'}
                        onChange={(e) => setSlotFormData({ ...slotFormData, timeFormat: e.target.value })}
                        className="w-4 h-4 accent-white"
                      />
                      <span className="text-sm text-zinc-300">12-hour (AM/PM)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="timeFormat"
                        value="24h"
                        checked={slotFormData.timeFormat === '24h'}
                        onChange={(e) => setSlotFormData({ ...slotFormData, timeFormat: e.target.value })}
                        className="w-4 h-4 accent-white"
                      />
                      <span className="text-sm text-zinc-300">24-hour</span>
                    </label>
                  </div>
                </div>

                {/* Time Selection */}
                {slotFormData.timeFormat === '12h' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">
                        Start Time
                      </label>
                      <div className="flex gap-2">
                        <input
                          name="startHour"
                          type="number"
                          placeholder="6"
                          required
                          min="1"
                          max="12"
                          value={slotFormData.startHour}
                          onChange={(e) => setSlotFormData({ ...slotFormData, startHour: e.target.value })}
                          className="flex-1 bg-zinc-900 border border-zinc-700 p-3 text-white outline-none focus:border-white transition-colors text-center font-mono text-lg"
                        />
                        <select
                          value={slotFormData.startPeriod}
                          onChange={(e) => setSlotFormData({ ...slotFormData, startPeriod: e.target.value as 'AM' | 'PM' })}
                          className="bg-zinc-900 border border-zinc-700 p-3 text-white outline-none focus:border-white transition-colors font-bold uppercase text-sm"
                        >
                          <option value="AM">AM</option>
                          <option value="PM">PM</option>
                        </select>
                      </div>
                      <p className="text-[10px] text-zinc-600 mt-1.5">1-12 (12-hour format)</p>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">
                        End Time
                      </label>
                      <div className="flex gap-2">
                        <input
                          name="endHour"
                          type="number"
                          placeholder="7"
                          required
                          min="1"
                          max="12"
                          value={slotFormData.endHour}
                          onChange={(e) => setSlotFormData({ ...slotFormData, endHour: e.target.value })}
                          className="flex-1 bg-zinc-900 border border-zinc-700 p-3 text-white outline-none focus:border-white transition-colors text-center font-mono text-lg"
                        />
                        <select
                          value={slotFormData.endPeriod}
                          onChange={(e) => setSlotFormData({ ...slotFormData, endPeriod: e.target.value as 'AM' | 'PM' })}
                          className="bg-zinc-900 border border-zinc-700 p-3 text-white outline-none focus:border-white transition-colors font-bold uppercase text-sm"
                        >
                          <option value="AM">AM</option>
                          <option value="PM">PM</option>
                        </select>
                      </div>
                      <p className="text-[10px] text-zinc-600 mt-1.5">1-12 (must be after start)</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">
                        Start Time
                      </label>
                      <input
                        name="startHour"
                        type="number"
                        placeholder="18"
                        required
                        min="0"
                        max="23"
                        value={slotFormData.startHour}
                        onChange={(e) => setSlotFormData({ ...slotFormData, startHour: e.target.value })}
                        className="w-full bg-zinc-900 border border-zinc-700 p-3 text-white outline-none focus:border-white transition-colors text-center font-mono text-lg"
                      />
                      <p className="text-[10px] text-zinc-600 mt-1.5">
                        0-23 (24-hour format)
                        {slotFormData.startHour && !isNaN(parseInt(slotFormData.startHour)) && (
                          <span className="ml-2 text-zinc-500">
                            = {formatTimeRange(parseInt(slotFormData.startHour), parseInt(slotFormData.startHour) + 1).split(' - ')[0]}
                          </span>
                        )}
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">
                        End Time
                      </label>
                      <input
                        name="endHour"
                        type="number"
                        placeholder="19"
                        required
                        min="0"
                        max="23"
                        value={slotFormData.endHour}
                        onChange={(e) => setSlotFormData({ ...slotFormData, endHour: e.target.value })}
                        className="w-full bg-zinc-900 border border-zinc-700 p-3 text-white outline-none focus:border-white transition-colors text-center font-mono text-lg"
                      />
                      <p className="text-[10px] text-zinc-600 mt-1.5">
                        0-23 (must be after start)
                        {slotFormData.endHour && !isNaN(parseInt(slotFormData.endHour)) && (
                          <span className="ml-2 text-zinc-500">
                            = {formatTimeRange(parseInt(slotFormData.endHour), parseInt(slotFormData.endHour) + 1).split(' - ')[0]}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                )}

                {/* Preview */}
                <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded">
                  <p className="text-xs text-zinc-500 uppercase tracking-widest mb-2">Live Preview</p>
                  {slotFormData.startHour && slotFormData.endHour ? (
                    <div className="space-y-2">
                      <p className="text-lg font-mono text-white">
                        {slotFormData.timeFormat === '12h'
                          ? `${slotFormData.startHour}:00 ${slotFormData.startPeriod} - ${slotFormData.endHour}:00 ${slotFormData.endPeriod}`
                          : formatTimeRange24(
                            slotFormData.timeFormat === '12h'
                              ? convertTo24Hour(parseInt(slotFormData.startHour), slotFormData.startPeriod)
                              : parseInt(slotFormData.startHour),
                            slotFormData.timeFormat === '12h'
                              ? convertTo24Hour(parseInt(slotFormData.endHour), slotFormData.endPeriod)
                              : parseInt(slotFormData.endHour)
                          )
                        }
                      </p>
                      <p className="text-xs text-zinc-500">
                        Duration: {
                          slotFormData.timeFormat === '12h'
                            ? convertTo24Hour(parseInt(slotFormData.endHour), slotFormData.endPeriod) - convertTo24Hour(parseInt(slotFormData.startHour), slotFormData.startPeriod)
                            : parseInt(slotFormData.endHour) - parseInt(slotFormData.startHour)
                        } hour(s)
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm font-mono text-zinc-500">Enter start and end times to see preview</p>
                  )}
                </div>

                {/* Price */}
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">
                    Price (€)
                  </label>
                  <div className="flex items-center">
                    <span className="text-zinc-500 mr-3 font-mono text-lg">€</span>
                    <input
                      name="price"
                      type="number"
                      placeholder="60"
                      required
                      min="0.01"
                      max="10000"
                      step="0.01"
                      className="flex-1 bg-zinc-900 border border-zinc-700 p-3 text-white outline-none focus:border-white transition-colors font-mono text-lg"
                    />
                  </div>
                  <p className="text-[10px] text-zinc-600 mt-1.5">Price in euros (€0.01 - €10,000)</p>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full bg-white text-black px-6 py-3 font-bold uppercase text-xs tracking-widest hover:bg-zinc-200 transition-colors"
                >
                  Add Slot
                </button>
              </form>
            </details>
          </div>
        )}

        {activeTab === 'bookings' && (
          <div className="bg-black border border-white/10 overflow-x-auto">
            <table className="w-full text-left min-w-[800px]">
              <thead className="bg-zinc-900 text-xs font-bold uppercase tracking-widest text-zinc-500">
                <tr>
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Game</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Time</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm font-mono text-zinc-300">
                {allBookings.map(b => (
                  <tr key={b.id} className="hover:bg-zinc-900/30 transition-colors">
                    <td className="px-6 py-4 text-white font-bold">{b.id}</td>
                    <td className="px-6 py-4 text-zinc-400">{b.gameName}</td>
                    <td className="px-6 py-4">{b.date}</td>
                    <td className="px-6 py-4">{b.slots.join(', ')}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-bold uppercase tracking-widest px-2 py-1 border ${b.status === 'Checked In' ? 'border-green-500 text-green-500 bg-green-500/10' :
                        b.status === 'Cancelled' ? 'border-red-500 text-red-500 bg-red-500/10' :
                          'border-zinc-500 text-zinc-500'
                        }`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {b.status === 'Confirmed' && (
                          <>
                            <button
                              onClick={() => handleStatusChange(b.id, 'Checked In')}
                              className="bg-white text-black p-2 hover:bg-zinc-200"
                              title="Check In"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              onClick={() => handleStatusChange(b.id, 'Cancelled')}
                              className="border border-zinc-700 text-zinc-500 p-2 hover:text-red-500 hover:border-red-500"
                              title="Cancel Booking"
                            >
                              <XCircle size={14} />
                            </button>
                          </>
                        )}
                        {b.status === 'Checked In' && (
                          <button className="text-green-500 cursor-default p-2"><CheckCircle size={14} /></button>
                        )}
                        {b.status === 'Cancelled' && (
                          <button
                            onClick={() => handleDeleteBooking(b.id)}
                            className="text-red-900 hover:text-red-600 p-2"
                            title="Delete Record"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {allBookings.length === 0 && <tr><td colSpan={6} className="px-6 py-8 text-center text-zinc-600 italic">No active bookings</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'closures' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-black border border-white/10 p-6 md:p-8">
              <h3 className="text-xl font-bold uppercase italic tracking-tighter mb-6 flex items-center"><Wrench size={20} className="mr-2" /> Report Closure</h3>
              <form onSubmit={addClosure} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Closure Type</label>
                  <div className="flex gap-4">
                    <button type="button" onClick={() => setClosureForm({ ...closureForm, type: 'full' })} className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest border ${closureForm.type === 'full' ? 'bg-white text-black border-white' : 'border-zinc-700 text-zinc-500'}`}>Full Day</button>
                    <button type="button" onClick={() => setClosureForm({ ...closureForm, type: 'partial' })} className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest border ${closureForm.type === 'partial' ? 'bg-white text-black border-white' : 'border-zinc-700 text-zinc-500'}`}>Partial</button>
                  </div>
                </div>
                <div><label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Date</label><input required type="date" min={todayIso} value={closureForm.date} onChange={e => setClosureForm({ ...closureForm, date: e.target.value })} className="w-full bg-zinc-900 border border-zinc-700 p-3 text-white outline-none" /></div>
                {closureForm.type === 'partial' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Start (24h)</label><input type="number" min="0" max="23" value={closureForm.startHour} onChange={e => setClosureForm({ ...closureForm, startHour: parseInt(e.target.value) })} className="w-full bg-zinc-900 border border-zinc-700 p-3 text-white outline-none" /></div>
                    <div><label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">End (24h)</label><input type="number" min="0" max="23" value={closureForm.endHour} onChange={e => setClosureForm({ ...closureForm, endHour: parseInt(e.target.value) })} className="w-full bg-zinc-900 border border-zinc-700 p-3 text-white outline-none" /></div>
                  </div>
                )}
                <div><label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Reason</label><select value={closureForm.reason} onChange={e => setClosureForm({ ...closureForm, reason: e.target.value })} className="w-full bg-zinc-900 border border-zinc-700 p-3 text-white outline-none"><option>Maintenance</option><option>Holiday</option><option>Weather</option><option>Private Event</option><option>Other</option></select></div>
                <div><label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Note</label><input type="text" placeholder="Optional details..." value={closureForm.note} onChange={e => setClosureForm({ ...closureForm, note: e.target.value })} className="w-full bg-zinc-900 border border-zinc-700 p-3 text-white outline-none" /></div>
                <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-widest py-4 transition-colors">Activate Closure</button>
              </form>
            </div>
            <div className="bg-zinc-900/50 p-6 border border-white/5">
              <h3 className="text-sm font-bold uppercase tracking-widest mb-6">Active Closures</h3>
              <div className="space-y-4">
                {closures.map(c => (
                  <div key={c.id} className="bg-black border border-red-900/50 p-4 flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1"><span className="text-red-500 font-bold text-sm uppercase">{c.date}</span><span className="text-xs bg-zinc-800 px-2 py-0.5 rounded text-zinc-400 uppercase">{c.type}</span></div>
                      <p className="text-white font-medium text-sm">{c.reason}</p>
                      {c.type === 'partial' && <p className="text-zinc-500 text-xs mt-1">{c.startHour}:00 - {c.endHour}:00</p>}
                    </div>
                    <button onClick={() => deleteClosure(c.id)} className="text-zinc-600 hover:text-red-500"><Trash2 size={16} /></button>
                  </div>
                ))}
                {closures.length === 0 && <p className="text-zinc-500 italic text-sm">No active closures.</p>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

