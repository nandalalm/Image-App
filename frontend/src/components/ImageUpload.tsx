import { useState } from "react";
import { Plus, X, Upload } from "lucide-react";
import { uploadToBackend } from "../utils/s3Upload";
import { useToast } from "./ToastProvider";

interface ImageWithTitle {
  file: File;
  title: string;
  preview: string;
  id: string;
}

interface ImageUploadProps {
  onUpload: () => void; // Just trigger refresh after upload
  isUploading: boolean;
}

const ImageUpload = ({ onUpload, isUploading }: ImageUploadProps) => {
  const [selectedImages, setSelectedImages] = useState<ImageWithTitle[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const { show } = useToast();
  const [errorText, setErrorText] = useState<string>("");

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const newImages: ImageWithTitle[] = [];
    let rejected = 0;
    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        const id = Math.random().toString(36).substr(2, 9);
        const preview = URL.createObjectURL(file);
        newImages.push({
          file,
          title: file.name.split('.')[0], // Default title from filename
          preview,
          id
        });
      } else {
        rejected++;
      }
    });

    setSelectedImages(prev => [...prev, ...newImages]);

    if (rejected > 0) {
      setErrorText("Only image files are allowed (JPG, PNG, GIF, WebP)");
    } else {
      setErrorText("");
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const updateTitle = (id: string, title: string) => {
    setSelectedImages(prev =>
      prev.map(img => img.id === id ? { ...img, title } : img)
    );
  };

  const removeImage = (id: string) => {
    setSelectedImages(prev => {
      const imageToRemove = prev.find(img => img.id === id);
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.preview);
      }
      return prev.filter(img => img.id !== id);
    });
  };

  const handleUpload = async () => {
    if (selectedImages.length > 0) {
      try {
        // Upload to backend (which handles S3)
        const uploadData = selectedImages.map(img => ({
          file: img.file,
          title: img.title
        }));
        
        await uploadToBackend(uploadData);
        
        // Trigger refresh in parent component
        onUpload();
        
        // Clear selected images after upload
        selectedImages.forEach(img => URL.revokeObjectURL(img.preview));
        setSelectedImages([]);
        show('Images uploaded', 'success');
      } catch (error) {
        console.error('Upload failed:', error);
        show('Upload failed. Please try again.', 'error');
      }
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur rounded-2xl shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Add Images</h2>
      
      {/* File Drop Zone */}
      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          dragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-lg font-medium text-gray-700 mb-2">
          Drop images here or click to select
        </p>
        <p className="text-sm text-gray-500 mb-4">
          Support for multiple images (JPG, PNG, GIF, WebP)
        </p>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
          id="file-upload"
        />
        <label
          htmlFor="file-upload"
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md cursor-pointer inline-block transition-colors shadow"
        >
          Select Images
        </label>
        {errorText && (
          <p className="mt-3 text-sm text-red-600">{errorText}</p>
        )}
      </div>

      {/* Selected Images Preview */}
      {selectedImages.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-4">Selected Images ({selectedImages.length})</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {selectedImages.map((image) => (
              <div key={image.id} className="border rounded-xl p-3 bg-gray-50/70">
                <div className="relative mb-2">
                  <img
                    src={image.preview}
                    alt={image.title}
                    className="w-full h-28 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => removeImage(image.id)}
                    className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 shadow"
                  >
                    <X size={16} />
                  </button>
                </div>
                <input
                  type="text"
                  value={image.title}
                  onChange={(e) => updateTitle(image.id, e.target.value)}
                  placeholder="Enter image title"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}
          </div>
          
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-md font-medium transition-colors flex items-center gap-2 shadow"
            >
              <Plus size={20} />
              {isUploading ? 'Uploading...' : `Upload ${selectedImages.length} Image${selectedImages.length > 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
