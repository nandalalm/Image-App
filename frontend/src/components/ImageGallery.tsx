import { useState, useEffect } from "react";
import { Edit, Trash2, Save, X, Loader2 } from "lucide-react";
import ImageCard from "./ImageCard";
import ImageModal from "./ImageModal";
import { imageTitleSchema } from "../validation/imageTitleSchema";

export interface ImageItem {
  id: string;
  title: string;
  imageUrl: string;
  order: number;
  createdAt: string;
}

interface ImageGalleryProps {
  images: ImageItem[];
  totalImages: number;
  onEdit: (id: string, title: string, file?: File) => void;
  onDelete: (id: string) => void;
  onDeleteAll: () => void;
  onReorder: (images: ImageItem[]) => void;
  isLoading: boolean;
}

const ImageGallery = ({ images, totalImages, onEdit, onDelete, onDeleteAll, onReorder, isLoading }: ImageGalleryProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editFile, setEditFile] = useState<File | null>(null);
  const [editFilePreview, setEditFilePreview] = useState<string | null>(null);
  const [editFileError, setEditFileError] = useState<string>("");
  const [editTitleError, setEditTitleError] = useState<string>("");
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isProcessingFile, setIsProcessingFile] = useState<boolean>(false);
  const [draggedItem, setDraggedItem] = useState<ImageItem | null>(null);
  const [draggedOver, setDraggedOver] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalImage, setModalImage] = useState<ImageItem | null>(null);
  const [isTouchDragging, setIsTouchDragging] = useState(false);
  const [touchPos, setTouchPos] = useState<{ x: number; y: number } | null>(null);
  const [reorderMode, setReorderMode] = useState(false);

  useEffect(() => {
    return () => {
      if (editFilePreview) {
        URL.revokeObjectURL(editFilePreview);
      }
    };
  }, [editFilePreview]);

  const startEdit = (image: ImageItem) => {
    setEditingId(image.id);
    setEditTitle(image.title);
    setEditFile(null);
    setEditTitleError("");
  };

  const cancelEdit = () => {
    if (editFilePreview) {
      URL.revokeObjectURL(editFilePreview);
    }
    setEditingId(null);
    setEditTitle("");
    setEditFile(null);
    setEditFilePreview(null);
    setEditFileError("");
    setEditTitleError("");
  };

  const validateTitle = (title: string) => {
    const validation = imageTitleSchema.safeParse({ title });
    const error = validation.success ? "" : validation.error.issues[0]?.message || "";
    setEditTitleError(error);
    return validation.success;
  };
  const handleTitleChange = (title: string) => {
    setEditTitle(title);
    validateTitle(title);
  };

  const handleSave = async () => {
    if (editingId) {
      if (!validateTitle(editTitle)) {
        return; 
      }
      
      setIsEditing(true);
      try {
        await onEdit(editingId, editTitle.trim(), editFile || undefined);
        if (editFilePreview) {
          URL.revokeObjectURL(editFilePreview);
        }
        cancelEdit();
      } catch (error) {
        console.error('Edit failed:', error);
      } finally {
        setIsEditing(false);
      }
    }
  };

  const onReplaceImageSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (!file) {
      setEditFile(null);
      setEditFilePreview(null);
      setEditFileError("");
      setIsProcessingFile(false);
      return;
    }
    
    setIsProcessingFile(true);
    
    if (!file.type.startsWith("image/")) {
      setEditFile(null);
      setEditFilePreview(null);
      setEditFileError("Only image files are allowed (JPG, PNG, GIF, WebP)");
      e.currentTarget.value = "";
      setIsProcessingFile(false);
      return;
    }
    
    const previewUrl = URL.createObjectURL(file);
    
    setTimeout(() => {
      if (editFilePreview) {
        URL.revokeObjectURL(editFilePreview);
      }
      setEditFileError("");
      setEditFile(file);
      setEditFilePreview(previewUrl);
      setIsProcessingFile(false);
    }, 300);
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

    const [removed] = newImages.splice(draggedIndex, 1);
    newImages.splice(targetIndex, 0, removed);

    const reorderedImages = newImages.map((img, index) => ({
      ...img,
      order: index
    }));

    onReorder(reorderedImages);
    setDraggedItem(null);
  };

  const openModal = (image: ImageItem) => {
    if (reorderMode) return; 
    setModalImage(image);
    setModalOpen(true);
  };

  const handleTouchStartFactory = (image: ImageItem) => (e: React.TouchEvent) => {
    if (!reorderMode) return;
    const t = e.touches[0];
    setDraggedItem(image);
    setDraggedOver(image.id);
    setIsTouchDragging(true);
    if (t) setTouchPos({ x: t.clientX, y: t.clientY });
    document.body.style.overflow = 'hidden';
  };

  const handleTouchMove: React.TouchEventHandler = (e) => {
    if (!reorderMode) return;
    if (e.cancelable) e.preventDefault();
    const touch = e.touches[0];
    if (!touch) return;
    setTouchPos({ x: touch.clientX, y: touch.clientY });

    const EDGE_THRESHOLD = 60; 
    const SCROLL_STEP = 24; 
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
      <div className="mb-5">
        <div className="flex flex-col gap-3 sm:hidden">
          <h2 className="text-xl font-semibold">Your Images ({images.length})</h2>
          <div className="flex items-center gap-3">
            {totalImages > 0 && (
              <button
                onClick={onDeleteAll}
                className="px-3 py-1.5 rounded-md text-sm font-medium shadow bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                Delete All
              </button>
            )}
            <button
              onClick={() => {
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

        <div className="hidden sm:flex justify-between items-center">
          <h2 className="text-xl font-semibold">Your Images ({images.length})</h2>
          <div className="flex items-center gap-3">
            <p className="hidden md:block text-sm text-gray-500">{reorderMode ? 'Reorder mode' : 'Click card to preview'}</p>
            {totalImages > 0 && (
              <button
                onClick={onDeleteAll}
                className="px-3 py-1.5 rounded-md text-sm font-medium shadow bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                Delete All
              </button>
            )}
            <button
              onClick={() => {
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
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((image) => (
          editingId === image.id ? (
            <div
              key={image.id}
              className="rounded-xl bg-white border shadow-sm transition-all sm:col-span-2 md:col-span-2 lg:col-span-2"
            >
              <button
                type="button"
                onClick={() => openModal(image)}
                className="block w-full"
                aria-label={`Open ${image.title}`}
              >
                <div className="relative w-full h-36 sm:h-40 md:h-44 rounded-t-xl overflow-hidden">
                  <img
                    src={editFilePreview || image.imageUrl}
                    alt={image.title}
                    className="w-full h-full object-cover"
                  />
                  {editFilePreview && (
                    <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-md">
                      Preview
                    </div>
                  )}
                </div>
              </button>

              <div className="p-3 md:p-4 space-y-3">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 text-sm ${
                    editTitleError 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  placeholder="Enter image title"
                />
                {editTitleError && (
                  <p className="text-xs text-red-600 mt-1">{editTitleError}</p>
                )}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Replace Image (Optional)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={onReplaceImageSelected}
                    disabled={isProcessingFile}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  {isProcessingFile && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-blue-600">
                      <Loader2 size={16} className="animate-spin" />
                      Processing image...
                    </div>
                  )}
                  {editFileError && (
                    <p className="mt-2 text-sm text-red-600">{editFileError}</p>
                  )}
                </div>
                <div className="flex gap-2 flex-col sm:flex-row">
                  <button
                    onClick={handleSave}
                    disabled={isEditing || isProcessingFile}
                    className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-3 py-2 rounded-md text-sm font-medium flex items-center justify-center gap-1 transition-colors"
                  >
                    {isEditing ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Save size={16} />
                    )}
                    {isEditing ? 'Saving...' : 'Save'}
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
