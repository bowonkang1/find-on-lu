import React from "react";
import { Button } from "./ui/Button";
import { sendContactEmail } from "../lib/supabaseService";
import { openPrefilledEmail } from "../lib/openPrefilledEmail";
import { getMobileContactAction, isMobileDevice } from "../lib/mobileContactFlow";

interface ItemDetailsModalProps {
  item: {
    id: string;
    title: string;
    description: string;
    user_email: string;
    created_at: string;
    image_url?: string;
    // Thrift-specific (optional)
    price?: number;
    condition?: string;
    category?: string;
    // Lost&Found-specific (optional)
    type?: "lost" | "found";
    location?: string;
    date?: string;
  };
  onClose: () => void;
}
export function ItemDetailsModal({ item, onClose }: ItemDetailsModalProps) {
  // Get poster name from email

  const posterName = item.user_email.split("@")[0];

  // Format date - use 'date' if it exists (Lost&Found), otherwise use created_at
  const displayDate = item.date
    ? new Date(item.date).toLocaleDateString()
    : new Date(item.created_at).toLocaleDateString();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
        {/* Close button */}
        <button
          onClick={onClose}
          className="float-right text-gray-500 hover:text-gray-700"
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

        {/* Image */}
        {item.image_url && (
          <div className="w-full max-w-lg mx-auto mb-4">
            <img
              src={item.image_url}
              alt={item.title}
              className="w-full h-80 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => window.open(item.image_url, "_blank")}
              title="Click to view full size"
            />
          </div>
        )}

        {/* Title and Price */}
        <h2 className="text-2xl font-bold mb-2">{item.title}</h2>
        {item.price !== undefined && (
          <p className="text-3xl font-bold text-green-600 mb-4">
            ${item.price}
          </p>
        )}

        {/* Full Description */}
        <div className="mb-4">
          <h3 className="font-semibold text-gray-700 mb-2">Description</h3>
          <p className="text-gray-600">{item.description}</p>
        </div>

        {/* Details */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Show condition if it exists (Thrift items) */}
          {item.condition && (
            <div>
              <p className="text-sm text-gray-500">Condition</p>
              <p className="font-medium">{item.condition}</p>
            </div>
          )}

          {/* Show category if it exists (Thrift items) */}
          {item.category && (
            <div>
              <p className="text-sm text-gray-500">Category</p>
              <p className="font-medium">{item.category}</p>
            </div>
          )}

          {/* Show type if it exists (Lost&Found items) */}
          {item.type && (
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <p className="font-medium">
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    item.type === "lost"
                      ? "bg-red-100 text-red-700"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {item.type.toUpperCase()}
                </span>
              </p>
            </div>
          )}

          {/* Show location if it exists (Lost&Found items) */}
          {item.location && (
            <div>
              <p className="text-sm text-gray-500">Location</p>
              <p className="font-medium">{item.location}</p>
            </div>
          )}

          {/* Always show date and seller */}
          <div>
            <p className="text-sm text-gray-500">Posted</p>
            <p className="font-medium">{displayDate}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">
              {item.price !== undefined ? "Seller" : "Posted by"}
            </p>
            <p className="font-medium">{posterName}</p>
          </div>
        </div>

        {/* Contact Button */}
        <Button
          className="w-full"
          onClick={async () => {
            const subject =
              item.type === "lost"
                ? `About your lost item post: ${item.title}`
                : item.type === "found"
                  ? `About your found item post: ${item.title}`
                  : item.type
                    ? `About your ${item.type} item: ${item.title}`
                    : `Interested in: ${item.title}`;

            let body = "";

            // prefilled email templates for thrift, lost, and found items
            if (item.price !== undefined) {
              // Thrift item
              body = `Hi ${posterName},\n\nI'm interested in your item "${item.title}" listed for $${item.price}.\n\nIs this still available?\n\nThanks!`;
            } else if (item.type === "lost") {
              // LOST item - someone found it and wants to return it
              body = `Hi ${posterName},\n\nI saw your lost item posting for "${item.title}" on Find On LU.\n\nI found something matching your description. Let me know when you're available and we can arrange to return it.\n\nThanks!`;
            } else if (item.type === "found") {
              body = `Hi ${posterName},\n\nI'm reaching out about your Find On LU found post "${item.title}". I think this item might be mine, and I'd like to coordinate a quick meet-up on campus to verify.\n\nThanks!`;
            } else {
              // Fallback for any other case
              body = `Hi ${posterName},\n\nI saw your posting for "${item.title}" on Find On LU.\n\nPlease let me know if this is still available.\n\nThanks!`;
            }

            if (!isMobileDevice()) {
              openPrefilledEmail(item.user_email, subject, body);
              return;
            }

            const action = getMobileContactAction({
              to: item.user_email,
              subject,
              message: body,
            });

            if (action === "cancel") {
              return;
            }

            try {
              await sendContactEmail({
                to: item.user_email,
                subject,
                message: body,
              });
              alert(
                `Message sent.\nTo: ${item.user_email}\nSubject: ${subject}\nReplies will go to your Lawrence email.`
              );
            } catch (error: any) {
              alert(error?.message || "Failed to send message.");
            }
          }}
        >
          Contact {item.price !== undefined ? "Seller" : "Poster"}
        </Button>
      </div>
    </div>
  );
}
