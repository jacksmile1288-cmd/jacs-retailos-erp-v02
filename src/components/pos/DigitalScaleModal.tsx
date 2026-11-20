import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Product } from '../../types';
import {
  Scale,
  Usb,
  Unplug,
  X,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Maximize2,
  Sparkles,
  Keyboard,
} from 'lucide-react';

interface SerialPortLike {
  open: (options: { baudRate: number }) => Promise<void>;
  close: () => Promise<void>;
  readable?: ReadableStream<Uint8Array> | null;
}

export interface ScaleMeasurementPayload {
  service: Product;
  grossWeightKg: number;
  tareWeightKg: number;
  netWeightKg: number;
  billedWeightKg: number;
  isMinWeightAdjusted: boolean;
  minWeightAppliedKg: number;
}

export interface LaundryAreaPayload {
  service: Product;
  lengthM: number;
  widthM: number;
  areaM2: number;
  billedAreaM2: number;
  isMinAreaAdjusted: boolean;
  minAreaAppliedM2: number;
}

interface DigitalScaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  kiloanServices: Product[];
  initialService?: Product | null;
  initialGrossKg?: number;
  initialTareKg?: number;
  isLight: boolean;
  onApplyWeight: (payload: ScaleMeasurementPayload) => void;
  onScaleLiveUpdate?: (state: { connected: boolean; grossKg: number; tareKg: number; netKg: number }) => void;
}

function parseWeightFromSerialChunk(text: string): number | null {
  if (!text) return null;
  const cleaned = text.replace(/,/g, '.');
  const matches = cleaned.match(/([+-]?\d+(?:\.\d+)?)\s*(?:kg|KG|Kg)?/g);
  if (!matches || matches.length === 0) return null;
  const last = matches[matches.length - 1];
  const numMatch = last.match(/[+-]?\d+(?:\.\d+)?/);
  if (!numMatch) return null;
  const parsed = Math.abs(parseFloat(numMatch[0]));
  if (Number.isNaN(parsed) || !Number.isFinite(parsed)) return null;
  // Filter absurd noise spikes > 500kg
  if (parsed > 500) return null;
  return Number(parsed.toFixed(2));
}

export const DigitalScaleModal: React.FC<DigitalScaleModalProps> = ({
  isOpen,
  onClose,
  kiloanServices,
  initialService,
  initialGrossKg = 0,
  initialTareKg = 0,
  isLight,
  onApplyWeight,
  onScaleLiveUpdate,
}) => {
  const [selectedServiceId, setSelectedServiceId] = useState<string>(
    initialService?.id || kiloanServices[0]?.id || ''
  );
  const [grossWeightKg, setGrossWeightKg] = useState<number>(initialGrossKg);
  const [grossInputStr, setGrossInputStr] = useState<string>(
    initialGrossKg > 0 ? String(initialGrossKg) : ''
  );
  const [tareWeightKg, setTareWeightKg] = useState<number>(initialTareKg);
  const [baudRate, setBaudRate] = useState<number>(9600);
  const [isSerialConnected, setIsSerialConnected] = useState<boolean>(false);
  const [serialStatusMsg, setSerialStatusMsg] = useState<string>(
    'Siap hubungkan timbangan USB/RS232 atau gunakan input HID / manual.'
  );
  const [lastRawSerial, setLastRawSerial] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState<boolean>(false);

  const portRef = useRef<SerialPortLike | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);
  const readingActiveRef = useRef<boolean>(false);
  const hidInputRef = useRef<HTMLInputElement>(null);

  const isWebSerialSupported =
    typeof navigator !== 'undefined' && 'serial' in navigator;

  useEffect(() => {
    if (initialService?.id) {
      setSelectedServiceId(initialService.id);
    } else if (!selectedServiceId && kiloanServices[0]?.id) {
      setSelectedServiceId(kiloanServices[0].id);
    }
  }, [initialService?.id, kiloanServices, selectedServiceId]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        hidInputRef.current?.focus();
        hidInputRef.current?.select();
      }, 60);
    }
  }, [isOpen]);

  const activeService = useMemo(
    () =>
      kiloanServices.find((s) => s.id === selectedServiceId) ||
      kiloanServices[0] ||
      null,
    [kiloanServices, selectedServiceId]
  );

  const minOrderKg = useMemo(() => {
    const val = Number(
      activeService?.minOrderWeightKg ?? activeService?.minOrderQty ?? 2
    );
    return val > 0 ? val : 2;
  }, [activeService]);

  const netWeightKg = useMemo(
    () => Math.max(0, Number((grossWeightKg - tareWeightKg).toFixed(2))),
    [grossWeightKg, tareWeightKg]
  );

  const isMinWeightAdjusted = useMemo(
    () => netWeightKg > 0 && netWeightKg < minOrderKg,
    [netWeightKg, minOrderKg]
  );

  const billedWeightKg = useMemo(() => {
    if (netWeightKg <= 0) return 0;
    return isMinWeightAdjusted ? minOrderKg : netWeightKg;
  }, [netWeightKg, isMinWeightAdjusted, minOrderKg]);

  useEffect(() => {
    onScaleLiveUpdate?.({
      connected: isSerialConnected,
      grossKg: grossWeightKg,
      tareKg: tareWeightKg,
      netKg: netWeightKg,
    });
  }, [isSerialConnected, grossWeightKg, tareWeightKg, netWeightKg, onScaleLiveUpdate]);

  const disconnectSerial = async () => {
    readingActiveRef.current = false;
    try {
      if (readerRef.current) {
        await readerRef.current.cancel();
        readerRef.current.releaseLock();
        readerRef.current = null;
      }
    } catch {}
    try {
      if (portRef.current) {
        await portRef.current.close();
        portRef.current = null;
      }
    } catch {}
    setIsSerialConnected(false);
  };

  useEffect(() => {
    return () => {
      void disconnectSerial();
    };
  }, []);

  const handleConnectSerial = async () => {
    if (!isWebSerialSupported) {
      setSerialStatusMsg(
        'Browser/iframe tidak mendukung Web Serial API langsung. Gunakan Input HID USB atau Input Manual Desimal di bawah.'
      );
      return;
    }
    setIsConnecting(true);
    try {
      const serialApi = (navigator as unknown as {
        serial: { requestPort: (opts?: { filters: unknown[] }) => Promise<SerialPortLike> };
      }).serial;
      const port = await serialApi.requestPort({ filters: [] });
      await port.open({ baudRate });
      portRef.current = port;
      setIsSerialConnected(true);
      setSerialStatusMsg(`Terhubung ke timbangan serial (${baudRate} bps) — membaca data live...`);
      readingActiveRef.current = true;

      if (port.readable) {
        const reader = port.readable.getReader();
        readerRef.current = reader;
        const decoder = new TextDecoder();
        let buffer = '';

        void (async () => {
          try {
            while (readingActiveRef.current) {
              const { value, done } = await reader.read();
              if (done) break;
              if (value) {
                const chunk = decoder.decode(value, { stream: true });
                buffer += chunk;
                const lines = buffer.split(/[\r\n]+/);
                buffer = lines.pop() || '';
                for (const line of lines) {
                  const trimmed = line.trim();
                  if (!trimmed) continue;
                  setLastRawSerial(trimmed);
                  const w = parseWeightFromSerialChunk(trimmed);
                  if (w !== null) {
                    setGrossWeightKg(w);
                    setGrossInputStr(w.toFixed(2));
                  }
                }
              }
            }
          } catch (readErr: unknown) {
            if (readingActiveRef.current) {
              const msg = readErr instanceof Error ? readErr.message : 'Koneksi serial terputus';
              setSerialStatusMsg(`Pembacaan serial berhenti: ${msg}`);
            }
          } finally {
            setIsSerialConnected(false);
          }
        })();
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Akses port serial dibatalkan atau diblokir oleh kebijakan iframe.';
      setSerialStatusMsg(
        `Web Serial tidak dapat dibuka (${msg}). Silakan gunakan Input HID / Manual Desimal.`
      );
      setIsSerialConnected(false);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleManualGrossChange = (rawVal: string) => {
    setGrossInputStr(rawVal);
    const cleaned = rawVal.replace(',', '.');
    const parsed = parseFloat(cleaned);
    if (!Number.isNaN(parsed) && parsed >= 0) {
      setGrossWeightKg(Number(parsed.toFixed(2)));
    } else if (rawVal.trim() === '') {
      setGrossWeightKg(0);
    }
  };

  const handleSetTareFromCurrent = () => {
    setTareWeightKg(grossWeightKg);
  };

  const handleApply = () => {
    if (!activeService || billedWeightKg <= 0) return;
    onApplyWeight({
      service: activeService,
      grossWeightKg,
      tareWeightKg,
      netWeightKg,
      billedWeightKg,
      isMinWeightAdjusted,
      minWeightAppliedKg: minOrderKg,
    });
    onClose();
  };

  if (!isOpen) return null;

  const estimatedSubtotal = activeService
    ? Math.round(billedWeightKg * (activeService.sell_price || 0))
    : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[92vh] ${
          isLight
            ? 'bg-white border-cyan-500/60 text-slate-900'
            : 'bg-slate-900 border-cyan-500/40 text-slate-100'
        }`}
      >
        {/* Header */}
        <div
          className={`px-5 py-3.5 border-b flex items-center justify-between ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/70 border-slate-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/40 flex items-center justify-center text-cyan-500">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <span>Timbangan Digital Laundry</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono border ${
                    isSerialConnected
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/40'
                      : 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-300 border-cyan-500/30'
                  }`}
                >
                  {isSerialConnected ? '● SERIAL LIVE' : 'HID + MANUAL READY'}
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Web Serial (USB/RS232) • Input HID Desimal • Tare Keranjang • Auto Minimum Order
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* 1. Web Serial API Connection Bar */}
          <div
            className={`p-3 rounded-xl border space-y-2 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/70 border-slate-800'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-medium">
                <Usb className="w-4 h-4 text-cyan-500" />
                <span>Koneksi Timbangan Serial (USB / RS232)</span>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={baudRate}
                  disabled={isSerialConnected}
                  onChange={(e) => setBaudRate(Number(e.target.value))}
                  className={`px-2 py-1 rounded-lg border text-[11px] font-mono outline-none ${
                    isLight
                      ? 'bg-white border-slate-300 text-slate-800'
                      : 'bg-slate-900 border-slate-700 text-slate-200'
                  }`}
                >
                  <option value={9600}>9600 bps</option>
                  <option value={19200}>19200 bps</option>
                  <option value={38400}>38400 bps</option>
                  <option value={115200}>115200 bps</option>
                </select>
                {isSerialConnected ? (
                  <button
                    type="button"
                    onClick={() => void disconnectSerial()}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                  >
                    <Unplug className="w-3.5 h-3.5" />
                    <span>Putuskan Serial</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isConnecting}
                    onClick={() => void handleConnectSerial()}
                    className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                  >
                    <Usb className="w-3.5 h-3.5" />
                    <span>{isConnecting ? 'Menghubungkan...' : 'Hubungkan Web Serial'}</span>
                  </button>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
              <span>{serialStatusMsg}</span>
              {lastRawSerial && (
                <span className="font-mono px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 text-[10px]">
                  RX: {lastRawSerial}
                </span>
              )}
            </div>
          </div>

          {/* 2. Target Layanan Kiloan */}
          <div>
            <label className="block text-xs font-medium mb-1">
              Layanan Laundry Kiloan Tujuan
            </label>
            <select
              value={activeService?.id || ''}
              onChange={(e) => setSelectedServiceId(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl border text-xs font-medium outline-none ${
                isLight
                  ? 'bg-white border-slate-300 text-slate-900 focus:border-cyan-500'
                  : 'bg-slate-950 border-slate-700 text-white focus:border-cyan-400'
              }`}
            >
              {kiloanServices.map((srv) => (
                <option key={srv.id} value={srv.id}>
                  {srv.name} — Rp {Number(srv.sell_price).toLocaleString('id-ID')}/{srv.unit || 'kg'} (Min.{' '}
                  {srv.minOrderWeightKg ?? srv.minOrderQty ?? 2} kg • {srv.slaDuration || 'Reguler 48 Jam'})
                </option>
              ))}
            </select>
          </div>

          {/* 3. Readout Digital + HID/Manual Input + Tare */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Berat Bruto / HID Input */}
            <div
              className={`p-3.5 rounded-xl border space-y-2 ${
                isLight ? 'bg-cyan-50/50 border-cyan-300' : 'bg-slate-950 border-cyan-500/35'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium flex items-center gap-1.5 text-cyan-700 dark:text-cyan-300">
                  <Keyboard className="w-3.5 h-3.5" />
                  <span>Berat Bruto (HID / Manual)</span>
                </span>
                <span className="text-[10px] font-mono text-slate-500">kg desimal</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  ref={hidInputRef}
                  type="number"
                  step="0.01"
                  min={0}
                  value={grossInputStr}
                  onChange={(e) => handleManualGrossChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && billedWeightKg > 0) {
                      e.preventDefault();
                      handleApply();
                    }
                  }}
                  placeholder="0.00"
                  className={`w-full px-3 py-2 rounded-xl border font-mono text-xl font-bold text-right outline-none ${
                    isLight
                      ? 'bg-white border-cyan-400 text-slate-900'
                      : 'bg-slate-900 border-cyan-500/50 text-cyan-300'
                  }`}
                />
                <span className="font-mono font-bold text-sm text-slate-500">kg</span>
              </div>
              <div className="flex flex-wrap gap-1 pt-0.5">
                {[1.35, 2.5, 3.75, 5.2].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      setGrossWeightKg(preset);
                      setGrossInputStr(preset.toFixed(2));
                    }}
                    className={`px-2 py-0.5 rounded-md border text-[10px] font-mono cursor-pointer transition ${
                      isLight
                        ? 'bg-white hover:bg-cyan-100 border-slate-300 text-slate-700'
                        : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300'
                    }`}
                  >
                    {preset.toFixed(2)} kg
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    const next = Number((grossWeightKg + 0.5).toFixed(2));
                    setGrossWeightKg(next);
                    setGrossInputStr(next.toFixed(2));
                  }}
                  className="px-2 py-0.5 rounded-md border border-cyan-500/40 bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 text-[10px] font-mono cursor-pointer"
                >
                  +0.5 kg
                </button>
              </div>
            </div>

            {/* Tare / Potong Berat Keranjang */}
            <div
              className={`p-3.5 rounded-xl border space-y-2 ${
                isLight ? 'bg-amber-50/50 border-amber-300' : 'bg-slate-950 border-amber-500/35'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-amber-700 dark:text-amber-300">
                  Tare / Potong Berat Keranjang
                </span>
                <button
                  type="button"
                  onClick={() => setTareWeightKg(0)}
                  className="text-[10px] text-slate-500 hover:text-rose-500 flex items-center gap-0.5 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={tareWeightKg}
                  onChange={(e) =>
                    setTareWeightKg(Math.max(0, Number(parseFloat(e.target.value || '0').toFixed(2)) || 0))
                  }
                  className={`w-full px-3 py-2 rounded-xl border font-mono text-xl font-bold text-right outline-none ${
                    isLight
                      ? 'bg-white border-amber-400 text-slate-900'
                      : 'bg-slate-900 border-amber-500/50 text-amber-300'
                  }`}
                />
                <span className="font-mono font-bold text-sm text-slate-500">kg</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={handleSetTareFromCurrent}
                  className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-semibold cursor-pointer transition"
                >
                  Tare Berat Sekarang ({grossWeightKg.toFixed(2)} kg)
                </button>
                {[0.4, 0.6].map((presetTare) => (
                  <button
                    key={presetTare}
                    type="button"
                    onClick={() => setTareWeightKg(presetTare)}
                    className={`px-2 py-1 rounded-lg border text-[10px] font-mono cursor-pointer ${
                      isLight
                        ? 'bg-white border-amber-300 text-amber-800 hover:bg-amber-100'
                        : 'bg-slate-900 border-amber-500/30 text-amber-300 hover:bg-slate-800'
                    }`}
                  >
                    Keranjang {presetTare} kg
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 4. Summary Kalkulasi Netto + Auto-Adjust Minimum Berat Order */}
          <div
            className={`p-4 rounded-xl border space-y-2.5 ${
              isMinWeightAdjusted
                ? isLight
                  ? 'bg-amber-50 border-amber-400'
                  : 'bg-amber-950/30 border-amber-500/50'
                : isLight
                ? 'bg-emerald-50 border-emerald-300'
                : 'bg-emerald-950/25 border-emerald-500/40'
            }`}
          >
            <div className="grid grid-cols-3 gap-2 text-center">
              <div
                className={`p-2 rounded-lg border ${
                  isLight ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'
                }`}
              >
                <div className="text-[10px] text-slate-500 uppercase">Berat Bersih (Netto)</div>
                <div className="font-mono text-base font-bold text-cyan-600 dark:text-cyan-300">
                  {netWeightKg.toFixed(2)} kg
                </div>
              </div>
              <div
                className={`p-2 rounded-lg border ${
                  isLight ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'
                }`}
              >
                <div className="text-[10px] text-slate-500 uppercase">Min. Berat Order</div>
                <div className="font-mono text-base font-bold text-slate-700 dark:text-slate-200">
                  {minOrderKg.toFixed(2)} kg
                </div>
              </div>
              <div
                className={`p-2 rounded-lg border ${
                  isLight ? 'bg-white border-emerald-300' : 'bg-slate-900/80 border-emerald-500/40'
                }`}
              >
                <div className="text-[10px] text-slate-500 uppercase">Tagihan Final</div>
                <div className="font-mono text-base font-bold text-emerald-600 dark:text-emerald-400">
                  {billedWeightKg.toFixed(2)} kg
                </div>
              </div>
            </div>

            {isMinWeightAdjusted ? (
              <div className="flex items-start gap-2 text-xs text-amber-800 dark:text-amber-200">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                <span>
                  Berat bersih <strong>{netWeightKg.toFixed(2)} kg</strong> di bawah batas minimum order{' '}
                  <strong>{minOrderKg.toFixed(2)} kg</strong> — sistem otomatis menyesuaikan kuantitas tagihan ke{' '}
                  <strong>{billedWeightKg.toFixed(2)} kg</strong>.
                </span>
              </div>
            ) : billedWeightKg > 0 ? (
              <div className="flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-200">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>
                  Berat bersih memenuhi batas minimum order. Estimasi subtotal:{' '}
                  <strong className="font-mono">Rp {estimatedSubtotal.toLocaleString('id-ID')}</strong>
                </span>
              </div>
            ) : (
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Masukkan berat timbangan di atas (lebih dari 0 kg) untuk menghitung tagihan otomatis.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          className={`px-5 py-3.5 border-t flex items-center justify-between gap-3 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/70 border-slate-800'
          }`}
        >
          <div className="text-xs font-mono">
            Subtotal:{' '}
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              Rp {estimatedSubtotal.toLocaleString('id-ID')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-xl border text-xs font-medium cursor-pointer ${
                isLight
                  ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Tutup
            </button>
            <button
              type="button"
              disabled={!activeService || billedWeightKg <= 0}
              onClick={handleApply}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Terapkan {billedWeightKg > 0 ? `${billedWeightKg.toFixed(2)} kg` : ''} ke Kasir</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface LaundryAreaModalProps {
  isOpen: boolean;
  service: Product | null;
  initialLengthM?: number;
  initialWidthM?: number;
  isLight: boolean;
  onClose: () => void;
  onConfirm: (payload: LaundryAreaPayload) => void;
}

export const LaundryAreaModal: React.FC<LaundryAreaModalProps> = ({
  isOpen,
  service,
  initialLengthM = 2,
  initialWidthM = 1.5,
  isLight,
  onClose,
  onConfirm,
}) => {
  const [lengthM, setLengthM] = useState<number>(initialLengthM);
  const [widthM, setWidthM] = useState<number>(initialWidthM);

  useEffect(() => {
    if (isOpen) {
      setLengthM(initialLengthM > 0 ? initialLengthM : 2);
      setWidthM(initialWidthM > 0 ? initialWidthM : 1.5);
    }
  }, [isOpen, initialLengthM, initialWidthM]);

  if (!isOpen || !service) return null;

  const minArea = Math.max(0.5, Number(service.minOrderWeightKg ?? service.minOrderQty ?? 1));
  const areaM2 = Math.max(0, Number((lengthM * widthM).toFixed(2)));
  const isMinAreaAdjusted = areaM2 > 0 && areaM2 < minArea;
  const billedAreaM2 = areaM2 <= 0 ? 0 : isMinAreaAdjusted ? minArea : areaM2;
  const subtotal = Math.round(billedAreaM2 * (service.sell_price || 0));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (billedAreaM2 <= 0) return;
    onConfirm({
      service,
      lengthM,
      widthM,
      areaM2,
      billedAreaM2,
      isMinAreaAdjusted,
      minAreaAppliedM2: minArea,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden ${
          isLight
            ? 'bg-white border-indigo-400 text-slate-900'
            : 'bg-slate-900 border-indigo-500/40 text-slate-100'
        }`}
      >
        <div
          className={`px-5 py-3.5 border-b flex items-center justify-between ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/70 border-slate-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <Maximize2 className="w-4 h-4 text-indigo-500" />
            <div>
              <h3 className="text-sm font-semibold">Kalkulator Luas Laundry (m²)</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[260px]">
                {service.name}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg border border-slate-300 dark:border-slate-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Panjang (meter)</label>
              <input
                type="number"
                step="0.1"
                min={0.1}
                required
                value={lengthM}
                onChange={(e) => setLengthM(Math.max(0, parseFloat(e.target.value) || 0))}
                className={`w-full px-3 py-2 rounded-xl border font-mono text-base font-semibold outline-none ${
                  isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-700 text-white'
                }`}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Lebar (meter)</label>
              <input
                type="number"
                step="0.1"
                min={0.1}
                required
                value={widthM}
                onChange={(e) => setWidthM(Math.max(0, parseFloat(e.target.value) || 0))}
                className={`w-full px-3 py-2 rounded-xl border font-mono text-base font-semibold outline-none ${
                  isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-700 text-white'
                }`}
              />
            </div>
          </div>

          <div
            className={`p-3 rounded-xl border space-y-1 text-xs ${
              isLight ? 'bg-indigo-50 border-indigo-200' : 'bg-indigo-950/30 border-indigo-500/35'
            }`}
          >
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Luas Terhitung (P × L):</span>
              <span className="font-mono font-bold">
                {lengthM}m × {widthM}m = {areaM2.toFixed(2)} m²
              </span>
            </div>
            {isMinAreaAdjusted && (
              <div className="text-amber-600 dark:text-amber-300 text-[11px]">
                Di bawah minimum ({minArea} m²) → otomatis disesuaikan ke {billedAreaM2.toFixed(2)} m²
              </div>
            )}
            <div className="flex justify-between pt-1 border-t border-indigo-500/20">
              <span className="font-medium">Estimasi Tagihan ({billedAreaM2.toFixed(2)} m²):</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                Rp {subtotal.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={billedAreaM2 <= 0}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold cursor-pointer"
            >
              Masukkan ({billedAreaM2.toFixed(2)} m²)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
