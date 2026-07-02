import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { dataService } from '../utils/dataService';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate, formatTime } from '../utils/helpers';
import { exportToCSV } from '../utils/csvExport';
import { toast } from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { 
  FiArrowLeft, 
  FiMapPin, 
  FiCalendar, 
  FiClock, 
  FiDollarSign, 
  FiUsers, 
  FiMail, 
  FiPhone, 
  FiInfo,
  FiDownload,
  FiPlus,
  FiX,
  FiCheck,
  FiCheckSquare
} from 'react-icons/fi';

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role } = useAuth();
  const isReadOnly = role === 'Staff';

  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  
  // Registration modal for this event
  const [showRegModal, setShowRegModal] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const loadEventData = async () => {
    setLoading(true);
    try {
      const [evRes, regRes] = await Promise.all([
        dataService.getEvent(id),
        dataService.getRegistrations(id)
      ]);
      if (evRes.data) setEvent(evRes.data);
      if (regRes.data) setRegistrations(regRes.data);
    } catch (e) {
      toast.error('Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEventData();
  }, [id]);

  const handleExportCSV = () => {
    if (!registrations.length) {
      toast.error('No attendees registered yet');
      return;
    }
    const dataToExport = registrations.map(r => ({
      'Attendee Name': r.attendee?.full_name,
      'Email': r.attendee?.email,
      'Phone': r.attendee?.phone,
      'Ticket Type': r.ticket_type,
      'Registration Date': formatDate(r.registration_date),
      'Status': r.status,
      'Payment Status': r.payment?.payment_status || 'Paid', // Free fallback
      'Amount': r.payment?.amount || 0
    }));

    exportToCSV(
      dataToExport, 
      ['Attendee Name', 'Email', 'Phone', 'Ticket Type', 'Registration Date', 'Status', 'Payment Status', 'Amount'],
      `${event.name.replace(/\s+/g, '_')}_Attendees`
    );
    toast.success('Attendee list exported successfully');
  };

  const handleCheckInToggle = async (registration) => {
    const nextStatus = registration.status === 'Checked-in' ? 'Registered' : 'Checked-in';
    try {
      const { error } = await dataService.updateRegistrationStatus(registration.id, nextStatus);
      if (error) throw error;
      toast.success(nextStatus === 'Checked-in' ? 'Checked in successfully!' : 'Check-in reverted');
      loadEventData();
    } catch (err) {
      toast.error('Failed to toggle check-in');
    }
  };

  const handleRegisterAttendee = async (data) => {
    try {
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
        event_id: id,
        ticket_type: data.ticket_type
      };

      let paymentData = null;
      if (event.ticket_price > 0) {
        paymentData = {
          amount: event.ticket_price,
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
      loadEventData();
    } catch (err) {
      toast.error(err.message || 'Registration failed');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-20 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
        <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 bg-white dark:bg-gray-900 rounded-2xl animate-pulse"></div>
          <div className="h-80 bg-white dark:bg-gray-900 rounded-2xl animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center p-12 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-850 rounded-2xl">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Event not found</h3>
        <button onClick={() => navigate('/events')} className="mt-4 px-4 py-2 bg-brand-600 text-white rounded-xl">
          Back to Events
        </button>
      </div>
    );
  }

  const registeredCount = registrations.length;
  const capacityProgress = Math.min((registeredCount / event.capacity) * 100, 100);

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button 
        onClick={() => navigate('/events')}
        className="flex items-center gap-1.5 text-sm font-semibold text-gray-550 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-all text-left"
      >
        <FiArrowLeft className="w-4 h-4" />
        <span>Back to Events</span>
      </button>

      {/* Banner */}
      <div className="relative h-64 sm:h-80 rounded-2xl overflow-hidden shadow-sm">
        <img 
          src={event.banner_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80'} 
          alt={event.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent"></div>
        
        {/* Status Badge Over Banner */}
        <div className="absolute top-4 right-4 bg-brand-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
          {event.status}
        </div>

        <div className="absolute bottom-6 left-6 text-white text-left max-w-2xl">
          <span className="text-xs uppercase tracking-widest text-brand-300 font-semibold font-display">
            {event.category?.name || 'Other'}
          </span>
          <h1 className="text-xl sm:text-3xl font-extrabold m-0 mt-2 text-white leading-tight font-display">
            {event.name}
          </h1>
          <p className="text-xs sm:text-sm text-gray-300 mt-2 font-mono">Event Code: {event.code}</p>
        </div>
      </div>

      {/* Main Grid details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Details card (left col) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Info Card */}
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-6 rounded-2xl text-left space-y-4">
            <h3 className="text-base font-bold text-gray-900 dark:text-white font-display border-b border-gray-100 dark:border-gray-850 pb-2">
              Event Description
            </h3>
            <p className="text-sm text-gray-650 dark:text-gray-350 leading-relaxed whitespace-pre-line">
              {event.description || 'No description provided.'}
            </p>

            {event.notes && (
              <div className="p-4 bg-blue-50/50 dark:bg-brand-950/10 border border-blue-105/30 rounded-xl space-y-1 mt-4">
                <h4 className="text-xs font-bold uppercase text-brand-600 dark:text-brand-400 flex items-center gap-1.5">
                  <FiInfo className="w-4 h-4" />
                  <span>Important Notes</span>
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-line leading-relaxed">
                  {event.notes}
                </p>
              </div>
            )}
          </div>

          {/* Attendees List Sub-Section */}
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h3 className="text-base font-bold text-gray-900 dark:text-white font-display text-left">
                Attendee Registrations ({registeredCount})
              </h3>
              <div className="flex gap-2.5">
                <button
                  onClick={handleExportCSV}
                  className="flex items-center justify-center gap-1.5 px-3.5 py-2 border border-gray-200 dark:border-gray-850 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold text-xs rounded-xl transition-all"
                >
                  <FiDownload className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
                <button
                  onClick={() => setShowRegModal(true)}
                  className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs rounded-xl transition-all shadow-sm"
                >
                  <FiPlus className="w-3.5 h-3.5" />
                  <span>Add Attendee</span>
                </button>
              </div>
            </div>

            {registrations.length === 0 ? (
              <div className="py-12 text-center text-gray-500 dark:text-gray-400 border border-dashed border-gray-200 dark:border-gray-800 rounded-xl text-sm">
                No attendees registered yet for this event.
              </div>
            ) : (
              <div className="overflow-x-auto border border-gray-100 dark:border-gray-800 rounded-xl">
                <table className="w-full text-xs text-left text-gray-500 dark:text-gray-400">
                  <thead className="text-[10px] text-gray-700 uppercase bg-gray-50 dark:bg-gray-850 dark:text-gray-300">
                    <tr>
                      <th scope="col" className="px-4 py-3 font-semibold">Attendee</th>
                      <th scope="col" className="px-4 py-3 font-semibold">Ticket</th>
                      <th scope="col" className="px-4 py-3 font-semibold">Payment</th>
                      <th scope="col" className="px-4 py-3 font-semibold">Reg Date</th>
                      <th scope="col" className="px-4 py-3 font-semibold text-center">Check-In</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {registrations.map((reg) => (
                      <tr key={reg.id} className="hover:bg-gray-550/5">
                        <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">
                          <div className="flex flex-col text-left">
                            <span>{reg.attendee?.full_name}</span>
                            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono mt-0.5">{reg.attendee?.email}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-850 rounded font-medium">
                            {reg.ticket_type}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded font-semibold text-[10px] uppercase ${
                            reg.payment?.payment_status === 'Paid' 
                              ? 'bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400' 
                              : 'bg-yellow-50 text-yellow-750 dark:bg-yellow-950/20 dark:text-yellow-400'
                          }`}>
                            {reg.payment?.payment_status || 'Paid'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-400 dark:text-gray-500">{formatDate(reg.registration_date)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center">
                            <button
                              onClick={() => handleCheckInToggle(reg)}
                              className={`flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all ${
                                reg.status === 'Checked-in'
                                  ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/10'
                                  : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-450 hover:bg-gray-50 dark:hover:bg-gray-800'
                              }`}
                            >
                              <FiCheck className="w-3 h-3" />
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

        {/* Info Cards Sidebar (right col) */}
        <div className="space-y-6 text-left">
          
          {/* Quick Metrics */}
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-6 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white font-display border-b border-gray-100 dark:border-gray-850 pb-2">
              Registration Progress
            </h3>
            
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-gray-500">
                <span>Capacity Filled</span>
                <span>{registeredCount} / {event.capacity} ({Math.round(capacityProgress)}%)</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-850 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-brand-600 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${capacityProgress}%` }}
                ></div>
              </div>
            </div>

            {/* Event Price Card */}
            <div className="p-4 bg-gray-50 dark:bg-gray-850 rounded-xl flex items-center justify-between border border-gray-100 dark:border-gray-800">
              <span className="text-xs font-semibold text-gray-500">Ticket Price</span>
              <span className="text-lg font-bold text-gray-950 dark:text-white">
                {event.ticket_price > 0 ? formatCurrency(event.ticket_price) : 'FREE'}
              </span>
            </div>
          </div>

          {/* Date, Time & Venue */}
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-6 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white font-display border-b border-gray-100 dark:border-gray-850 pb-2">
              Time & Place
            </h3>
            
            <div className="space-y-3.5 text-sm text-gray-650 dark:text-gray-355">
              <div className="flex items-start gap-3">
                <FiCalendar className="w-4.5 h-4.5 text-brand-500 mt-0.5" />
                <div className="flex flex-col">
                  <span className="font-semibold text-gray-900 dark:text-white">Dates</span>
                  <span className="text-xs text-gray-500 mt-0.5">
                    {formatDate(event.start_date)} - {formatDate(event.end_date)}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <FiClock className="w-4.5 h-4.5 text-brand-500 mt-0.5" />
                <div className="flex flex-col">
                  <span className="font-semibold text-gray-900 dark:text-white">Timings</span>
                  <span className="text-xs text-gray-500 mt-0.5">
                    {formatTime(event.start_time)} - {formatTime(event.end_time)}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <FiMapPin className="w-4.5 h-4.5 text-brand-500 mt-0.5" />
                <div className="flex flex-col">
                  <span className="font-semibold text-gray-900 dark:text-white">Location</span>
                  <span className="text-xs text-gray-500 mt-0.5">
                    {event.venue} <br />
                    {event.address && `${event.address}, `}{event.city}, {event.state} {event.country}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Organizer Info */}
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-6 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white font-display border-b border-gray-100 dark:border-gray-850 pb-2">
              Organizer Details
            </h3>

            <div className="space-y-3.5 text-sm text-gray-650 dark:text-gray-355">
              <div className="flex items-center gap-3">
                <FiUsers className="w-4.5 h-4.5 text-gray-400" />
                <div className="flex flex-col">
                  <span className="font-semibold text-gray-900 dark:text-white">Organizer</span>
                  <span className="text-xs text-gray-500 mt-0.5">{event.organizer_name || 'Not Specified'}</span>
                </div>
              </div>

              {event.contact_email && (
                <div className="flex items-center gap-3">
                  <FiMail className="w-4.5 h-4.5 text-gray-400" />
                  <div className="flex flex-col">
                    <span className="font-semibold text-gray-900 dark:text-white">Contact Email</span>
                    <a href={`mailto:${event.contact_email}`} className="text-xs text-brand-600 hover:underline mt-0.5">{event.contact_email}</a>
                  </div>
                </div>
              )}

              {event.contact_phone && (
                <div className="flex items-center gap-3">
                  <FiPhone className="w-4.5 h-4.5 text-gray-400" />
                  <div className="flex flex-col">
                    <span className="font-semibold text-gray-900 dark:text-white">Contact Phone</span>
                    <a href={`tel:${event.contact_phone}`} className="text-xs text-brand-600 hover:underline mt-0.5">{event.contact_phone}</a>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* QUICK ATTENDEE REGISTRATION MODAL */}
      {showRegModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 dark:bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 text-left flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-base font-bold text-gray-900 dark:text-white font-display">
                Register Attendee: {event.name}
              </h3>
              <button 
                onClick={() => setShowRegModal(false)}
                className="text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-850 p-1.5 rounded-lg"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(handleRegisterAttendee)} className="p-6 space-y-4 overflow-y-auto">
              
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">Full Name</label>
                <input
                  type="text"
                  {...register('full_name', { required: 'Name is required' })}
                  className="mt-1.5 block w-full px-3 py-2.5 bg-white dark:bg-gray-950 text-gray-950 dark:text-white border border-gray-250 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-brand-500 text-sm"
                  placeholder="Jane Smith"
                />
                {errors.full_name && <span className="text-xs text-red-500 mt-1 block">{errors.full_name.message}</span>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">Email Address</label>
                <input
                  type="email"
                  {...register('email', { required: 'Email is required' })}
                  className="mt-1.5 block w-full px-3 py-2.5 bg-white dark:bg-gray-950 text-gray-950 dark:text-white border border-gray-250 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-brand-500 text-sm"
                  placeholder="jane.smith@example.com"
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
                    className="mt-1.5 block w-full px-3 py-2.5 bg-white dark:bg-gray-950 text-gray-950 dark:text-white border border-gray-250 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-brand-500 text-sm"
                    placeholder="+1 555-123-4567"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">Gender</label>
                  <select
                    {...register('gender')}
                    className="mt-1.5 block w-full px-3 py-2.5 bg-white dark:bg-gray-950 text-gray-950 dark:text-white border border-gray-250 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-brand-500 text-sm"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Date of Birth & Ticket Type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">Date of Birth</label>
                  <input
                    type="date"
                    {...register('dob')}
                    className="mt-1.5 block w-full px-3 py-2.5 bg-white dark:bg-gray-950 text-gray-950 dark:text-white border border-gray-250 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-brand-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">Ticket Type</label>
                  <select
                    {...register('ticket_type')}
                    className="mt-1.5 block w-full px-3 py-2.5 bg-white dark:bg-gray-950 text-gray-950 dark:text-white border border-gray-250 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-brand-500 text-sm"
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
                  className="mt-1.5 block w-full px-3 py-2.5 bg-white dark:bg-gray-950 text-gray-950 dark:text-white border border-gray-250 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-brand-500 text-sm"
                  placeholder="John Smith (+1 555-987-6543)"
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">Address</label>
                <input
                  type="text"
                  {...register('address')}
                  className="mt-1.5 block w-full px-3 py-2.5 bg-white dark:bg-gray-950 text-gray-950 dark:text-white border border-gray-250 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-brand-500 text-sm"
                  placeholder="123 Main St, Anytown"
                />
              </div>

              {/* Price Note if Paid */}
              {event.ticket_price > 0 && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-250/30 rounded-xl">
                  <p className="text-xs text-amber-800 dark:text-amber-300 font-medium">
                    This is a paid event. Registering will automatically charge/record a payment of <strong>{formatCurrency(event.ticket_price)}</strong> for this ticket.
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800 mt-6">
                <button
                  type="button"
                  onClick={() => setShowRegModal(false)}
                  className="px-4.5 py-2.5 bg-white dark:bg-gray-900 border border-gray-205 dark:border-gray-800 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-850"
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
    </div>
  );
};

export default EventDetails;
