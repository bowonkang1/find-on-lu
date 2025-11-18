import React, { useState, useEffect } from "react";
import { Button } from "../components/ui/Button";
import { PostItemModal } from "../components/PostItemModal";
import { ItemDetailsModal } from "../components/ItemDetailsModal";
import { getThriftItems } from "../lib/supabaseService";

interface ThriftItem {
  id: string; // uuid in Supabase
  title: string;
  description: string;
  price: number;
  category?: string;
  condition?: string;
  image_url?: string;
  user_email: string;
  created_at: string;
  status: 'available' | 'pending' | 'sold'; // default 'available' in Supabase
  user_id: string; // uuid in Supabase
}

export function ThriftPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ThriftItem | null>(null);
  const [items, setItems] = useState<ThriftItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch items from Supabase when page loads
  useEffect(() => {
    loadItems();
  }, []);

  async function loadItems() {
    try {
      setLoading(true);
      const data = await getThriftItems();
      setItems(data || []);
      setError("");
    } catch (err: any) {
      console.error("Error loading items:", err);
      setError("Failed to load items. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const handleItemPosted = async (newItem: any) => {
    // After posting, reload items from database
    await loadItems();
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lu-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading items...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-100 text-red-700 p-4 rounded-lg">
          <p className="font-semibold">Error</p>
          <p>{error}</p>
          <Button onClick={loadItems} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Thrift Store</h1>
          <p className="text-gray-600 mt-2">Buy and sell pre-loved items</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>Post Item</Button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <svg
              className="absolute left-3 top-3 h-4 w-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="m21 21-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lu-blue-500"
            />
            {searchTerm && (
              <p className="text-sm text-gray-600 mt-2">
                Found {filteredItems.length} items
              </p>
            )}
          </div>
          <div className="mb-6">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lu-blue-500 focus:border-lu-blue-500"
            >
              <option value="all">All Categories</option>
              <option value="Electronics">Electronics</option>
              <option value="Furniture">Furniture</option>
              <option value="Clothing">Clothing</option>
              <option value="Books">Books</option>
              <option value="Sports">Sports & Outdoors</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="bg-white p-6 rounded-xl shadow-lg cursor-pointer hover:shadow-2xl transition-shadow"
            onClick={() => setSelectedItem(item)}
          >
            <div className="w-full h-48 bg-gray-100 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.title}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-center text-gray-400">
                  <svg
                    className="mx-auto h-12 w-12 mb-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="text-sm">No photo</p>
                </div>
              )}
            </div>

            <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
            <p className="text-2xl font-bold text-green-600 mb-2">
              ${item.price}
            </p>
            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
              {item.description}
            </p>

            <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
              {item.condition && <span>{item.condition}</span>}
              {item.category && <span>{item.category}</span>}
            </div>

            <div className="text-sm text-gray-500 mb-4">
              <div>Posted by: {item.user_email.split("@")[0]}</div>
            </div>

            <Button
              size="sm"
              className="w-full"
              onClick={(e) => {
                e.stopPropagation();
                const posterName = item.user_email.split("@")[0];
                const subject = `Interested in: ${item.title}`;
                const body = `Hi ${posterName},\n\nI'm interested in your item "${item.title}" listed for $${item.price}.\n\nIs this still available?\n\nThanks!`;
                const outlookUrl = `https://outlook.office365.com/mail/deeplink/compose?to=${
                  item.user_email
                }&subject=${encodeURIComponent(
                  subject
                )}&body=${encodeURIComponent(body)}`;
                window.open(outlookUrl, "_blank");
              }}
            >
              Contact Seller
            </Button>
          </div>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            No items found
          </h3>
          <p className="text-gray-500">
            {searchTerm
              ? `No results for "${searchTerm}". Try a different search.`
              : "Be the first to post an item!"}
          </p>
        </div>
      )}

      <PostItemModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        type="thrift"
        onItemPosted={handleItemPosted}
      />
      {selectedItem && (
        <ItemDetailsModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  );
}
