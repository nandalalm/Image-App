export interface ImageItem {
  id: string;
  title: string;
  imageUrl: string;
  order: number;
  createdAt: string;
}

export interface ImageUploadData {
  file: File;
  title: string;
}

export interface ImageUpdateData {
  title: string;
  file?: File;
}

export interface ImageOrderUpdate {
  id: string;
  order: number;
}

export interface UploadResult {
  url: string;
  id: string;
  title: string;
}

export interface DeleteAllResponse {
  message: string;
  deletedCount: number;
}
