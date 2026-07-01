import React, { useState, useEffect } from 'react';
import { db, storage } from '../../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { toast } from 'react-toastify';
import { Loader2, Plus, Trash2, Image as ImageIcon } from 'lucide-react';

export default function ProductManager() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    price: '',
    category: 'Rings',
    inStock: true
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'products'));
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(data);
    } catch (error) {
      toast.error("Failed to fetch products");
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const checkCodeExists = async (code) => {
    const q = query(collection(db, 'products'), where('code', '==', code));
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!imageFile) {
      toast.error("Please select a product image");
      return;
    }

    try {
      setUploading(true);

      // 1. Check for duplicate code
      const codeExists = await checkCodeExists(formData.code);
      if (codeExists) {
        toast.error(`Product Code '${formData.code}' already exists!`);
        setUploading(false);
        return;
      }

      // 2. Upload image to Storage
      const storageRef = ref(storage, `products/${Date.now()}_${imageFile.name}`);
      const uploadResult = await uploadBytes(storageRef, imageFile);
      const imageUrl = await getDownloadURL(uploadResult.ref);

      // 3. Save to Firestore
      const newProduct = {
        ...formData,
        price: parseFloat(formData.price),
        imageUrl,
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'products'), newProduct);

      toast.success("Product added successfully!");
      fetchProducts();

      // Reset form
      setFormData({ name: '', code: '', price: '', category: 'Rings', inStock: true });
      setImageFile(null);
      setImagePreview(null);
      // Reset file input via ref or id if needed, but react manages it mostly if we use a ref.
      // A quick fix is just clearing state, input type file might retain name visually.
      document.getElementById('file-upload').value = '';

    } catch (error) {
      toast.error("Error adding product: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (productId) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;

    try {
      setDeleting(productId);
      await deleteDoc(doc(db, 'products', productId));
      toast.success("Product removed");
      setProducts(products.filter(p => p.id !== productId));
    } catch (error) {
      toast.error("Failed to delete product");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-[#2D3748] rounded-lg p-6 shadow-sm border border-gray-700">
        <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
          <Plus className="text-nazah-primary" />
          Add New Product
        </h2>

        <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Product Name</label>
              <input
                type="text"
                required
                className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white focus:ring-1 focus:ring-nazah-primary focus:border-nazah-primary"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Product Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. NZ-001"
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white focus:ring-1 focus:ring-nazah-primary focus:border-nazah-primary uppercase"
                  value={formData.code}
                  onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Price ($)</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white focus:ring-1 focus:ring-nazah-primary focus:border-nazah-primary"
                  value={formData.price}
                  onChange={e => setFormData({...formData, price: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Category</label>
                <select
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white focus:ring-1 focus:ring-nazah-primary focus:border-nazah-primary"
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                >
                  <option>Rings</option>
                  <option>Necklaces</option>
                  <option>Bracelets</option>
                  <option>Earrings</option>
                </select>
              </div>
              <div className="flex items-center h-[42px] px-2">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={formData.inStock}
                    onChange={e => setFormData({...formData, inStock: e.target.checked})}
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-nazah-primary"></div>
                  <span className="ml-3 text-sm font-medium text-gray-300">
                    {formData.inStock ? 'In Stock' : 'Out of Stock'}
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-400 mb-1">Product Image</label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-md bg-gray-700/50 hover:bg-gray-700 transition-colors relative overflow-hidden group">
              <div className="space-y-1 text-center z-10 relative">
                {imagePreview ? (
                  <div className="relative w-32 h-40 mx-auto">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-md" />
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-md">
                      <p className="text-white text-xs">Click to change</p>
                    </div>
                  </div>
                ) : (
                  <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                )}
                <div className="flex text-sm text-gray-400 justify-center mt-2">
                  <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-medium text-nazah-primary hover:text-[#a68648]">
                    <span>Upload a file</span>
                    <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={handleImageChange} />
                  </label>
                </div>
                <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
              </div>
              {/* Invisible file input covering the whole area if image exists for easy change */}
              {imagePreview && (
                <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" accept="image/*" onChange={handleImageChange} />
              )}
            </div>

            <button
              type="submit"
              disabled={uploading}
              className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-nazah-primary hover:bg-[#a68648] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-nazah-primary disabled:opacity-50 mt-4"
            >
              {uploading ? (
                <><Loader2 className="animate-spin mr-2 h-4 w-4" /> Adding...</>
              ) : (
                'Add Product'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Product List */}
      <div className="bg-[#2D3748] rounded-lg shadow-sm border border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">Inventory Management</h2>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-[#2D3748] divide-y divide-gray-700">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          <img className="h-10 w-10 rounded-sm object-cover" src={product.imageUrl} alt="" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-white">{product.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-700 text-gray-300">
                        {product.code}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {product.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      ${Number(product.price).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        product.inStock ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
                      }`}>
                        {product.inStock ? 'In Stock' : 'Out of Stock'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDelete(product.id)}
                        disabled={deleting === product.id}
                        className="text-red-400 hover:text-red-300 disabled:opacity-50 transition-colors"
                        title="Delete product"
                      >
                        {deleting === product.id ? <Loader2 className="animate-spin w-5 h-5" /> : <Trash2 className="w-5 h-5" />}
                      </button>
                    </td>
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                      No products found. Add your first piece above.
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