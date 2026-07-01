import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, LayoutDashboard, Package, ShoppingCart } from 'lucide-react';
import ProductManager from './admin/ProductManager';
import OrderManager from './admin/OrderManager';
import AnalyticsManager from './admin/AnalyticsManager';

export default function AdminDashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('products');

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  return (
    <div className="min-h-screen bg-nazah-bg text-nazah-text flex">
      {/* Sidebar */}
      <div className="w-64 bg-[#141923] border-r border-gray-800 flex flex-col fixed h-full">
        <div className="h-20 flex items-center justify-center border-b border-gray-800">
          <span className="font-serif text-2xl font-bold tracking-widest text-nazah-primary">NAZAH ADMIN</span>
        </div>

        <nav className="flex-1 py-6 px-4 space-y-2">
          {/* Analytics tab stub for now */}
          <button
            onClick={() => setActiveTab('analytics')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${activeTab === 'analytics' ? 'bg-nazah-primary/10 text-nazah-primary' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
          >
            <LayoutDashboard size={20} />
            <span className="font-medium">Analytics</span>
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${activeTab === 'products' ? 'bg-nazah-primary/10 text-nazah-primary' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
          >
            <Package size={20} />
            <span className="font-medium">Products</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${activeTab === 'orders' ? 'bg-nazah-primary/10 text-nazah-primary' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
          >
            <ShoppingCart size={20} />
            <span className="font-medium">Orders</span>
          </button>
        </nav>

        <div className="p-4 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-400/10 rounded-md transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 ml-64 p-8">
        <header className="mb-8">
          <h1 className="text-3xl font-serif font-bold text-white capitalize">{activeTab} Management</h1>
        </header>

        <main>
          {activeTab === 'products' && <ProductManager />}
          {activeTab === 'analytics' && <AnalyticsManager />}
          {activeTab === 'orders' && <OrderManager />}
        </main>
      </div>
    </div>
  );
}