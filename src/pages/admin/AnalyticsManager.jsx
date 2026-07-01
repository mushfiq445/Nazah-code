import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, getDocs, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { Loader2, TrendingUp, PackageSearch, Clock, CheckCircle, XCircle } from 'lucide-react';

export default function AnalyticsManager() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  const [stats, setStats] = useState({
    totalOrders: 0,
    delivered: 0,
    returned: 0,
    pending: 0,
    totalRevenue: 0
  });

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const ordersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setOrders(ordersData);
      calculateStats(ordersData);
    } catch (error) {
      toast.error("Failed to fetch orders");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (ordersList) => {
    // Current month filter (optional logic if we only want this month, but here we just calculate all-time or let's do all-time for simplicity, although requirements said "monthly stats". We will do all time for now, or filter by current month).
    // Let's filter by current month for "monthly stats"
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const monthlyOrders = ordersList.filter(order => {
      if (!order.createdAt) return false;
      const date = order.createdAt.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });

    // Calculate stats specifically for the monthly orders as requested
    let delivered = 0, returned = 0, pending = 0, totalRevenue = 0;

    monthlyOrders.forEach(order => {
      if (order.status === 'Delivered') delivered++;
      else if (order.status === 'Returned') returned++;
      else pending++; // default or 'Pending'

      // Count revenue for all non-returned monthly orders
      if (order.status !== 'Returned') {
        totalRevenue += Number(order.price) || 0;
      }
    });

    setStats({
      totalOrders: monthlyOrders.length,
      delivered,
      returned,
      pending,
      totalRevenue
    });
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      setUpdating(orderId);
      await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
      toast.success(`Order status updated to ${newStatus}`);

      // Update local state
      const updatedOrders = orders.map(order =>
        order.id === orderId ? { ...order, status: newStatus } : order
      );
      setOrders(updatedOrders);
      calculateStats(updatedOrders);
    } catch (error) {
      toast.error("Failed to update order status");
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="Total Orders" value={stats.totalOrders} icon={<PackageSearch className="text-blue-400" />} />
        <StatCard title="Pending" value={stats.pending} icon={<Clock className="text-yellow-400" />} />
        <StatCard title="Delivered" value={stats.delivered} icon={<CheckCircle className="text-green-400" />} />
        <StatCard title="Returned" value={stats.returned} icon={<XCircle className="text-red-400" />} />
        <StatCard title="Est. Revenue" value={`$${stats.totalRevenue.toFixed(2)}`} icon={<TrendingUp className="text-nazah-primary" />} />
      </div>

      {/* Order Status Tracking Table */}
      <div className="bg-[#2D3748] rounded-lg shadow-sm border border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-white">Order Tracking</h2>
        </div>

        {loading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="animate-spin text-nazah-primary h-8 w-8" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Order ID / Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-[#2D3748] divide-y divide-gray-700">
                {orders.map((order) => {
                  const dateStr = order.createdAt?.toDate
                    ? order.createdAt.toDate().toLocaleDateString()
                    : new Date(order.createdAt).toLocaleDateString();

                  return (
                    <tr key={order.id} className="hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-white">#{order.id.slice(-6).toUpperCase()}</div>
                        <div className="text-xs text-gray-400">{dateStr}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white">{order.customerName}</div>
                        <div className="text-xs text-gray-400">{order.customerPhone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white">{order.productName}</div>
                        <div className="text-xs text-nazah-primary">{order.productCode}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        ${Number(order.price).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {updating === order.id ? (
                          <div className="flex items-center space-x-2">
                            <Loader2 className="animate-spin text-nazah-primary h-4 w-4" />
                            <span className="text-sm text-gray-400">Updating...</span>
                          </div>
                        ) : (
                          <select
                            value={order.status}
                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                            className={`text-sm rounded-full px-3 py-1 font-semibold border-none focus:ring-2 focus:ring-nazah-primary outline-none ${
                              order.status === 'Delivered' ? 'bg-green-900/50 text-green-400' :
                              order.status === 'Returned' ? 'bg-red-900/50 text-red-400' :
                              'bg-yellow-900/50 text-yellow-400'
                            }`}
                          >
                            <option value="Pending" className="bg-gray-800 text-white">Pending</option>
                            <option value="Delivered" className="bg-gray-800 text-white">Delivered</option>
                            <option value="Returned" className="bg-gray-800 text-white">Returned</option>
                          </select>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                      No orders found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }) {
  return (
    <div className="bg-[#2D3748] rounded-lg p-5 shadow-sm border border-gray-700 flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-400">{title}</p>
        <p className="mt-1 text-2xl font-semibold text-white">{value}</p>
      </div>
      <div className="h-12 w-12 bg-gray-800 rounded-full flex items-center justify-center">
        {icon}
      </div>
    </div>
  );
}