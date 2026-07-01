import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { ShoppingBag, Search, Loader2, MoreVertical, Menu, X, Diamond } from 'lucide-react';

const MESSENGER_PAGE_ID = "61591582766954";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const productsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProducts(productsData);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['All', 'Rings', 'Necklaces', 'Bracelets', 'Earrings'];

  const filteredProducts = activeCategory === 'All'
    ? products
    : products.filter(p => p.category === activeCategory);

  const generateMessengerLink = (product) => {
    const text = `Hi NAZAH, I want to order this handmade jewelry: ${product.name} (Code: ${product.code}).`;
    return `https://m.me/${MESSENGER_PAGE_ID}?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="min-h-screen bg-nazah-bg text-nazah-text">
      {/* Navbar */}

      {/* Navbar */}
      <nav className="fixed w-full z-50 bg-nazah-bg/90 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex-shrink-0 flex items-center gap-2">
              <Diamond className="text-nazah-primary w-8 h-8" />
              <span className="font-serif text-3xl font-bold tracking-widest text-nazah-primary">NAZAH</span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#home" className="text-gray-300 hover:text-nazah-primary transition-colors">Home</a>
              <a href="#collections" className="text-gray-300 hover:text-nazah-primary transition-colors">Collections</a>
              <a href="#about" className="text-gray-300 hover:text-nazah-primary transition-colors">About</a>
              <a
                href={`https://www.facebook.com/profile.php?id=${MESSENGER_PAGE_ID}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-nazah-primary text-white px-6 py-2.5 rounded-sm font-medium hover:bg-[#a68648] transition-colors shadow-lg shadow-nazah-primary/20"
              >
                Customer Service
              </a>
              <div className="relative group cursor-pointer">
                <MoreVertical className="text-gray-300 hover:text-nazah-primary transition-colors w-6 h-6" />
                <div className="absolute right-0 mt-2 w-48 bg-gray-900 border border-gray-800 rounded-md shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <div className="py-1">
                    <a href="/login" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-nazah-primary">Admin Login</a>
                    <a href="#collections" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-nazah-primary">Latest Arrivals</a>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-gray-300 hover:text-white"
              >
                {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-gray-900 border-b border-gray-800">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <a href="#home" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-800">Home</a>
              <a href="#collections" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-800">Collections</a>
              <a href="#about" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-800">About</a>
              <a
                href={`https://www.facebook.com/profile.php?id=${MESSENGER_PAGE_ID}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block px-3 py-2 rounded-md text-base font-medium text-nazah-primary hover:text-white hover:bg-gray-800"
              >
                Customer Service
              </a>
              <a href="/login" className="block px-3 py-2 rounded-md text-base font-medium text-gray-400 hover:text-white hover:bg-gray-800 border-t border-gray-800 mt-2 pt-2">Admin Login</a>
            </div>
          </div>
        )}
      </nav>


      {/* Hero Section */}
      <section id="home" className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[80vh] text-center">
        <h1 className="font-serif text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
          Timeless Craftsmanship.<br />
          <span className="text-nazah-primary italic">Adorn Your Story.</span>
        </h1>
        <p className="text-gray-400 text-lg md:text-xl max-w-2xl mb-10">
          Discover our exclusive collection of handcrafted luxury jewelry.
          Each piece is uniquely designed to celebrate your individuality.
        </p>
        <a
          href="#collections"
          className="bg-nazah-primary text-white px-8 py-4 rounded-sm font-medium text-lg hover:bg-[#a68648] transition-all transform hover:scale-105 shadow-xl shadow-nazah-primary/20 flex items-center gap-2"
        >
          <ShoppingBag size={20} />
          Explore Collection
        </a>
      </section>

      {/* Product Gallery */}
      <section id="collections" className="py-20 bg-[#141923]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-serif text-4xl font-bold text-white mb-4">Our Collections</h2>
            <div className="w-24 h-1 bg-nazah-primary mx-auto"></div>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  activeCategory === category
                    ? 'bg-nazah-primary text-white shadow-lg shadow-nazah-primary/30'
                    : 'bg-transparent text-gray-400 border border-gray-700 hover:border-nazah-primary hover:text-white'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-10 h-10 text-nazah-primary animate-spin" />
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredProducts.map(product => (
                <div key={product.id} className="group bg-nazah-bg rounded-lg overflow-hidden border border-gray-800 hover:border-gray-700 transition-all duration-300">
                  <div className="relative aspect-[4/5] overflow-hidden bg-gray-900">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-700"
                    />
                    {!product.inStock && (
                      <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm text-white px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-sm border border-gray-700">
                        Sold Out
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-serif text-xl font-semibold text-white">{product.name}</h3>
                      <span className="text-nazah-primary font-medium">${Number(product.price).toFixed(2)}</span>
                    </div>
                    <p className="text-gray-500 text-sm mb-6 font-mono">{product.code}</p>

                    {product.inStock ? (
                      <a
                        href={generateMessengerLink(product)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full text-center border border-nazah-primary text-nazah-primary hover:bg-nazah-primary hover:text-white px-4 py-2.5 rounded-sm transition-colors"
                      >
                        Order Now
                      </a>
                    ) : (
                      <button
                        disabled
                        className="block w-full text-center border border-gray-700 text-gray-500 bg-gray-800 px-4 py-2.5 rounded-sm cursor-not-allowed opacity-75"
                      >
                        Out of Stock
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-gray-500">
              No products found in this category.
            </div>
          )}
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="font-serif text-4xl font-bold text-white mb-6">The NAZAH Story</h2>
            <div className="w-16 h-1 bg-nazah-primary mb-8"></div>
            <p className="text-gray-400 mb-6 leading-relaxed">
              At NAZAH, we believe that jewelry is more than just an accessory; it's a reflection of your unique journey.
              Our artisans blend traditional techniques with contemporary design to create pieces that transcend time.
            </p>
            <p className="text-gray-400 leading-relaxed">
              Every stone is carefully selected, and every curve is meticulously sculpted.
              We are dedicated to sustainable luxury, ensuring that each creation not only looks beautiful but is crafted with integrity.
            </p>
          </div>
          <div className="relative">

            <div className="aspect-square bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-800 p-2">
              <div className="w-full h-full bg-[#1A202C] rounded-md flex flex-col items-center justify-center border border-gray-700 p-8">
                <Diamond className="w-24 h-24 text-nazah-primary mb-6" />
                <span className="font-serif text-3xl font-bold tracking-widest text-nazah-primary">NAZAH</span>
                <span className="text-gray-500 mt-2 uppercase tracking-widest text-sm">Fine Jewelry</span>
              </div>
            </div>

            <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-nazah-primary/20 rounded-full blur-3xl z-[-1]"></div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#11151d] py-12 border-t border-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="font-serif text-2xl font-bold tracking-widest text-white mb-4 block">NAZAH</span>
          <p className="text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} NAZAH Jewelry. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}