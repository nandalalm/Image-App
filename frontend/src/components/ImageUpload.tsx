import { useState } from "react";
import { Plus, X, Loader2, Upload } from "lucide-react";
import { ImageApi } from "../services";
import type { ImageUploadData } from "../types/image";
import { useToast } from "../hooks/useToast";
import { imageTitleSchema } from "../validation/imageTitleSchema";

interface ImageWithTitle {
  file: File;
  title: string;
  preview: string;
  id: string;
  titleError?: string;
}

interface ImageUploadProps {
  onUpload: () => void; 
  onUploadStart?: () => void; 
  onUploadEnd?: () => void; 
}

const ImageUpload = ({ onUpload, onUploadStart, onUploadEnd }: ImageUploadProps) => {
  const [selectedImages, setSelectedImages] = useState<ImageWithTitle[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const { show } = useToast();
  const [errorText, setErrorText] = useState<string>("");
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const newImages: ImageWithTitle[] = [];
    Array.from(files).forEach((file) => {
      const id = Math.random().toString(36).substr(2, 9);
      
      let preview = '';
      if (file.type.startsWith('image/')) {
        preview = URL.createObjectURL(file);
      }
      
      let defaultTitle = file.name.split('.')[0]; 
      defaultTitle = defaultTitle
        .replace(/[-_]/g, ' ') 
        .replace(/\s+/g, ' ') 
        .trim(); 
      
      if (!/^[A-Za-z0-9\s]+$/.test(defaultTitle)) {
        defaultTitle = 'Image Title';
      }
      
      newImages.push({
        file,
        title: defaultTitle,
        preview,
        id
      });
    });

    setSelectedImages(prev => [...prev, ...newImages]);
    setErrorText(""); 
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
    const validation = imageTitleSchema.safeParse({ title });
    const titleError = validation.success ? undefined : validation.error.issues[0]?.message;

    setSelectedImages(prev =>
      prev.map(img => img.id === id ? { ...img, title, titleError } : img)
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
    if (selectedImages.length === 0) {
      show('Please select at least one image to upload', 'error');
      return;
    }

    const validationErrors: string[] = [];
    const invalidFiles: string[] = [];
    const titleErrors: string[] = [];

    selectedImages.forEach((img, index) => {
      const fileNumber = index + 1;
      
      if (!img.file.type.startsWith('image/')) {
        invalidFiles.push(`File ${fileNumber}: "${img.file.name}" is not a valid image file`);
      }
      
      const title = img.title.trim();
      if (!title) {
        titleErrors.push(`File ${fileNumber}: Title cannot be empty`);
      } else {
        if (!/^[A-Za-z0-9\s]+$/.test(title)) {
          titleErrors.push(`File ${fileNumber}: Title must contain only letters, numbers, and spaces`);
        }
        if (title.length > 50) {
          titleErrors.push(`File ${fileNumber}: Title must be 50 characters or less`);
        }
        if (title !== img.title.trim() || img.title.startsWith(' ') || img.title.endsWith(' ')) {
          titleErrors.push(`File ${fileNumber}: Title cannot have leading or trailing spaces`);
        }
      }
    });

    validationErrors.push(...invalidFiles, ...titleErrors);

    if (validationErrors.length > 0) {
      const errorMessage = validationErrors.length === 1 
        ? validationErrors[0]
        : `Please fix the following errors:\n• ${validationErrors.join('\n• ')}`;
      
      show(errorMessage, 'error');
      
      setSelectedImages(prev => prev.map((img) => {
        const title = img.title.trim();
        let titleError = '';
        
        if (!title) {
          titleError = 'Title cannot be empty';
        } else if (!/^[A-Za-z0-9\s]+$/.test(title)) {
          titleError = 'Title must contain only letters, numbers, and spaces';
        } else if (title.length > 50) {
          titleError = 'Title must be 50 characters or less';
        } else if (title !== img.title.trim() || img.title.startsWith(' ') || img.title.endsWith(' ')) {
          titleError = 'Title cannot have leading or trailing spaces';
        }
        
        return { ...img, titleError };
      }));
      
      return;
    }

    try {
      setIsUploading(true);
      onUploadStart?.();
      
      const uploadData: ImageUploadData[] = selectedImages.map(img => ({
        file: img.file,
        title: img.title.trim()
      }));
      
      await ImageApi.uploadImages(uploadData);
      
      onUpload();
      
      selectedImages.forEach(img => URL.revokeObjectURL(img.preview));
      setSelectedImages([]);
      show('Images uploaded successfully!', 'success');
    } catch (error) {
      console.error('Upload failed:', error);
      show('Upload failed. Please try again.', 'error');
    } finally {
      setIsUploading(false);
      onUploadEnd?.();
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
              <div key={image.id} className={`border rounded-xl p-3 ${!image.file.type.startsWith('image/') ? 'bg-red-50 border-red-200' : 'bg-gray-50/70'}`}>
                <div className="relative mb-2">
                  {image.file.type.startsWith('image/') ? (
                    <img
                      src={image.preview}
                      alt={image.title}
                      className="w-full h-28 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-28 bg-red-100 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-red-500 text-2xl mb-1">⚠️</div>
                        <div className="text-red-600 text-xs">Invalid file type</div>
                        <div className="text-red-500 text-xs">{image.file.type || 'Unknown'}</div>
                      </div>
                    </div>
                  )}
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
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                    image.titleError 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                />
                {image.titleError && (
                  <p className="text-xs text-red-600 mt-1">{image.titleError}</p>
                )}
              </div>
            ))}
          </div>
          
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-md font-medium transition-colors flex items-center gap-2 shadow"
            >
              {isUploading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Plus size={20} />
              )}
              {isUploading ? 'Uploading...' : `Upload ${selectedImages.length} Image${selectedImages.length > 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
