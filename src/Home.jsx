import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';

const PAGE_ID = import.meta.env.VITE_MESSENGER_PAGE_ID || '61591582766954';
const MESSENGER_LINK = `https://m.me/${PAGE_ID}`;

export default function Home() {
  const [products, setProducts] = useState([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'products'));
        const productsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setProducts(productsData);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const categories = ['All', 'Rings', 'Necklaces', 'Bracelets', 'Earrings'];

  const filteredProducts = filter === 'All'
    ? products
    : products.filter(p => p.category === filter);

  const getMessengerOrderLink = (product) => {
    const text = `Hi NAZAH, I want to order this handmade jewelry: ${product.name} (Code: ${product.code}).`;
    return `${MESSENGER_LINK}?text=${encodeURIComponent(text)}`;
  };

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-background/90 backdrop-blur-sm border-b border-gray-800 px-6 py-4 flex justify-between items-center">
        <div className="text-2xl font-serif text-primary font-bold tracking-widest cursor-pointer" onClick={() => scrollToSection('hero')}>
          NAZAH
        </div>
        <div className="flex gap-6 items-center">
          <button onClick={() => scrollToSection('collections')} className="hover:text-primary transition">Collections</button>
          <button onClick={() => scrollToSection('about')} className="hover:text-primary transition">About</button>
          <a
            href={MESSENGER_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-primary text-background px-4 py-2 rounded font-medium hover:bg-yellow-600 transition"
          >
            Customer Service
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="hero" className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-5xl md:text-7xl mb-6">Timeless Craftsmanship. Adorn Your Story.</h1>
        <p className="text-xl text-gray-400 mb-10 max-w-2xl">
          Discover our collection of handcrafted, premium jewelry designed for the modern muse.
        </p>
        <button onClick={() => scrollToSection('collections')} className="bg-primary text-background px-8 py-3 text-lg font-medium rounded hover:bg-yellow-600 transition">
          Explore Collections
        </button>
      </section>

      {/* Product Gallery */}
      <section id="collections" className="py-20 px-6 md:px-12 max-w-7xl mx-auto">
        <h2 className="text-4xl text-center mb-12">Our Collections</h2>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-6 py-2 rounded-full border transition ${
                filter === cat
                  ? 'bg-primary text-background border-primary'
                  : 'border-gray-600 hover:border-primary hover:text-primary'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="text-center text-gray-400">Loading exquisite pieces...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProducts.map(product => (
              <div key={product.id} className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden group">
                <div className="relative h-80 overflow-hidden bg-gray-900 flex items-center justify-center">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                  ) : (
                    <span className="text-gray-600">No Image</span>
                  )}

                  {!product.inStock && (
                    <div className="absolute top-4 right-4 bg-red-900/90 text-red-100 px-3 py-1 text-sm rounded font-medium border border-red-700 backdrop-blur-md">
                      Sold Out
                    </div>
                  )}
                </div>

                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-medium">{product.name}</h3>
                    <span className="text-primary font-serif text-lg">${Number(product.price).toFixed(2)}</span>
                  </div>
                  <p className="text-gray-400 text-sm mb-6">Code: {product.code}</p>

                  {product.inStock ? (
                    <a
                      href={getMessengerOrderLink(product)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full text-center bg-transparent border border-primary text-primary py-2 rounded hover:bg-primary hover:text-background transition"
                    >
                      Order Now
                    </a>
                  ) : (
                    <button disabled className="block w-full text-center bg-gray-700 text-gray-500 py-2 rounded cursor-not-allowed">
                      Out of Stock
                    </button>
                  )}
                </div>
              </div>
            ))}

            {filteredProducts.length === 0 && (
              <div className="col-span-full text-center text-gray-400 py-12">
                No products found in this category.
              </div>
            )}
          </div>
        )}
      </section>

      {/* About Section */}
      <section id="about" className="py-20 px-6 bg-gray-900/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl mb-8">The NAZAH Story</h2>
          <p className="text-lg text-gray-300 leading-relaxed mb-6 font-light">
            Founded on the principles of timeless elegance and unparalleled craftsmanship, NAZAH creates jewelry that transcends trends. Each piece is meticulously handcrafted, blending traditional techniques with modern aesthetics to adorn the stories of those who wear them.
          </p>
          <p className="text-lg text-gray-300 leading-relaxed font-light">
            We source only the finest materials, ensuring that every ring, necklace, bracelet, and earring reflects the premium quality our brand is known for.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black py-8 text-center text-gray-500 text-sm border-t border-gray-800">
        <p>&copy; {new Date().getFullYear()} NAZAH. All rights reserved.</p>
      </footer>
    </div>
  );
}
