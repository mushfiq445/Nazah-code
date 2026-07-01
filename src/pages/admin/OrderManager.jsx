import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, addDoc, getDocs, doc, updateDoc, query, where, Timestamp } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { Search, Plus, Save, Copy, CheckCircle, Loader2 } from 'lucide-react';

export default function OrderManager() {
  const [loading, setLoading] = useState(false);
  const [productCode, setProductCode] = useState('');
  const [productDetails, setProductDetails] = useState(null);

  const [formData, setFormData] = useState({
    customerPhone: '',
    customerName: '',
    customerAddress: '',
    price: '',
    status: 'Pending'
  });

  const [generatedReceipt, setGeneratedReceipt] = useState(null);

  // Find customer by phone
  const handlePhoneBlur = async () => {
    if (!formData.customerPhone) return;
    try {
      const q = query(collection(db, 'customers'), where('phone', '==', formData.customerPhone));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const customer = querySnapshot.docs[0].data();
        setFormData(prev => ({
          ...prev,
          customerName: customer.name,
          customerAddress: customer.address
        }));
        toast.info("Existing customer details auto-filled.");
      }
    } catch (error) {
      console.error("Error fetching customer", error);
    }
  };

  // Find product by code
  const handleCodeBlur = async () => {
    if (!productCode) return;
    try {
      const q = query(collection(db, 'products'), where('code', '==', productCode.toUpperCase()));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const product = querySnapshot.docs[0].data();
        setProductDetails(product);
        setFormData(prev => ({
          ...prev,
          price: product.price
        }));
        toast.success(`Found: ${product.name}`);
      } else {
        setProductDetails(null);
        toast.error("Product Code not found! You can enter price manually.");
      }
    } catch (error) {
      console.error("Error fetching product", error);
    }
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    if (!formData.customerName || !formData.customerPhone || !formData.price || !productCode) {
      toast.error("Please fill in all required fields.");
      return;
    }

    try {
      setLoading(true);

      // 1. Save or update customer
      const customerQuery = query(collection(db, 'customers'), where('phone', '==', formData.customerPhone));
      const customerSnap = await getDocs(customerQuery);

      if (customerSnap.empty) {
        await addDoc(collection(db, 'customers'), {
          name: formData.customerName,
          phone: formData.customerPhone,
          address: formData.customerAddress,
          createdAt: Timestamp.now()
        });
      } else {
        // Optional: Update customer details if they changed
        const docId = customerSnap.docs[0].id;
        await updateDoc(doc(db, 'customers', docId), {
          name: formData.customerName,
          address: formData.customerAddress
        });
      }

      // 2. Save Order
      const newOrder = {
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        customerAddress: formData.customerAddress,
        productCode: productCode.toUpperCase(),
        productName: productDetails ? productDetails.name : 'Manual Entry',
        price: parseFloat(formData.price),
        status: 'Pending',
        createdAt: Timestamp.now()
      };

      const orderRef = await addDoc(collection(db, 'orders'), newOrder);

      toast.success("Order created successfully!");

      // 3. Generate Receipt
      const receiptText = `*Order Confirmation - NAZAH Jewelry*\n\nOrder ID: #${orderRef.id.slice(-6).toUpperCase()}\nDate: ${new Date().toLocaleDateString()}\n\n*Customer Details:*\nName: ${formData.customerName}\nPhone: ${formData.customerPhone}\nAddress: ${formData.customerAddress}\n\n*Order Details:*\nItem: ${newOrder.productName} (Code: ${newOrder.productCode})\nTotal Price: $${Number(newOrder.price).toFixed(2)}\n\nThank you for shopping with NAZAH!`;

      setGeneratedReceipt(receiptText);

      // Reset form
      setFormData({
        customerPhone: '',
        customerName: '',
        customerAddress: '',
        price: '',
        status: 'Pending'
      });
      setProductCode('');
      setProductDetails(null);

    } catch (error) {
      toast.error("Failed to create order: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedReceipt);
    toast.success("Receipt copied to clipboard!");
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Order Form */}
        <div className="bg-[#2D3748] rounded-lg p-6 shadow-sm border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <Plus className="text-nazah-primary" />
            Create New Order
          </h2>

          <form onSubmit={handleCreateOrder} className="space-y-5">
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider border-b border-gray-700 pb-2">Customer Details</h3>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Phone Number (Auto-fill)</label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    className="w-full bg-gray-700 border border-gray-600 rounded-md pl-10 pr-4 py-2 text-white focus:ring-1 focus:ring-nazah-primary focus:border-nazah-primary"
                    placeholder="Enter phone and click away"
                    value={formData.customerPhone}
                    onChange={e => setFormData({...formData, customerPhone: e.target.value})}
                    onBlur={handlePhoneBlur}
                  />
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Customer Name</label>
                <input
                  type="text"
                  required
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white focus:ring-1 focus:ring-nazah-primary focus:border-nazah-primary"
                  value={formData.customerName}
                  onChange={e => setFormData({...formData, customerName: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Shipping Address</label>
                <textarea
                  required
                  rows="3"
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white focus:ring-1 focus:ring-nazah-primary focus:border-nazah-primary"
                  value={formData.customerAddress}
                  onChange={e => setFormData({...formData, customerAddress: e.target.value})}
                ></textarea>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider border-b border-gray-700 pb-2">Product Details</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Product Code</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="e.g. NZ-001"
                      className="w-full bg-gray-700 border border-gray-600 rounded-md pl-10 pr-4 py-2 text-white focus:ring-1 focus:ring-nazah-primary focus:border-nazah-primary uppercase"
                      value={productCode}
                      onChange={e => setProductCode(e.target.value.toUpperCase())}
                      onBlur={handleCodeBlur}
                    />
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  </div>
                  {productDetails && (
                    <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> {productDetails.name}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Total Price ($)</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white focus:ring-1 focus:ring-nazah-primary focus:border-nazah-primary"
                    value={formData.price}
                    onChange={e => setFormData({...formData, price: e.target.value})}
                  />
                  <p className="text-xs text-gray-500 mt-1">Calculated automatically but can be edited.</p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-nazah-primary hover:bg-[#a68648] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-nazah-primary disabled:opacity-50 mt-6"
            >
              {loading ? (
                <><Loader2 className="animate-spin mr-2 h-5 w-5" /> Processing Order...</>
              ) : (
                <><Save className="mr-2 h-5 w-5" /> Save Order</>
              )}
            </button>
          </form>
        </div>

        {/* Receipt Generator */}
        <div className="bg-[#2D3748] rounded-lg p-6 shadow-sm border border-gray-700 flex flex-col">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            Instant Receipt
          </h2>

          <div className="flex-1 bg-gray-900 rounded-md border border-gray-700 p-4 relative font-mono text-sm text-gray-300 whitespace-pre-wrap overflow-y-auto">
            {generatedReceipt ? generatedReceipt : (
              <div className="h-full flex items-center justify-center text-gray-600">
                Receipt will appear here after creating an order.
              </div>
            )}
          </div>

          <button
            onClick={copyToClipboard}
            disabled={!generatedReceipt}
            className="mt-4 w-full flex justify-center items-center py-2 px-4 border border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-300 bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 transition-colors"
          >
            <Copy className="mr-2 h-4 w-4" /> Copy to Clipboard
          </button>
        </div>
      </div>
    </div>
  );
}