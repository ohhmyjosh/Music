import { MoreVertical } from "lucide-react";
import clsx from "clsx";
import { useUiStore } from "../../store/uiStore";

// Opens the shared "⋮" menu for a song or a catalog card (album, playlist,
// artist). Right-click opens it at the pointer; the button anchors it to itself.
export function openItemMenu(event, item, context = {}) {
  event.preventDefault();
  event.stopPropagation();
  const fromPointer = event.type === "contextmenu";
  const rect = fromPointer ? null : event.currentTarget.getBoundingClientRect();
  useUiStore.getState().openMenu({
    item,
    x: fromPointer ? event.clientX : rect.right,
    y: fromPointer ? event.clientY : rect.bottom,
    context
  });
}

export default function MenuButton({ item, context, className, size = 20, label = "More actions" }) {
  return (
    <button
      className={clsx("icon-btn", className)}
      aria-label={label}
      onClick={(event) => openItemMenu(event, item, context)}
    >
      <MoreVertical size={size} />
    </button>
  );
}
