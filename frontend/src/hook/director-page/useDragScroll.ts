import { useRef, type PointerEvent } from "react";

export const useDragScroll = (enabled: boolean) => {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    startScrollLeft: number;
    startScrollTop: number;
  }>({
    active: false,
    startX: 0,
    startY: 0,
    startScrollLeft: 0,
    startScrollTop: 0,
  });

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!enabled || event.button !== 0) {
      return;
    }

    const target = event.target as HTMLElement;
    if (target.closest('[data-page-builder-selected="true"]')) {
      return;
    }

    const container = scrollContainerRef.current;
    if (!container) {
      return;
    }

    dragStateRef.current = {
      active: true,
      startX: event.clientX,
      startY: event.clientY,
      startScrollLeft: container.scrollLeft,
      startScrollTop: container.scrollTop,
    };
    container.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const container = scrollContainerRef.current;
    if (!container || !dragStateRef.current.active) {
      return;
    }

    container.scrollLeft = dragStateRef.current.startScrollLeft - (event.clientX - dragStateRef.current.startX);
    container.scrollTop = dragStateRef.current.startScrollTop - (event.clientY - dragStateRef.current.startY);
  };

  const stopDragScroll = (event: PointerEvent<HTMLDivElement>) => {
    const container = scrollContainerRef.current;
    dragStateRef.current.active = false;
    if (container?.hasPointerCapture(event.pointerId)) {
      container.releasePointerCapture(event.pointerId);
    }
  };

  return {
    scrollContainerRef,
    dragScrollHandlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: stopDragScroll,
      onPointerCancel: stopDragScroll,
      onPointerLeave: stopDragScroll,
    },
  };
};
