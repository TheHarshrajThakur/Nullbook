import React, { useState, useRef } from 'react';

interface PanelSplitterProps {
  direction?: 'col' | 'row';
  onDrag: (e: { clientX: number; clientY: number; deltaX: number; deltaY: number }) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onDoubleClick?: () => void;
  title?: string;
  className?: string;
}

export const PanelSplitter: React.FC<PanelSplitterProps> = ({
  direction = 'col',
  onDrag,
  onDragStart,
  onDragEnd,
  onDoubleClick,
  title,
  className = ''
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only respond to primary (left) mouse button or single touch
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();

    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    onDragStart?.();

    const cursorType = direction === 'col' ? 'col-resize' : 'row-resize';
    document.body.style.cursor = cursorType;
    document.body.style.userSelect = 'none';

    const handlePointerMove = (moveEvent: PointerEvent) => {
      if (!dragStartRef.current) return;
      const deltaX = moveEvent.clientX - dragStartRef.current.x;
      const deltaY = moveEvent.clientY - dragStartRef.current.y;
      dragStartRef.current = { x: moveEvent.clientX, y: moveEvent.clientY };

      onDrag({
        clientX: moveEvent.clientX,
        clientY: moveEvent.clientY,
        deltaX,
        deltaY
      });
    };

    const handlePointerUp = () => {
      setIsDragging(false);
      dragStartRef.current = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      onDragEnd?.();
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  return (
    <>
      <div
        onPointerDown={handlePointerDown}
        onDoubleClick={onDoubleClick}
        title={title || (direction === 'col' ? 'Drag to resize tab • Double-click to reset' : 'Drag to resize • Double-click to reset')}
        className={`hidden lg:block ${direction === 'col' ? 'vscode-splitter-col' : 'vscode-splitter-row'} ${
          isDragging ? 'is-dragging' : ''
        } ${className}`}
        role="separator"
        aria-orientation={direction === 'col' ? 'vertical' : 'horizontal'}
      />
      {/* Invisible global overlay to catch pointer movements smoothly over iframes/textareas */}
      {isDragging && (
        <div
          className="fixed inset-0 z-50 pointer-events-none"
          style={{ cursor: direction === 'col' ? 'col-resize' : 'row-resize' }}
        />
      )}
    </>
  );
};
