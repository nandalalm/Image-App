import axiosInstance from "../api/axiosInstance";
import type {
  ImageItem,
  ImageUploadData,
  ImageUpdateData,
  ImageOrderUpdate,
  UploadResult,
  DeleteAllResponse
} from "../types/image";
import type { PaginationParams, PaginatedResponse } from "../types/api";

export class ImageApi {
 
  static async getUserImages(params: PaginationParams = {}): Promise<PaginatedResponse<ImageItem>> {
    const { page = 1, limit = 6 } = params;
    const response = await axiosInstance.get(`/images/my-images?page=${page}&limit=${limit}`);
    
    return {
      data: response.data.images || [],
      pagination: response.data.pagination
    };
  }

  static async uploadImages(files: ImageUploadData[]): Promise<UploadResult[]> {
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
  }

  static async updateImage(id: string, data: ImageUpdateData): Promise<ImageItem> {
    if (data.file) {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('image', data.file);

      const response = await axiosInstance.put(`/images/update/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } else {
      const response = await axiosInstance.put(`/images/update/${id}`, { title: data.title });
      return response.data;
    }
  }

  static async deleteImage(id: string): Promise<{ message: string }> {
    const response = await axiosInstance.delete(`/images/delete/${id}`);
    return response.data;
  }

  static async deleteAllImages(): Promise<DeleteAllResponse> {
    const response = await axiosInstance.delete('/images/delete-all');
    return response.data;
  }

  static async reorderImages(imageOrders: ImageOrderUpdate[]): Promise<{ message: string }> {
    const response = await axiosInstance.patch('/images/reorder-images', {
      imageOrders
    });
    return response.data;
  }
}
