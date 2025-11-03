export function FileDropOverlay({ isVisible }: { isVisible: boolean }) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm pointer-events-none">
      <div className="text-white text-xl font-medium">📁 Drop your files anywhere</div>
    </div>
  );
}
