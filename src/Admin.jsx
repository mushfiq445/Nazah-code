import { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { auth, db, storage } from './firebase';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { LogOut, LayoutDashboard, Package, ShoppingCart, Plus, Check, X, ClipboardCopy } from 'lucide-react';

export default function Admin() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('dashboard');

    // Data States
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);

    // Form States - Product
    const [prodName, setProdName] = useState('');
    const [prodCode, setProdCode] = useState('');
    const [prodPrice, setProdPrice] = useState('');
    const [prodCategory, setProdCategory] = useState('Rings');
    const [prodInStock, setProdInStock] = useState(true);
    const [prodImage, setProdImage] = useState(null);
    const [isSubmittingProd, setIsSubmittingProd] = useState(false);

    // Form States - Order
    const [orderPhone, setOrderPhone] = useState('');
    const [orderName, setOrderName] = useState('');
    const [orderAddress, setOrderAddress] = useState('');
    const [orderProdCode, setOrderProdCode] = useState('');
    const [generatedReceipt, setGeneratedReceipt] = useState('');
    const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

    // Fetch Data
    const fetchData = async () => {
        try {
            const prodSnap = await getDocs(collection(db, 'products'));
            setProducts(prodSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

            const orderSnap = await getDocs(collection(db, 'orders'));
            setOrders(orderSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a,b) => b.createdAt - a.createdAt));
        } catch (error) {
            console.error("Error fetching data: ", error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/');
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    // --- Product Management Methods ---
    const handleAddProduct = async (e) => {
        e.preventDefault();
        setIsSubmittingProd(true);
        try {
            let imageUrl = '';
            if (prodImage) {
                const imageRef = ref(storage, `products/${prodCode}_${prodImage.name}`);
                const snapshot = await uploadBytes(imageRef, prodImage);
                imageUrl = await getDownloadURL(snapshot.ref);
            }

            await addDoc(collection(db, 'products'), {
                name: prodName,
                code: prodCode,
                price: Number(prodPrice),
                category: prodCategory,
                inStock: prodInStock,
                imageUrl: imageUrl,
                createdAt: Date.now()
            });

            // Reset form
            setProdName(''); setProdCode(''); setProdPrice(''); setProdImage(null);
            document.getElementById('imageInput').value = '';
            fetchData();
            alert('Product added successfully!');
        } catch (error) {
            console.error("Error adding product: ", error);
            alert('Failed to add product.');
        } finally {
            setIsSubmittingProd(false);
        }
    };

    const handleDeleteProduct = async (productId, imageUrl) => {
        if(window.confirm('Are you sure you want to delete this product?')) {
            try {
                await deleteDoc(doc(db, 'products', productId));
                if (imageUrl) {
                    const imageRef = ref(storage, imageUrl);
                    await deleteObject(imageRef).catch(e => console.warn('Image might not exist or failed to delete', e));
                }
                fetchData();
            } catch (error) {
                console.error("Error deleting product", error);
            }
        }
    };

    const toggleStock = async (productId, currentStatus) => {
        try {
            await updateDoc(doc(db, 'products', productId), {
                inStock: !currentStatus
            });
            fetchData();
        } catch (error) {
            console.error("Error toggling stock", error);
        }
    };

    // --- Order Management Methods ---
    const handlePhoneBlur = async () => {
        if (!orderPhone) return;
        try {
            const q = query(collection(db, 'customers'), where("phone", "==", orderPhone));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                const customerData = querySnapshot.docs[0].data();
                setOrderName(customerData.name);
                setOrderAddress(customerData.address);
            }
        } catch (error) {
            console.error("Error fetching customer: ", error);
        }
    };

    const handleCreateOrder = async (e) => {
        e.preventDefault();
        setIsSubmittingOrder(true);
        try {
            // Find product price
            const product = products.find(p => p.code.toLowerCase() === orderProdCode.toLowerCase());
            if (!product) {
                alert("Product code not found!");
                setIsSubmittingOrder(false);
                return;
            }

            const newOrder = {
                customerName: orderName,
                customerPhone: orderPhone,
                customerAddress: orderAddress,
                productCode: orderProdCode,
                productName: product.name,
                totalAmount: product.price,
                status: 'Pending',
                createdAt: Date.now()
            };

            // Save Order
            await addDoc(collection(db, 'orders'), newOrder);

            // Save/Update Customer Directory
            const q = query(collection(db, 'customers'), where("phone", "==", orderPhone));
            const customerSnap = await getDocs(q);
            if (customerSnap.empty) {
                await addDoc(collection(db, 'customers'), {
                    name: orderName,
                    phone: orderPhone,
                    address: orderAddress,
                });
            } else {
                // Update existing customer address if different
                const existingDoc = customerSnap.docs[0];
                if(existingDoc.data().address !== orderAddress) {
                    await updateDoc(doc(db, 'customers', existingDoc.id), { address: orderAddress });
                }
            }

            // Generate Receipt
            const receipt = `NAZAH Order Receipt\n-------------------\nName: ${orderName}\nPhone: ${orderPhone}\nAddress: ${orderAddress}\n\nItem: ${product.name} (Code: ${product.code})\nTotal: $${product.price.toFixed(2)}\nStatus: Pending\n\nThank you for choosing NAZAH!`;
            setGeneratedReceipt(receipt);

            // Reset form
            setOrderPhone(''); setOrderName(''); setOrderAddress(''); setOrderProdCode('');
            fetchData();
        } catch (error) {
            console.error("Error creating order: ", error);
            alert('Failed to create order');
        } finally {
            setIsSubmittingOrder(false);
        }
    };

    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
            fetchData();
        } catch (error) {
            console.error("Error updating status: ", error);
        }
    };

    const copyReceipt = () => {
        navigator.clipboard.writeText(generatedReceipt);
        alert('Receipt copied to clipboard!');
    };

    // --- Analytics Calc ---
    const totalOrders = orders.length;
    const deliveredOrders = orders.filter(o => o.status === 'Delivered').length;
    const returnedOrders = orders.filter(o => o.status === 'Returned').length;
    const pendingOrders = orders.filter(o => o.status === 'Pending').length;
    const totalValue = orders.filter(o => o.status !== 'Returned').reduce((sum, o) => sum + o.totalAmount, 0);

    return (
        <div className="flex min-h-screen bg-gray-900">
            {/* Sidebar */}
            <aside className="w-64 bg-gray-950 border-r border-gray-800 hidden md:flex flex-col">
                <div className="p-6">
                    <h2 className="text-2xl font-serif text-primary">NAZAH Admin</h2>
                </div>
                <nav className="flex-1 px-4 space-y-2 mt-4">
                    <button
                        onClick={() => setActiveTab('dashboard')}
                        className={`flex items-center gap-3 w-full p-3 rounded text-left transition ${activeTab === 'dashboard' ? 'bg-primary/10 text-primary' : 'text-gray-400 hover:bg-gray-800'}`}
                    >
                        <LayoutDashboard size={20} /> Dashboard
                    </button>
                    <button
                        onClick={() => setActiveTab('products')}
                        className={`flex items-center gap-3 w-full p-3 rounded text-left transition ${activeTab === 'products' ? 'bg-primary/10 text-primary' : 'text-gray-400 hover:bg-gray-800'}`}
                    >
                        <Package size={20} /> Products
                    </button>
                    <button
                        onClick={() => setActiveTab('orders')}
                        className={`flex items-center gap-3 w-full p-3 rounded text-left transition ${activeTab === 'orders' ? 'bg-primary/10 text-primary' : 'text-gray-400 hover:bg-gray-800'}`}
                    >
                        <ShoppingCart size={20} /> Orders
                    </button>
                </nav>
                <div className="p-4 border-t border-gray-800">
                    <button onClick={handleLogout} className="flex items-center gap-3 w-full p-3 text-red-400 hover:bg-red-950/50 rounded transition">
                        <LogOut size={20} /> Log Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Mobile Header */}
                <header className="md:hidden flex justify-between items-center p-4 bg-gray-950 border-b border-gray-800">
                    <h2 className="text-xl font-serif text-primary">NAZAH Admin</h2>
                    <select
                        value={activeTab}
                        onChange={(e) => setActiveTab(e.target.value)}
                        className="bg-gray-800 border-none text-white rounded p-2 focus:ring-0"
                    >
                        <option value="dashboard">Dashboard</option>
                        <option value="products">Products</option>
                        <option value="orders">Orders</option>
                    </select>
                </header>

                <div className="flex-1 overflow-y-auto p-6 md:p-8">
                    {activeTab === 'dashboard' && (
                        <div className="space-y-8 animate-in fade-in">
                            <h2 className="text-3xl font-serif">Analytics Overview</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                                <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                                    <p className="text-gray-400 text-sm">Total Orders</p>
                                    <p className="text-3xl font-bold mt-2">{totalOrders}</p>
                                </div>
                                <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                                    <p className="text-gray-400 text-sm">Pending</p>
                                    <p className="text-3xl font-bold mt-2 text-yellow-500">{pendingOrders}</p>
                                </div>
                                <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                                    <p className="text-gray-400 text-sm">Delivered</p>
                                    <p className="text-3xl font-bold mt-2 text-green-500">{deliveredOrders}</p>
                                </div>
                                <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                                    <p className="text-gray-400 text-sm">Returned</p>
                                    <p className="text-3xl font-bold mt-2 text-red-500">{returnedOrders}</p>
                                </div>
                                <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                                    <p className="text-gray-400 text-sm">Total Revenue (Est.)</p>
                                    <p className="text-3xl font-bold mt-2 text-primary font-serif">${totalValue.toFixed(2)}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'products' && (
                        <div className="space-y-8 animate-in fade-in">
                            <h2 className="text-3xl font-serif">Product Management</h2>

                            {/* Add Product Form */}
                            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                                <h3 className="text-xl mb-4 font-medium flex items-center gap-2"><Plus size={20}/> Add New Product</h3>
                                <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1">Product Name</label>
                                        <input type="text" required value={prodName} onChange={e => setProdName(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded p-2" />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1">Product Code</label>
                                        <input type="text" required value={prodCode} onChange={e => setProdCode(e.target.value)} placeholder="e.g. NZ-001" className="w-full bg-gray-900 border border-gray-700 rounded p-2" />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1">Price ($)</label>
                                        <input type="number" step="0.01" required value={prodPrice} onChange={e => setProdPrice(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded p-2" />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1">Category</label>
                                        <select value={prodCategory} onChange={e => setProdCategory(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded p-2">
                                            <option>Rings</option>
                                            <option>Necklaces</option>
                                            <option>Bracelets</option>
                                            <option>Earrings</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1">Product Image</label>
                                        <input id="imageInput" type="file" accept="image/*" required onChange={e => setProdImage(e.target.files[0])} className="w-full bg-gray-900 border border-gray-700 rounded p-1.5 text-sm file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:bg-gray-700 file:text-white" />
                                    </div>
                                    <div className="flex items-end pb-1">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" checked={prodInStock} onChange={e => setProdInStock(e.target.checked)} className="rounded bg-gray-900 border-gray-700 text-primary focus:ring-primary h-5 w-5" />
                                            <span>In Stock</span>
                                        </label>
                                    </div>
                                    <div className="md:col-span-2 lg:col-span-3 flex justify-end mt-2">
                                        <button disabled={isSubmittingProd} type="submit" className="bg-primary text-background px-6 py-2 rounded font-medium hover:bg-yellow-600 disabled:opacity-50">
                                            {isSubmittingProd ? 'Adding...' : 'Add Product'}
                                        </button>
                                    </div>
                                </form>
                            </div>

                            {/* Product List */}
                            <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-900/50 border-b border-gray-700 text-sm text-gray-400">
                                            <th className="p-4">Product</th>
                                            <th className="p-4">Code</th>
                                            <th className="p-4">Category</th>
                                            <th className="p-4">Price</th>
                                            <th className="p-4">Stock</th>
                                            <th className="p-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {products.map(p => (
                                            <tr key={p.id} className="border-b border-gray-700/50 hover:bg-gray-750">
                                                <td className="p-4 flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-gray-900 rounded overflow-hidden">
                                                        {p.imageUrl && <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />}
                                                    </div>
                                                    <span className="font-medium">{p.name}</span>
                                                </td>
                                                <td className="p-4 text-gray-400">{p.code}</td>
                                                <td className="p-4 text-gray-400">{p.category}</td>
                                                <td className="p-4">${p.price.toFixed(2)}</td>
                                                <td className="p-4">
                                                    <button onClick={() => toggleStock(p.id, p.inStock)} className={`flex items-center gap-1 text-sm px-2 py-1 rounded-full ${p.inStock ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                                                        {p.inStock ? <><Check size={14}/> In Stock</> : <><X size={14}/> Sold Out</>}
                                                    </button>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <button onClick={() => handleDeleteProduct(p.id, p.imageUrl)} className="text-red-400 hover:text-red-300 text-sm">Delete</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'orders' && (
                        <div className="space-y-8 animate-in fade-in">
                            <h2 className="text-3xl font-serif">Order Management</h2>

                            {/* Create Order Form */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                                    <h3 className="text-xl mb-4 font-medium">New Order Entry</h3>
                                    <form onSubmit={handleCreateOrder} className="space-y-4">
                                        <div>
                                            <label className="block text-sm text-gray-400 mb-1">Phone Number (Triggers Auto-fill)</label>
                                            <input type="tel" required value={orderPhone} onChange={e => setOrderPhone(e.target.value)} onBlur={handlePhoneBlur} placeholder="e.g. 555-0123" className="w-full bg-gray-900 border border-gray-700 rounded p-2" />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-gray-400 mb-1">Customer Name</label>
                                            <input type="text" required value={orderName} onChange={e => setOrderName(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded p-2" />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-gray-400 mb-1">Delivery Address</label>
                                            <textarea required value={orderAddress} onChange={e => setOrderAddress(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded p-2 h-20 resize-none"></textarea>
                                        </div>
                                        <div>
                                            <label className="block text-sm text-gray-400 mb-1">Product Code</label>
                                            <input type="text" required value={orderProdCode} onChange={e => setOrderProdCode(e.target.value)} placeholder="e.g. NZ-001" className="w-full bg-gray-900 border border-gray-700 rounded p-2 uppercase" />
                                        </div>
                                        <button disabled={isSubmittingOrder} type="submit" className="w-full bg-primary text-background py-2 rounded font-medium hover:bg-yellow-600 disabled:opacity-50">
                                            {isSubmittingOrder ? 'Processing...' : 'Create Order & Receipt'}
                                        </button>
                                    </form>
                                </div>

                                {/* Receipt Display */}
                                <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 flex flex-col">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-xl font-medium">Generated Receipt</h3>
                                        {generatedReceipt && (
                                            <button onClick={copyReceipt} className="text-primary hover:text-yellow-400 flex items-center gap-2 text-sm">
                                                <ClipboardCopy size={16} /> Copy
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex-1 bg-gray-900 rounded border border-gray-700 p-4 relative font-mono text-sm text-gray-300 whitespace-pre-wrap">
                                        {generatedReceipt || <span className="text-gray-600 italic">Receipt will appear here after order creation...</span>}
                                    </div>
                                </div>
                            </div>

                            {/* Order Status Table */}
                            <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                                <div className="p-4 border-b border-gray-700">
                                    <h3 className="text-lg font-medium">Recent Orders</h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse whitespace-nowrap">
                                        <thead>
                                            <tr className="bg-gray-900/50 border-b border-gray-700 text-sm text-gray-400">
                                                <th className="p-4">Customer</th>
                                                <th className="p-4">Item (Code)</th>
                                                <th className="p-4">Total</th>
                                                <th className="p-4">Status</th>
                                                <th className="p-4">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {orders.map(o => (
                                                <tr key={o.id} className="border-b border-gray-700/50 hover:bg-gray-750">
                                                    <td className="p-4">
                                                        <div className="font-medium">{o.customerName}</div>
                                                        <div className="text-xs text-gray-400">{o.customerPhone}</div>
                                                    </td>
                                                    <td className="p-4 text-sm">{o.productName} <span className="text-gray-500">({o.productCode})</span></td>
                                                    <td className="p-4">${o.totalAmount.toFixed(2)}</td>
                                                    <td className="p-4">
                                                        <span className={`px-2 py-1 text-xs rounded-full ${
                                                            o.status === 'Pending' ? 'bg-yellow-900/50 text-yellow-500' :
                                                            o.status === 'Delivered' ? 'bg-green-900/50 text-green-500' :
                                                            'bg-red-900/50 text-red-500'
                                                        }`}>
                                                            {o.status}
                                                        </span>
                                                    </td>
                                                    <td className="p-4">
                                                        <select
                                                            value={o.status}
                                                            onChange={(e) => updateOrderStatus(o.id, e.target.value)}
                                                            className="bg-gray-900 border border-gray-700 text-sm rounded p-1"
                                                        >
                                                            <option value="Pending">Pending</option>
                                                            <option value="Delivered">Delivered</option>
                                                            <option value="Returned">Returned</option>
                                                        </select>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
