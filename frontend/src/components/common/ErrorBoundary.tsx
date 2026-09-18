import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#091E19] flex items-center justify-center p-6 text-[#FDFEF8]">
          <div className="max-w-md w-full bg-[#14382F] border border-[#235447] rounded-3xl p-6 text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 mx-auto flex items-center justify-center border border-red-500/30">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-[#FDFEF8]">Algo inesperado aconteceu</h2>
            <p className="text-xs text-[#95BDB0] leading-relaxed">
              Ocorreu um erro temporário na visualização. Seus dados continuam seguros no banco de dados.
            </p>
            <div className="p-3 bg-[#0B241D] rounded-xl text-left border border-[#235447]/60 text-[11px] font-mono text-red-300 max-h-24 overflow-y-auto">
              {this.state.error?.message || 'Erro desconhecido'}
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#184339] hover:bg-[#205549] text-[#D1EAE0] transition-all cursor-pointer"
              >
                Tentar novamente
              </button>
              <button
                type="button"
                onClick={this.handleReload}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#C1F76B] text-[#0F2D26] hover:bg-[#b0ec53] transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-[#C1F76B]/20"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Recarregar página</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
