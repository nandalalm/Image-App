import React, { useEffect } from "react";
import type { ImageItem } from "./ImageGallery";

interface ImageModalProps {
  open: boolean;
  image: ImageItem | null;
  onClose: () => void;
}

const ImageModal: React.FC<ImageModalProps> = ({ open, image, onClose }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !image) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
        aria-label="Close modal backdrop"
      />
      <div className="relative h-full w-full flex items-center justify-center p-4">
        <div className="relative max-w-5xl w-full">
          <img
            src={image.imageUrl}
            alt={image.title}
            className="w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
          />
          {image.title && (
            <div className="absolute bottom-3 left-3 right-3 bg-black/60 text-white text-sm px-3 py-2 rounded-md">
              {image.title}
            </div>
          )}
          <button
            onClick={onClose}
            className="absolute -top-3 -right-3 bg-white text-gray-900 rounded-full w-8 h-8 shadow flex items-center justify-center hover:bg-gray-100"
            aria-label="Close image"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageModal;
