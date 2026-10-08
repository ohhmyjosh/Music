import { useUiStore } from "../../store/uiStore";

// Bottom-left snackbars, like YouTube Music's "Saved to Liked Music".
export default function Toasts() {
  const toasts = useUiStore((state) => state.toasts);
  const dismiss = useUiStore((state) => state.dismissToast);
  if (!toasts.length) return null;

  return (
    <div className="pointer-events-none fixed bottom-[calc(var(--mobile-nav-h)+var(--mobile-mini-h)+env(safe-area-inset-bottom)+12px)] left-3 right-3 z-[90] flex flex-col items-start gap-2 lg:bottom-[calc(var(--player-h)+16px)] lg:left-6">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className="pointer-events-auto flex max-w-md animate-pop-in items-center gap-4 rounded bg-[#e8e8e8] px-4 py-3 text-sm font-medium text-black shadow-xl"
        >
          <span>{toast.message}</span>
          {toast.action ? (
            <button
              className="shrink-0 font-bold uppercase text-accent-700"
              onClick={() => {
                toast.action.run();
                dismiss(toast.id);
              }}
            >
              {toast.action.label}
            </button>
          ) : null}
        </div>
      ))}
    </div>
  );
}
