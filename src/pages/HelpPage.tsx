import React from "react";

export function HelpPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
          How to Use Find On LU
        </h1>
        <p className="text-gray-600">
          A quick guide for posting, matching, and contacting people safely on campus.
        </p>
      </div>

      {/* Quick Start */}
      <section className="mb-8 bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl">
        <h2 className="text-2xl font-bold mb-4">Quick Start</h2>
        <div className="space-y-2 text-gray-700 text-sm">
          <p>
            <strong>Lost an item?</strong> Post it with clear details and photo. If a likely
            match appears, you may get an email.
          </p>
          <p>
            <strong>Found an item?</strong> Post location + basic details so owners can identify it.
          </p>
          <p>
            <strong>Selling something?</strong> Add price/photos and respond quickly to interested buyers.
          </p>
        </div>
      </section>

      {/* Lost & Found */}
      <section className="mb-8 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold mb-4">Lost &amp; Found Tips</h2>

        <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-700">
          <div>
            <h3 className="font-semibold mb-2">For Lost Posts</h3>
            <ul className="space-y-1">
              <li>• Include color, brand, and where you last saw it</li>
              <li>• Add a clear photo if possible</li>
              <li>• Check your Lawrence email regularly</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">For Found Posts</h3>
            <ul className="space-y-1">
              <li>• Share enough info, but keep sensitive details private</li>
              <li>• Ask claimants for proof of ownership</li>
              <li>• Delete the post after returning the item</li>
            </ul>
          </div>
        </div>

        <div className="mt-4 bg-green-50 p-4 rounded-lg text-sm text-gray-700">
          <p>
            <strong>When your lost item is recovered:</strong> use{" "}
            <strong>Mark as Reunited</strong> in My Posts so matching notifications stop.
          </p>
        </div>
      </section>

      {/* AI Matching */}
      <section className="mb-8 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold mb-4">AI Matching (What to Expect)</h2>
        <p className="text-sm text-gray-700 mb-3">
          The system compares item descriptions (and sometimes image details) to suggest possible
          matches between lost and found posts.
        </p>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• Treat matches as suggestions, not final proof</li>
          <li>• Always verify details before meeting</li>
          <li>• If details are weak, the match may be less reliable</li>
        </ul>
      </section>

      {/* Contact */}
      <section className="mb-8 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold mb-4">Contacting Someone</h2>
        <p className="text-sm text-gray-700 mb-3">
          The Contact button opens Outlook with the recipient pre-filled. On some mobile setups,
          you may need to complete subject/body manually.
        </p>
        <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700">
          <p className="font-semibold mb-1">Best practice:</p>
          <ul className="space-y-1">
            <li>• Keep messages specific and polite</li>
            <li>• Mention identifying details when claiming an item</li>
            <li>• Meet in a public campus location</li>
          </ul>
        </div>
      </section>

      {/* Safety */}
      <section className="mb-8 bg-white p-6 rounded-xl shadow-sm border border-red-100">
        <h2 className="text-2xl font-bold mb-4 text-red-700">Safety</h2>
        <div className="text-sm text-gray-700 space-y-2">
          <p>• Meet in public campus spaces (library, union, cafe)</p>
          <p>• Bring a friend for high-value items</p>
          <p>• Do not share serial numbers or sensitive data publicly</p>
          <p>• If something feels off, contact Campus Safety</p>
        </div>
      </section>

      {/* FAQ */}
      <section className="mb-8 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold mb-4">Common Questions</h2>
        <div className="space-y-4 text-sm">
          <div>
            <p className="font-semibold">Can I edit my post?</p>
            <p className="text-gray-700">Yes. Go to My Posts and click Edit.</p>
          </div>
          <div>
            <p className="font-semibold">I marked an item as reunited by mistake.</p>
            <p className="text-gray-700">In My Posts, switch it back to active.</p>
          </div>
          <div>
            <p className="font-semibold">How long do posts stay up?</p>
            <p className="text-gray-700">
              They remain until you delete them. Removing old posts keeps results cleaner.
            </p>
          </div>
        </div>
      </section>

      {/* Footer Help */}
      <section className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-6 rounded-xl text-center">
        <h2 className="text-2xl font-bold mb-2">Need Help?</h2>
        <p>If you run into a safety issue, contact Campus Safety right away.</p>
      </section>
    </div>
  );
}