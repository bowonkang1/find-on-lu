import React, { useState, useEffect } from "react";
import { Button } from "../components/ui/Button";
import { PostItemModal } from "../components/PostItemModal";
import { ItemDetailsModal } from "../components/ItemDetailsModal";
import { getLostFoundItems } from '../lib/supabaseService';

interface LostFoundItem {
  id: string;
  type: "lost" | "found";
  title: string;
  description: string;
  location: string;
  user_email: string;
  created_at: string;
  image_url?: string;
  date: string;
  user_id: string; 
  status: 'active' | 'found' | 'closed';
}

export function LostFoundPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "lost" | "found">("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<LostFoundItem | null>(null);
  const [items, setItems] = useState<LostFoundItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  //Fetch items from supabase when page loads
  useEffect(()=> {
    loadItems();
  },[])

  async function loadItems(){
    try{
      console.log('🔄 Loading items from Supabase...');
      setLoading(true);
      const data = await getLostFoundItems();
      console.log('📦 Received from Supabase:', data);
      console.log('📊 Item count:', data?.length);



      setItems(data || []);
      setError('');
    }catch (err: any) {
      console.error('Error loading items:', err);
      setError('Failed to load items. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const handleItemPosted = async (newItem: any) => {
   // After posting, reload items from database
   console.log('handleItemPosted called!', newItem);
   await loadItems();
  };


  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === "all" || item.type === filterType;
    return matchesSearch && matchesFilter;
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
          <Button onClick={loadItems} className="mt-4">Try Again</Button>
        </div>
      </div>
    );
  }


  return (
    //header
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Lost & Found</h1>
          <p className="text-gray-600 mt-2">
            Help find lost items or report found items
          </p>
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
            {/*Search Section*/}
            <input
              type="text"
              placeholder="Search lost or found items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lu-blue-500"
            />
             {/*for showing the number of results*/}
            {searchTerm && (
              <p className="text-sm text-gray-600 mt-2">
                Found {filteredItems.length} items
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant={filterType === "all" ? "primary" : "outline"}
              onClick={() => setFilterType("all")}
              size="sm"
            >
              All Items
            </Button>
            <Button
              variant={filterType === "lost" ? "primary" : "outline"}
              onClick={() => setFilterType("lost")}
              size="sm"
            >
              Lost
            </Button>
            <Button
              variant={filterType === "found" ? "primary" : "outline"}
              onClick={() => setFilterType("found")}
              size="sm"
            >
              Found
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="bg-white p-6 rounded-xl shadow-lg cursor-pointer hover:shadow-2xl transition-shadow"
            onClick={() => {
              console.log("Card clicked!", item);
              setSelectedItem(item);
            }}
          >
            <div className="w-full h-48 bg-gray-100 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
              {item.image_url ?  (
                <img
                  src={item.image_url}
                  alt={item.title}
                  className="w-full h-full object-cover"
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
            <div className="flex items-center justify-between mb-3">
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full ${
                  item.type === "lost"
                    ? "bg-red-100 text-red-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {item.type.toUpperCase()}
              </span>
              <span className="text-sm text-gray-500">{new Date(item.date).toLocaleDateString()}</span>
            </div>

            <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
            <p className="text-gray-600 text-sm mb-3">{item.description}</p>

            <div className="text-sm text-gray-500 mb-4">
              <div>Location: {item.location}</div>
              <div>Posted by: {item.user_email.split('@')[0]}</div>
            </div>

            <Button
              size="sm"
              className="w-full"
              onClick={(e) => {
                e.stopPropagation(); // Prevent card click when clicking button
                const posterName = item.user_email.split('@')[0];
                const subject = `Found your ${item.type} item: ${item.title}`;
                const body = `Hi ${posterName},\n\nI saw your ${item.type} item posting for "${item.title}" on Find On LU.\n\n${item.description}\n\nLocation: ${item.location}\n\nPlease let me know if this is still available.\n\nThanks!`;
                const outlookUrl = `https://outlook.office365.com/mail/deeplink/compose?to=${
                  item.user_email
                }&subject=${encodeURIComponent(
                  subject
                )}&body=${encodeURIComponent(body)}`;
                window.open(outlookUrl, "_blank");
              }}
            >
              Contact
            </Button>
          </div>
        ))}
      </div>

      {filteredItems.length === 0 && ( // empty state
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
        type="lost-found"
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
