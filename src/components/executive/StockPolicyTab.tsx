import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { StockAlertPolicy } from '../../types';
import {
  ShieldAlert,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  Boxes,
  Layers,
  Sparkles,
  Sliders,
  Check,
  X,
  Info,
  Package,
} from 'lucide-react';

interface StockPolicyTabProps {
  isLight: boolean;
  isEn: boolean;
}

export const StockPolicyTab: React.FC<StockPolicyTabProps> = ({ isLight, isEn }) => {
  const {
    stockAlertPolicies,
    addStockAlertPolicy,
    updateStockAlertPolicy,
    deleteStockAlertPolicy,
    getProductAlertThreshold,
    products,
    showToast,
    addAuditLog,
  } = useApp();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingPolicyId, setEditingPolicyId] = useState<string | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('ALL');
  const [formVelocity, setFormVelocity] = useState<'FAST_MOVING' | 'REGULAR' | 'SLOW_MOVING' | 'CRITICAL'>('FAST_MOVING');
  const [formThreshold, setFormThreshold] = useState<number>(25);
  const [formDefaultUnits, setFormDefaultUnits] = useState<number>(10);
  const [formNotes, setFormNotes] = useState('');

  // Extract unique product categories for selector
  const productCategories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach((p) => {
      if (p.category) cats.add(p.category);
    });
    return Array.from(cats);
  }, [products]);

  // Live evaluation of low stock products under current active policies
  const evaluatedProducts = useMemo(() => {
    return products.map((p) => {
      const evaluation = getProductAlertThreshold(p);
      return {
        product: p,
        ...evaluation,
      };
    });
  }, [products, getProductAlertThreshold]);

  const criticalCount = evaluatedProducts.filter((item) => item.isLowStock).length;

  const handleOpenCreate = () => {
    setEditingPolicyId(null);
    setFormName('');
    setFormCategory('ALL');
    setFormVelocity('FAST_MOVING');
    setFormThreshold(25);
    setFormDefaultUnits(10);
    setFormNotes('Kebijakan standar ambang batas peringatan stok');
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (policy: StockAlertPolicy) => {
    setEditingPolicyId(policy.id);
    setFormName(policy.name);
    setFormCategory(policy.category || 'ALL');
    setFormVelocity(policy.velocityGroup || 'FAST_MOVING');
    setFormThreshold(policy.thresholdPercent ?? policy.alertPercentage ?? 20);
    setFormDefaultUnits(policy.defaultMinUnits ?? policy.minBufferUnits ?? 10);
    setFormNotes(policy.notes || '');
    setIsCreateModalOpen(true);
  };

  const handleSavePolicy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert(isEn ? 'Policy name is required' : 'Nama kebijakan wajib diisi');
      return;
    }

    if (editingPolicyId) {
      updateStockAlertPolicy(editingPolicyId, {
        name: formName.trim(),
        category: formCategory === 'ALL' ? undefined : formCategory,
        velocityGroup: formVelocity,
        thresholdPercent: Number(formThreshold) || 20,
        defaultMinUnits: Number(formDefaultUnits) || 10,
        notes: formNotes.trim(),
      });
      showToast(isEn ? 'Stock policy updated successfully' : 'Kebijakan ambang stok berhasil diperbarui');
      addAuditLog('UPDATE', `Updated stock policy: ${formName}`);
    } else {
      addStockAlertPolicy({
        name: formName.trim(),
        targetType: formCategory === 'ALL' ? 'DEFAULT' : 'CATEGORY',
        targetValue: formCategory,
        alertPercentage: Number(formThreshold) || 20,
        isFastMoving: formVelocity === 'FAST_MOVING' || formVelocity === 'CRITICAL',
        category: formCategory === 'ALL' ? undefined : formCategory,
        velocityGroup: formVelocity,
        thresholdPercent: Number(formThreshold) || 20,
        defaultMinUnits: Number(formDefaultUnits) || 10,
        isActive: true,
        notes: formNotes.trim(),
        appliedBy: 'General Manager (Executive)',
        updatedBy: 'General Manager (Executive)',
      });
      showToast(isEn ? 'New stock policy created and activated' : 'Kebijakan ambang stok baru berhasil diotorisasi & diaktifkan');
      addAuditLog('CREATE', `Created stock policy: ${formName}`);
    }

    setIsCreateModalOpen(false);
  };

  const handleTogglePolicy = (id: string, currentStatus: boolean) => {
    updateStockAlertPolicy(id, { isActive: !currentStatus });
    showToast(
      isEn
        ? `Policy ${!currentStatus ? 'Activated' : 'Deactivated'}`
        : `Kebijakan ${!currentStatus ? 'Diaktifkan' : 'Dinonaktifkan'}`
    );
  };

  const handleDeletePolicy = (id: string, name: string) => {
    if (confirm(isEn ? `Delete policy "${name}"?` : `Hapus kebijakan stok "${name}"?`)) {
      deleteStockAlertPolicy(id);
      showToast(isEn ? 'Policy deleted' : 'Kebijakan stok dihapus');
      addAuditLog('DELETE', `Deleted stock policy: ${name}`);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Policy Governance Banner */}
      <div
        className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          isLight
            ? 'bg-gradient-to-r from-amber-50/80 via-white to-orange-50/80 border-amber-200'
            : 'bg-gradient-to-r from-[#1b1509] via-[#161b22] to-[#1a1309] border-amber-500/30'
        }`}
      >
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className={`font-bold text-base ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {isEn
                  ? 'Executive Stock Policy & Percentage-Based Alert Thresholds'
                  : 'Kebijakan Stok & Ambang Batas Peringatan Persentase'}
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 font-mono">
                OTORISASI MANAJERIAL
              </span>
            </div>
            <p className="text-xs text-slate-700 font-medium dark:text-slate-400 mt-1 max-w-3xl leading-relaxed">
              {isEn
                ? 'Managerial control replaces per-product manual input. Set percentage thresholds based on turnover velocity (e.g. Fast Moving triggers at 35% remaining, Regular at 20%, Critical at 25%). Thresholds automatically govern Low Stock Alert badges in Warehouse and Dashboard telemetry in real-time.'
                : 'Otorisasi kebijakan menggantikan pengisian batas alert manual oleh staf operasional. Manajer menetapkan ambang batas berbasis persentase sisa stok terhadap kapasitas awal (contoh: Fast Moving memicu alert di 35% sisa, Reguler di 20%, Kritis/Farmasi di 25%). Sistem secara otomatis memicu badge "Low Stock Alert" di Modul Gudang & Telemetri Dashboard.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="px-3.5 py-2 rounded-xl border border-amber-500/30 bg-amber-500/10 text-right">
            <div className="text-[10px] text-amber-900 dark:text-slate-400 font-bold uppercase tracking-wider">
              {isEn ? 'Alert Triggered' : 'Produk Kritis Terpicu'}
            </div>
            <div className="text-lg font-black font-mono text-amber-700 dark:text-amber-400">
              {criticalCount} <span className="text-xs font-normal text-slate-700 dark:text-slate-400">/ {products.length} SKU</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center gap-2 shadow-[0_0_15px_rgba(245,158,11,0.3)] cursor-pointer transition whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>{isEn ? '+ Add Stock Policy' : '+ Tambah Kebijakan Stok'}</span>
          </button>
        </div>
      </div>

      {/* Grid of Active Policies */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stockAlertPolicies.map((policy) => {
          const isFast = policy.velocityGroup === 'FAST_MOVING';
          const isCritical = policy.velocityGroup === 'CRITICAL';
          const isSlow = policy.velocityGroup === 'SLOW_MOVING';

          const accentColor = isFast
            ? 'text-cyan-400 border-cyan-500/40 bg-cyan-500/10'
            : isCritical
            ? 'text-rose-400 border-rose-500/40 bg-rose-500/10'
            : isSlow
            ? 'text-slate-400 border-slate-500/40 bg-slate-500/10'
            : 'text-amber-400 border-amber-500/40 bg-amber-500/10';

          return (
            <div
              key={policy.id}
              className={`p-4 rounded-2xl border border-slate-300 dark:border-slate-700 shadow-xs flex flex-col justify-between transition-all ${
                isLight ? 'bg-white' : 'bg-[#161b22]'
              } ${!policy.isActive ? 'opacity-60' : ''}`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border uppercase font-mono ${accentColor}`}>
                    {(policy.velocityGroup || 'REGULAR').replace('_', ' ')}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleTogglePolicy(policy.id, !!policy.isActive)}
                      className={`cursor-pointer transition ${
                        policy.isActive
                          ? 'bg-emerald-100 border border-emerald-400 text-emerald-900 font-bold text-[10px] px-2 py-0.5 rounded dark:bg-emerald-950 dark:border-emerald-700 dark:text-emerald-300'
                          : 'bg-slate-200 border border-slate-400 text-slate-800 font-bold text-[10px] px-2 py-0.5 rounded dark:bg-slate-800 dark:border-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {policy.isActive ? 'AKTIF' : 'NON-AKTIF'}
                    </button>
                  </div>
                </div>

                <h4 className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {policy.name}
                </h4>

                <div className="mt-2 space-y-1.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-800 font-bold text-xs">Target Category:</span>
                    <span className="text-slate-950 font-black text-xs dark:text-white">
                      {policy.category ? policy.category : 'Semua Kategori (Global)'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-800 font-bold text-xs">Alert Trigger %:</span>
                    <span className="text-slate-950 font-black text-xs dark:text-white font-mono">
                      {policy.thresholdPercent}% <span className="text-[10px] font-normal text-slate-600 dark:text-slate-400">sisa stok</span>
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-800 font-bold text-xs">Min Floor Units:</span>
                    <span className="text-slate-950 font-black text-xs dark:text-white font-mono">
                      {policy.defaultMinUnits} Unit
                    </span>
                  </div>
                </div>

                {policy.notes && (
                  <p className="text-slate-800 italic font-medium text-xs mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-700/40">
                    "{policy.notes}"
                  </p>
                )}
              </div>

              <div className="pt-3 mt-3 border-t border-slate-200 dark:border-slate-700/40 flex items-center justify-between text-[11px]">
                <span className="text-slate-600 dark:text-slate-400 text-[10px]">
                  {policy.appliedBy || 'Executive'}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(policy)}
                    className="p-1 rounded text-slate-500 hover:text-cyan-600 dark:text-slate-400 dark:hover:text-cyan-400 cursor-pointer"
                    title={isEn ? 'Edit Policy' : 'Edit Kebijakan'}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeletePolicy(policy.id, policy.name)}
                    className="p-1 rounded text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 cursor-pointer"
                    title={isEn ? 'Delete Policy' : 'Hapus Kebijakan'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Impact Preview Table: Realtime Trigger Evaluation */}
      <div
        className={`p-5 rounded-2xl border ${
          isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#161b22] border-[#30363d]'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h4 className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-white'} flex items-center gap-2`}>
              <Boxes className="w-4 h-4 text-cyan-400" />
              <span>{isEn ? 'Live Stock Alert Impact Telemetry' : 'Daftar Evaluasi Ambang Stok Realtime (Live Telemetry)'}</span>
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {isEn
                ? 'Shows current physical stock compared to policy-calculated alert thresholds for each catalog item.'
                : 'Menampilkan kalkulasi ambang batas stok otomatis dan status peringatan dini untuk setiap SKU gudang.'}
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
              ✓ Normal: {products.length - criticalCount} SKU
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-400 border border-rose-500/30 font-semibold animate-pulse">
              ⚠ Low Stock: {criticalCount} SKU
            </span>
          </div>
        </div>

        <div className={`overflow-x-auto rounded-xl border ${isLight ? 'border-slate-200' : 'border-slate-700/40'}`}>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className={isLight ? 'bg-slate-100 text-slate-700' : 'bg-[#0d1117] text-slate-300'}>
                <th className="py-2.5 px-3 font-semibold">SKU / Kode</th>
                <th className="py-2.5 px-3 font-semibold">Nama Produk</th>
                <th className="py-2.5 px-3 font-semibold">Kategori</th>
                <th className="py-2.5 px-3 font-semibold text-center">Stok Fisik Saat Ini</th>
                <th className="py-2.5 px-3 font-semibold text-center">Ambang Batas Alert</th>
                <th className="py-2.5 px-3 font-semibold">Kebijakan Eksekutif Aktif</th>
                <th className="py-2.5 px-3 font-semibold text-center">Status Telemetri</th>
              </tr>
            </thead>
            <tbody className={`divide-y font-mono ${isLight ? 'divide-slate-200' : 'divide-slate-700/30'}`}>
              {evaluatedProducts.map(({ product, isLowStock, minStock, policyName, thresholdPercent }, pIdx) => (
                <tr
                  key={`stock-pol-${product.id}-${pIdx}`}
                  className={`transition ${
                    isLowStock
                      ? isLight
                        ? 'bg-rose-50/70 hover:bg-rose-100/70'
                        : 'bg-rose-950/20 hover:bg-rose-950/30'
                      : isLight
                      ? 'hover:bg-slate-50'
                      : 'hover:bg-[#1f242c]'
                  }`}
                >
                  <td className="py-2 px-3 text-cyan-700 dark:text-cyan-400 font-bold">{product.barcode || product.id}</td>
                  <td className="py-2 px-3 font-sans text-slate-950 font-bold text-xs dark:text-white">{product.name}</td>
                  <td className="py-2 px-3 font-sans text-slate-700 font-medium text-xs dark:text-slate-300">{product.category}</td>
                  <td className="py-2 px-3 text-center font-bold">
                    <span
                      className={`px-2 py-0.5 rounded-full ${
                        isLowStock
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                          : 'bg-emerald-500/20 text-emerald-400'
                      }`}
                    >
                      {product.stock} {product.unit || 'PCS'}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-center text-amber-800 font-bold text-xs dark:text-amber-300">
                    ≤ {minStock} Unit <span className="text-[10px] text-slate-600 dark:text-slate-400">({thresholdPercent}%)</span>
                  </td>
                  <td className="py-2 px-3 font-sans text-slate-800 font-semibold text-xs dark:text-slate-200">
                    <span className="inline-flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span>{policyName}</span>
                    </span>
                  </td>
                  <td className="py-2 px-3 text-center font-sans">
                    {isLowStock ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse">
                        <AlertTriangle className="w-3 h-3" />
                        LOW STOCK ALERT
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400">
                        <CheckCircle2 className="w-3 h-3" />
                        STOK AMAN
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form: Add / Edit Policy */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div
            className={`w-full max-w-lg rounded-2xl border p-6 shadow-2xl space-y-4 ${
              isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#161b22] border-[#30363d] text-white'
            }`}
          >
            <div className="flex items-center justify-between border-b border-slate-700/40 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base">
                  {editingPolicyId
                    ? isEn
                      ? 'Edit Stock Policy'
                      : 'Edit Kebijakan Ambang Stok'
                    : isEn
                    ? 'New Stock Policy'
                    : 'Otorisasi Kebijakan Ambang Stok Baru'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePolicy} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-800 dark:text-slate-300">
                  {isEn ? 'Policy Name' : 'Nama Kebijakan'} *
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Contoh: Ambang Kritis FMCG & Makanan"
                  required
                  className={`w-full px-3 py-2 rounded-xl border text-sm transition focus:outline-none ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#0d1117] border-[#30363d] text-white'
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-800 dark:text-slate-300">
                    {isEn ? 'Velocity Group' : 'Klasifikasi Perputaran'}
                  </label>
                  <select
                    value={formVelocity}
                    onChange={(e: any) => setFormVelocity(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border text-xs transition focus:outline-none ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#0d1117] border-[#30363d] text-white'
                    }`}
                  >
                    <option value="FAST_MOVING">Fast Moving (Tinggi)</option>
                    <option value="REGULAR">Regular (Standar)</option>
                    <option value="SLOW_MOVING">Slow Moving (Rendah)</option>
                    <option value="CRITICAL">Critical / Farmasi (Ketat)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-800 dark:text-slate-300">
                    {isEn ? 'Target Category Scope' : 'Cakupan Kategori'}
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border text-xs transition focus:outline-none ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#0d1117] border-[#30363d] text-white'
                    }`}
                  >
                    <option value="ALL">Semua Kategori (Global)</option>
                    {productCategories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Threshold Percentage Slider + Number */}
              <div className="space-y-2 p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10">
                <div className="flex justify-between items-center">
                  <label className="font-bold text-amber-800 dark:text-amber-400">
                    {isEn ? 'Percentage Threshold (% of Initial Stock)' : 'Persentase Ambang Pemicu Alert (%)'}
                  </label>
                  <span className="font-mono text-base font-extrabold text-amber-700 dark:text-amber-300">
                    {formThreshold}%
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="50"
                  step="1"
                  value={formThreshold}
                  onChange={(e) => setFormThreshold(parseInt(e.target.value) || 20)}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-600 dark:text-slate-400">
                  <span>5% (Minimal)</span>
                  <span>20% (Standar)</span>
                  <span>35% (Fast-Moving)</span>
                  <span>50% (Sangat Ketat)</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-800 dark:text-slate-300">
                  {isEn ? 'Absolute Minimum Floor Units' : 'Batas Minimum Fisik Absolut (Unit)'}
                </label>
                <input
                  type="number"
                  min="1"
                  value={formDefaultUnits}
                  onChange={(e) => setFormDefaultUnits(parseInt(e.target.value) || 5)}
                  className={`w-full px-3 py-2 rounded-xl border text-sm font-mono transition focus:outline-none ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#0d1117] border-[#30363d] text-white'
                  }`}
                />
                <span className="text-[10px] text-slate-600 dark:text-slate-400">
                  {isEn
                    ? 'Fallback if calculated percentage produces a lower unit count'
                    : 'Batas dasar jika persentase menghasilkan angka unit yang terlalu kecil'}
                </span>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-800 dark:text-slate-300">
                  {isEn ? 'Executive Notes / Rationale' : 'Catatan Otorisasi Eksekutif'}
                </label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Alasan penetapan ambang batas..."
                  className={`w-full px-3 py-2 rounded-xl border text-xs transition focus:outline-none ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#0d1117] border-[#30363d] text-white'
                  }`}
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-700/40 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer"
                >
                  {isEn ? 'Cancel' : 'Batal'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center gap-1.5 shadow-lg shadow-amber-500/20 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{isEn ? 'Save & Authorize' : 'Simpan & Otorisasi'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
