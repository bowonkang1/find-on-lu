import React, { useState, useEffect } from "react";
import { Button } from "../components/ui/Button";
import {
  getMyThriftItems,
  getMyLostFoundItems,
  deleteThriftItem,
  deleteLostFoundItem,
  updateThriftItem,
  updateLostFoundItem,
} from "../lib/supabaseService";

interface ThriftItem {
  id: string;
  title: string;
  description: string;
  price: number;
  category?: string;
  condition?: string;
  image_url?: string;
  user_email: string;
  created_at: string;
  status: string;
}

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
  status: string;
}

export function MyPostsPage() {
  const [thriftItems, setThriftItems] = useState<ThriftItem[]>([]);
  const [lostFoundItems, setLostFoundItems] = useState<LostFoundItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingItem, setEditingItem] = useState<
    ThriftItem | LostFoundItem | null
  >(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    loadMyPosts();
  }, []);

  function handleEditThrift(item: ThriftItem) {
    setEditingItem(item);
    setShowEditModal(true);
  }

  function handleEditLostFound(item: LostFoundItem) {
    setEditingItem(item);
    setShowEditModal(true);
  }

  async function handleUpdateItem(updatedData: any) {
    if (!editingItem) return;

    try {
      // Check if it's a thrift item or lost/found item
      if ("price" in editingItem) {
        // It's a thrift item
        await updateThriftItem(editingItem.id, updatedData);
      } else {
        // It's a lost/found item
        await updateLostFoundItem(editingItem.id, updatedData);
      }

      alert("Item updated successfully!");
      setShowEditModal(false);
      setEditingItem(null);
      loadMyPosts(); // Reload items
    } catch (err) {
      alert("Failed to update item");
    }
  }

  async function loadMyPosts() {
    try {
      setLoading(true);
      const [thrift, lostFound] = await Promise.all([
        getMyThriftItems(),
        getMyLostFoundItems(),
      ]);
      setThriftItems(thrift || []);
      setLostFoundItems(lostFound || []);
      setError("");
    } catch (err: any) {
      console.error("Error loading posts:", err);
      setError("Failed to load your posts");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteThrift(id: string, title: string) {
    if (!window.confirm(`Delete "${title}"?`)) return;

    try {
      await deleteThriftItem(id);
      alert("Item deleted");
      loadMyPosts();
    } catch (err) {
      alert("Failed to delete item");
    }
  }

  async function handleDeleteLostFound(id: string, title: string) {
    if (!window.confirm(`Delete "${title}"?`)) return;

    try {
      await deleteLostFoundItem(id);
      alert("Item deleted");
      loadMyPosts();
    } catch (err) {
      alert("Failed to delete item");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lu-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your posts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-100 text-red-700 p-4 rounded-lg">
          <p className="font-semibold">Error</p>
          <p>{error}</p>
          <Button onClick={loadMyPosts} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const totalPosts = thriftItems.length + lostFoundItems.length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Posts</h1>
        <p className="text-gray-600 mt-2">
          Manage your listings ({totalPosts} total)
        </p>
      </div>

      {/* Thrift Store Items */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Thrift Store ({thriftItems.length})
        </h2>

        {thriftItems.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <p className="text-gray-500">No thrift items posted yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {thriftItems.map((item) => (
              <div key={item.id} className="bg-white p-6 rounded-xl shadow-lg">
                <div className="w-full h-48 bg-gray-100 rounded-lg mb-4 overflow-hidden">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
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

                <div className="text-xs text-gray-400 mb-4">
                  Posted {new Date(item.created_at).toLocaleDateString()}
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditThrift(item)}
                    className="flex-1 text-blue-800 border-blue-800 hover:bg-blue-50"
                  >
                    Edit
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteThrift(item.id, item.title)}
                    className="w-full text-red-600 border-red-600 hover:bg-red-50"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lost & Found Items */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Lost & Found ({lostFoundItems.length})
        </h2>

        {lostFoundItems.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <p className="text-gray-500">No lost/found items posted yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lostFoundItems.map((item) => (
              <div key={item.id} className="bg-white p-6 rounded-xl shadow-lg">
                <div className="w-full h-48 bg-gray-100 rounded-lg mb-4 overflow-hidden">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
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
                  <span className="text-sm text-gray-500">
                    {new Date(item.date).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm mb-3">{item.description}</p>

                <div className="text-sm text-gray-500 mb-4">
                  Location: {item.location}
                </div>

                <div className="text-xs text-gray-400 mb-4">
                  Posted {new Date(item.created_at).toLocaleDateString()}
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditLostFound(item)}
                    className="flex-1 text-blue-600 border-blue-600 hover:bg-blue-50"
                  >
                    Edit
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteLostFound(item.id, item.title)}
                    className="w-full text-red-600 border-red-600 hover:bg-red-50"
                  >
                    Delete
                  </Button>
                  {/* Edit Modal */}
                  {showEditModal && editingItem && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
                        <div className="flex justify-between items-center mb-6">
                          <h2 className="text-2xl font-bold">Edit Item</h2>
                          <button
                            onClick={() => {
                              setShowEditModal(false);
                              setEditingItem(null);
                            }}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <svg
                              className="w-6 h-6"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>

                        {/* Simple Edit Form */}
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            const updates: any = {
                              title: formData.get("title"),
                              description: formData.get("description"),
                            };

                            if ("price" in editingItem) {
                              // Thrift item
                              updates.price = parseFloat(
                                formData.get("price") as string
                              );
                              updates.category = formData.get("category");
                              updates.condition = formData.get("condition");
                            } else {
                              // Lost & Found item
                              updates.location = formData.get("location");
                              updates.date = formData.get("date");
                            }

                            handleUpdateItem(updates);
                          }}
                          className="space-y-4"
                        >
                          {/* Title */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Title
                            </label>
                            <input
                              name="title"
                              type="text"
                              defaultValue={editingItem.title}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lu-blue-500 focus:border-lu-blue-500"
                              required
                            />
                          </div>

                          {/* Description */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Description
                            </label>
                            <textarea
                              name="description"
                              defaultValue={editingItem.description}
                              rows={4}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lu-blue-500 focus:border-lu-blue-500"
                              required
                            />
                          </div>
                          {/* Description (image change)*/}
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                            <p className="text-sm text-blue-800">
                              💡 <strong>Note:</strong> To change the image,
                              delete this post and create a new one.
                            </p>s
                          </div>

                          {/* Thrift-specific fields */}
                          {"price" in editingItem && (
                            <>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Price
                                </label>
                                <input
                                  name="price"
                                  type="number"
                                  step="0.01"
                                  defaultValue={editingItem.price}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lu-blue-500 focus:border-lu-blue-500"
                                  required
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Category
                                </label>
                                <select
                                  name="category"
                                  defaultValue={editingItem.category}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lu-blue-500 focus:border-lu-blue-500"
                                  required
                                >
                                  <option value="">Select category</option>
                                  <option value="Electronics">
                                    Electronics
                                  </option>
                                  <option value="Furniture">Furniture</option>
                                  <option value="Clothing">Clothing</option>
                                  <option value="Books">Books</option>
                                  <option value="Sports">
                                    Sports & Outdoors
                                  </option>
                                  <option value="Other">Other</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Condition
                                </label>
                                <select
                                  name="condition"
                                  defaultValue={editingItem.condition}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lu-blue-500 focus:border-lu-blue-500"
                                  required
                                >
                                  <option value="">Select condition</option>
                                  <option value="New">New</option>
                                  <option value="Like New">Like New</option>
                                  <option value="Good">Good</option>
                                  <option value="Fair">Fair</option>
                                  <option value="Poor">Poor</option>
                                </select>
                              </div>
                            </>
                          )}

                          {/* Lost & Found specific fields */}
                          {"location" in editingItem && (
                            <>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Location
                                </label>
                                <input
                                  name="location"
                                  type="text"
                                  defaultValue={editingItem.location}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lu-blue-500 focus:border-lu-blue-500"
                                  required
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Date
                                </label>
                                <input
                                  name="date"
                                  type="date"
                                  defaultValue={editingItem.date}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lu-blue-500 focus:border-lu-blue-500"
                                  required
                                />
                              </div>
                            </>
                          )}

                          {/* Buttons */}
                          <div className="flex gap-3 pt-4">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setShowEditModal(false);
                                setEditingItem(null);
                              }}
                              className="flex-1"
                            >
                              Cancel
                            </Button>
                            <Button type="submit" className="flex-1">
                              Save Changes
                            </Button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
