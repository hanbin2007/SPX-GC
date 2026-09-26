import { useCallback, useRef, useState } from 'react';

/** Drag-and-drop of files onto an element, with a hover flag for styling. */
export function useFileDrop(onFiles: (files: File[]) => void, accept: (file: File) => boolean = () => true) {
  const [over, setOver] = useState(false);
  const depth = useRef(0);
  const hasFiles = (event: React.DragEvent) => [...event.dataTransfer.types].includes('Files');
  const bind = {
    onDragEnter: useCallback((event: React.DragEvent) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      depth.current += 1;
      setOver(true);
    }, []),
    onDragOver: useCallback((event: React.DragEvent) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = 'copy';
    }, []),
    onDragLeave: useCallback(() => {
      depth.current = Math.max(0, depth.current - 1);
      if (!depth.current) setOver(false);
    }, []),
    onDrop: useCallback((event: React.DragEvent) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      event.stopPropagation();
      depth.current = 0;
      setOver(false);
      const files = [...event.dataTransfer.files].filter(accept);
      if (files.length) onFiles(files);
    }, [onFiles, accept])
  };
  return { over, bind };
}
