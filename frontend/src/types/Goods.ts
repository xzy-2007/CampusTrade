export type GoodsStatus =
  | 'PendingReview'
  | 'Approved'
  | 'Rejected'
  | 'Reserved'
  | 'Sold'
  | 'Removed';

export interface GoodsCategory {
  id: number;
  name: string;
  description?: string;
}

export interface GoodsUser {
  id: number;
  username: string;
  avatar?: string;
}

export interface GoodsReview {
  action: 'approved' | 'rejected';
  reason?: string;
  adminName: string;
  createdAt: string;
}

export interface Goods {
  id: number;
  title: string;
  description?: string;
  price: number;
  images: string[];
  status: GoodsStatus;
  category?: GoodsCategory;
  user?: GoodsUser;
  categoryId?: number;
  version?: number;
  reviewReason?: string;
  review?: GoodsReview;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateGoodsRequest {
  title: string;
  description: string;
  price: number;
  categoryId: number;
  images: string[];
}

export interface UpdateGoodsRequest {
  title?: string;
  description?: string;
  price?: number;
  categoryId?: number;
  images?: string[];
}

export interface ResubmitGoodsRequest {
  title: string;
  description: string;
  price: number;
  categoryId: number;
  images: string[];
}

export interface GoodsListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  categoryId?: number;
}

export interface GoodsListResponse {
  total: number;
  page: number;
  pageSize: number;
  items: Goods[];
}