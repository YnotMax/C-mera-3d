import React, { useState } from 'react';
import { Camera, Eye, Zap, Crosshair } from 'lucide-react';
import { soundEffects } from './AudioEffects';

interface SensorViewfinderProps {
  focalLength: number;
  apertureValue: number;
  focusDistance: number;
}

export const SensorViewfinder: React.FC<SensorViewfinderProps> = ({
  focalLength,
  apertureValue,
  focusDistance,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isShutterFired, setIsShutterFired] = useState(false);

  const displayFStop = (2.8 * Math.pow(Math.SQRT2, (1.0 - apertureValue) * 6)).toFixed(1);
  const blurAmount = Math.max(1, (1.0 - (1.0 - apertureValue)) * 14); // f/2.8 = 14px blur, f/22 = 1px blur

  const handleShoot = () => {
    setIsShutterFired(true);
    soundEffects.playShutterClick();
    setTimeout(() => {
      setIsShutterFired(false);
    }, 120);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => {
          setIsOpen(true);
          soundEffects.playHoverBlip();
        }}
        className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900/80 hover:bg-slate-800 text-sky-400 border border-slate-800 hover:border-slate-700 backdrop-blur-md shadow-lg transition-all"
        title="Abrir simulação visual do que o sensor CMOS captura através da lente"
      >
        <Eye className="w-4 h-4" />
        <span>Visor do Sensor</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-24 right-6 z-30 w-72 bg-slate-900/95 border border-sky-500/40 rounded-xl p-3 shadow-2xl shadow-black/90 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-xs font-mono">
        <span className="flex items-center gap-1.5 text-sky-400 font-bold">
          <Camera className="w-3.5 h-3.5" />
          Plano Focal CMOS (35mm)
        </span>
        <button
          onClick={() => setIsOpen(false)}
          className="text-slate-400 hover:text-white px-1 py-0.5 rounded"
        >
          ✕
        </button>
      </div>

      {/* Janela de Visão do Sensor */}
      <div className="relative w-full h-44 rounded-lg overflow-hidden bg-black border border-slate-800 flex items-center justify-center">
        {/* Flash de obturador */}
        {isShutterFired && (
          <div className="absolute inset-0 bg-white z-20 animate-out fade-out duration-100" />
        )}

        {/* Simulação óptica de fundo desfocado com bokeh */}
        <div
          className="absolute inset-0 bg-gradient-to-tr from-sky-950 via-slate-900 to-indigo-950 transition-all duration-300"
          style={{
            filter: `blur(${blurAmount}px)`,
            transform: `scale(${1 + (200 - focalLength) * 0.002})`,
          }}
        >
          {/* Círculos de Bokeh Poligonal */}
          <div className="absolute top-6 left-8 w-12 h-12 rounded-full bg-amber-400/40 mix-blend-screen" />
          <div className="absolute top-12 right-10 w-16 h-16 rounded-full bg-rose-400/35 mix-blend-screen" />
          <div className="absolute bottom-6 left-16 w-10 h-10 rounded-full bg-emerald-400/30 mix-blend-screen" />
        </div>

        {/* Elemento central nítido em foco */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-xl border border-sky-400/80 bg-sky-500/10 backdrop-blur-xs flex items-center justify-center shadow-lg shadow-sky-500/20">
            <Crosshair className="w-6 h-6 text-sky-400 animate-pulse" />
          </div>
          <span className="text-[10px] font-mono font-semibold text-slate-200 mt-1.5 bg-black/60 px-2 py-0.5 rounded">
            Foco AF: {focusDistance === Infinity ? '∞' : `${focusDistance.toFixed(1)}m`}
          </span>
        </div>

        {/* Linhas de grade fotográfica de terços */}
        <div className="absolute inset-0 pointer-events-none opacity-25">
          <div className="absolute left-1/3 inset-y-0 w-px bg-white" />
          <div className="absolute left-2/3 inset-y-0 w-px bg-white" />
          <div className="absolute top-1/3 inset-x-0 h-px bg-white" />
          <div className="absolute top-2/3 inset-x-0 h-px bg-white" />
        </div>

        {/* Telemetria HUD da Câmera */}
        <div className="absolute bottom-2 inset-x-2 flex justify-between items-center text-[10px] font-mono text-emerald-400 font-bold bg-black/70 px-2 py-1 rounded">
          <span>{focalLength}mm</span>
          <span>f/{displayFStop}</span>
          <span>1/500s</span>
          <span>ISO 100</span>
        </div>
      </div>

      {/* Botão de Disparador */}
      <button
        onClick={handleShoot}
        className="w-full mt-2.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 active:scale-98 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-sky-950 transition-all"
      >
        <Zap className="w-3.5 h-3.5" />
        <span>Disparar Obturador</span>
      </button>
    </div>
  );
};
