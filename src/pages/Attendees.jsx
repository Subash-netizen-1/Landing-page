import React, { useEffect, useState } from 'react';
import { dataService } from '../utils/dataService';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate, getQRCodeUrl } from '../utils/helpers';
import { exportToCSV } from '../utils/csvExport';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { 
  FiSearch, 
  FiPlus, 
  FiEdit, 
  FiTrash2, 
  FiDownload, 
  FiCheckCircle, 
  FiX, 
  FiPrinter,
  FiUserCheck,
  FiGrid,
  FiTag
} from 'react-icons/fi';

const Attendees = () => {
  const { role } = useAuth();
  const isReadOnly = role === 'Staff';

  const [loading, setLoading] = useState(true);
  const [registrations, setRegistrations] = useState([]);
  const [events, setEvents] = useState([]);
  const [filteredRegs, setFilteredRegs] = useState([]);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEvent, setSelectedEvent] = useState('');
  const [selectedTicketType, setSelectedTicketType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals state
  const [showRegModal, setShowRegModal] = useState(false);
  const [editingAttendee, setEditingAttendee] = useState(null);
  const [deletingReg, setDeletingReg] = useState(null);
  const [viewingTicket, setViewingTicket] = useState(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const { register: regEdit, handleSubmit: handleEditSubmit, reset: resetEdit } = useForm();

  // Load initial data
  const loadData = async () => {
    setLoading(true);
    try {
      const [eventsRes, regsRes] = await Promise.all([
        dataService.getEvents(),
        dataService.getRegistrations()
      ]);
      if (eventsRes.data) setEvents(eventsRes.data.filter(e => e.status === 'Published'));
      if (regsRes.data) {
        setRegistrations(regsRes.data);
        setFilteredRegs(regsRes.data);
      }
    } catch (e) {
      toast.error('Failed to load registrations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter and Search logic
  useEffect(() => {
    let result = registrations;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(r => 
        r.attendee?.full_name.toLowerCase().includes(query) || 
        r.attendee?.email.toLowerCase().includes(query) ||
        (r.attendee?.phone && r.attendee?.phone.includes(query)) ||
        (r.ticket?.ticket_code && r.ticket?.ticket_code.toLowerCase().includes(query))
      );
    }

    if (selectedEvent) {
      result = result.filter(r => r.event_id === selectedEvent);
    }

    if (selectedTicketType) {
      result = result.filter(r => r.ticket_type === selectedTicketType);
    }

    if (selectedStatus) {
      result = result.filter(r => r.status === selectedStatus);
    }

    setFilteredRegs(result);
    setCurrentPage(1);
  }, [searchQuery, selectedEvent, selectedTicketType, selectedStatus, registrations]);

  // Pagination helper
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredRegs.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredRegs.length / itemsPerPage);

  // Global Registration Handler
  const handleRegister = async (data) => {
    try {
      const selectedEvObj = events.find(e => e.id === data.event_id);
      if (!selectedEvObj) return;

      const attendeeData = {
        full_name: data.full_name,
        email: data.email,
        phone: data.phone,
        gender: data.gender,
        dob: data.dob || null,
        address: data.address || '',
        emergency_contact: data.emergency_contact || ''
      };

      const registrationData = {
        event_id: data.event_id,
        ticket_type: data.ticket_type
      };

      let paymentData = null;
      if (selectedEvObj.ticket_price > 0) {
        paymentData = {
          amount: selectedEvObj.ticket_price,
          payment_status: 'Paid',
          payment_method: 'Stripe',
          transaction_id: 'ch_' + Math.random().toString(36).substring(2, 10)
        };
      }

      const { error } = await dataService.registerAttendee(attendeeData, registrationData, paymentData);
      if (error) throw error;

      toast.success('Attendee registered successfully!');
      setShowRegModal(false);
      reset();
      loadData();
    } catch (err) {
      toast.error(err.message || 'Registration failed');
    }
  };

  // Edit attendee details
  const handleOpenEdit = (reg, e) => {
    e.stopPropagation();
    setEditingAttendee(reg);
    resetEdit({
      full_name: reg.attendee.full_name,
      email: reg.attendee.email,
      phone: reg.attendee.phone,
      gender: reg.attendee.gender,
      dob: reg.attendee.dob,
      address: reg.attendee.address,
      emergency_contact: reg.attendee.emergency_contact
    });
  };

  const handleUpdateAttendee = async (data) => {
    try {
      const { error } = await dataService.updateAttendee(editingAttendee.attendee.id, data);
      if (error) throw error;
      toast.success('Attendee updated successfully');
      setEditingAttendee(null);
      loadData();
    } catch (err) {
      toast.error('Failed to update attendee');
    }
  };

  // Delete registration / attendee
  const handleDeleteRegistration = async () => {
    if (!deletingReg) return;
    try {
      const { error } = await dataService.deleteAttendee(deletingReg.attendee_id);
      if (error) throw error;
      toast.success('Registration deleted');
      setDeletingReg(null);
      loadData();
    } catch (err) {
      toast.error('Failed to delete registration');
    }
  };

  // Toggle Checkin
  const handleCheckInToggle = async (reg, e) => {
    e.stopPropagation();
    const nextStatus = reg.status === 'Checked-in' ? 'Registered' : 'Checked-in';
    try {
      const { error } = await dataService.updateRegistrationStatus(reg.id, nextStatus);
      if (error) throw error;
      toast.success(nextStatus === 'Checked-in' ? 'Checked in successfully!' : 'Check-in reverted');
      loadData();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (!filteredRegs.length) {
      toast.error('No attendees to export');
      return;
    }
    const dataToExport = filteredRegs.map(r => ({
      'Attendee Name': r.attendee?.full_name,
      'Email': r.attendee?.email,
      'Phone': r.attendee?.phone,
      'Event Name': r.event?.name,
      'Ticket Code': r.ticket?.ticket_code || 'N/A',
      'Ticket Type': r.ticket_type,
      'Status': r.status,
      'Date Registered': formatDate(r.registration_date)
    }));

    exportToCSV(
      dataToExport,
      ['Attendee Name', 'Email', 'Phone', 'Event Name', 'Ticket Code', 'Ticket Type', 'Status', 'Date Registered'],
      'Attendees_List'
    );
    toast.success('Export completed successfully');
  };

  const triggerPrint = () => {
    const printContent = document.getElementById('printable-ticket').innerHTML;
    const originalContent = document.body.innerHTML;
    document.body.innerHTML = printContent;
    window.print();
    document.body.innerHTML = originalContent;
    window.location.reload(); // Quick refresh to restore react bindings safely
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="text-left">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white m-0 font-display">
            Attendee Registrations
          </h1>
          <p className="text-gray-550 dark:text-gray-400 text-sm mt-1">
            Global roster of registered users, ticket issuances, and check-in logs.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-1.5 px-4.5 py-2.5 border border-gray-200 dark:border-gray-850 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold text-sm rounded-xl transition-all"
          >
            <FiDownload className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          {!isReadOnly && (
            <button
              onClick={() => {
                if (events.length === 0) {
                  toast.error('Please create and publish an event first.');
                  return;
                }
                reset({
                  event_id: events[0]?.id || '',
                  ticket_type: 'Free',
                  full_name: '',
                  email: '',
                  phone: '',
                  gender: 'Male',
                  dob: '',
                  address: '',
                  emergency_contact: ''
                });
                setShowRegModal(true);
              }}
              className="flex items-center justify-center gap-1.5 px-4.5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm rounded-xl transition-all shadow-md shadow-brand-500/10 active:scale-98"
            >
              <FiPlus className="w-4 h-4" />
              <span>Register Attendee</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-850 p-4 rounded-2xl flex flex-col lg:flex-row lg:items-center gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
            <FiSearch className="w-4.5 h-4.5" />
          </span>
          <input
            type="text"
            placeholder="Search by name, email, phone, ticket code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white placeholder-gray-400 dark:placeholder-gray-550 border border-gray-150 dark:border-gray-850 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm transition-all"
          />
        </div>

        {/* Event Filter */}
        <div className="w-full lg:w-48">
          <select
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
            className="block w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white border border-gray-150 dark:border-gray-850 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm transition-all"
          >
            <option value="">All Events</option>
            {events.map(e => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>
        </div>

        {/* Ticket Type Filter */}
        <div className="w-full lg:w-40">
          <select
            value={selectedTicketType}
            onChange={(e) => setSelectedTicketType(e.target.value)}
            className="block w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white border border-gray-150 dark:border-gray-850 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm transition-all"
          >
            <option value="">All Ticket Types</option>
            <option value="Free">Free</option>
            <option value="Paid">Paid</option>
            <option value="VIP">VIP</option>
            <option value="Student">Student</option>
            <option value="Early Bird">Early Bird</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="w-full lg:w-40">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="block w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white border border-gray-150 dark:border-gray-850 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm transition-all"
          >
            <option value="">All Statuses</option>
            <option value="Registered">Registered</option>
            <option value="Checked-in">Checked-in</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Grid List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 w-full bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-850 animate-pulse rounded-2xl"></div>
          ))}
        </div>
      ) : filteredRegs.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-850 rounded-2xl p-16 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 mb-4">
            <FiUserCheck className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white">No registrations found</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            No attendees match the criteria specified.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 uppercase bg-gray-550/5 dark:bg-gray-850 dark:text-gray-300 border-b border-gray-100 dark:border-gray-800">
                <tr>
                  <th scope="col" className="px-6 py-4 font-semibold">Attendee Details</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Event Registered</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Ticket Code</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Type</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Payment</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Status</th>
                  <th scope="col" className="px-6 py-4 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {currentItems.map((reg) => (
                  <tr 
                    key={reg.id}
                    className="hover:bg-gray-50/50 dark:hover:bg-gray-850/30 transition-colors duration-150"
                  >
                    <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">
                      <div className="flex flex-col text-left">
                        <span>{reg.attendee?.full_name}</span>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono mt-0.5">{reg.attendee?.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-left">
                      <div className="flex flex-col font-medium text-gray-800 dark:text-gray-200">
                        <span className="truncate max-w-xs">{reg.event?.name}</span>
                        <span className="text-[10px] text-gray-450 dark:text-gray-500 mt-0.5">{formatDate(reg.event?.start_date)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-gray-550">{reg.ticket?.ticket_code || 'TKT-PENDING'}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs font-semibold">
                        {reg.ticket_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                        reg.payment?.payment_status === 'Paid'
                          ? 'bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400'
                          : 'bg-yellow-50 text-yellow-750 dark:bg-yellow-950/20 dark:text-yellow-400'
                      }`}>
                        {reg.payment?.payment_status || 'Paid'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={(e) => handleCheckInToggle(reg, e)}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                          reg.status === 'Checked-in'
                            ? 'bg-emerald-500 text-white shadow-sm'
                            : 'bg-gray-105 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                        }`}
                      >
                        {reg.status}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setViewingTicket(reg)}
                          className="px-2.5 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-600 dark:bg-brand-950/40 dark:hover:bg-brand-900/40 dark:text-brand-400 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                        >
                          <FiTag className="w-3.5 h-3.5" />
                          <span>Ticket</span>
                        </button>
                        {!isReadOnly && (
                          <>
                            <button
                              onClick={(e) => handleOpenEdit(reg, e)}
                              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-550 hover:text-gray-900 dark:hover:text-white"
                              title="Edit Attendee Details"
                            >
                              <FiEdit className="w-4.5 h-4.5" />
                            </button>
                            {role === 'Super Admin' && (
                              <button
                                onClick={() => setDeletingReg(reg)}
                                className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg text-red-650 hover:text-red-750 dark:text-red-400"
                                title="Delete Registration"
                              >
                                <FiTrash2 className="w-4.5 h-4.5" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 bg-gray-550/5 dark:bg-gray-850/10 border-t border-gray-100 dark:border-gray-800">
              <span className="text-xs text-gray-500">
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredRegs.length)} of {filteredRegs.length} registrations
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3.5 py-1.5 bg-white dark:bg-gray-900 border border-gray-205 dark:border-gray-850 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3.5 py-1.5 bg-white dark:bg-gray-900 border border-gray-205 dark:border-gray-850 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-805 transition-all"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* REGISTRATION FORM MODAL */}
      {showRegModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 dark:bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 text-left flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-base font-bold text-gray-900 dark:text-white font-display">
                Register Attendee
              </h3>
              <button onClick={() => setShowRegModal(false)} className="text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-850 p-1.5 rounded-lg">
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(handleRegister)} className="p-6 space-y-4 overflow-y-auto">
              {/* Event selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">Event</label>
                <select
                  {...register('event_id', { required: 'Please select an event' })}
                  className="mt-1.5 block w-full px-3 py-2.5 bg-white dark:bg-gray-950 text-gray-950 dark:text-white border border-gray-250 dark:border-gray-800 rounded-xl text-sm focus:ring-2 focus:ring-brand-500"
                >
                  {events.map(e => (
                    <option key={e.id} value={e.id}>{e.name} (${e.ticket_price})</option>
                  ))}
                </select>
                {errors.event_id && <span className="text-xs text-red-500 mt-1 block">{errors.event_id.message}</span>}
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">Full Name</label>
                <input
                  type="text"
                  {...register('full_name', { required: 'Name is required' })}
                  className="mt-1.5 block w-full px-3 py-2.5 bg-white dark:bg-gray-950 text-gray-950 dark:text-white border border-gray-250 dark:border-gray-800 rounded-xl text-sm focus:ring-2 focus:ring-brand-500"
                  placeholder="John Doe"
                />
                {errors.full_name && <span className="text-xs text-red-500 mt-1 block">{errors.full_name.message}</span>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">Email Address</label>
                <input
                  type="email"
                  {...register('email', { required: 'Email is required' })}
                  className="mt-1.5 block w-full px-3 py-2.5 bg-white dark:bg-gray-950 text-gray-950 dark:text-white border border-gray-250 dark:border-gray-800 rounded-xl text-sm focus:ring-2 focus:ring-brand-500"
                  placeholder="john.doe@example.com"
                />
                {errors.email && <span className="text-xs text-red-500 mt-1 block">{errors.email.message}</span>}
              </div>

              {/* Phone & Gender */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">Phone</label>
                  <input
                    type="text"
                    {...register('phone')}
                    className="mt-1.5 block w-full px-3 py-2.5 bg-white dark:bg-gray-950 text-gray-950 dark:text-white border border-gray-250 dark:border-gray-800 rounded-xl text-sm focus:ring-2 focus:ring-brand-500"
                    placeholder="+1 555-001-2299"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">Gender</label>
                  <select
                    {...register('gender')}
                    className="mt-1.5 block w-full px-3 py-2.5 bg-white dark:bg-gray-950 text-gray-950 dark:text-white border border-gray-250 dark:border-gray-800 rounded-xl text-sm focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* DOB & Ticket Type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">Date of Birth</label>
                  <input
                    type="date"
                    {...register('dob')}
                    className="mt-1.5 block w-full px-3 py-2.5 bg-white dark:bg-gray-950 text-gray-950 dark:text-white border border-gray-250 dark:border-gray-800 rounded-xl text-sm focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">Ticket Type</label>
                  <select
                    {...register('ticket_type')}
                    className="mt-1.5 block w-full px-3 py-2.5 bg-white dark:bg-gray-950 text-gray-950 dark:text-white border border-gray-250 dark:border-gray-800 rounded-xl text-sm focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="Free">Free</option>
                    <option value="Paid">Paid</option>
                    <option value="VIP">VIP</option>
                    <option value="Student">Student</option>
                    <option value="Early Bird">Early Bird</option>
                  </select>
                </div>
              </div>

              {/* Emergency Contact */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">Emergency Contact</label>
                <input
                  type="text"
                  {...register('emergency_contact')}
                  className="mt-1.5 block w-full px-3 py-2.5 bg-white dark:bg-gray-950 text-gray-950 dark:text-white border border-gray-250 dark:border-gray-800 rounded-xl text-sm focus:ring-2 focus:ring-brand-500"
                  placeholder="Mary Doe (+1 555-001-2288)"
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">Address</label>
                <input
                  type="text"
                  {...register('address')}
                  className="mt-1.5 block w-full px-3 py-2.5 bg-white dark:bg-gray-950 text-gray-950 dark:text-white border border-gray-250 dark:border-gray-800 rounded-xl text-sm focus:ring-2 focus:ring-brand-500"
                  placeholder="123 Maple Rd, Seattle"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800 mt-6">
                <button
                  type="button"
                  onClick={() => setShowRegModal(false)}
                  className="px-4.5 py-2.5 bg-white dark:bg-gray-900 border border-gray-205 dark:border-gray-800 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-550/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-all"
                >
                  Confirm Registration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT ATTENDEE MODAL */}
      {editingAttendee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 dark:bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 text-left flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-base font-bold text-gray-900 dark:text-white font-display">
                Edit Attendee Details
              </h3>
              <button onClick={() => setEditingAttendee(null)} className="text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-850 p-1.5 rounded-lg">
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit(handleUpdateAttendee)} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">Full Name</label>
                <input
                  type="text"
                  {...regEdit('full_name', { required: 'Name is required' })}
                  className="mt-1.5 block w-full px-3 py-2.5 bg-white dark:bg-gray-950 text-gray-950 dark:text-white border border-gray-250 dark:border-gray-800 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">Email Address</label>
                <input
                  type="email"
                  {...regEdit('email', { required: 'Email is required' })}
                  className="mt-1.5 block w-full px-3 py-2.5 bg-white dark:bg-gray-950 text-gray-950 dark:text-white border border-gray-250 dark:border-gray-800 rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">Phone</label>
                  <input
                    type="text"
                    {...regEdit('phone')}
                    className="mt-1.5 block w-full px-3 py-2.5 bg-white dark:bg-gray-950 text-gray-950 dark:text-white border border-gray-250 dark:border-gray-800 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">Gender</label>
                  <select
                    {...regEdit('gender')}
                    className="mt-1.5 block w-full px-3 py-2.5 bg-white dark:bg-gray-950 text-gray-950 dark:text-white border border-gray-250 dark:border-gray-800 rounded-xl text-sm"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">Date of Birth</label>
                  <input
                    type="date"
                    {...regEdit('dob')}
                    className="mt-1.5 block w-full px-3 py-2.5 bg-white dark:bg-gray-950 text-gray-950 dark:text-white border border-gray-250 dark:border-gray-800 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">Emergency Contact</label>
                  <input
                    type="text"
                    {...regEdit('emergency_contact')}
                    className="mt-1.5 block w-full px-3 py-2.5 bg-white dark:bg-gray-950 text-gray-950 dark:text-white border border-gray-250 dark:border-gray-800 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">Address</label>
                <input
                  type="text"
                  {...regEdit('address')}
                  className="mt-1.5 block w-full px-3 py-2.5 bg-white dark:bg-gray-950 text-gray-950 dark:text-white border border-gray-250 dark:border-gray-800 rounded-xl text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800 mt-6">
                <button
                  type="button"
                  onClick={() => setEditingAttendee(null)}
                  className="px-4.5 py-2.5 bg-white dark:bg-gray-900 border border-gray-205 dark:border-gray-800 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-850"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-all"
                >
                  Update Info
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TICKET MOCK VIEW MODAL (PDF/Boarding-Pass layout) */}
      {viewingTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 dark:bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 text-left overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-brand-600 text-white">
              <span className="font-bold text-sm tracking-widest uppercase font-display">Event Pass & Boarding Ticket</span>
              <button 
                onClick={() => setViewingTicket(null)}
                className="text-white/80 hover:bg-white/10 p-1 rounded-lg"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Ticket Container */}
            <div id="printable-ticket" className="p-6 bg-white dark:bg-gray-900">
              
              {/* Boarding Pass Styling */}
              <div className="border-2 border-dashed border-gray-250 dark:border-gray-800 rounded-2xl p-5 flex flex-col md:flex-row gap-6 relative bg-gray-50/50 dark:bg-gray-950/20 text-gray-900 dark:text-white">
                
                {/* Left Ticket Hub */}
                <div className="flex-1 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="text-left">
                      <span className="text-[10px] font-bold text-brand-600 dark:text-brand-400 tracking-wider uppercase">Event Name</span>
                      <h4 className="font-bold text-base text-gray-900 dark:text-white leading-tight font-display mt-0.5">{viewingTicket.event?.name}</h4>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-left">
                      <span className="text-[10px] font-semibold text-gray-400 uppercase">Attendee</span>
                      <p className="text-xs font-bold text-gray-900 dark:text-white truncate mt-0.5">{viewingTicket.attendee?.full_name}</p>
                      <p className="text-[9px] text-gray-400 font-mono leading-none">{viewingTicket.attendee?.email}</p>
                    </div>
                    <div className="text-left">
                      <span className="text-[10px] font-semibold text-gray-400 uppercase">Ticket ID</span>
                      <p className="text-xs font-bold text-brand-600 dark:text-brand-400 font-mono mt-0.5">{viewingTicket.ticket?.ticket_code || 'TKT-PENDING'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-left">
                      <span className="text-[10px] font-semibold text-gray-400 uppercase font-display">Date</span>
                      <p className="text-xs font-bold text-gray-900 dark:text-white mt-0.5">{formatDate(viewingTicket.event?.start_date)}</p>
                    </div>
                    <div className="text-left">
                      <span className="text-[10px] font-semibold text-gray-400 uppercase">Time</span>
                      <p className="text-xs font-bold text-gray-900 dark:text-white mt-0.5">09:00 AM</p>
                    </div>
                    <div className="text-left">
                      <span className="text-[10px] font-semibold text-gray-400 uppercase">Seat/Tier</span>
                      <p className="text-xs font-bold text-gray-900 dark:text-white mt-0.5">{viewingTicket.ticket_type}</p>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-800 pt-3 flex justify-between items-center text-xs">
                    <span className="text-gray-400">Venue: <strong>{viewingTicket.event?.venue}</strong></span>
                    <span className="font-semibold text-emerald-500 uppercase">{viewingTicket.event?.ticket_price > 0 ? formatCurrency(viewingTicket.event?.ticket_price) : 'FREE'}</span>
                  </div>
                </div>

                {/* Vertical Divider */}
                <div className="hidden md:block w-px border-l border-dashed border-gray-250 dark:border-gray-800 h-auto"></div>

                {/* Right Ticket Barcode & QR Code Stub */}
                <div className="flex flex-col items-center justify-center min-w-[130px] gap-3 text-center">
                  <img 
                    src={getQRCodeUrl(`TKT-${viewingTicket.ticket?.ticket_code}-${viewingTicket.id}`)} 
                    alt="QR Code" 
                    className="w-28 h-28 border border-gray-200 rounded-lg p-1 bg-white"
                  />
                  <div className="flex flex-col">
                    <span className="text-[9px] uppercase font-bold text-gray-400 tracking-widest">Scan to Check-In</span>
                    <span className="text-[10px] text-gray-500 font-mono mt-0.5">{viewingTicket.status}</span>
                  </div>
                </div>

              </div>

            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 dark:bg-gray-850 border-t border-gray-100 dark:border-gray-800">
              <button
                onClick={() => setViewingTicket(null)}
                className="px-4.5 py-2.5 bg-white dark:bg-gray-900 border border-gray-205 dark:border-gray-800 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Close
              </button>
              <button
                onClick={triggerPrint}
                className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5"
              >
                <FiPrinter className="w-4 h-4" />
                <span>Print Pass / PDF</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      {deletingReg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 dark:bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 text-left">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Cancel Registration</h3>
            <p className="mt-2 text-sm text-gray-550 dark:text-gray-400">
              Are you sure you want to cancel and delete the registration for <strong>{deletingReg.attendee?.full_name}</strong> from <strong>{deletingReg.event?.name}</strong>?
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setDeletingReg(null)}
                className="px-4.5 py-2 bg-white dark:bg-gray-900 border border-gray-205 dark:border-gray-850 text-xs font-semibold text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteRegistration}
                className="px-4.5 py-2 bg-red-650 hover:bg-red-700 text-white font-semibold text-xs rounded-xl shadow-sm"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendees;
