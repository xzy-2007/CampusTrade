export type { User, LoginRequest, LoginResponse, RegisterRequest, UpdateProfileRequest } from './User';
export type { Goods, GoodsStatus, GoodsCategory, GoodsUser, GoodsReview, CreateGoodsRequest, UpdateGoodsRequest, ResubmitGoodsRequest, GoodsListParams, GoodsListResponse } from './Goods';
export type { Order, OrderStatus, OrderGoods, OrderUser, CreateOrderRequest, CreateOrderResponse, OrderListParams, OrderListResponse } from './Order';
export type { Category } from './Category';
export type { FavoriteItem } from './Favorite';
export type { ReviewRecord } from './ReviewRecord';

export interface ApiError {
  message: string;
  statusCode: number;
}

export interface PaginatedResponse<T> {
  total: number;
  items: T[];
  page?: number;
  pageSize?: number;
}