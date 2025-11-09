import axiosInstance from "../api/axiosInstance";

export interface UploadResult {
  url: string;
  id: string;
  title: string;
}

export const uploadToBackend = async (files: { file: File; title: string }[]): Promise<UploadResult[]> => {
  try {
    const formData = new FormData();
    
    files.forEach(({ file }) => {
      formData.append('images', file);
    });
    
    const titles = files.map(({ title }) => title);
    formData.append('titles', JSON.stringify(titles));

    const response = await axiosInstance.post('/images/upload-files', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.images.map((img: { imageUrl: string; _id: string; title: string }) => ({
      url: img.imageUrl,
      id: img._id,
      title: img.title
    }));
  } catch (error) {
    console.error('Backend upload failed:', error);
    throw new Error('Failed to upload images to server');
  }
};
