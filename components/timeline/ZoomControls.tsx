'use client';

interface Props {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitToView: () => void;
}

export default function ZoomControls({ onZoomIn, onZoomOut, onFitToView }: Props) {
  return (
    <div className="flex flex-col gap-1 p-2 bg-white border border-stone-200 rounded-xl shadow-sm">
      <button
        onClick={onZoomIn}
        className="w-8 h-8 flex items-center justify-center text-stone-600 hover:bg-stone-100 rounded-lg transition-colors text-lg font-light leading-none"
        title="Zoom in"
      >
        +
      </button>
      <div className="h-px bg-stone-100" />
      <button
        onClick={onZoomOut}
        className="w-8 h-8 flex items-center justify-center text-stone-600 hover:bg-stone-100 rounded-lg transition-colors text-lg font-light leading-none"
        title="Zoom out"
      >
        −
      </button>
      <div className="h-px bg-stone-100" />
      <button
        onClick={onFitToView}
        className="w-8 h-8 flex items-center justify-center text-stone-500 hover:bg-stone-100 rounded-lg transition-colors"
        title="Adatta alla vista"
      >
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
          <rect x="2" y="2" width="5" height="5" rx="0.5" />
          <rect x="9" y="2" width="5" height="5" rx="0.5" />
          <rect x="2" y="9" width="5" height="5" rx="0.5" />
          <rect x="9" y="9" width="5" height="5" rx="0.5" />
        </svg>
      </button>
    </div>
  );
}
