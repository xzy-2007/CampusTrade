export type OrderStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Completed'
  | 'Cancelled';

export interface OrderGoods {
  id: number;
  title: string;
  price: number;
  images: string[];
}

export interface OrderUser {
  id: number;
  username: string;
  avatar?: string;
}

export interface Order {
  id: number;
  status: OrderStatus;
  goods: OrderGoods;
  buyer: OrderUser;
  seller: OrderUser;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateOrderRequest {
  goodsId: number;
  goodsVersion: number;
}

export interface CreateOrderResponse {
  id: number;
  status: 'Pending';
  goodsId: number;
  createdAt: string;
}

export interface OrderListParams {
  page?: number;
  pageSize?: number;
  role?: 'buyer' | 'seller';
  status?: OrderStatus;
}

export interface OrderListResponse {
  total: number;
  items: Order[];
}