export interface FavoriteItem {
  id: number;
  goods: {
    id: number;
    title: string;
    price: number;
    images: string[];
    status: string;
  };
  createdAt: string;
}