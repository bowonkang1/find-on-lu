import React, { useState } from "react";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { createThriftItem, createLostFoundItem, uploadItemImage, findMatchingLostItems,
  notifyMatchedUsers } from "../lib/supabaseService";
import { sendNewItemNotification, getAllUserEmails } from '../lib/supabaseService';
import { supabase } from '../lib/supabase';

interface PostItemModalProps {
  isOpen: boolean; // Controls if modal shows or hides
  onClose: () => void; // Function to close modal
  type: "lost-found" | "thrift"; // Which type of form to show
  onItemPosted?: (newItem: any) => void; // Tells parent page to reload
}
//

export function PostItemModal({
  isOpen,
  onClose,
  type,
  onItemPosted,
}: PostItemModalProps) {
  // is Open =true -> Modal shows
  // type = "thrift" → Shows price/condition fields
  // Has onClose function to close itself
  // Has onItemPosted function to send data back

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    category: "",
    price: "",
    condition: "",
    itemType: "lost", // for lost-found only(what page I'm on-lost page)
    posterName: "",
    image: null as File | null,
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let savedItem;
      let imageUrl: string | undefined = undefined;

      // Upload image first if exists
      if (formData.image) {
        console.log('📤 Uploading image...');
        imageUrl = await uploadItemImage(formData.image) || undefined;
        console.log('✅ Image uploaded:', imageUrl);
      }

      // Save item to database
      if (type === "thrift") {
        savedItem = await createThriftItem({
          title: formData.title,
          description: formData.description,
          price: parseFloat(formData.price),
          category: formData.category || "Other",
          condition: formData.condition,
          image_url: imageUrl
        });
      } else {
        savedItem = await createLostFoundItem({
          title: formData.title,
          description: formData.description,
          type: formData.itemType as "lost" | "found",
          location: formData.location,
          date: new Date().toISOString().split("T")[0],
          image_url: imageUrl
        });
      }

      console.log('✅ Item saved to database:', savedItem);

      // ============================================
      // 🤖 AI MATCHING FOR FOUND ITEMS
      // ============================================
      if (type === 'lost-found' && formData.itemType === 'found') {
        try {
          console.log('🤖 Starting AI matching...');
          
          const { data: { user } } = await supabase.auth.getUser();
          
          const matches = await findMatchingLostItems({
            title: formData.title,
            description: formData.description,
            location: formData.location,
          });
          
          if (matches.length > 0) {
            console.log(`🎉 Found ${matches.length} potential matches!`);
            
            await notifyMatchedUsers(matches, {
              title: formData.title,
              description: formData.description,
              location: formData.location,
              user_email: user?.email || '',
            });
            
            alert(`Item posted successfully! Found ${matches.length} potential match(es) - users have been notified!`);
          } else {
            console.log('🤖 No AI matches found');
            alert('Item posted successfully! No matching lost items found yet.');
          }
        } catch (aiError) {
          console.error('⚠️ AI matching failed:', aiError);
          alert('Item posted successfully! (AI matching unavailable)');
        }
      } else {
        // Lost items and thrift items - just post, no emails
        alert('Item posted successfully!');
      }

      // Wait for parent to reload items
      if (onItemPosted) {
        await onItemPosted(savedItem);
      }

      // Reset form
      setFormData({
        title: "",
        description: "",
        location: "",
        category: "",
        price: "",
        condition: "",
        itemType: "lost",
        posterName: "",
        image: null,
      });

      // Close modal LAST (after everything else completes)
      onClose();

    } catch (error: any) {
      console.error("Error posting item:", error);
      alert("Failed to post item: " + (error.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">
              {type === "lost-found" ? "Report Item" : "Sell Item"}
            </h2>
            <button
              onClick={onClose}
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

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Lost/Found type selection */}
            {type === "lost-found" && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Item Status
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="itemType"
                      value="lost"
                      checked={formData.itemType === "lost"}
                      onChange={(e) =>
                        setFormData({ ...formData, itemType: e.target.value })
                      }
                      className="mr-2"
                    />
                    I lost something
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="itemType"
                      value="found"
                      checked={formData.itemType === "found"}
                      onChange={(e) =>
                        setFormData({ ...formData, itemType: e.target.value })
                      }
                      className="mr-2"
                    />
                    I found something
                  </label>
                </div>
              </div>
            )}

            <Input
              label="Item Title"
              placeholder="e.g., iPhone 13 Pro"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              required
            />

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lu-blue-500"
                rows={3}
                placeholder="Describe the item..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                required
              />
            </div>

            {/* Image Upload Section */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Item Photo (Optional)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                {formData.image ? (
                  <div className="space-y-2">
                    <img
                      src={URL.createObjectURL(formData.image)}
                      alt="Preview"
                      className="mx-auto h-32 w-32 object-cover rounded-lg"
                    />
                    <div className="flex gap-2 justify-center">
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, image: null })
                        }
                        className="text-red-600 text-sm hover:text-red-800"
                      >
                        Remove
                      </button>
                      <label className="text-blue-600 text-sm hover:text-blue-800 cursor-pointer">
                        Change Photo
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            setFormData({ ...formData, image: file });
                          }} //
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <p className="mt-2 text-sm text-gray-600">
                      <span className="font-medium text-blue-600">
                        Click to upload
                      </span>{" "}
                      or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, GIF up to 5MB
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setFormData({ ...formData, image: file });
                      }}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {type === "lost-found" && (
              <Input
                label="Location"
                placeholder="Where was it lost/found?"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                required
              />
            )}

            {type === "thrift" && (
              <>
                <Input
                  label="Price ($)"
                  type="number"
                  placeholder="0.00"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                  required
                />

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Condition
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lu-blue-500"
                    value={formData.condition}
                    onChange={(e) =>
                      setFormData({ ...formData, condition: e.target.value })
                    }
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

            {/* Add these fields before the buttons section */}
            <Input
              label="Your Name"
              placeholder="Your full name"
              value={formData.posterName}
              onChange={(e) =>
                setFormData({ ...formData, posterName: e.target.value })
              }
              required
            />

            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? "Posting..." : "Post Item"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
