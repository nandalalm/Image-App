import axiosInstance from "../api/axiosInstance";
import type { User } from "../types/auth";

export class UserApi {
  static async updateProfileImage(file: File): Promise<User> {
    const formData = new FormData();
    formData.append('image', file);

    const response = await axiosInstance.patch('/user/updateImage', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data.user;
  }

  static async getProfile(): Promise<User> {
    const response = await axiosInstance.get('/user/profileinfo');
    return response.data.user;
  }

  static async updateProfile(data: Partial<User>): Promise<User> {
    const response = await axiosInstance.put('/user/profile', data);
    return response.data.user;
  }
}
