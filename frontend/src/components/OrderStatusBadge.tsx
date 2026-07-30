import type { OrderStatus } from '@/types';

const statusMap: Record<OrderStatus, { label: string; className: string }> = {
  Pending: { label: '待确认', className: 'bg-yellow-100 text-yellow-700' },
  Confirmed: { label: '已确认', className: 'bg-blue-100 text-blue-700' },
  Completed: { label: '已完成', className: 'bg-green-100 text-green-700' },
  Cancelled: { label: '已取消', className: 'bg-gray-100 text-gray-500' },
};

export default function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const { label, className } = statusMap[status];
  return (
    <span className={`inline-block text-xs px-2 py-0.5 rounded ${className}`}>
      {label}
    </span>
  );
}