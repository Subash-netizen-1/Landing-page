import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dataService } from '../utils/dataService';
import { formatCurrency, formatDate } from '../utils/helpers';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { 
  FiSearch, 
  FiPlus, 
  FiEdit, 
  FiTrash2, 
  FiCopy, 
  FiArchive, 
  FiEye, 
  FiFilter, 
  FiGrid, 
  FiList,
  FiX,
  FiCheckCircle,
  FiMapPin,
  FiCalendar
} from 'react-icons/fi';

const Events = () => {
  const { role, user } = useAuth();
  const navigate = useNavigate();
  const isReadOnly = role === 'Staff';

  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [deletingEvent, setDeletingEvent] = useState(null);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  // Load Categories & Events
  const loadData = async () => {
    setLoading(true);
    try {
      const [catRes, evRes] = await Promise.all([
        dataService.getCategories(),
        dataService.getEvents()
      ]);
      if (catRes.data) setCategories(catRes.data);
      if (evRes.data) {
        setEvents(evRes.data);
        setFilteredEvents(evRes.data);
      }
    } catch (e) {
      toast.error('Failed to load event data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter and Search logic
  useEffect(() => {
    let result = events;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(e => 
        e.name.toLowerCase().includes(query) || 
        e.code.toLowerCase().includes(query) ||
        e.venue.toLowerCase().includes(query) ||
        (e.city && e.city.toLowerCase().includes(query))
      );
    }

    if (selectedCategory) {
      result = result.filter(e => e.category_id === selectedCategory);
    }

    if (selectedStatus) {
      result = result.filter(e => e.status === selectedStatus);
    }

    if (maxPrice !== '') {
      const priceLimit = parseFloat(maxPrice);
      if (!isNaN(priceLimit)) {
        result = result.filter(e => parseFloat(e.ticket_price) <= priceLimit);
      }
    }

    setFilteredEvents(result);
    setCurrentPage(1); // Reset to first page when filtering
  }, [searchQuery, selectedCategory, selectedStatus, maxPrice, events]);

  // Pagination helper
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredEvents.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage);

  // Handlers
  const handleOpenCreate = () => {
    reset({
      name: '',
      description: '',
      category_id: categories[0]?.id || '',
      venue: '',
      address: '',
      city: '',
      state: '',
      country: 'USA',
      start_date: '',
      end_date: '',
      start_time: '09:00',
      end_time: '17:00',
      capacity: 100,
      organizer_name: '',
      contact_email: '',
      contact_phone: '',
      ticket_price: 0,
      banner_url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80',
      status: 'Draft',
      visibility: 'Public',
      notes: ''
    });
    setShowCreateModal(true);
  };

  const handleOpenEdit = (event, e) => {
    e.stopPropagation();
    setEditingEvent(event);
    reset({
      name: event.name,
      description: event.description,
      category_id: event.category_id,
      venue: event.venue,
      address: event.address,
      city: event.city,
      state: event.state,
      country: event.country,
      start_date: event.start_date,
      end_date: event.end_date,
      start_time: event.start_time.slice(0, 5), // trim seconds if they exist
      end_time: event.end_time.slice(0, 5),
      capacity: event.capacity,
      organizer_name: event.organizer_name,
      contact_email: event.contact_email,
      contact_phone: event.contact_phone,
      ticket_price: event.ticket_price,
      banner_url: event.banner_url,
      status: event.status,
      visibility: event.visibility,
      notes: event.notes
    });
  };

  const handleSaveEvent = async (data) => {
    try {
      if (editingEvent) {
        const { data: updated, error } = await dataService.updateEvent(editingEvent.id, data);
        if (error) throw error;
        toast.success('Event updated successfully');
        setEditingEvent(null);
      } else {
        const { data: created, error } = await dataService.createEvent(data, user.id);
        if (error) throw error;
        toast.success('Event created successfully');
        setShowCreateModal(false);
      }
      loadData();
    } catch (err) {
      toast.error(err.message || 'Error saving event');
    }
  };

  const handleDuplicate = async (id, e) => {
    e.stopPropagation();
    try {
      const { error } = await dataService.duplicateEvent(id, user.id);
      if (error) throw error;
      toast.success('Event duplicated as Draft');
      loadData();
    } catch (err) {
      toast.error('Failed to duplicate event');
    }
  };

  const handleArchive = async (id, e) => {
    e.stopPropagation();
    try {
      const { error } = await dataService.archiveEvent(id);
      if (error) throw error;
      toast.success('Event archived');
      loadData();
    } catch (err) {
      toast.error('Failed to archive event');
    }
  };

  const handleTogglePublish = async (event, e) => {
    e.stopPropagation();
    const nextStatus = event.status === 'Published' ? 'Draft' : 'Published';
    try {
      const { error } = await dataService.updateEvent(event.id, { status: nextStatus });
      if (error) throw error;
      toast.success(nextStatus === 'Published' ? 'Event Published!' : 'Event reverted to Draft');
      loadData();
    } catch (err) {
      toast.error('Status change failed');
    }
  };

  const handleDelete = async () => {
    if (!deletingEvent) return;
    try {
      const { error } = await dataService.deleteEvent(deletingEvent.id);
      if (error) throw error;
      toast.success('Event deleted successfully');
      setDeletingEvent(null);
      loadData();
    } catch (err) {
      toast.error('Failed to delete event');
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      Draft: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
      Published: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200/30',
      Cancelled: 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 border border-red-200/30',
      Completed: 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border border-blue-200/30',
      Archived: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200/30'
    };
    return (
      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${styles[status] || styles.Draft}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="text-left">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white m-0 font-display">
            Event Management
          </h1>
          <p className="text-gray-550 dark:text-gray-400 text-sm mt-1">
            Create, duplicate, schedule, and view event registrations.
          </p>
        </div>
        {!isReadOnly && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-650 hover:bg-brand-700 text-white font-semibold text-sm rounded-xl transition-all shadow-md shadow-brand-500/10 hover:shadow-brand-500/25 active:scale-98"
          >
            <FiPlus className="w-4 h-4" />
            <span>Create Event</span>
          </button>
        )}
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-850 p-4 rounded-2xl flex flex-col md:flex-row md:items-center gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
            <FiSearch className="w-4.5 h-4.5" />
          </span>
          <input
            type="text"
            placeholder="Search by event name, code, venue, city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white placeholder-gray-400 dark:placeholder-gray-550 border border-gray-150 dark:border-gray-850 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm transition-all"
          />
        </div>

        {/* Category Filter */}
        <div className="w-full md:w-44">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="block w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white border border-gray-150 dark:border-gray-850 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm transition-all"
          >
            <option value="">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="w-full md:w-40">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="block w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white border border-gray-150 dark:border-gray-850 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm transition-all"
          >
            <option value="">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Published">Published</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Archived">Archived</option>
          </select>
        </div>

        {/* Max Price Filter */}
        <div className="w-full md:w-36">
          <input
            type="number"
            placeholder="Max Price"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="block w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white placeholder-gray-400 dark:placeholder-gray-550 border border-gray-150 dark:border-gray-850 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm transition-all"
          />
        </div>
      </div>

      {/* Events Listings Grid/Table */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 w-full bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-850 animate-pulse rounded-2xl"></div>
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-850 rounded-2xl p-16 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 mb-4">
            <FiCalendar className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white">No events found</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            No events match your search query or filter selection.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-850 dark:text-gray-300 border-b border-gray-100 dark:border-gray-800">
                <tr>
                  <th scope="col" className="px-6 py-4 font-semibold">Event Name</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Code</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Category</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Venue</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Date</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Price</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Status</th>
                  <th scope="col" className="px-6 py-4 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {currentItems.map((event) => (
                  <tr 
                    key={event.id} 
                    onClick={() => navigate(`/events/${event.id}`)}
                    className="hover:bg-gray-50/50 dark:hover:bg-gray-850/30 cursor-pointer transition-colors duration-150"
                  >
                    <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">
                      <div className="flex flex-col text-left">
                        <span>{event.name}</span>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono mt-0.5">{event.organizer_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">{event.code}</td>
                    <td className="px-6 py-4">{event.category?.name || 'Other'}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-left">
                        <FiMapPin className="w-3.5 h-3.5 text-gray-400" />
                        <span>{event.venue}, {event.city}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-left">
                        <FiCalendar className="w-3.5 h-3.5 text-gray-400" />
                        <span>{formatDate(event.start_date)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">
                      {event.ticket_price > 0 ? formatCurrency(event.ticket_price) : <span className="text-emerald-500 font-bold text-xs uppercase">Free</span>}
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(event.status)}</td>
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => navigate(`/events/${event.id}`)}
                          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-550 hover:text-gray-900 dark:hover:text-white transition-all"
                          title="View Details"
                        >
                          <FiEye className="w-4 h-4" />
                        </button>
                        {!isReadOnly && (
                          <>
                            <button
                              onClick={(e) => handleOpenEdit(event, e)}
                              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 transition-all"
                              title="Edit Event"
                            >
                              <FiEdit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => handleDuplicate(event.id, e)}
                              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300 transition-all"
                              title="Duplicate Event"
                            >
                              <FiCopy className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => handleTogglePublish(event, e)}
                              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 transition-all"
                              title={event.status === 'Published' ? 'Unpublish (Draft)' : 'Publish Event'}
                            >
                              <FiCheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => handleArchive(event.id, e)}
                              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 transition-all"
                              title="Archive Event"
                            >
                              <FiArchive className="w-4 h-4" />
                            </button>
                            {role === 'Super Admin' && (
                              <button
                                onClick={(e) => { e.stopPropagation(); setDeletingEvent(event); }}
                                className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg text-red-650 hover:text-red-750 dark:text-red-400 dark:hover:text-red-300 transition-all"
                                title="Delete Event"
                              >
                                <FiTrash2 className="w-4 h-4" />
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
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredEvents.length)} of {filteredEvents.length} events
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3.5 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-850 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3.5 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-850 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {(showCreateModal || editingEvent) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 dark:bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 max-h-[90vh] overflow-y-auto flex flex-col text-left">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white font-display">
                {editingEvent ? `Edit Event: ${editingEvent.name}` : 'Create New Event'}
              </h3>
              <button 
                onClick={() => { setShowCreateModal(false); setEditingEvent(null); }}
                className="text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-850 p-1.5 rounded-lg"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSubmit(handleSaveEvent)} className="p-6 space-y-6 flex-1">
              
              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* Name */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Event Name</label>
                  <input
                    type="text"
                    {...register('name', { required: 'Event Name is required' })}
                    className="mt-1.5 block w-full px-3 py-2.5 bg-white dark:bg-gray-950 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-brand-500 text-sm"
                    placeholder="Global Developers Conference"
                  />
                  {errors.name && <span className="text-xs text-red-500 mt-1 block">{errors.name.message}</span>}
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Description</label>
                  <textarea
                    rows={3}
                    {...register('description')}
                    className="mt-1.5 block w-full px-3 py-2.5 bg-white dark:bg-gray-950 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-brand-500 text-sm"
                    placeholder="Provide a description of the event..."
                  />
                </div>

                {/* Category & Ticket Price */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Category</label>
                  <select
                    {...register('category_id', { required: 'Category is required' })}
                    className="mt-1.5 block w-full px-3 py-2.5 bg-white dark:bg-gray-950 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-brand-500 text-sm"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Ticket Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('ticket_price', { required: 'Price is required', min: 0 })}
                    className="mt-1.5 block w-full px-3 py-2.5 bg-white dark:bg-gray-950 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-brand-500 text-sm"
                    placeholder="0.00 (Free)"
                  />
                </div>

                {/* Dates */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Start Date</label>
                  <input
                    type="date"
                    {...register('start_date', { required: 'Start Date is required' })}
                    className="mt-1.5 block w-full px-3 py-2.5 bg-white dark:bg-gray-950 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-brand-500 text-sm"
                  />
                  {errors.start_date && <span className="text-xs text-red-500 mt-1 block">{errors.start_date.message}</span>}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">End Date</label>
                  <input
                    type="date"
                    {...register('end_date', { required: 'End Date is required' })}
                    className="mt-1.5 block w-full px-3 py-2.5 bg-white dark:bg-gray-950 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-brand-500 text-sm"
                  />
                  {errors.end_date && <span className="text-xs text-red-500 mt-1 block">{errors.end_date.message}</span>}
                </div>

                {/* Times */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Start Time</label>
                  <input
                    type="time"
                    {...register('start_time', { required: 'Start Time is required' })}
                    className="mt-1.5 block w-full px-3 py-2.5 bg-white dark:bg-gray-950 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-brand-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">End Time</label>
                  <input
                    type="time"
                    {...register('end_time', { required: 'End Time is required' })}
                    className="mt-1.5 block w-full px-3 py-2.5 bg-white dark:bg-gray-950 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-brand-500 text-sm"
                  />
                </div>

                {/* Venue Details */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Venue Name</label>
                  <input
                    type="text"
                    {...register('venue', { required: 'Venue is required' })}
                    className="mt-1.5 block w-full px-3 py-2.5 bg-white dark:bg-gray-950 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-brand-500 text-sm"
                    placeholder="Grand Ballroom"
                  />
                  {errors.venue && <span className="text-xs text-red-500 mt-1 block">{errors.venue.message}</span>}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Capacity</label>
                  <input
                    type="number"
                    {...register('capacity', { required: 'Capacity is required', min: 1 })}
                    className="mt-1.5 block w-full px-3 py-2.5 bg-white dark:bg-gray-950 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-brand-500 text-sm"
                    placeholder="100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Address</label>
                  <input
                    type="text"
                    {...register('address')}
                    className="mt-1.5 block w-full px-3 py-2.5 bg-white dark:bg-gray-950 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-brand-500 text-sm"
                    placeholder="123 Convention Ave"
                  />
                </div>

                {/* City, State, Country */}
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">City</label>
                    <input
                      type="text"
                      {...register('city')}
                      className="mt-1 block w-full px-2 py-2 bg-white dark:bg-gray-950 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 rounded-xl text-xs"
                      placeholder="Chicago"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">State</label>
                    <input
                      type="text"
                      {...register('state')}
                      className="mt-1 block w-full px-2 py-2 bg-white dark:bg-gray-950 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 rounded-xl text-xs"
                      placeholder="IL"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Country</label>
                    <input
                      type="text"
                      {...register('country')}
                      className="mt-1 block w-full px-2 py-2 bg-white dark:bg-gray-950 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 rounded-xl text-xs"
                      placeholder="USA"
                    />
                  </div>
                </div>

                {/* Organizer Contact Info */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Organizer Name</label>
                  <input
                    type="text"
                    {...register('organizer_name')}
                    className="mt-1.5 block w-full px-3 py-2.5 bg-white dark:bg-gray-950 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-brand-500 text-sm"
                    placeholder="Apex Events Group"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Contact Email</label>
                  <input
                    type="email"
                    {...register('contact_email')}
                    className="mt-1.5 block w-full px-3 py-2.5 bg-white dark:bg-gray-950 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-brand-500 text-sm"
                    placeholder="contact@organizer.com"
                  />
                </div>

                {/* Status / Visibility */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Status</label>
                  <select
                    {...register('status')}
                    className="mt-1.5 block w-full px-3 py-2.5 bg-white dark:bg-gray-950 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-brand-500 text-sm"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Published">Published</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Visibility</label>
                  <select
                    {...register('visibility')}
                    className="mt-1.5 block w-full px-3 py-2.5 bg-white dark:bg-gray-950 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-brand-500 text-sm"
                  >
                    <option value="Public">Public (Listed)</option>
                    <option value="Private">Private (Invite only)</option>
                  </select>
                </div>

                {/* Banner Image URL (simulation) */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Banner Image URL</label>
                  <input
                    type="text"
                    {...register('banner_url')}
                    className="mt-1.5 block w-full px-3 py-2.5 bg-white dark:bg-gray-950 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-brand-500 text-sm"
                  />
                </div>

                {/* Notes */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Additional Notes</label>
                  <textarea
                    rows={2}
                    {...register('notes')}
                    className="mt-1.5 block w-full px-3 py-2.5 bg-white dark:bg-gray-950 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-brand-500 text-sm"
                    placeholder="Enter any other notes, food details, parking rules..."
                  />
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800 mt-6">
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); setEditingEvent(null); }}
                  className="px-4.5 py-2.5 bg-white dark:bg-gray-900 border border-gray-205 dark:border-gray-800 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-850"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm rounded-xl transition-all shadow-md"
                >
                  Save Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      {deletingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 dark:bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 text-left">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Delete Event</h3>
            <p className="mt-2 text-sm text-gray-550 dark:text-gray-400">
              Are you absolutely sure you want to delete the event <strong>{deletingEvent.name}</strong>? All associated registrations, tickets, and payments will be permanently removed. This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setDeletingEvent(null)}
                className="px-4.5 py-2 bg-white dark:bg-gray-900 border border-gray-205 dark:border-gray-850 text-sm font-semibold text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4.5 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-sm rounded-xl transition-all shadow-md shadow-red-500/10"
              >
                Delete Event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Events;
