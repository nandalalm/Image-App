// Backend upload utility - sends files to backend for S3 processing
import axiosInstance from "../api/axiosInstance";

export interface UploadResult {
  url: string;
  id: string;
  title: string;
}

export const uploadToBackend = async (files: { file: File; title: string }[]): Promise<UploadResult[]> => {
  try {
    const formData = new FormData();
    
    // Add files to FormData
    files.forEach(({ file }) => {
      formData.append('images', file);
    });
    
    // Add titles as array
    const titles = files.map(({ title }) => title);
    titles.forEach((title) => {
      formData.append('titles', title);
    });

    const response = await axiosInstance.post('/images/upload-files', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.images.map((img: any) => ({
      url: img.imageUrl,
      id: img._id,
      title: img.title
    }));
  } catch (error) {
    console.error('Backend upload failed:', error);
    throw new Error('Failed to upload images to server');
  }
};
