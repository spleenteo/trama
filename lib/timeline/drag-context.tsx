'use client';

import { createContext, useContext, useRef, useState, useCallback } from 'react';

interface DragState {
  draggingEventId: string | null;
  dropTargetId: string | null;
}

interface DragContextValue {
  state: DragState;
  startDrag: (eventId: string) => void;
  setDropTarget: (id: string | null) => void;
  endDrag: () => { eventId: string; targetId: string } | null;
  isDragging: boolean;
}

const DragContext = createContext<DragContextValue | null>(null);

export function DragProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DragState>({ draggingEventId: null, dropTargetId: null });
  const stateRef = useRef(state);
  stateRef.current = state;

  const startDrag = useCallback((eventId: string) => {
    setState({ draggingEventId: eventId, dropTargetId: null });
  }, []);

  const setDropTarget = useCallback((id: string | null) => {
    setState((s) => s.draggingEventId ? { ...s, dropTargetId: id } : s);
  }, []);

  const endDrag = useCallback(() => {
    const { draggingEventId, dropTargetId } = stateRef.current;
    setState({ draggingEventId: null, dropTargetId: null });
    if (draggingEventId && dropTargetId && draggingEventId !== dropTargetId) {
      return { eventId: draggingEventId, targetId: dropTargetId };
    }
    return null;
  }, []);

  return (
    <DragContext.Provider value={{ state, startDrag, setDropTarget, endDrag, isDragging: !!state.draggingEventId }}>
      {children}
    </DragContext.Provider>
  );
}

export function useDrag() {
  const ctx = useContext(DragContext);
  if (!ctx) throw new Error('useDrag must be used within DragProvider');
  return ctx;
}
