import React, {useEffect, useState} from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { supabase } from '../lib/supabase';

export function DashboardPage() {
  //add state for real data
  const [stats, setStats] = useState({
    lostItems: 0, //tracks how many items were reported as lost
    foundItems: 0, //tracks how many items were found
    thriftItems: 0, //tracks how many thrift items exist
    itemsReunited: 0, //tracks how many lost items were matched with their owners
    loading: true //data is being fetched or not yet loaded
  });

  //fetch real data when components loads
  useEffect(() => {
    fetchStats();
  }, []); //[]-> run one time only

  const fetchStats = async() => { //fechStats-> retrieves data from a supabase and updates web stats
    try{
      //destructurig + renaming
      const { count: lostCount } = await supabase
      .from('lost_found_items')
      .select('*', { count: 'exact', head: true })
      //*-> data I want to select,
      //exact-> Return the exact number of rows that match the filters
      //head:true-> Only return the countnot actual rows
      .eq('type', 'lost')
      .eq('status', 'active');

      //count found items
      const { count: foundCount } = await supabase
        .from('lost_found_items')
        .select('*', { count: 'exact', head: true })
        .eq('type', 'found')
        .eq('status', 'active');

      // Count thrift items (available only)
      const { count: thriftCount } = await supabase
        .from('thrift_items')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'available');

      // Count reunited items (all time)
      const { count: reunitedCount } = await supabase
        .from('lost_found_items')
        .select('*', { count: 'exact', head: true })
        .eq('type', 'lost')
        .eq('status', 'found');

        setStats({
          lostItems: lostCount || 0,
          foundItems: foundCount || 0,
          thriftItems: thriftCount || 0,
          itemsReunited: reunitedCount || 0,
          loading: false
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
        setStats(prev => ({ ...prev, loading: false }));
      }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
      <img
          src="/logo-lawrence.png"
          alt="Lawrence University Logo"
          className="h-32 w-auto mx-auto mb-4"
        />


        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Welcome to Find On LU
        </h2>


        <p className="text-lg text-gray-600">
          Your campus lost & found and marketplace platform
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">📱</span>
          </div>
          <h3 className="text-xl font-semibold mb-3">Lost & Found</h3>
          <p className="text-gray-600 mb-6">Report lost items or help others find theirs</p>
          <Link to="/lost-found">
            <Button className="w-full">Browse Lost & Found</Button>
          </Link>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🛒</span>
          </div>
          <h3 className="text-xl font-semibold mb-3">Thrift Store</h3>
          <p className="text-gray-600 mb-6">Buy and sell items with fellow students</p>
          <Link to="/thrift">
            <Button className="w-full">Browse Thrift Store</Button>
          </Link>
        </div>
      </div>

      <div className="mt-12 text-center">
        <h3 className="text-xl font-semibold mb-4 text-gray-900">Quick Stats</h3>

        {stats.loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white p-4 rounded-lg shadow animate-pulse">
                <div className="h-8 bg-gray-300 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
           {/* Lost Items */}
           <div className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition-shadow">
           <div className="text-3xl font-bold text-red-600">
             {stats.lostItems}
           </div>
           <div className="text-sm text-gray-600 mt-1">Lost Items</div>
           <div className="text-xs text-gray-400 mt-1">Currently Active</div>
         </div>

         {/* Found Items */}
         <div className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition-shadow">
              <div className="text-3xl font-bold text-green-600">
                {stats.foundItems}
              </div>
              <div className="text-sm text-gray-600 mt-1">Found Items</div>
              <div className="text-xs text-gray-400 mt-1">Waiting to Claim</div>
          </div>

          {/* Thrift Items */}
          <div className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition-shadow">
              <div className="text-3xl font-bold text-blue-600">
                {stats.thriftItems}
              </div>
              <div className="text-sm text-gray-600 mt-1">Items for Sale</div>
              <div className="text-xs text-gray-400 mt-1">Available Now</div>
          </div>

          {/* ✅ NEW: Items Reunited */}
          <div className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition-shadow">
              <div className="text-3xl font-bold text-purple-600">
                {stats.itemsReunited}
              </div>
              <div className="text-sm text-gray-600 mt-1">Reunited! 🎉</div>
              <div className="text-xs text-gray-400 mt-1">All Time</div>
            </div>
          </div>
        )}
    </div>
    </div>
  );
}