import { useState, useEffect } from "react";
import { useAppSelector } from "../redux/store";
import Navbar from "../components/Navbar";
import ImageUpload from "../components/ImageUpload";
import ImageGallery from "../components/ImageGallery";
import type { ImageItem } from "../components/ImageGallery";
import axiosInstance from "../api/axiosInstance";
import { useRef } from "react";
import { useToast } from "../components/ToastProvider";
import ConfirmDialog from "../components/ConfirmDialog";


const Home = () => {
  const { user } = useAppSelector((state) => state.auth);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [isUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const didFetchRef = useRef(false);
  const { show } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  // Fetch user images on component mount (guarded to avoid duplicate fetch in StrictMode)
  useEffect(() => {
    if (didFetchRef.current) return;
    didFetchRef.current = true;
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      setIsLoading(true);
      const response = await axiosInstance.get("/images/my-images");
      setImages(response.data.images || []);
    } catch (error) {
      console.error("Failed to fetch images:", error);
      setImages([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async () => {
    // Just refresh the images list since upload is handled by ImageUpload component
    await fetchImages();
  };

  const handleEdit = async (id: string, title: string, file?: File) => {
    try {
      if (file) {
        // For file updates, we'll use FormData to send to backend
        const formData = new FormData();
        formData.append('title', title);
        formData.append('image', file);

        await axiosInstance.put(`/images/update/${id}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        // For title-only updates
        await axiosInstance.put(`/images/update/${id}`, { title });
      }

      // Refresh images list
      await fetchImages();
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
      const orderData = reorderedImages.map((img, index) => ({
        id: img.id,
        order: index
      }));

      await axiosInstance.patch("/images/reorder-images", { images: orderData });
      setImages(reorderedImages);
      show("Order saved", "success");
    } catch (error) {
      console.error("Reorder failed:", error);
      show("Failed to save new order", "error");
      // Refresh to get original order back
      await fetchImages();
    }
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
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-indigo-600 to-fuchsia-600 rounded-2xl shadow-lg p-8 mb-8 text-white">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {getUserName()}! 👋
          </h1>
          <p className="text-indigo-100 text-lg">
            Manage your image collection with ease. Upload, organize, and share your memories.
          </p>
        </div>

        {/* Image Upload Section */}
        <div className="mb-8">
          <ImageUpload onUpload={handleUpload} isUploading={isUploading} />
        </div>

        {/* Image Gallery Section */}
        <ImageGallery
          images={images}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onReorder={handleReorder}
          isLoading={isLoading}
        />
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete image?"
        description="This action cannot be undone."
        confirmText="Delete"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={async () => {
          if (!pendingDeleteId) return;
          try {
            await axiosInstance.delete(`/images/delete/${pendingDeleteId}`);
            await fetchImages();
            show("Image deleted", "success");
          } catch (err) {
            console.error("Delete failed:", err);
            show("Failed to delete image", "error");
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
