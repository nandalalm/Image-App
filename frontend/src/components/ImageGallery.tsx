import { useState } from "react";
import { Edit, Trash2, Save, X } from "lucide-react";
import ImageCard from "./ImageCard";
import ImageModal from "./ImageModal";

export interface ImageItem {
  id: string;
  title: string;
  imageUrl: string;
  order: number;
  createdAt: string;
}

interface ImageGalleryProps {
  images: ImageItem[];
  onEdit: (id: string, title: string, file?: File) => void;
  onDelete: (id: string) => void;
  onReorder: (images: ImageItem[]) => void;
  isLoading: boolean;
}

const ImageGallery = ({ images, onEdit, onDelete, onReorder, isLoading }: ImageGalleryProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editFile, setEditFile] = useState<File | null>(null);
  const [editFileError, setEditFileError] = useState<string>("");
  const [draggedItem, setDraggedItem] = useState<ImageItem | null>(null);
  const [draggedOver, setDraggedOver] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalImage, setModalImage] = useState<ImageItem | null>(null);
  // Touch drag UI state
  const [isTouchDragging, setIsTouchDragging] = useState(false);
  const [touchPos, setTouchPos] = useState<{ x: number; y: number } | null>(null);
  // Reorder mode toggle
  const [reorderMode, setReorderMode] = useState(false);

  const startEdit = (image: ImageItem) => {
    setEditingId(image.id);
    setEditTitle(image.title);
    setEditFile(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
    setEditFile(null);
    setEditFileError("");
  };

  const saveEdit = () => {
    if (editingId) {
      onEdit(editingId, editTitle, editFile || undefined);
      cancelEdit();
    }
  };

  const onReplaceImageSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (!file) {
      setEditFile(null);
      setEditFileError("");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setEditFile(null);
      setEditFileError("Only image files are allowed (JPG, PNG, GIF, WebP)");
      // reset input value so user can re-select
      e.currentTarget.value = "";
      return;
    }
    setEditFileError("");
    setEditFile(file);
  };

  const handleDragStart = (e: React.DragEvent, image: ImageItem) => {
    setDraggedItem(image);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDraggedOver(targetId);
  };

  const handleDragLeave = () => {
    setDraggedOver(null);
  };

  const handleDrop = (e: React.DragEvent, targetImage: ImageItem) => {
    e.preventDefault();
    setDraggedOver(null);

    if (!draggedItem || draggedItem.id === targetImage.id) {
      setDraggedItem(null);
      return;
    }

    const newImages = [...images];
    const draggedIndex = newImages.findIndex(img => img.id === draggedItem.id);
    const targetIndex = newImages.findIndex(img => img.id === targetImage.id);

    // Remove dragged item and insert at target position
    const [removed] = newImages.splice(draggedIndex, 1);
    newImages.splice(targetIndex, 0, removed);

    // Update order values
    const reorderedImages = newImages.map((img, index) => ({
      ...img,
      order: index
    }));

    onReorder(reorderedImages);
    setDraggedItem(null);
  };

  const openModal = (image: ImageItem) => {
    if (reorderMode) return; // disable preview during reorder
    setModalImage(image);
    setModalOpen(true);
  };

  // Touch drag support for mobile/tablet
  const handleTouchStartFactory = (image: ImageItem) => (e: React.TouchEvent) => {
    if (!reorderMode) return;
    const t = e.touches[0];
    setDraggedItem(image);
    setDraggedOver(image.id);
    setIsTouchDragging(true);
    if (t) setTouchPos({ x: t.clientX, y: t.clientY });
    // lock body scroll while dragging
    document.body.style.overflow = 'hidden';
  };

  const handleTouchMove: React.TouchEventHandler = (e) => {
    if (!reorderMode) return;
    // Prevent scroll while dragging
    if (e.cancelable) e.preventDefault();
    const touch = e.touches[0];
    if (!touch) return;
    setTouchPos({ x: touch.clientX, y: touch.clientY });

    // Edge auto-scroll when finger near top/bottom of viewport
    const EDGE_THRESHOLD = 60; // px
    const SCROLL_STEP = 24; // px per event
    if (touch.clientY < EDGE_THRESHOLD) {
      window.scrollBy({ top: -SCROLL_STEP, behavior: 'auto' });
    } else if (touch.clientY > window.innerHeight - EDGE_THRESHOLD) {
      window.scrollBy({ top: SCROLL_STEP, behavior: 'auto' });
    }
    const el = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement | null;
    const card = el?.closest('[data-id]') as HTMLElement | null;
    const targetId = card?.getAttribute('data-id');
    if (targetId && targetId !== draggedOver) {
      setDraggedOver(targetId);
    }
  };

  const handleTouchEnd = () => {
    if (!reorderMode) return;
    if (!draggedItem || !draggedOver) {
      setDraggedItem(null);
      setDraggedOver(null);
      setIsTouchDragging(false);
      setTouchPos(null);
      document.body.style.overflow = '';
      return;
    }
    const targetImage = images.find((img) => img.id === draggedOver);
    if (targetImage && draggedItem.id !== targetImage.id) {
      const newImages = [...images];
      const draggedIndex = newImages.findIndex((img) => img.id === draggedItem.id);
      const targetIndex = newImages.findIndex((img) => img.id === targetImage.id);
      const [removed] = newImages.splice(draggedIndex, 1);
      newImages.splice(targetIndex, 0, removed);
      const reorderedImages = newImages.map((img, index) => ({ ...img, order: index }));
      onReorder(reorderedImages);
    }
    setDraggedItem(null);
    setDraggedOver(null);
    setIsTouchDragging(false);
    setTouchPos(null);
    document.body.style.overflow = '';
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="border rounded-lg p-4">
                <div className="h-48 bg-gray-200 rounded mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Your Images</h2>
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📷</div>
          <p className="text-gray-500 text-lg">No images uploaded yet</p>
          <p className="text-gray-400 text-sm">Upload some images to get started!</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-2xl shadow-md p-6 ${isTouchDragging ? 'touch-none' : ''}`}>
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-xl font-semibold">Your Images ({images.length})</h2>
        <div className="flex items-center gap-3">
          <p className="hidden sm:block text-sm text-gray-500">{reorderMode ? 'Reorder mode' : 'Click card to preview'}</p>
          <button
            onClick={() => {
              // exiting reorder mode should clear any drag state
              if (reorderMode) {
                setDraggedItem(null);
                setDraggedOver(null);
                setIsTouchDragging(false);
                setTouchPos(null);
                document.body.style.overflow = '';
              }
              setReorderMode((v) => !v);
            }}
            className={`px-3 py-1.5 rounded-md text-sm font-medium shadow ${
              reorderMode ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {reorderMode ? 'Done' : 'Reorder'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((image) => (
          editingId === image.id ? (
            <div
              key={image.id}
              className="rounded-xl bg-white border shadow-sm transition-all sm:col-span-2 md:col-span-2 lg:col-span-2"
            >
              {/* Top: preview (click still opens modal) */}
              <button
                type="button"
                onClick={() => openModal(image)}
                className="block w-full"
                aria-label={`Open ${image.title}`}
              >
                <div className="relative w-full h-36 sm:h-40 md:h-44 rounded-t-xl overflow-hidden">
                  <img
                    src={image.imageUrl}
                    alt={image.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              </button>

              {/* Inline edit area within card */}
              <div className="p-3 md:p-4 space-y-3">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Enter image title"
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Replace Image (optional)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={onReplaceImageSelected}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {editFileError && (
                    <p className="mt-2 text-sm text-red-600">{editFileError}</p>
                  )}
                </div>
                <div className="flex gap-2 flex-col sm:flex-row">
                  <button
                    onClick={saveEdit}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-md text-sm font-medium flex items-center justify-center gap-1"
                  >
                    <Save size={16} />
                    Save
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded-md text-sm font-medium flex items-center justify-center gap-1"
                  >
                    <X size={16} />
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <ImageCard
              key={image.id}
              image={image}
              onClick={() => openModal(image)}
              onDragStart={(e) => handleDragStart(e, image)}
              onDragOver={(e) => handleDragOver(e, image.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, image)}
              dragged={draggedItem?.id === image.id}
              draggedOver={draggedOver === image.id}
              onTouchStart={handleTouchStartFactory(image)}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              draggableEnabled={reorderMode}
              actions={
                <>
                  <button
                    onClick={(ev) => { ev.stopPropagation(); if (!reorderMode) startEdit(image); }}
                    className="text-blue-500 hover:text-blue-700 p-1"
                    title="Edit"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={(ev) => { ev.stopPropagation(); if (!reorderMode) onDelete(image.id); }}
                    className="text-red-500 hover:text-red-700 p-1"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </>
              }
            />
          )
        ))}
      </div>

      {/* Floating preview that follows finger during touch drag */}
      {isTouchDragging && draggedItem && touchPos && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{ left: touchPos.x + 8, top: touchPos.y + 8 }}
        >
          <div className="w-28 h-20 rounded-lg overflow-hidden shadow-lg ring-2 ring-blue-400/60 bg-white">
            <img
              src={draggedItem.imageUrl}
              alt={draggedItem.title}
              className="w-full h-full object-cover opacity-90"
            />
          </div>
        </div>
      )}

      <ImageModal open={modalOpen} image={modalImage} onClose={() => setModalOpen(false)} />
    </div>
  );
};

export default ImageGallery;
