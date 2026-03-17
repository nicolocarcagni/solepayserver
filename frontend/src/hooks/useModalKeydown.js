import { useEffect } from "react";

/**
 * Hook to handle Escape key press for modals.
 * @param {Function} onClose - Function to call when Escape is pressed.
 */
export default function useModalKeydown(onClose) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);
}
