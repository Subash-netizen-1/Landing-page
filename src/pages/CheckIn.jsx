import React, { useEffect, useState } from 'react';
import { dataService } from '../utils/dataService';
import { formatDate } from '../utils/helpers';
import { toast } from 'react-hot-toast';
import { 
  FiCheckSquare, 
  FiSearch, 
  FiCamera, 
  FiRefreshCw, 
  FiUserCheck, 
  FiClock, 
  FiAlertCircle,
  FiZap
} from 'react-icons/fi';

const CheckIn = () => {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [registrations, setRegistrations] = useState([]);
  const [filteredRegs, setFilteredRegs] = useState([]);

  // Simulator State
  const [scanning, setScanning] = useState(false);
  const [selectedSimTicket, setSelectedSimTicket] = useState('');

  // Stats
  const [stats, setStats] = useState({
    registered: 0,
    checkedIn: 0,
    remaining: 0
  });

  const loadInitialData = async () => {
    try {
      const { data } = await dataService.getEvents();
      if (data) {
        const activeEvents = data.filter(e => e.status === 'Published');
        setEvents(activeEvents);
        if (activeEvents.length > 0) {
          setSelectedEventId(activeEvents[0].id);
        }
      }
    } catch (e) {
      toast.error('Failed to load events');
    }
  };

  // Load registrations when selected event changes
  const loadRegistrations = async () => {
    if (!selectedEventId) return;
    setLoading(true);
    try {
      const { data } = await dataService.getRegistrations(selectedEventId);
      if (data) {
        setRegistrations(data);
        setFilteredRegs(data);
        
        // Calculate Stats
        const total = data.length;
        const checked = data.filter(r => r.status === 'Checked-in').length;
        setStats({
          registered: total,
          checkedIn: checked,
          remaining: total - checked
        });
      }
    } catch (e) {
      toast.error('Failed to load registrations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadRegistrations();
  }, [selectedEventId]);

  // Handle Search Input
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredRegs(registrations);
      return;
    }
    const query = searchQuery.toLowerCase();
    const filtered = registrations.filter(r => 
      r.attendee?.full_name.toLowerCase().includes(query) ||
      r.attendee?.email.toLowerCase().includes(query) ||
      (r.ticket?.ticket_code && r.ticket?.ticket_code.toLowerCase().includes(query))
    );
    setFilteredRegs(filtered);
  }, [searchQuery, registrations]);

  // Handle Manual checkin toggle
  const handleCheckIn = async (reg) => {
    const nextStatus = reg.status === 'Checked-in' ? 'Registered' : 'Checked-in';
    try {
      const { error } = await dataService.updateRegistrationStatus(reg.id, nextStatus);
      if (error) throw error;
      toast.success(nextStatus === 'Checked-in' ? `${reg.attendee.full_name} Checked In!` : 'Check-in reverted');
      loadRegistrations();
    } catch (e) {
      toast.error('Check-in state update failed');
    }
  };

  // Trigger Simulated Scan
  const handleSimulateScan = () => {
    if (!selectedSimTicket) {
      toast.error('Please select a registered attendee ticket to scan.');
      return;
    }

    const reg = registrations.find(r => r.id === selectedSimTicket);
    if (!reg) return;

    if (reg.status === 'Checked-in') {
      toast.error('This ticket code is already scanned / checked-in.');
      return;
    }

    setScanning(true);
    
    // Simulate camera lock-on and scanner latency (1.5 seconds)
    setTimeout(async () => {
      setScanning(false);
      try {
        const { error } = await dataService.updateRegistrationStatus(reg.id, 'Checked-in');
        if (error) throw error;
        toast.success(`[SCAN SUCCESS] ${reg.attendee.full_name} Checked-In!`, {
          icon: '🚀',
          duration: 3500
        });
        setSelectedSimTicket('');
        loadRegistrations();
      } catch (err) {
        toast.error('Simulated scan check-in failed');
      }
    }, 1500);
  };

  const getRecentCheckins = () => {
    return registrations
      .filter(r => r.status === 'Checked-in')
      // Sort roughly by updated date if available
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
      .slice(0, 5);
  };

  const selectedEvent = events.find(e => e.id === selectedEventId);

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white m-0 font-display">
          Check-In Desk
        </h1>
        <p className="text-gray-550 dark:text-gray-400 text-sm mt-1">
          Perform manual check-ins, view live counts, and simulate QR ticket scans.
        </p>
      </div>

      {/* Selector bar */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-850 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="w-full sm:w-80">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Select Active Event</label>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="block w-full px-3 py-2 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white border border-gray-155 dark:border-gray-850 rounded-xl focus:ring-2 focus:ring-brand-500 text-sm"
          >
            {events.length === 0 ? (
              <option>No published events found</option>
            ) : (
              events.map(e => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))
            )}
          </select>
        </div>

        {/* Stats display */}
        {selectedEventId && (
          <div className="flex gap-6 sm:gap-12 w-full sm:w-auto justify-around border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-100 dark:border-gray-800">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-gray-450 dark:text-gray-500 uppercase tracking-widest">Registered</span>
              <span className="text-lg font-bold text-gray-900 dark:text-white mt-1 leading-none">{stats.registered}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Checked In</span>
              <span className="text-lg font-bold text-emerald-500 mt-1 leading-none">{stats.checkedIn}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest">Remaining</span>
              <span className="text-lg font-bold text-amber-500 mt-1 leading-none">{stats.remaining}</span>
            </div>
          </div>
        )}
      </div>

      {!selectedEventId ? (
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-850 rounded-2xl p-16 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 mb-4">
            <FiAlertCircle className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white">No active event</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Publish at least one event to activate the Check-In Desk.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Viewfinder Column */}
          <div className="space-y-6">
            
            {/* Viewfinder card */}
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-5 rounded-2xl flex flex-col space-y-4">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white font-display border-b border-gray-100 dark:border-gray-850 pb-2">
                Simulated Camera Scanner
              </h3>

              {/* Viewfinder block */}
              <div className="relative aspect-video sm:aspect-square bg-gray-950 dark:bg-black rounded-xl overflow-hidden flex flex-col items-center justify-center text-white border border-gray-800">
                
                {/* Viewfinder borders */}
                <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-brand-500"></div>
                <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-brand-500"></div>
                <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-brand-500"></div>
                <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-brand-500"></div>

                {/* Laser animation */}
                <div className={`absolute left-0 w-full h-0.5 bg-red-500 shadow-md shadow-red-500/80 transition-all duration-1000 ${
                  scanning ? 'animate-bounce' : 'opacity-30 top-1/2'
                }`}></div>

                {/* Viewfinder status text */}
                {scanning ? (
                  <div className="flex flex-col items-center gap-2 z-10 bg-black/60 px-4 py-2 rounded-xl">
                    <FiRefreshCw className="w-5 h-5 text-brand-400 animate-spin" />
                    <span className="text-xs font-mono tracking-widest text-brand-400 uppercase">Locking QR Code...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 z-10 bg-black/60 px-4 py-2 rounded-xl text-gray-400">
                    <FiCamera className="w-6 h-6" />
                    <span className="text-[10px] font-mono tracking-widest uppercase">Lens Ready / Standby</span>
                  </div>
                )}
              </div>

              {/* QR Simulator inputs */}
              <div className="space-y-3.5 bg-gray-50/50 dark:bg-gray-950/20 p-4 border border-gray-100 dark:border-gray-850 rounded-xl">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Simulate Scanning Ticket</label>
                  <select
                    value={selectedSimTicket}
                    onChange={(e) => setSelectedSimTicket(e.target.value)}
                    className="block w-full px-2.5 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs focus:ring-1 focus:ring-brand-500 text-gray-850 dark:text-gray-255"
                  >
                    <option value="">Select ticket to check in...</option>
                    {registrations
                      .filter(r => r.status === 'Registered')
                      .map(r => (
                        <option key={r.id} value={r.id}>
                          {r.attendee?.full_name} ({r.ticket?.ticket_code || 'TKT'})
                        </option>
                      ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleSimulateScan}
                  disabled={scanning || !selectedSimTicket}
                  className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs rounded-xl shadow-sm disabled:opacity-40 transition-all"
                >
                  <FiZap className="w-3.5 h-3.5" />
                  <span>Scan Selected Ticket</span>
                </button>
              </div>
            </div>

            {/* Recent Logs card */}
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-5 rounded-2xl space-y-4">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white font-display border-b border-gray-100 dark:border-gray-850 pb-2">
                Recent Check-ins
              </h3>

              <div className="space-y-3 max-h-56 overflow-y-auto">
                {getRecentCheckins().length === 0 ? (
                  <div className="text-center text-xs py-8 text-gray-400">
                    No check-ins logged yet.
                  </div>
                ) : (
                  getRecentCheckins().map((reg, idx) => (
                    <div key={idx} className="flex gap-3 items-start text-xs border-b border-gray-550/5 pb-2.5 last:border-0 last:pb-0">
                      <div className="p-1.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 rounded-lg">
                        <FiUserCheck className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 dark:text-white truncate">
                          {reg.attendee?.full_name}
                        </p>
                        <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                          Code: {reg.ticket?.ticket_code}
                        </p>
                      </div>
                      <div className="flex flex-col items-end text-[10px] text-gray-400">
                        <span className="flex items-center gap-1">
                          <FiClock className="w-3 h-3" />
                          <span>{new Date(reg.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* Roster Column */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Roster card */}
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-6 rounded-2xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="text-base font-bold text-gray-900 dark:text-white font-display">
                  Roster & Manual Search
                </h3>

                {/* Search */}
                <div className="relative w-full sm:w-64">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-2 text-gray-400">
                    <FiSearch className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search name, ticket..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-8 pr-3 py-1.5 bg-gray-50 dark:bg-gray-950 border border-gray-155 dark:border-gray-850 rounded-lg text-xs"
                  />
                </div>
              </div>

              {/* Roster table */}
              {loading ? (
                <div className="h-64 animate-pulse bg-gray-55/5 rounded-xl border border-gray-100 dark:border-gray-800"></div>
              ) : filteredRegs.length === 0 ? (
                <div className="py-12 border border-dashed border-gray-200 dark:border-gray-800 rounded-xl text-center text-xs text-gray-400">
                  No matching attendee registered.
                </div>
              ) : (
                <div className="overflow-x-auto border border-gray-100 dark:border-gray-800 rounded-xl">
                  <table className="w-full text-xs text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-[10px] text-gray-700 bg-gray-50 dark:bg-gray-850 dark:text-gray-300 uppercase">
                      <tr>
                        <th scope="col" className="px-4 py-3">Attendee</th>
                        <th scope="col" className="px-4 py-3">Ticket ID</th>
                        <th scope="col" className="px-4 py-3">Tier</th>
                        <th scope="col" className="px-4 py-3 text-center">Mutate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {filteredRegs.map((reg) => (
                        <tr key={reg.id} className="hover:bg-gray-550/5">
                          <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">
                            <div className="flex flex-col text-left">
                              <span>{reg.attendee?.full_name}</span>
                              <span className="text-[9px] font-mono text-gray-400 mt-0.5">{reg.attendee?.email}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 font-mono text-gray-400">{reg.ticket?.ticket_code || 'N/A'}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">{reg.ticket_type}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-center">
                              <button
                                onClick={() => handleCheckIn(reg)}
                                className={`flex items-center gap-1 px-3 py-1 font-bold text-[10px] rounded-lg transition-all ${
                                  reg.status === 'Checked-in'
                                    ? 'bg-emerald-500 text-white shadow-sm'
                                    : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-750 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                                }`}
                              >
                                <FiCheckSquare className="w-3.5 h-3.5" />
                                <span>{reg.status === 'Checked-in' ? 'Checked In' : 'Check In'}</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default CheckIn;
