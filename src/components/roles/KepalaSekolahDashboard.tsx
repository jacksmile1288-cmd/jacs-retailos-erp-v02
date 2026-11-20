import React, { useState } from 'react';
import {
  Award,
  BookOpen,
  Users,
  GraduationCap,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  CheckCircle2,
  TrendingUp,
  FileCheck2,
  AlertCircle,
  BarChart3,
  Sparkles
} from 'lucide-react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip
} from 'recharts';

interface AkreditasiPillar {
  pillar: string;
  score: number;
  target: number;
  status: 'Optimal' | 'Attention' | 'Excellent';
}

const pilarAkreditasiData: AkreditasiPillar[] = [
  { pillar: 'Kinerja Pendidik', score: 92, target: 90, status: 'Optimal' },
  { pillar: 'Kepemimpinan KS', score: 95, target: 90, status: 'Excellent' },
  { pillar: 'Iklim Belajar', score: 88, target: 85, status: 'Optimal' },
  { pillar: 'Hasil Belajar', score: 85, target: 85, status: 'Attention' },
];

export const KepalaSekolahDashboard: React.FC = () => {
  // State default-nya false (hidden by default sesuai instruksi)
  const [showChart, setShowChart] = useState<boolean>(false);

  return (
    <div className="space-y-6 select-none p-4 md:p-6 bg-slate-50 dark:bg-slate-900 rounded-2xl">
      {/* Header Info Principal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
              AKREDITASI BAN-PDM 2026
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Update Terakhir: Hari ini
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
            Dasbor Utama Kepala Sekolah
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">
            Pengawasan Kesiapan Akreditasi, Kinerja Tenaga Pendidik & Tata Kelola Operasional Sekolah
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 text-center">
            <p className="text-xs text-emerald-700 dark:text-emerald-400 font-bold uppercase tracking-wider">Predikat Kinerja</p>
            <p className="text-lg font-black text-emerald-600 dark:text-emerald-300">UNGGUL (A)</p>
          </div>
        </div>
      </div>

      {/* Grid Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase">Total Siswa Active</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">1,248</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">↑ 98.4% Kehadiran</p>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-950/50 rounded-xl text-blue-600 dark:text-blue-400">
            <GraduationCap className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase">Tenaga Pendidik / Guru</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">68</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">100% Sertifikasi BAN-PDM</p>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl text-emerald-600 dark:text-emerald-400">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase">Skor Akreditasi (Rata-Rata)</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">90.0 / 100</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">Status Memenuhi Target</p>
          </div>
          <div className="p-3 bg-purple-50 dark:bg-purple-950/50 rounded-xl text-purple-600 dark:text-purple-400">
            <Award className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase">Kelengkapan Berkas SOP</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">96.5%</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">Siap Audit Fisik</p>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-950/50 rounded-xl text-amber-600 dark:text-amber-400">
            <FileCheck2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* SECTION RADAR KESIAPAN 4 PILAR AKREDITASI BAN-PDM */}
      <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-xs transition-all duration-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-700/60">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                RADAR KESIAPAN 4 PILAR AKREDITASI BAN-PDM
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                Evaluasi komprehensif mutu pendidikan, iklim belajar, dan hasil belajar siswa
              </p>
            </div>
          </div>

          {/* Tombol Sakelar Visibilitas Grafik */}
          <button
            type="button"
            onClick={() => setShowChart(!showChart)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-700/80 transition-colors cursor-pointer shadow-xs"
          >
            {showChart ? (
              <>
                <EyeOff className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>[👁️ Sembunyikan Grafik ∧]</span>
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>[👁️ Tampilkan Grafik ∨]</span>
              </>
            )}
          </button>
        </div>

        {/* Dynamic Collapsible Block for Chart & Pillar Stats */}
        {showChart ? (
          <div className="mt-5 space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Left Column: Visual Radar Chart */}
              <div className="lg:col-span-7 h-[300px] w-full bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700/40 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={pilarAkreditasiData}>
                    <PolarGrid stroke="#94a3b8" strokeDasharray="3 3" opacity={0.4} />
                    <PolarAngleAxis
                      dataKey="pillar"
                      tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                    />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#94a3b8" opacity={0.3} />
                    <Radar
                      name="Skor Capaian"
                      dataKey="score"
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.35}
                    />
                    <Radar
                      name="Target Standard"
                      dataKey="target"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.15}
                    />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* Right Column: Breakdown 4 Pilar List */}
              <div className="lg:col-span-5 space-y-3">
                <h3 className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                  Rincian Nilai Per-Pilar
                </h3>
                {pilarAkreditasiData.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700/40 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        {item.pillar}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                        Target Minimal: {item.target} poin
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-black text-emerald-600 dark:text-emerald-400">
                        {item.score} / 100
                      </p>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-3 p-4 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-dashed border-slate-300 dark:border-slate-700/80 text-center">
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
              Grafik Radar Kesiapan 4 Pilar Akreditasi tersembunyi secara default. Klik tombol di atas untuk membuka visualisasi radar & kurva capaian.
            </p>
          </div>
        )}
      </div>

      {/* Operational Juklak & SOP Summary */}
      <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-500" />
          <span>Operational Juklak & SOP Info Viewer - Kepala Sekolah</span>
        </h3>
        <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
          Pengawasan rutin Kepala Sekolah mencakup verifikasi harian kurikulum merdeka, validasi beban mengajar guru, kesiapan instrumen BAN-PDM, dan otorisasi anggaran operasional sarana & prasarana pendidikan.
        </p>
      </div>
    </div>
  );
};

export default KepalaSekolahDashboard;
