import React, { useState, useEffect } from "react";
import { Button } from "../components/ui/Button";
import {
  getMyThriftItems,
  getMyLostFoundItems,
  deleteThriftItem,
  deleteLostFoundItem,
  updateThriftItem,
  updateLostFoundItem,
  updateItemStatus,
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
  const [lostFoundFilter, setLostFoundFilter] = useState<
    "all" | "lost" | "found"
  >("all");
  const [sectionFilter, setSectionFilter] = useState<
    "all" | "thrift" | "lostfound"
  >("all");

  useEffect(() => {
    loadMyPosts();
  }, []);

  function confirmWhenPageActive(message: string): boolean {
    if (typeof document !== "undefined" && document.visibilityState !== "visible") {
      alert("Please switch back to the app tab and try again.");
      return false;
    }
    return window.confirm(message);
  }

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
      if ("price" in editingItem) {
        await updateThriftItem(editingItem.id, updatedData);
      } else {
        await updateLostFoundItem(editingItem.id, updatedData);
      }

      alert("Item updated successfully!");
      setShowEditModal(false);
      setEditingItem(null);
      loadMyPosts();
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
    if (!confirmWhenPageActive(`Delete "${title}"?`)) return;

    try {
      await deleteThriftItem(id);
      alert("Item deleted");
      loadMyPosts();
    } catch (err) {
      alert("Failed to delete item");
    }
  }

  async function handleDeleteLostFound(id: string, title: string) {
    if (!confirmWhenPageActive(`Delete "${title}"?`)) return;

    try {
      await deleteLostFoundItem(id);
      alert("Item deleted");
      loadMyPosts();
    } catch (err) {
      alert("Failed to delete item");
    }
  }
  async function handleMarkAsReunited(itemId: string) {
    if (
      !confirmWhenPageActive(
        "Mark this item as reunited? It will no longer appear in AI matching."
      )
    ) {
      return;
    }

    try {
      await updateItemStatus(itemId, "reunited");
      alert("Item marked as reunited!");
      loadMyPosts();
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status");
    }
  }

  async function handleMarkAsActive(itemId: string) {
    try {
      await updateItemStatus(itemId, "active");
      alert("Item marked as active again!");
      loadMyPosts();
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status");
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

  const filteredLostFoundItems = lostFoundItems.filter((item) => {
    if (lostFoundFilter === "all") return true;
    return item.type === lostFoundFilter;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Posts</h1>
        <p className="text-gray-600 mt-2">
          Manage your listings ({totalPosts} total)
        </p>
        <div className="flex flex-wrap items-center gap-2 mt-4">
          <span className="text-xs sm:text-sm font-medium text-gray-600">
            Show:
          </span>
          <Button
            size="sm"
            variant={sectionFilter === "all" ? "primary" : "outline"}
            onClick={() => setSectionFilter("all")}
            className="text-xs sm:text-sm px-2 sm:px-3"
          >
            All ({totalPosts})
          </Button>
          <Button
            size="sm"
            variant={sectionFilter === "thrift" ? "primary" : "outline"}
            onClick={() => setSectionFilter("thrift")}
          >
            Thrift ({thriftItems.length})
          </Button>
          <Button
            size="sm"
            variant={sectionFilter === "lostfound" ? "primary" : "outline"}
            onClick={() => setSectionFilter("lostfound")}
          >
            Lost & Found ({lostFoundItems.length})
          </Button>
        </div>
      </div>

      {(sectionFilter === "all" || sectionFilter === "thrift") && (
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
                <div
                  key={item.id}
                  className="bg-white p-6 rounded-xl shadow-lg"
                >
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

                  <div className="text-xs text-gray-400 mb-3">
                    Posted {new Date(item.created_at).toLocaleDateString()}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditThrift(item)}
                      className="flex-1 text-blue-600 border-blue-600 hover:bg-blue-50"
                    >
                      Edit
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteThrift(item.id, item.title)}
                      className="flex-1 text-red-600 border-red-600 hover:bg-red-50"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {(sectionFilter === "all" || sectionFilter === "lostfound") && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-800">
              Lost & Found ({lostFoundItems.length})
            </h2>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant={lostFoundFilter === "all" ? "primary" : "outline"}
                onClick={() => setLostFoundFilter("all")}
              >
                All ({lostFoundItems.length})
              </Button>
              <Button
                size="sm"
                variant={lostFoundFilter === "lost" ? "primary" : "outline"}
                onClick={() => setLostFoundFilter("lost")}
                className={
                  lostFoundFilter === "lost"
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : ""
                }
              >
                Lost ({lostFoundItems.filter((i) => i.type === "lost").length})
              </Button>
              <Button
                size="sm"
                variant={lostFoundFilter === "found" ? "primary" : "outline"}
                onClick={() => setLostFoundFilter("found")}
                className={
                  lostFoundFilter === "found"
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : ""
                }
              >
                Found ({lostFoundItems.filter((i) => i.type === "found").length}
                )
              </Button>
            </div>
          </div>

          {filteredLostFoundItems.length === 0 ? (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <p className="text-gray-500">
                {lostFoundFilter === "all"
                  ? "No lost/found items posted yet"
                  : `No ${lostFoundFilter} items posted yet`}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredLostFoundItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white p-6 rounded-xl shadow-lg"
                >
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
                  <p className="text-gray-600 text-sm mb-3">
                    {item.description}
                  </p>
                  <div className="text-sm text-gray-500 mb-3">
                    Location: {item.location}
                  </div>

                  <div className="text-xs text-gray-400 mb-3">
                    Posted {new Date(item.created_at).toLocaleDateString()}
                  </div>

                  <div className="mb-3">
                    {item.status === "reunited" ? (
                      <span className="inline-block bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                        ✅ Reunited
                      </span>
                    ) : (
                      <span className="inline-block bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                        📍 Active
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    {item.status === "active" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMarkAsReunited(item.id)}
                        className="w-full text-green-600 border-green-600 hover:bg-green-50"
                      >
                        ✅ Mark as Reunited
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMarkAsActive(item.id)}
                        className="w-full text-blue-600 border-blue-600 hover:bg-blue-50"
                      >
                        📍 Mark as Active
                      </Button>
                    )}

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
                        onClick={() =>
                          handleDeleteLostFound(item.id, item.title)
                        }
                        className="flex-1 text-red-600 border-red-600 hover:bg-red-50"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showEditModal && editingItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
        >
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

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const updates: any = {
                  title: formData.get("title"),
                  description: formData.get("description"),
                };

                if ("price" in editingItem) {
                  updates.price = parseFloat(formData.get("price") as string);
                  updates.category = formData.get("category");
                  updates.condition = formData.get("condition");
                } else {
                  updates.location = formData.get("location");
                  updates.date = formData.get("date");
                }

                handleUpdateItem(updates);
              }}
              className="space-y-4"
            >
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
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-800">
                  💡 <strong>Note:</strong> To change the image, delete this
                  post and create a new one.
                </p>
              </div>

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
                      <option value="Electronics">Electronics</option>
                      <option value="Furniture">Furniture</option>
                      <option value="Clothing">Clothing</option>
                      <option value="Books">Books</option>
                      <option value="Sports">Sports & Outdoors</option>
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
  );
}
