import { useState, useEffect, useCallback } from "react";
import { useAppSelector } from "../redux/store";
import Navbar from "../components/Navbar";
import ImageUpload from "../components/ImageUpload";
import ImageGallery from "../components/ImageGallery";
import { ImageApi } from "../services";
import type { ImageItem, ImageUpdateData, ImageOrderUpdate } from "../types/image";
import { useRef } from "react";
import { useToast } from "../hooks/useToast";
import ConfirmDialog from "../components/ConfirmDialog";


const Home = () => {
  const { user } = useAppSelector((state) => state.auth);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalImages, setTotalImages] = useState(0);
  const didFetchRef = useRef(false);
  const { show } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const fetchImages = useCallback(async (page = 1, append = false) => {
    try {
      if (!append) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      const result = await ImageApi.getUserImages({ page, limit: 8 });
      const newImages = result.data;
      const pagination = result.pagination;

      if (append) {
        setImages(prev => [...prev, ...newImages]);
      } else {
        setImages(newImages);
      }

      setHasMore(pagination?.hasMore || false);
      setTotalImages(pagination?.totalImages || 0);
      setCurrentPage(page);
    } catch (error) {
      console.error("Failed to fetch images:", error);
      show("Failed to load images", "error");
    } finally {
      if (!append) {
        setIsLoading(false);
      } else {
        setIsLoadingMore(false);
      }
    }
  }, [show]);

  useEffect(() => {
    if (didFetchRef.current) return;
    didFetchRef.current = true;
    fetchImages();
  }, [fetchImages]);

  const handleUpload = async () => {
    await fetchImages();
  };

  const handleLoadMore = async () => {
    await fetchImages(currentPage + 1, true);
  };

  const handleEdit = async (id: string, title: string, file?: File) => {
    try {
      const updateData: ImageUpdateData = { title, file };
      const updatedImage = await ImageApi.updateImage(id, updateData);

      setImages(prev => prev.map(img => {
        if (img.id !== id) return img;

        if (file) {
          return { ...updatedImage, imageUrl: `${updatedImage.imageUrl}&v=${Date.now()}` };
        } else {
          const currentUrl = img.imageUrl;
          const hasVersion = currentUrl.includes('&v=');
          return {
            ...updatedImage,
            imageUrl: hasVersion ? currentUrl : updatedImage.imageUrl
          };
        }
      }));
      show("Image updated", "success");
    } catch (error) {
      console.error("Edit failed:", error);
      show("Failed to edit image", "error");
    }
  };

  const handleDelete = async (id: string) => {
    setPendingDeleteId(id);
    setConfirmOpen(true);
  };

  const handleReorder = async (reorderedImages: ImageItem[]) => {
    try {
      const orderData: ImageOrderUpdate[] = reorderedImages.map((img, index) => ({
        id: img.id,
        order: index
      }));

      await ImageApi.reorderImages(orderData);
      setImages(reorderedImages);
      show("Order saved", "success");
    } catch (error) {
      console.error("Reorder failed:", error);
      show("Failed to save new order", "error");
      await fetchImages();
    }
  };

  const handleDeleteAll = () => {
    if (totalImages === 0) return;

    setPendingDeleteId('DELETE_ALL');
    setConfirmOpen(true);
  };

  const getUserName = () => {
    if (user?.firstName) {
      return user?.lastName ? `${user.firstName} ${user.lastName}` : user.firstName;
    }
    if (!user?.email) return "User";
    return user.email.split('@')[0];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-pink-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gradient-to-r from-indigo-600 to-fuchsia-600 rounded-2xl shadow-lg p-8 mb-8 text-white">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {getUserName()}! 👋
          </h1>
          <p className="text-indigo-100 text-lg">
            Manage your image collection with ease. Upload, organize, and share your memories.
          </p>
        </div>

        <div className="mb-8">
          <ImageUpload onUpload={handleUpload} />
        </div>

        <ImageGallery
          images={images}
          totalImages={totalImages}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onDeleteAll={handleDeleteAll}
          onReorder={handleReorder}
          isLoading={isLoading}
        />

        {hasMore && !isLoading && images.length > 0 && (
          <div className="flex justify-center mt-8">
            <button
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-8 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              {isLoadingMore ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Loading...
                </>
              ) : (
                `Load More (${totalImages - images.length} remaining)`
              )}
            </button>
          </div>
        )}

        {!isLoading && images.length > 0 && (
          <div className="text-center mt-4 text-gray-600 text-sm">
            Showing {images.length} of {totalImages} images
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title={pendingDeleteId === 'DELETE_ALL' ? "Delete all images?" : "Delete image?"}
        description={
          pendingDeleteId === 'DELETE_ALL'
            ? `This will permanently delete all ${totalImages} images from your account. This action cannot be undone.`
            : "This action cannot be undone."
        }
        confirmText="Delete"
        onCancel={() => {
          setConfirmOpen(false);
          setPendingDeleteId(null);
        }}
        onConfirm={async () => {
          if (!pendingDeleteId) return;
          try {
            if (pendingDeleteId === 'DELETE_ALL') {
              const response = await ImageApi.deleteAllImages();
              const deletedCount = response.deletedCount || totalImages;
              await fetchImages();
              show(`All ${deletedCount} images deleted successfully`, "success");
            } else {
              await ImageApi.deleteImage(pendingDeleteId);
              setImages(prev => prev.filter(img => img.id !== pendingDeleteId));
              setTotalImages(prev => prev - 1);
              show("Image deleted", "success");
            }
          } catch (err) {
            console.error("Delete failed:", err);
            show(
              pendingDeleteId === 'DELETE_ALL'
                ? "Failed to delete all images"
                : "Failed to delete image",
              "error"
            );
          } finally {
            setConfirmOpen(false);
            setPendingDeleteId(null);
          }
        }}
      />
    </div>
  );
};

export default Home;
