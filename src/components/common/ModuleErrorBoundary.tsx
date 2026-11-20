import React from 'react';
import { ShieldAlert, RefreshCw, Copy, Check, RotateCcw } from 'lucide-react';

interface ModuleErrorBoundaryProps {
  children: React.ReactNode;
  activeModule: string;
  branchId: string;
  isLight?: boolean;
  onErrorCaptured?: (payload: {
    message: string;
    stack?: string;
    module: string;
    route?: string;
    type: 'CRITICAL';
  }) => void;
  onResetModule?: () => void;
}

interface ModuleErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  componentStack: string;
  copied: boolean;
}

function summarizeStackTrace(stack?: string): string {
  if (!stack) return 'Stack trace tidak tersedia.';
  const lines = stack
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('Error:'))
    .slice(0, 4)
    .map((line) =>
      line
        .replace(/https?:\/\/[^/]+/g, '')
        .replace(/\?t=\d+/g, '')
        .replace(/\?v=[a-zA-Z0-9_-]+/g, '')
    );
  return lines.length > 0 ? lines.join(' | ') : stack.slice(0, 240);
}

export class ModuleErrorBoundary extends React.Component<
  ModuleErrorBoundaryProps,
  ModuleErrorBoundaryState
> {
  constructor(props: ModuleErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      componentStack: '',
      copied: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ModuleErrorBoundaryState> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    const compStack = errorInfo?.componentStack || '';
    this.setState({ componentStack: compStack });

    const routePath =
      typeof window !== 'undefined'
        ? `${window.location.pathname}${window.location.hash || ''}#${this.props.activeModule}`
        : `#${this.props.activeModule}`;

    this.props.onErrorCaptured?.({
      message: error?.message || 'Terjadi crash runtime pada modul.',
      stack: error?.stack || compStack,
      module: this.props.activeModule,
      route: routePath,
      type: 'CRITICAL'
    });
  }

  componentDidUpdate(prevProps: ModuleErrorBoundaryProps): void {
    if (prevProps.activeModule !== this.props.activeModule && this.state.hasError) {
      this.setState({
        hasError: false,
        error: null,
        componentStack: '',
        copied: false
      });
    }
  }

  private handleReloadModule = () => {
    this.setState({
      hasError: false,
      error: null,
      componentStack: '',
      copied: false
    });
    this.props.onResetModule?.();
  };

  private handleCopyForAiFix = async () => {
    const errMsg = this.state.error?.message || 'Unknown React Render Error';
    const stackSummary = summarizeStackTrace(
      this.state.error?.stack || this.state.componentStack
    );
    const fullDetail = [
      `[JacS RetailOS ERP - React Crash Report]`,
      `Timestamp : ${new Date().toISOString()}`,
      `Cabang    : ${this.props.branchId}`,
      `Modul     : ${this.props.activeModule.toUpperCase()}`,
      `Pesan     : ${errMsg}`,
      `Stack Ringkas: ${stackSummary}`,
      this.state.error?.stack ? `\nFull Stack:\n${this.state.error.stack}` : ''
    ]
      .filter(Boolean)
      .join('\n');

    try {
      await navigator.clipboard.writeText(fullDetail);
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2500);
    } catch {}
  };

  render(): React.ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const isLight = Boolean(this.props.isLight);
    const errMessage = this.state.error?.message || 'Terjadi kesalahan tak terduga saat merender modul.';
    const stackSummary = summarizeStackTrace(
      this.state.error?.stack || this.state.componentStack
    );

    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4 sm:p-6">
        <div
          className={`w-full max-w-xl rounded-3xl border p-6 sm:p-7 shadow-2xl space-y-5 ${
            isLight
              ? 'bg-[#F6F8FB] border-rose-300 text-slate-900'
              : 'bg-[#161b22] border-rose-500/40 text-slate-100'
          }`}
        >
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-500 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-rose-500/15 border border-rose-500/30 text-[10px] font-mono font-bold text-rose-500 uppercase tracking-wider mb-1.5">
                ERROR BOUNDARY • {this.props.branchId} • {this.props.activeModule.toUpperCase()}
              </div>
              <h2 className="text-lg font-black tracking-tight">
                Modul Mengalami Gangguan Sementara
              </h2>
              <p className={`text-xs mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Sistem telah mengisolasi crash agar sesi Anda dan data transaksi tetap aman. Insiden ini otomatis dicatat ke <code className="font-mono">systemErrorLogs</code>.
              </p>
            </div>
          </div>

          <div
            className={`rounded-2xl border p-4 font-mono text-xs space-y-2 ${
              isLight
                ? 'bg-white border-slate-300 text-slate-800'
                : 'bg-[#0d1117] border-gray-800 text-slate-200'
            }`}
          >
            <div>
              <span className="text-[10px] uppercase tracking-wider text-rose-500 font-bold block mb-0.5">
                Pesan Error:
              </span>
              <p className="font-bold break-words text-rose-500 dark:text-rose-400">{errMessage}</p>
            </div>
            <div className={`pt-2 border-t ${isLight ? 'border-slate-200' : 'border-gray-800'}`}>
              <span className="text-[10px] uppercase tracking-wider text-cyan-500 font-bold block mb-0.5">
                Lokasi &amp; Ringkasan Stack Trace:
              </span>
              <p className={`text-[11px] break-all ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                {stackSummary}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={this.handleReloadModule}
                className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs flex items-center gap-2 cursor-pointer shadow-md transition active:scale-95"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Muat Ulang Modul</span>
              </button>

              <button
                type="button"
                onClick={() => window.location.reload()}
                className={`px-3.5 py-2.5 rounded-xl font-bold text-xs border flex items-center gap-1.5 cursor-pointer transition ${
                  isLight
                    ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-800'
                    : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reload Halaman</span>
              </button>
            </div>

            <button
              type="button"
              onClick={this.handleCopyForAiFix}
              className={`px-3.5 py-2.5 rounded-xl font-bold text-xs border flex items-center gap-1.5 cursor-pointer transition ${
                this.state.copied
                  ? 'bg-emerald-600 border-emerald-500 text-white'
                  : isLight
                  ? 'bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-800'
                  : 'bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/40 text-amber-300'
              }`}
            >
              {this.state.copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{this.state.copied ? 'Detail Tersalin!' : 'Salin Detail Error untuk AI Fix'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default ModuleErrorBoundary;
