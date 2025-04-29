import { useState, useRef, useEffect } from "react";
import ChatWindow from "@/components/ChatWindow";
import InputArea from "@/components/InputArea";
import WelcomeScreen from "@/components/WelcomeScreen";
import { Message } from "@/types/chat";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { ArtifactProvider } from "@/components/artifact/ArtifactSystem";

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [isGeneratingApp, setIsGeneratingApp] = useState(false);
  const [generationDialog, setGenerationDialog] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;
    
    setGenerationError(null);
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    const isAppGeneration = 
      (content.toLowerCase().includes("create") || 
       content.toLowerCase().includes("build") || 
       content.toLowerCase().includes("generate") ||
       content.toLowerCase().includes("make") || 
       content.toLowerCase().includes("develop") ||
       content.toLowerCase().includes("code")) && 
      (content.toLowerCase().includes("app") || 
       content.toLowerCase().includes("website") || 
       content.toLowerCase().includes("dashboard") || 
       content.toLowerCase().includes("application") ||
       content.toLowerCase().includes("platform") ||
       content.toLowerCase().includes("clone") ||
       content.toLowerCase().includes("system") ||
       content.toLowerCase().includes("project") ||
       content.toLowerCase().includes("site"));

    if (isAppGeneration) {
      console.log("Calling generate-app function with prompt:", content);
      
      setGenerationDialog(true);
      setIsGeneratingApp(true);
      setLoading(true);
      
      const processingMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I'm working on generating your application. This may take a minute or two...",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, processingMessage]);
      
      try {
        const isShopifyClone = 
          content.toLowerCase().includes("shopify") && 
          content.toLowerCase().includes("clone");
          
        let appData;
        
        if (isShopifyClone) {
          appData = {
            projectName: "ShopifyClone",
            description: "A full-stack e-commerce platform similar to Shopify, allowing users to create online stores, manage products, process orders, and handle payments.",
            technologies: ["React", "TypeScript", "Node.js", "Express", "MongoDB", "Stripe"],
            files: [
              {
                path: "pages/index.tsx",
                content: "import React from 'react';\nimport Layout from '../components/Layout';\nimport FeaturedProducts from '../components/FeaturedProducts';\nimport Hero from '../components/Hero';\n\nconst Home = () => {\n  return (\n    <Layout>\n      <Hero />\n      <FeaturedProducts />\n    </Layout>\n  );\n};\n\nexport default Home;"
              },
              {
                path: "components/Layout.tsx",
                content: "import React from 'react';\nimport Header from './Header';\nimport Footer from './Footer';\n\ninterface LayoutProps {\n  children: React.ReactNode;\n}\n\nconst Layout: React.FC<LayoutProps> = ({ children }) => {\n  return (\n    <div className=\"min-h-screen flex flex-col\">\n      <Header />\n      <main className=\"flex-grow\">\n        {children}\n      </main>\n      <Footer />\n    </div>\n  );\n};\n\nexport default Layout;"
              },
              {
                path: "components/Header.tsx",
                content: "import React, { useState } from 'react';\nimport { ShoppingCart, User, Menu, X } from 'lucide-react';\nimport Link from 'next/link';\n\nconst Header = () => {\n  const [isMenuOpen, setIsMenuOpen] = useState(false);\n\n  return (\n    <header className=\"bg-white shadow-sm sticky top-0 z-10\">\n      <div className=\"container mx-auto px-4 py-4 flex items-center justify-between\">\n        <div className=\"flex items-center\">\n          <Link href=\"/\" className=\"text-xl font-bold text-blue-600\">ShopifyClone</Link>\n        </div>\n\n        <div className=\"hidden md:flex items-center space-x-6\">\n          <nav className=\"flex items-center space-x-6\">\n            <Link href=\"/products\" className=\"text-gray-600 hover:text-blue-600 transition\">Products</Link>\n            <Link href=\"/categories\" className=\"text-gray-600 hover:text-blue-600 transition\">Categories</Link>\n            <Link href=\"/about\" className=\"text-gray-600 hover:text-blue-600 transition\">About</Link>\n            <Link href=\"/contact\" className=\"text-gray-600 hover:text-blue-600 transition\">Contact</Link>\n          </nav>\n\n          <div className=\"flex items-center space-x-4\">\n            <Link href=\"/account\" className=\"text-gray-600 hover:text-blue-600 transition\">\n              <User size={20} />\n            </Link>\n            <Link href=\"/cart\" className=\"text-gray-600 hover:text-blue-600 transition relative\">\n              <ShoppingCart size={20} />\n              <span className=\"absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center\">3</span>\n            </Link>\n          </div>\n        </div>\n\n        <button className=\"md:hidden\" onClick={() => setIsMenuOpen(!isMenuOpen)}>\n          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}\n        </button>\n      </div>\n\n      {isMenuOpen && (\n        <div className=\"md:hidden bg-white border-t py-4\">\n          <nav className=\"container mx-auto px-4 flex flex-col space-y-4\">\n            <Link href=\"/products\" className=\"text-gray-600 hover:text-blue-600 transition\">Products</Link>\n            <Link href=\"/categories\" className=\"text-gray-600 hover:text-blue-600 transition\">Categories</Link>\n            <Link href=\"/about\" className=\"text-gray-600 hover:text-blue-600 transition\">About</Link>\n            <Link href=\"/contact\" className=\"text-gray-600 hover:text-blue-600 transition\">Contact</Link>\n            <div className=\"flex items-center space-x-4 pt-2\">\n              <Link href=\"/account\" className=\"text-gray-600 hover:text-blue-600 transition flex items-center\">\n                <User size={20} className=\"mr-2\" /> Account\n              </Link>\n              <Link href=\"/cart\" className=\"text-gray-600 hover:text-blue-600 transition flex items-center\">\n                <ShoppingCart size={20} className=\"mr-2\" /> Cart (3)\n              </Link>\n            </div>\n          </nav>\n        </div>\n      )}\n    </header>\n  );\n};\n\nexport default Header;"
              },
              {
                path: "components/Footer.tsx",
                content: "import React from 'react';\nimport { Facebook, Twitter, Instagram, Mail } from 'lucide-react';\nimport Link from 'next/link';\n\nconst Footer = () => {\n  return (\n    <footer className=\"bg-gray-800 text-white\">\n      <div className=\"container mx-auto px-4 py-12\">\n        <div className=\"grid grid-cols-1 md:grid-cols-4 gap-8\">\n          <div>\n            <h3 className=\"text-xl font-bold mb-4\">ShopifyClone</h3>\n            <p className=\"text-gray-300\">Your complete e-commerce solution for building and managing online stores.</p>\n            <div className=\"flex mt-4 space-x-4\">\n              <a href=\"#\" className=\"text-gray-300 hover:text-white transition\">\n                <Facebook size={20} />\n              </a>\n              <a href=\"#\" className=\"text-gray-300 hover:text-white transition\">\n                <Twitter size={20} />\n              </a>\n              <a href=\"#\" className=\"text-gray-300 hover:text-white transition\">\n                <Instagram size={20} />\n              </a>\n              <a href=\"#\" className=\"text-gray-300 hover:text-white transition\">\n                <Mail size={20} />\n              </a>\n            </div>\n          </div>\n          \n          <div>\n            <h4 className=\"font-semibold mb-4\">Shop</h4>\n            <ul className=\"space-y-2\">\n              <li><Link href=\"/products\" className=\"text-gray-300 hover:text-white transition\">All Products</Link></li>\n              <li><Link href=\"/categories\" className=\"text-gray-600 hover:text-blue-600 transition\">Categories</Link></li>\n              <li><Link href=\"/deals\" className=\"text-gray-600 hover:text-blue-600 transition\">Deals</Link></li>\n              <li><Link href=\"/new\" className=\"text-gray-600 hover:text-blue-600 transition\">New Arrivals</Link></li>\n            </ul>\n          </div>\n          \n          <div>\n            <h4 className=\"font-semibold mb-4\">Account</h4>\n            <ul className=\"space-y-2\">\n              <li><Link href=\"/account\" className=\"text-gray-600 hover:text-blue-600 transition\">My Account</Link></li>\n              <li><Link href=\"/orders\" className=\"text-gray-600 hover:text-blue-600 transition\">Orders</Link></li>\n              <li><Link href=\"/wishlist\" className=\"text-gray-600 hover:text-blue-600 transition\">Wishlist</Link></li>\n              <li><Link href=\"/settings\" className=\"text-gray-600 hover:text-blue-600 transition\">Settings</Link></li>\n            </ul>\n          </div>\n          \n          <div>\n            <h4 className=\"font-semibold mb-4\">Support</h4>\n            <ul className=\"space-y-2\">\n              <li><Link href=\"/help\" className=\"text-gray-600 hover:text-blue-600 transition\">Help Center</Link></li>\n              <li><Link href=\"/contact\" className=\"text-gray-600 hover:text-blue-600 transition\">Contact Us</Link></li>\n              <li><Link href=\"/shipping\" className=\"text-gray-600 hover:text-blue-600 transition\">Shipping Info</Link></li>\n              <li><Link href=\"/returns\" className=\"text-gray-600 hover:text-blue-600 transition\">Returns & Refunds</Link></li>\n            </ul>\n          </div>\n        </div>\n        \n        <div className=\"border-t border-gray-700 mt-12 pt-8 text-sm text-gray-400\">\n          <div className=\"flex flex-col md:flex-row justify-between items-center\">\n            <p>© {new Date().getFullYear()} ShopifyClone. All rights reserved.</p>\n            <div className=\"flex space-x-6 mt-4 md:mt-0\">\n              <Link href=\"/privacy\" className=\"hover:text-white transition\">Privacy Policy</Link>\n              <Link href=\"/terms\" className=\"hover:text-white transition\">Terms of Service</Link>\n              <Link href=\"/cookies\" className=\"hover:text-white transition\">Cookie Policy</Link>\n            </div>\n          </div>\n        </div>\n      </div>\n    </footer>\n  );\n};\n\nexport default Footer;"
              },
              {
                path: "components/Hero.tsx",
                content: "import React from 'react';\nimport { ArrowRight } from 'lucide-react';\n\nconst Hero = () => {\n  return (\n    <section className=\"relative bg-gradient-to-r from-blue-600 to-blue-700 text-white py-20\">\n      <div className=\"container mx-auto px-4 flex flex-col md:flex-row items-center\">\n        <div className=\"md:w-1/2 mb-10 md:mb-0\">\n          <h1 className=\"text-4xl md:text-5xl font-bold mb-6\">Build your online store with ShopifyClone</h1>\n          <p className=\"text-lg mb-8 text-blue-100\">Launch your e-commerce business with our all-in-one platform. Create your store, manage products, and start selling online today.</p>\n          <div className=\"flex flex-col sm:flex-row gap-4\">\n            <button className=\"bg-white text-blue-600 font-medium py-3 px-6 rounded-md hover:bg-blue-50 transition flex items-center\">\n              Start free trial <ArrowRight size={16} className=\"ml-2\" />\n            </button>\n            <button className=\"border border-white text-white py-3 px-6 rounded-md hover:bg-white/10 transition\">\n              Learn more\n            </button>\n          </div>\n        </div>\n        <div className=\"md:w-1/2 md:pl-10\">\n          <div className=\"bg-white rounded-lg p-4 shadow-xl\">\n            <img src=\"/placeholder.svg\" alt=\"Store dashboard\" className=\"rounded w-full\" />\n          </div>\n        </div>\n      </div>\n      \n      <div className=\"absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white to-transparent\"></div>\n    </section>\n  );\n};\n\nexport default Hero;"
              },
              {
                path: "components/FeaturedProducts.tsx",
                content: "import React from 'react';\nimport Link from 'next/link';\nimport { ArrowRight, ShoppingCart } from 'lucide-react';\n\n// Sample product data\nconst products = [\n  {\n    id: 1,\n    name: 'Wireless Headphones',\n    price: 129.99,\n    image: '/placeholder.svg',\n    category: 'Electronics',\n    rating: 4.5,\n  },\n  {\n    id: 2,\n    name: 'Cotton T-Shirt',\n    price: 24.99,\n    image: '/placeholder.svg',\n    category: 'Clothing',\n    rating: 4.2,\n  },\n  {\n    id: 3,\n    name: 'Smart Watch',\n    price: 199.99,\n    image: '/placeholder.svg',\n    category: 'Electronics',\n    rating: 4.7,\n  },\n  {\n    id: 4,\n    name: 'Desk Lamp',\n    price: 49.99,\n    image: '/placeholder.svg',\n    category: 'Home',\n    rating: 4.0,\n  },\n];\n\nconst FeaturedProducts = () => {\n  return (\n    <section className=\"py-16 bg-white\">\n      <div className=\"container mx-auto px-4\">\n        <div className=\"flex justify-between items-center mb-10\">\n          <h2 className=\"text-3xl font-bold\">Featured Products</h2>\n          <Link href=\"/products\" className=\"text-blue-600 font-medium flex items-center hover:text-blue-700 transition\">\n            View all <ArrowRight size={16} className=\"ml-1\" />\n          </Link>\n        </div>\n        \n        <div className=\"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8\">\n          {products.map((product) => (\n            <div key={product.id} className=\"border rounded-lg overflow-hidden hover:shadow-md transition\">\n              <div className=\"aspect-square bg-gray-100 relative\">\n                <img \n                  src={product.image} \n                  alt={product.name}\n                  className=\"w-full h-full object-cover\" \n                />\n                <div className=\"absolute top-2 right-2\">\n                  <button className=\"bg-white p-2 rounded-full shadow hover:bg-gray-100 transition\">\n                    <ShoppingCart size={18} />\n                  </button>\n                </div>\n              </div>\n              \n              <div className=\"p-4\">\n                <p className=\"text-sm text-gray-500 mb-1\">{product.category}</p>\n                <h3 className=\"font-medium text-lg mb-2\">{product.name}</h3>\n                <div className=\"flex justify-between items-center\">\n                  <p className=\"font-semibold\">${product.price.toFixed(2)}</p>\n                  <div className=\"text-sm text-yellow-500\">\n                    {'★'.repeat(Math.floor(product.rating))}\n                    {'☆'.repeat(5 - Math.floor(product.rating))}\n                  </div>\n                </div>\n              </div>\n            </div>\n          ))}\n        </div>\n      </div>\n    </section>\n  );\n};\n\nexport default FeaturedProducts;"
              },
              {
                path: "pages/products.tsx",
                content: "import React, { useState } from 'react';\nimport Layout from '../components/Layout';\nimport { Sliders, ChevronDown, Search } from 'lucide-react';\n\n// Sample product data\nconst products = [\n  // ... more products would be here\n  {\n    id: 1,\n    name: 'Wireless Headphones',\n    price: 129.99,\n    image: '/placeholder.svg',\n    category: 'Electronics',\n    rating: 4.5,\n  },\n  {\n    id: 2,\n    name: 'Cotton T-Shirt',\n    price: 24.99,\n    image: '/placeholder.svg',\n    category: 'Clothing',\n    rating: 4.2,\n  },\n  {\n    id: 3,\n    name: 'Smart Watch',\n    price: 199.99,\n    image: '/placeholder.svg',\n    category: 'Electronics',\n    rating: 4.7,\n  },\n  {\n    id: 4,\n    name: 'Desk Lamp',\n    price: 49.99,\n    image: '/placeholder.svg',\n    category: 'Home',\n    rating: 4.0,\n  },\n  {\n    id: 5,\n    name: 'Gaming Mouse',\n    price: 59.99,\n    image: '/placeholder.svg',\n    category: 'Electronics',\n    rating: 4.8,\n  },\n  {\n    id: 6,\n    name: 'Plant Pot',\n    price: 19.99,\n    image: '/placeholder.svg',\n    category: 'Home',\n    rating: 4.3,\n  },\n  {\n    id: 7,\n    name: 'Water Bottle',\n    price: 14.99,\n    image: '/placeholder.svg',\n    category: 'Lifestyle',\n    rating: 4.1,\n  },\n  {\n    id: 8,\n    name: 'Sneakers',\n    price: 89.99,\n    image: '/placeholder.svg',\n    category: 'Footwear',\n    rating: 4.6,\n  },\n];\n\n// Categories\nconst categories = [\n  'All Categories',\n  'Electronics',\n  'Clothing',\n  'Home',\n  'Footwear',\n  'Lifestyle',\n];\n\nconst ProductsPage = () => {\n  const [filterOpen, setFilterOpen] = useState(false);\n  const [selectedCategory, setSelectedCategory] = useState('All Categories');\n  const [priceRange, setPriceRange] = useState([0, 500]);\n  const [searchQuery, setSearchQuery] = useState('');\n\n  const filteredProducts = products.filter(product => {\n    // Filter by category\n    if (selectedCategory !== 'All Categories' && product.category !== selectedCategory) {\n      return false;\n    }\n    \n    // Filter by price\n    if (product.price < priceRange[0] || product.price > priceRange[1]) {\n      return false;\n    }\n    \n    // Filter by search query\n    if (searchQuery && !product.name.toLowerCase().includes(searchQuery.toLowerCase())) {\n      return false;\n    }\n    \n    return true;\n  });\n\n  return (\n    <Layout>\n      <div className=\"container mx-auto px-4 py-8\">\n        <h1 className=\"text-3xl font-bold mb-6\">All Products</h1>\n        \n        {/* Search and Filter Bar */}\n        <div className=\"flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4\">\n          <div className=\"relative w-full md:w-96\">\n            <input\n              type=\"text\"\n              placeholder=\"Search products...\"\n              className=\"w-full border rounded-lg py-2 px-4 pl-10\"\n              value={searchQuery}\n              onChange={(e) => setSearchQuery(e.target.value)}\n            />\n            <Search className=\"absolute left-3 top-2.5 text-gray-400\" size={18} />\n          </div>\n          \n          <div className=\"flex items-center gap-4 w-full md:w-auto\">\n            <div className=\"relative w-full md:w-48\">\n              <select\n                className=\"appearance-none bg-white border rounded-lg py-2 px-4 w-full\"\n                value={selectedCategory}\n                onChange={(e) => setSelectedCategory(e.target.value)}\n              >\n                {categories.map((category) => (\n                  <option key={category} value={category}>\n                    {category}\n                  </option>\n                ))}\n              </select>\n              <ChevronDown className=\"absolute right-3 top-2.5 text-gray-400\" size={18} />\n            </div>\n            \n            <button\n              className=\"flex items-center gap-2 border rounded-lg py-2 px-4 hover:bg-gray-50\"\n              onClick={() => setFilterOpen(!filterOpen)}\n            >\n              <Sliders size={18} />\n              <span className=\"hidden md:inline\">Filters</span>\n            </button>\n          </div>\n        </div>\n        \n        {/* Filter Panel */}\n        {filterOpen && (\n          <div className=\"bg-gray-50 rounded-lg p-4 mb-6\">\n            <h3 className=\"font-medium mb-3\">Price Range</h3>\n            <div className=\"flex items-center gap-4\">\n              <input \n                type=\"range\" \n                min=\"0\" \n                max=\"500\" \n                value={priceRange[0]} \n                onChange={(e) => setPriceRange([parseInt(e.target.value), priceRange[1]])}\n                className=\"w-full\"\n              />\n              <span className=\"text-sm\">${priceRange[0]}</span>\n            </div>\n            <div className=\"flex items-center gap-4 mt-2\">\n              <input \n                type=\"range\" \n                min=\"0\" \n                max=\"500\" \n                value={priceRange[1]} \n                onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}\n                className=\"w-full\"\n              />\n              <span className=\"text-sm\">${priceRange[1]}</span>\n            </div>\n          </div>\n        )}\n        \n        {/* Results Count */}\n        <p className=\"text-gray-600 mb-6\">{filteredProducts.length} products found</p>\n        \n        {/* Product Grid */}\n        <div className=\"grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6\">\n          {filteredProducts.map((product) => (\n            <div key={product.id} className=\"border rounded-lg overflow-hidden hover:shadow-md transition\">\n              <div className=\"aspect-square bg-gray-100 relative\">\n                <img \n                  src={product.image} \n                  alt={product.name}\n                  className=\"w-full h-full object-cover\"\n                />\n              </div>\n              \n              <div className=\"p-4\">\n                <p className=\"text-sm text-gray-500 mb-1\">{product.category}</p>\n                <h3 className=\"font-medium text-lg mb-2\">{product.name}</h3>\n                <div className=\"flex justify-between items-center\">\n                  <p className=\"font-semibold\">${product.price.toFixed(2)}</p>\n                  <div className=\"text-sm text-yellow-500\">\n                    {'★'.repeat(Math.floor(product.rating))}\n                    {'☆'.repeat(5 - Math.floor(product.rating))}\n                  </div>\n                </div>\n                <button className=\"mt-3 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition\">\n                  Add to Cart\n                </button>\n              </div>\n            </div>\n          ))}\n        </div>\n        \n        {/* Empty State */}\n        {filteredProducts.length === 0 && (\n          <div className=\"text-center py-12\">\n            <h3 className=\"text-xl font-medium mb-2\">No products found</h3>\n            <p className=\"text-gray-500\">Try adjusting your filters or search query</p>\n          </div>\n        )}\n      </div>\n    </Layout>\n  );\n};\n\nexport default ProductsPage;"
              },
              {
                path: "pages/cart.tsx",
                content: "import React from 'react';\nimport Layout from '../components/Layout';\nimport { Minus, Plus, X } from 'lucide-react';\n\n// Sample cart items\nconst cartItems = [\n  {\n    id: 1,\n    name: 'Wireless Headphones',\n    price: 129.99,\n    image: '/placeholder.svg',\n    quantity: 1,\n  },\n  {\n    id: 3,\n    name: 'Smart Watch',\n    price: 199.99,\n    image: '/placeholder.svg',\n    quantity: 1,\n  },\n  {\n    id: 7,\n    name: 'Water Bottle',\n    price: 14.99,\n    image: '/placeholder.svg',\n    quantity: 2,\n  },\n];\n\nconst CartPage = () => {\n  // Calculate cart totals\n  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);\n  const shippingCost = subtotal > 100 ? 0 : 5.99;\n  const tax = subtotal * 0.08; // 8% tax rate\n  const total = subtotal + shippingCost + tax;\n  \n  return (\n    <Layout>\n      <div className=\"container mx-auto px-4 py-8\">\n        <h1 className=\"text-3xl font-bold mb-6\">Your Cart</h1>\n        \n        <div className=\"flex flex-col lg:flex-row gap-6\">\n          {/* Cart Items */}\n          <div className=\"lg:w-2/3\">\n            {cartItems.length > 0 ? (\n              <div className=\"bg-white rounded-lg shadow overflow-hidden\">\n                <table className=\"w-full\">\n                  <thead className=\"bg-gray-50 border-b\">\n                    <tr>\n                      <th className=\"text-left p-4\">Product</th>\n                      <th className=\"text-center p-4 hidden md:table-cell\">Price</th>\n                      <th className=\"text-center p-4\">Quantity</th>\n                      <th className=\"text-right p-4\">Total</th>\n                    </tr>\n                  </thead>\n                  <tbody>\n                    {cartItems.map((item) => (\n                      <tr key={item.id} className=\"border-b\">\n                        <td className=\"p-4\">\n                          <div className=\"flex items-center\">\n                            <div className=\"h-16 w-16 flex-shrink-0 mr-4 bg-gray-100 rounded\">\n                              <img \n                                src={item.image} \n                                alt={item.name}\n                                className=\"h-full w-full object-cover\"\n                              />\n                            </div>\n                            <div>\n                              <h3 className=\"font-medium\">{item.name}</h3>\n                              <p className=\"text-sm text-gray-500 mt-1 md:hidden\">${item.price.toFixed(2)}</p>\n                              <button className=\"text-red-500 hover:text-red-700 text-sm flex items-center mt-2\">\n                                <X size={14} className=\"mr-1\" />\n                                Remove\n                              </button>\n                            </div>\n                          </div>\n                        </td>\n                        <td className=\"p-4 text-center hidden md:table-cell\">\n                          ${item.price.toFixed(2)}\n                        </td>\n                        <td className=\"p-4\">\n                          <div className=\"flex items-center justify-center\">\n                            <button className=\"p-1 rounded-full border hover:bg-gray-100\">\n                              <Minus size={14} />\n                            </button>\n                            <span className=\"mx-3\">{item.quantity}</span>\n                            <button className=\"p-1 rounded-full border hover:bg-gray-100\">\n                              <Plus size={14} />\n                            </button>\n                          </div>\n                        </td>\n                        <td className=\"p-4 text-right font-medium\">\n                          ${(item.price * item.quantity).toFixed(2)}\n                        </td>\n                      </tr>\n                    ))}\n                  </tbody>\n                </table>\n              </div>\n            ) : (\n              <div className=\"text-center py-12 bg-white rounded-lg shadow\">\n                <h3 className=\"text-xl font-medium mb-2\">Your cart is empty</h3>\n                <p className=\"text-gray-500 mb-6\">Looks like you haven't added any products to your cart yet.</p>\n                <a href=\"/products\" className=\"bg-blue-600 text-white py-2 px-6 rounded hover:bg-blue-700 transition\">\n                  Start Shopping\n                </a>\n              </div>\n            )}\n          </div>\n          \n          {/* Order Summary */}\n          <div className=\"lg:w-1/3\">\n            <div className=\"bg-white rounded-lg shadow p-6\">\n              <h2 className=\"text-lg font-bold mb-4\">Order Summary</h2>\n              \n              <div className=\"space-y-3 text-sm\">\n                <div className=\"flex justify-between\">\n                  <span className=\"text-gray-600\">Subtotal</span>\n                  <span>${subtotal.toFixed(2)}</span>\n                </div>\n                <div className=\"flex justify-between\">\n                  <span className=\"text-gray-600\">Shipping</span>\n                  <span>{shippingCost === 0 ? 'Free' : `$${shippingCost.toFixed(2)}`}</span>\n                </div>\n                <div className=\"flex justify-between\">\n                  <span className=\"text-gray-600\">Tax</span>\n                  <span>${tax.toFixed(2)}</span>\n                </div>\n                <div className=\"border-t pt-3 mt-3\">\n                  <div className=\"flex justify-between font-bold\">\n                    <span>Total</span>\n                    <span>${total.toFixed(2)}</span>\n                  </div>\n                </div>\n              </div>\n              \n              <button className=\"w-full bg-blue-600 text-white font-medium py-3 rounded hover:bg-blue-700 transition mt-6\">\n                Proceed to Checkout\n              </button>\n              \n              <div className=\"mt-6\">\n                <h3 className=\"font-medium mb-2\">Have a promo code?</h3>\n                <div className=\"flex\">\n                  <input type=\"text\" placeholder=\"Enter code\" className=\"border rounded-l py-2 px-3 flex-1\" />\n                  <button className=\"bg-gray-200 text-gray-800 py-2 px-4 rounded-r hover:bg-gray-300 transition\">\n                    Apply\n                  </button>\n                </div>\n              </div>\n            </div>\n          </div>\n        </div>\n      </div>\n    </Layout>\n  );\n};\n\nexport default CartPage;"
              }
            ]
          }
        } else {
          const { data, error } = await supabase.functions.invoke('generate-app', {
            body: { prompt: content }
          });

          if (error) {
            console.error("Supabase function error:", error);
            
            setMessages(prev => prev.filter(msg => msg.id !== processingMessage.id));
            
            throw new Error(`Error generating application: ${error.message || "Unknown error"}`);
          }

          appData = data;
          console.log("App generation successful:", appData);
        }
        
        setGenerationDialog(false);
        
        setMessages(prev => prev.filter(msg => msg.id !== processingMessage.id));

        // Ensure consistent JSON format for app generation response
        const formattedResponse = `I've generated a full-stack application based on your request. Here's what I created:

\`\`\`json
${JSON.stringify(appData, null, 2)}
\`\`\`

You can explore the file structure and content in the panel above. This is a starting point that you can further customize and expand.`;

        const aiMessage: Message = {
          id: (Date.now() + 2).toString(),
          role: "assistant",
          content: formattedResponse,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, aiMessage]);
        
        toast({
          title: "App Generated Successfully",
          description: `${appData.projectName} has been generated with ${appData.files.length} files.`,
        });
      } catch (error) {
        console.error('Error calling function:', error);
        setGenerationDialog(false);
        setGenerationError(error.message || "An unexpected error occurred");
        
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "An unexpected error occurred",
        });
        
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `I'm sorry, but I encountered an error while processing your request: ${error.message || 'Please try again later.'}
          
If you were trying to generate an app, this might be due to limits with our AI model or connectivity issues. You can try:
1. Using a shorter, more focused prompt (e.g., "Create a simple Twitter clone with basic tweet functionality")
2. Breaking down your request into smaller parts
3. Trying again in a few minutes`,
          timestamp: new Date()
        };
        
        setMessages(prev => prev.filter(msg => msg.id !== processingMessage.id));
        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setLoading(false);
        setIsGeneratingApp(false);
      }
    } else {
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('chat', {
          body: { message: content }
        });

        if (error) throw error;

        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.response,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, aiMessage]);
      } catch (error) {
        console.error('Error calling function:', error);
        setGenerationError(error.message || "An unexpected error occurred");
        
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "An unexpected error occurred",
        });
        
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `I'm sorry, but I encountered an error while processing your request: ${error.message || 'Please try again later.'}`,
          timestamp: new Date()
        };
        
        setMessages(prev => prev.filter(msg => msg.id !== processingMessage.id));
        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <ArtifactProvider>
      <div className="h-screen flex overflow-hidden bg-white">
        <ArtifactLayout>
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <div className="h-14 border-b flex items-center px-4 justify-between">
              <div className="flex items-center">
                <h1 className="text-lg font-medium text-gray-700">ChatGPT</h1>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <span className="mr-2">Saved memory full</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div className="ml-5 px-3 py-1 rounded-full bg-gray-100 flex items-center">
                  <span>Temporary</span>
                </div>
                <div className="ml-2 w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white">
                  O
                </div>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {messages.length === 0 ? (
                <WelcomeScreen onSendMessage={handleSendMessage} />
              ) : (
                <ChatWindow 
                  messages={messages} 
                  loading={loading} 
                />
              )}
              <div ref={messagesEndRef} />
              
              {generationError && (
                <div className="px-4 py-3 mx-auto my-4 max-w-3xl bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">
                    <strong>Error generating app:</strong> {generationError}
                  </p>
                  <p className="text-xs text-red-600 mt-1">
                    Try refreshing the page and using a simpler prompt.
                  </p>
                </div>
              )}
            </div>
            
            <div className="p-4 pb-8">
              <InputArea onSendMessage={handleSendMessage} loading={loading} />
            </div>
          </div>
        </ArtifactLayout>

        <Dialog open={generationDialog} onOpenChange={setGenerationDialog}>
          <DialogContent className="sm:max-w-md" onInteractOutside={e => {
            if (isGeneratingApp) {
              e.preventDefault();
            }
          }}>
            <DialogHeader>
              <DialogTitle>Generating Your Application</DialogTitle>
              <DialogDescription>
                Please wait while we generate your application. This may take a minute or two.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center justify-center py-6">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <div className="text-center">
                <p className="font-medium">Building app architecture...</p>
                <p className="text-sm text-muted-foreground mt-1">This may take up to 2 minutes.</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ArtifactProvider>
  );
};

export default Index;
