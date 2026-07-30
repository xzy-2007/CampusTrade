export interface ReviewRecord {
  id: number;
  goods: { id: number; title: string };
  admin: { username: string };
  action: 'approved' | 'rejected';
  reason?: string;
  createdAt: string;
}