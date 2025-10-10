import React from "react";
import { GripVertical } from "lucide-react";
import type { ImageItem } from "./ImageGallery";

interface ImageCardProps {
  image: ImageItem;
  onClick: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  dragged: boolean;
  draggedOver: boolean;
  actions: React.ReactNode; // edit/delete controls
  onTouchStart?: (e: React.TouchEvent) => void;
  onTouchMove?: (e: React.TouchEvent) => void;
  onTouchEnd?: (e: React.TouchEvent) => void;
  draggableEnabled?: boolean;
}

const ImageCard: React.FC<ImageCardProps> = ({
  image,
  onClick,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  dragged,
  draggedOver,
  actions,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  draggableEnabled = true,
}) => {
  return (
    <div
      data-id={image.id}
      draggable={draggableEnabled}
      onDragStart={draggableEnabled ? onDragStart : undefined}
      onDragOver={draggableEnabled ? onDragOver : undefined}
      onDragLeave={draggableEnabled ? onDragLeave : undefined}
      onDrop={draggableEnabled ? onDrop : undefined}
      onTouchStart={draggableEnabled ? onTouchStart : undefined}
      onTouchMove={draggableEnabled ? onTouchMove : undefined}
      onTouchEnd={draggableEnabled ? onTouchEnd : undefined}
      className={[
        "rounded-xl bg-white border shadow-sm transition-all",
        draggableEnabled ? "cursor-move" : "cursor-pointer",
        "hover:shadow-md",
        dragged ? "opacity-50" : "",
        draggedOver ? "border-blue-500 bg-blue-50" : "",
      ].join(" ")}
    >
      <div className="flex items-center justify-between px-3 pt-2">
        <GripVertical className={`text-gray-400 ${draggableEnabled ? '' : 'opacity-30'}`} size={18} />
        <div className="flex gap-1">{actions}</div>
      </div>
      <button
        type="button"
        onClick={onClick}
        className="block w-full px-3 pb-3"
        aria-label={`Open ${image.title}`}
      >
        <div className="relative w-full h-40 rounded-lg overflow-hidden">
          <img
            src={image.imageUrl}
            alt={image.title}
            className="w-full h-full object-cover transform transition-transform duration-200 hover:scale-[1.03]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
          <div className="absolute bottom-2 left-2 right-2 text-left">
            <p className="text-white text-sm font-medium truncate">{image.title}</p>
          </div>
        </div>
      </button>
    </div>
  );
};

export default ImageCard;
