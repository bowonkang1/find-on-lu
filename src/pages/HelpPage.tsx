import React from 'react';

export function HelpPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
          How to Use Find On LU
        </h1>
        <p className="text-gray-600">
          Everything you need to know about finding lost items, selling stuff, and staying safe
        </p>
      </div>

      {/* Quick Start */}
      <section className="mb-10 bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl">
        <h2 className="text-2xl font-bold mb-4 flex items-center">
          <span className="mr-2"></span> Quick Start
        </h2>
        <div className="space-y-2 text-gray-700">
          <p><strong>Lost something?</strong> Post it → Get AI match emails → Mark as Reunited when found</p>
          <p><strong>Found something?</strong> Post it → AI notifies the owner → Delete after returning it</p>
          <p><strong>Selling stuff?</strong> Post price & photos → Buyers contact you → Meet safely on campus</p>
        </div>
      </section>

      {/* Install as an App */}
      <section className="mb-10 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold mb-4 flex items-center">
          <span className="mr-2"></span> Install as an App
        </h2>
        <p className="text-gray-700 mb-4">Use Find On LU like a real app!</p>
        
        <div className="grid md:grid-cols-2 gap-6 mb-4">
          <div>
            <h3 className="font-semibold text-lg mb-2">iPhone (Safari):</h3>
            <ol className="list-decimal list-inside space-y-1 text-gray-700 text-sm">
              <li>Tap the Share button (⬆️)</li>
              <li>Scroll down and tap "Add to Home Screen"</li>
              <li>Tap "Add"</li>
              <li>The Find On LU icon appears on your home screen!</li>
            </ol>
          </div>
          
          <div>
            <h3 className="font-semibold text-lg mb-2">Android (Chrome):</h3>
            <ol className="list-decimal list-inside space-y-1 text-gray-700 text-sm">
              <li>Tap the menu (⋮)</li>
              <li>Tap "Install app" or "Add to Home Screen"</li>
              <li>Tap "Install"</li>
              <li>Launch from your app drawer!</li>
            </ol>
          </div>
        </div>
      </section>

      {/* Lost & Found */}
      <section className="mb-10 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold mb-4 flex items-center">
          <span className="mr-2">📱</span> Lost & Found
        </h2>
        
        <div className="mb-6">
          <h3 className="font-semibold text-lg mb-3">Post a Lost Item</h3>
          <ol className="list-decimal list-inside space-y-2 text-gray-700 text-sm">
            <li>Upload a clear photo</li>
            <li>Describe: color, brand, location, when lost</li>
            <li>Check your email for AI match notifications</li>
          </ol>
        </div>
        
        <div className="mb-6">
          <h3 className="font-semibold text-lg mb-3">Post a Found Item</h3>
          <ol className="list-decimal list-inside space-y-2 text-gray-700 text-sm">
            <li>Upload a photo and location</li>
            <li>Owner gets notified automatically</li>
            <li>Delete your post after returning it</li>
          </ol>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">When Reunited</h3>
          <ul className="text-sm text-gray-700 space-y-1">
            <li><strong>Lost owners:</strong> Click "Mark as Reunited" (stops emails, keeps record)</li>
            <li><strong>Found posters:</strong> Click "Delete" (removes from system)</li>
          </ul>
        </div>
      </section>

      {/* AI Matching */}
      <section className="mb-10 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold mb-4 flex items-center">
          <span className="mr-2">🤖</span> AI Matching
        </h2>
        
        <p className="text-gray-700 mb-4">
          <strong>How it works:</strong> Our AI compares photos and descriptions to find matches automatically.
        </p>
        
        <div className="mb-4">
          <p className="font-semibold mb-2">What to do:</p>
          <ul className="space-y-1 text-sm text-gray-700">
            <li>• Lost item owners get email notifications</li>
            <li>• Verify details before meeting</li>
            <li>• AI suggests matches - you confirm they're correct</li>
          </ul>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg">
          <p className="font-semibold text-sm mb-1">Privacy:</p>
          <p className="text-sm text-gray-700">
            Only potential matches see your email. No public contact info.
          </p>
        </div>
      </section>

      {/* About Contact Buttons */}
      <section className="mb-10 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold mb-4 flex items-center">
          <span className="mr-2">📧</span> About Contact Buttons
        </h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-2">Desktop:</h3>
            <p className="text-sm text-gray-700">
              When you click "Contact" or "Contact Seller," Outlook opens with everything pre-filled (subject and message). Just click Send!
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">Mobile:</h3>
            <p className="text-sm text-gray-700">
              The Outlook mobile app opens, but you'll need to type the subject and message yourself. This is a limitation of the Outlook app, not Find On LU.
            </p>
          </div>
        </div>
        
        <div className="mt-4 bg-gray-50 p-4 rounded-lg">
          <p className="font-semibold text-sm mb-1">Tips:</p>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• The recipient's email address is always filled in automatically</li>
            <li>• Keep your messages polite and specific</li>
            <li>• Include details about the item to help verify it's yours</li>
          </ul>
        </div>
      </section>

      {/* Safety */}
      <section className="mb-10 bg-white p-6 rounded-xl shadow-sm border border-red-100">
        <h2 className="text-2xl font-bold mb-4 flex items-center text-red-700">
          <span className="mr-2">⚠️</span> Safety (Especially for Valuable Items)
        </h2>
        
        <div className="grid md:grid-cols-2 gap-6 mb-4">
          <div>
            <h3 className="font-semibold mb-2">If you lost something expensive:</h3>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>• Don't share serial numbers publicly</li>
              <li>• Meet in public campus areas (library, café, union)</li>
              <li>• Ask claimant to describe details you didn't post</li>
              <li>• Bring a friend</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">If you found something expensive:</h3>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>• Don't post identifying details (serial #, passwords)</li>
              <li>• Ask for proof of ownership</li>
              <li>• Meet in public, bring a friend</li>
              <li>• When in doubt, turn it in to Campus Safety</li>
            </ul>
          </div>
        </div>
        
        <div className="bg-red-50 p-4 rounded-lg">
          <p className="font-semibold text-sm mb-2 text-red-800">Red flags:</p>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• Can't describe the item accurately</li>
            <li>• Wants to meet off-campus alone</li>
            <li>• Generic description ("black phone")</li>
          </ul>
        </div>
      </section>

      {/* Tips for Success */}
      <section className="mb-10 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold mb-4 flex items-center">
          <span className="mr-2">💡</span> Tips for Success
        </h2>
        
        <div className="mb-4">
          <p className="font-semibold mb-2">Good posts include:</p>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>✅ Clear, well-lit photos</li>
            <li>✅ Specific details: "Navy JanSport backpack with red zipper and 'Class of 2025' pin"</li>
            <li>✅ Exact location and time</li>
            <li>❌ Not: "blue backpack"</li>
          </ul>
        </div>
        
        <div className="bg-yellow-50 p-4 rounded-lg">
          <p className="font-semibold text-sm mb-2">Remember:</p>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• Check Lawrence email daily</li>
            <li>• Respond within 24-48 hours</li>
            <li>• Mark items as Reunited to stop duplicate emails</li>
            <li>• Delete old posts to keep the platform clean</li>
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section className="mb-10 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold mb-4 flex items-center">
          <span className="mr-2">❓</span> Common Questions
        </h2>
        
        <div className="space-y-4">
          <div>
            <p className="font-semibold text-sm mb-1">Is AI matching accurate?</p>
            <p className="text-sm text-gray-700">It suggests matches - you verify the details.</p>
          </div>
          
          <div>
            <p className="font-semibold text-sm mb-1">Can I edit my post?</p>
            <p className="text-sm text-gray-700">Yes, in "My Posts" click Edit.</p>
          </div>
          
          <div>
            <p className="font-semibold text-sm mb-1">Marked as Reunited by mistake?</p>
            <p className="text-sm text-gray-700">Click "Mark as Active" to turn AI matching back on.</p>
          </div>
          
          <div>
            <p className="font-semibold text-sm mb-1">How long do posts stay?</p>
            <p className="text-sm text-gray-700">Until you delete them. Remove old posts to help others.</p>
          </div>
          
          <div>
            <p className="font-semibold text-sm mb-1">What if someone claims my found item incorrectly?</p>
            <p className="text-sm text-gray-700">Ask them to describe features you didn't mention. Request proof for valuable items.</p>
          </div>
        </div>
      </section>

      {/* Need Help */}
      <section className="bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 text-white p-6 rounded-xl text-center">
        <h2 className="text-2xl font-bold mb-4">📞 Need Help?</h2>
        <p className="mb-2">Contact Campus Safety or visit the Info Desk</p>
        <p className="text-sm opacity-90">We're here to help keep the Lawrence community connected!</p>
      </section>
    </div>
  );
}