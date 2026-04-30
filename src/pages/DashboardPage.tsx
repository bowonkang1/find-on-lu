import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

export function DashboardPage() {
  //add state for real data
  const [stats, setStats] = useState({
    lostItems: 0, //tracks how many items were reported as lost
    foundItems: 0, //tracks how many items were found
    thriftItems: 0, //tracks how many thrift items exist
    itemsReunited: 0, //tracks how many lost items were matched with their owners
    soldItems: 0, //tracks how many thrift items were marked sold
    loading: true, //data is being fetched or not yet loaded
  });
  const [showWelcome, setShowWelcome] = useState(false);
  const navigate = useNavigate();

  //fetch real data when components loads
  useEffect(() => {
    fetchStats();
  }, []); //[]-> run one time only

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem("hasSeenWelcome");
    if (!hasSeenWelcome) {
      setShowWelcome(true);
    }
  }, []);

  const fetchStats = async () => {
    //fechStats-> retrieves data from a supabase and updates web stats
    try {
      //destructurig + renaming
      const { count: lostCount } = await supabase
        .from("lost_found_items")
        .select("*", { count: "exact", head: true })
        //*-> data I want to select,
        //exact-> Return the exact number of rows that match the filters
        //head:true-> Only return the countnot actual rows
        .eq("type", "lost")
        .eq("status", "active");

      //count found items
      const { count: foundCount } = await supabase
        .from("lost_found_items")
        .select("*", { count: "exact", head: true })
        .eq("type", "found")
        .eq("status", "active");

      // Count thrift items (available only)
      const { count: thriftCount } = await supabase
        .from("thrift_items")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");

      const { count: soldCount } = await supabase
        .from("thrift_items")
        .select("*", { count: "exact", head: true })
        .eq("status", "sold");

      // Count reunited items (all time) - Lost items only
      const { count: reunitedCount } = await supabase
        .from("lost_found_items")
        .select("*", { count: "exact", head: true })
        .eq("type", "lost")
        .eq("status", "reunited");

      setStats({
        lostItems: lostCount || 0,
        foundItems: foundCount || 0,
        thriftItems: thriftCount || 0,
        itemsReunited: reunitedCount || 0,
        soldItems: soldCount || 0,
        loading: false,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      setStats((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleSkipWelcome = () => {
    localStorage.setItem("hasSeenWelcome", "true");
    setShowWelcome(false);
  };

  const handleReadHelp = () => {
    localStorage.setItem("hasSeenWelcome", "true");
    setShowWelcome(false);
    navigate("/help");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {showWelcome && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                 Welcome to Find On LU!
              </h2>
            </div>

            <div className="space-y-4 mb-6">
              <div className="bg-blue-50 p-3 rounded-lg flex items-start gap-3">
                <span className="text-2xl flex-shrink-0">📱</span>
                <div>
                  <h3 className="font-semibold text-gray-900">Lost & Found</h3>
                  <p className="text-sm text-gray-600">
                    Post lost/found items and get AI match notifications via
                    email
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg flex items-start gap-3">
                <span className="text-2xl flex-shrink-0">🛒</span>
                <div>
                  <h3 className="font-semibold text-gray-900">Thrift Store</h3>
                  <p className="text-sm text-gray-700">
                    Buy and sell with fellow students
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-gray-300"
                  onChange={(e) => {
                    if (e.target.checked) {
                      localStorage.setItem("hasSeenWelcome", "true");
                    } else {
                      localStorage.removeItem("hasSeenWelcome");
                    }
                  }}
                />
                Don't show this again
              </label>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleSkipWelcome}
                className="flex-1 !text-gray-600 !border-gray-300 hover:!bg-gray-50"
              >
                Skip
              </Button>
              <Button
                variant="outline"
                onClick={handleReadHelp}
                className="flex-1 !text-blue-600 !border-blue-600 hover:!bg-blue-50"
              >
                Read Help Guide →
              </Button>
            </div>
          </div>
        </div>
      )}
      <div
        className="mb-10 rounded-2xl overflow-hidden"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0, 43, 91, 0.20), rgba(0, 43, 91, 0.20)), url('/campus-hero.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center 20%",
        }}
      >
        <div className="text-center px-6 py-11 md:py-14 backdrop-blur-0">
          <img
            src="/logo-lawrence.png"
            alt="Lawrence University Logo"
            className="h-24 md:h-28 w-auto mx-auto mb-6 drop-shadow-md"
          />

          <h2 className="text-3xl md:text-5xl font-semibold text-white mb-4 tracking-tight drop-shadow-md">
            Welcome to Find On LU
          </h2>

          <div className="w-20 h-1 bg-white/80 rounded-full mx-auto mb-5"></div>

          <p className="text-xl text-white/95 font-medium">
            Your campus lost & found and marketplace platform
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">📱</span>
          </div>
          <h3 className="text-xl font-semibold mb-3">Lost & Found</h3>
          <p className="text-gray-600 mb-6">
            Report lost items or help others find theirs
          </p>
          <Link to="/lost-found">
            <Button className="w-full">Browse Lost & Found</Button>
          </Link>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🛒</span>
          </div>
          <h3 className="text-xl font-semibold mb-3">Thrift Store</h3>
          <p className="text-gray-600 mb-6">
            Buy and sell items with fellow students
          </p>
          <Link to="/thrift">
            <Button className="w-full">Browse Thrift Store</Button>
          </Link>
        </div>
      </div>

      <div className="mt-12 text-center">
        <h3 className="text-xl font-semibold mb-4 text-gray-900">
          Quick Stats
        </h3>

        {stats.loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 max-w-5xl mx-auto">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="bg-white p-3 sm:p-4 rounded-lg shadow animate-pulse"
              >
                <div className="h-8 bg-gray-300 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 max-w-5xl mx-auto">
            {/* Lost Items */}
            <div className="bg-white p-3 sm:p-4 rounded-lg shadow hover:shadow-lg transition-shadow">
              <div className="text-2xl sm:text-3xl font-bold text-blue-700">
                {stats.lostItems}
              </div>
              <div className="text-xs sm:text-sm text-gray-600 mt-1">Lost Items</div>
              <div className="text-[11px] sm:text-xs text-gray-400 mt-1">Currently Active</div>
            </div>

            {/* Found Items */}
            <div className="bg-white p-3 sm:p-4 rounded-lg shadow hover:shadow-lg transition-shadow">
              <div className="text-2xl sm:text-3xl font-bold text-orange-500">
                {stats.foundItems}
              </div>
              <div className="text-xs sm:text-sm text-gray-600 mt-1">Found Items</div>
              <div className="text-[11px] sm:text-xs text-gray-400 mt-1">Waiting to Claim</div>
            </div>

            {/* Thrift Items */}
            <div className="bg-white p-3 sm:p-4 rounded-lg shadow hover:shadow-lg transition-shadow">
              <div className="text-2xl sm:text-3xl font-bold text-pink-500">
                {stats.thriftItems}
              </div>
              <div className="text-xs sm:text-sm text-gray-600 mt-1">Items for Sale</div>
              <div className="text-[11px] sm:text-xs text-gray-400 mt-1">Available Now</div>
            </div>

            <div className="bg-white p-3 sm:p-4 rounded-lg shadow hover:shadow-lg transition-shadow">
              <div className="text-2xl sm:text-3xl font-bold text-lime-700">
                {stats.soldItems}
              </div>
              <div className="text-xs sm:text-sm text-gray-600 mt-1">Items Sold</div>
              <div className="text-[11px] sm:text-xs text-gray-400 mt-1">All Time</div>
            </div>

            <div className="bg-white p-3 sm:p-4 rounded-lg shadow hover:shadow-lg transition-shadow">
              <div className="text-2xl sm:text-3xl font-bold text-violet-800">
                {stats.itemsReunited}
              </div>
              <div className="text-xs sm:text-sm text-gray-600 mt-1">Reunited! 🎉</div>
              <div className="text-[11px] sm:text-xs text-gray-400 mt-1">All Time</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
