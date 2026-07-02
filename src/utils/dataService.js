// Database Access Layer (Dual-Mode: Supabase and localStorage Demo Mode)
import { supabase } from './supabaseClient';
import { generateEventCode, generateTicketCode } from './helpers';

// Helper to check if we are in demo mode
const checkDemoMode = () => {
  const session = localStorage.getItem('demo_session');
  // If no env credentials, we are always in demo mode
  const hasEnv = !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
  if (!hasEnv) return true;
  // If env exists, check what user is logged in (session might be demo user or Supabase user)
  if (session) {
    const user = JSON.parse(session);
    if (user.id.startsWith('d')) return true; // Demo user IDs start with 'd'
  }
  return false;
};

// -------------------------------------------------------------------
// MOCK/SEED DATA FOR LOCAL DEMO MODE
// -------------------------------------------------------------------
const SEED_CATEGORIES = [
  { id: 'c1', name: 'Conference', slug: 'conference' },
  { id: 'c2', name: 'Seminar', slug: 'seminar' },
  { id: 'c3', name: 'Workshop', slug: 'workshop' },
  { id: 'c4', name: 'College Fest', slug: 'college-fest' },
  { id: 'c5', name: 'Cultural Event', slug: 'cultural-event' },
  { id: 'c6', name: 'Sports Event', slug: 'sports-event' },
  { id: 'c7', name: 'Music Concert', slug: 'music-concert' },
  { id: 'c8', name: 'Exhibition', slug: 'exhibition' },
  { id: 'c9', name: 'Webinar', slug: 'webinar' },
  { id: 'c10', name: 'Training', slug: 'training' },
  { id: 'c11', name: 'Other', slug: 'other' }
];

const SEED_EVENTS = [
  {
    id: 'e1',
    name: 'Global Tech Developers Conference 2026',
    code: 'CON-20260701-GTDC',
    description: 'The premier annual gathering of software engineering professionals, cloud architects, and tech executives to discuss the future of AI, developer tooling, and decentralized networks.',
    category_id: 'c1',
    venue: 'Convention Center, Hall A',
    address: '100 Metrotech Center',
    city: 'Brooklyn',
    state: 'NY',
    country: 'USA',
    start_date: '2026-08-15',
    end_date: '2026-08-17',
    start_time: '09:00:00',
    end_time: '18:00:00',
    capacity: 250,
    organizer_name: 'ApexTech Media',
    contact_email: 'events@apextech.com',
    contact_phone: '+1 555-019-2831',
    ticket_price: 299.00,
    banner_url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80',
    status: 'Published',
    visibility: 'Public',
    notes: 'Premium lunch is included. VIP pass includes speaker meet & greet.',
    created_by: 'd1',
    created_at: '2026-07-01T10:00:00Z',
    updated_at: '2026-07-01T10:00:00Z'
  },
  {
    id: 'e2',
    name: 'Advanced React Architecture Workshop',
    code: 'WRK-20260701-REACT',
    description: 'An intensive, hands-on workshop building high-performance React web applications using Server Components, State Machines, and modern caching strategies.',
    category_id: 'c3',
    venue: 'Innovation Hub Room 402',
    address: '450 Science Parkway',
    city: 'San Jose',
    state: 'CA',
    country: 'USA',
    start_date: '2026-07-20',
    end_date: '2026-07-20',
    start_time: '10:00:00',
    end_time: '16:00:00',
    capacity: 45,
    organizer_name: 'Frontend Guild',
    contact_email: 'training@frontendguild.org',
    contact_phone: '+1 555-014-9988',
    ticket_price: 99.00,
    banner_url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80',
    status: 'Published',
    visibility: 'Public',
    notes: 'Requires laptop with Node.js v20+ installed.',
    created_by: 'd1',
    created_at: '2026-07-01T10:15:00Z',
    updated_at: '2026-07-01T10:15:00Z'
  },
  {
    id: 'e3',
    name: 'Future of Decentralized Finance (DeFi) Webinar',
    code: 'WEB-20260701-DEFI',
    description: 'A global panel discussion featuring leading blockchain economists, smart contract auditors, and regulatory compliance experts exploring DeFi trends.',
    category_id: 'c9',
    venue: 'Zoom Webinar',
    address: 'Online',
    city: 'Virtual',
    state: '',
    country: 'Global',
    start_date: '2026-07-12',
    end_date: '2026-07-12',
    start_time: '14:00:00',
    end_time: '16:30:00',
    capacity: 1000,
    organizer_name: 'CryptoResearch Group',
    contact_email: 'webinars@cryptoresearch.io',
    contact_phone: '',
    ticket_price: 0.00,
    banner_url: 'https://images.unsplash.com/photo-1591115413009-d6368d89e5a8?auto=format&fit=crop&w=800&q=80',
    status: 'Published',
    visibility: 'Public',
    notes: 'Link will be sent to registered emails.',
    created_by: 'd2',
    created_at: '2026-07-01T10:20:00Z',
    updated_at: '2026-07-01T10:20:00Z'
  },
  {
    id: 'e4',
    name: 'Summit Concert: Neon Nights Music Festival',
    code: 'CON-20260701-NEON',
    description: 'Featuring three stages of live electronic dance music, ambient soundscapes, and visual projection art under the stars.',
    category_id: 'c7',
    venue: 'Riverside Amphitheater',
    address: '500 Concert Way',
    city: 'Austin',
    state: 'TX',
    country: 'USA',
    start_date: '2026-09-05',
    end_date: '2026-09-06',
    start_time: '18:00:00',
    end_time: '01:00:00',
    capacity: 2500,
    organizer_name: 'Starlight Live',
    contact_email: 'help@starlightlive.com',
    contact_phone: '+1 555-081-3944',
    ticket_price: 150.00,
    banner_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
    status: 'Published',
    visibility: 'Public',
    notes: '18+ event. Bring valid photo ID.',
    created_by: 'd2',
    created_at: '2026-07-01T10:30:00Z',
    updated_at: '2026-07-01T10:30:00Z'
  },
  {
    id: 'e5',
    name: 'National Intercollegiate Athletics Championship',
    code: 'SPO-20260701-ATHL',
    description: 'Annual college sports championship event featuring track and field, volleyball, and soccer tournaments.',
    category_id: 'c6',
    venue: 'City Olympic Stadium',
    address: '88 Championship Blvd',
    city: 'Denver',
    state: 'CO',
    country: 'USA',
    start_date: '2026-10-12',
    end_date: '2026-10-14',
    start_time: '08:00:00',
    end_time: '17:00:00',
    capacity: 5000,
    organizer_name: 'National College Athletics Board',
    contact_email: 'sports@collegesports.org',
    contact_phone: '+1 555-013-1122',
    ticket_price: 25.00,
    banner_url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80',
    status: 'Draft',
    visibility: 'Private',
    notes: 'Draft schedule release pending.',
    created_by: 'd3',
    created_at: '2026-07-01T10:45:00Z',
    updated_at: '2026-07-01T10:45:00Z'
  }
];

const SEED_ATTENDEES = [
  { id: 'a1', full_name: 'Jane Doe', email: 'jane.doe@gmail.com', phone: '+1 555-012-3456', gender: 'Female', dob: '1995-04-12', address: '123 Main St, New York, NY 10001', emergency_contact: 'John Doe (+1 555-012-3457)', created_at: '2026-07-01T11:00:00Z', updated_at: '2026-07-01T11:00:00Z' },
  { id: 'a2', full_name: 'Robert Johnson', email: 'robert.j@outlook.com', phone: '+1 555-013-5819', gender: 'Male', dob: '1988-08-25', address: '456 Elm St, San Jose, CA 95112', emergency_contact: 'Mary Johnson (+1 555-013-5820)', created_at: '2026-07-01T11:05:00Z', updated_at: '2026-07-01T11:05:00Z' },
  { id: 'a3', full_name: 'Alice Smith', email: 'alice.smith@techcorp.io', phone: '+1 555-014-9988', gender: 'Female', dob: '1992-11-03', address: '789 Pine Rd, Austin, TX 78701', emergency_contact: 'Bob Smith (+1 555-014-9989)', created_at: '2026-07-01T11:08:00Z', updated_at: '2026-07-01T11:08:00Z' },
  { id: 'a4', full_name: 'Michael Brown', email: 'mbrown@edu.org', phone: '+1 555-019-7431', gender: 'Male', dob: '2001-01-15', address: '50 University Ave, Denver, CO 80208', emergency_contact: 'David Brown (+1 555-019-7432)', created_at: '2026-07-01T11:10:00Z', updated_at: '2026-07-01T11:10:00Z' },
  { id: 'a5', full_name: 'Emily Davis', email: 'emily.davis@design.com', phone: '+1 555-017-8822', gender: 'Female', dob: '1997-09-30', address: '99 Oak Lane, Seattle, WA 98101', emergency_contact: 'Sarah Davis (+1 555-017-8823)', created_at: '2026-07-01T11:12:00Z', updated_at: '2026-07-01T11:12:00Z' }
];

const SEED_REGISTRATIONS = [
  { id: 'r1', event_id: 'e1', attendee_id: 'a1', ticket_type: 'Paid', registration_date: '2026-07-01T11:00:00Z', status: 'Registered', qr_code_data: 'REG-E1-A1-JANE-DOE', created_at: '2026-07-01T11:00:00Z', updated_at: '2026-07-01T11:00:00Z' },
  { id: 'r2', event_id: 'e1', attendee_id: 'a2', ticket_type: 'VIP', registration_date: '2026-07-01T11:05:00Z', status: 'Checked-in', qr_code_data: 'REG-E1-A2-ROBERT-JOHNSON', created_at: '2026-07-01T11:05:00Z', updated_at: '2026-07-01T11:05:00Z' },
  { id: 'r3', event_id: 'e2', attendee_id: 'a2', ticket_type: 'Paid', registration_date: '2026-07-01T11:06:00Z', status: 'Registered', qr_code_data: 'REG-E2-A2-ROBERT-JOHNSON', created_at: '2026-07-01T11:06:00Z', updated_at: '2026-07-01T11:06:00Z' },
  { id: 'r4', event_id: 'e3', attendee_id: 'a3', ticket_type: 'Free', registration_date: '2026-07-01T11:08:00Z', status: 'Registered', qr_code_data: 'REG-E3-A3-ALICE-SMITH', created_at: '2026-07-01T11:08:00Z', updated_at: '2026-07-01T11:08:00Z' },
  { id: 'r5', event_id: 'e4', attendee_id: 'a3', ticket_type: 'Early Bird', registration_date: '2026-07-01T11:09:00Z', status: 'Registered', qr_code_data: 'REG-E4-A3-ALICE-SMITH', created_at: '2026-07-01T11:09:00Z', updated_at: '2026-07-01T11:09:00Z' },
  { id: 'r6', event_id: 'e1', attendee_id: 'a4', ticket_type: 'Student', registration_date: '2026-07-01T11:10:00Z', status: 'Registered', qr_code_data: 'REG-E1-A4-MICHAEL-BROWN', created_at: '2026-07-01T11:10:00Z', updated_at: '2026-07-01T11:10:00Z' }
];

const SEED_TICKETS = [
  { id: 't1', registration_id: 'r1', ticket_code: 'TKT-2026-R1X', pdf_url: null, created_at: '2026-07-01T11:00:00Z' },
  { id: 't2', registration_id: 'r2', ticket_code: 'TKT-2026-R2X', pdf_url: null, created_at: '2026-07-01T11:05:00Z' },
  { id: 't3', registration_id: 'r3', ticket_code: 'TKT-2026-R3X', pdf_url: null, created_at: '2026-07-01T11:06:00Z' },
  { id: 't4', registration_id: 'r4', ticket_code: 'TKT-2026-R4X', pdf_url: null, created_at: '2026-07-01T11:08:00Z' },
  { id: 't5', registration_id: 'r5', ticket_code: 'TKT-2026-R5X', pdf_url: null, created_at: '2026-07-01T11:09:00Z' },
  { id: 't6', registration_id: 'r6', ticket_code: 'TKT-2026-R6X', pdf_url: null, created_at: '2026-07-01T11:10:00Z' }
];

const SEED_PAYMENTS = [
  { id: 'p1', registration_id: 'r1', amount: 299.00, payment_status: 'Paid', payment_method: 'Stripe', transaction_id: 'ch_19283749', refunded_amount: 0.00, created_at: '2026-07-01T11:00:00Z', updated_at: '2026-07-01T11:00:00Z' },
  { id: 'p2', registration_id: 'r2', amount: 450.00, payment_status: 'Paid', payment_method: 'Credit Card', transaction_id: 'ch_48291039', refunded_amount: 0.00, created_at: '2026-07-01T11:05:00Z', updated_at: '2026-07-01T11:05:00Z' },
  { id: 'p3', registration_id: 'r3', amount: 99.00, payment_status: 'Paid', payment_method: 'PayPal', transaction_id: 'ch_88193822', refunded_amount: 0.00, created_at: '2026-07-01T11:06:00Z', updated_at: '2026-07-01T11:06:00Z' },
  { id: 'p4', registration_id: 'r4', amount: 0.00, payment_status: 'Paid', payment_method: 'Cash', transaction_id: 'ch_free', refunded_amount: 0.00, created_at: '2026-07-01T11:08:00Z', updated_at: '2026-07-01T11:08:00Z' },
  { id: 'p5', registration_id: 'r5', amount: 150.00, payment_status: 'Paid', payment_method: 'Stripe', transaction_id: 'ch_33918392', refunded_amount: 0.00, created_at: '2026-07-01T11:09:00Z', updated_at: '2026-07-01T11:09:00Z' },
  { id: 'p6', registration_id: 'r6', amount: 199.00, payment_status: 'Pending', payment_method: 'Bank Transfer', transaction_id: 'tx_bank_9921', refunded_amount: 0.00, created_at: '2026-07-01T11:10:00Z', updated_at: '2026-07-01T11:10:00Z' }
];

const SEED_NOTIFICATIONS = [
  { id: 'n1', user_id: null, title: 'New Registration', message: 'Jane Doe registered for Global Tech Developers Conference 2026.', type: 'New Registration', is_read: false, created_at: '2026-07-01T11:01:00Z' },
  { id: 'n2', user_id: null, title: 'New Registration', message: 'Robert Johnson registered for Advanced React Architecture Workshop.', type: 'New Registration', is_read: true, created_at: '2026-07-01T11:06:00Z' },
  { id: 'n3', user_id: null, title: 'Payment Confirmed', message: 'Payment of $450.00 from Robert Johnson for VIP Ticket confirmed.', type: 'Payment Confirmation', is_read: false, created_at: '2026-07-01T11:05:00Z' }
];

const SEED_SETTINGS = {
  id: '00000000-0000-0000-0000-000000000000',
  org_name: 'ApexEvents Inc.',
  org_logo_url: 'https://api.dicebear.com/7.x/initials/svg?seed=AE&backgroundColor=3b82f6',
  email_settings: { sender_email: 'notifications@apexevents.com', sender_name: 'ApexEvents System' },
  theme_settings: { primary_color: '#3b82f6', default_theme: 'dark' },
  updated_at: '2026-07-01T11:00:00Z'
};

const SEED_REPORTS = [
  { id: 'rep1', name: 'GTDC Attendance Report', type: 'Attendance', parameters: { event_id: 'e1' }, file_url: null, created_by: 'd1', created_at: '2026-07-01T11:12:00Z' }
];

// Helper to write/read mock data from storage
const getStorageData = (key, seed) => {
  const data = localStorage.getItem(`demo_${key}`);
  if (!data) {
    localStorage.setItem(`demo_${key}`, JSON.stringify(seed));
    return seed;
  }
  return JSON.parse(data);
};

const setStorageData = (key, data) => {
  localStorage.setItem(`demo_${key}`, JSON.stringify(data));
};

// -------------------------------------------------------------------
// DATA SERVICE IMPLEMENTATION
// -------------------------------------------------------------------
export const dataService = {
  // --- EVENT CATEGORIES ---
  async getCategories() {
    if (checkDemoMode()) {
      return { data: getStorageData('categories', SEED_CATEGORIES), error: null };
    }
    return await supabase.from('event_categories').select('*').order('name');
  },

  // --- EVENTS ---
  async getEvents() {
    if (checkDemoMode()) {
      return { data: getStorageData('events', SEED_EVENTS), error: null };
    }
    return await supabase
      .from('events')
      .select('*, category:event_categories(name)')
      .order('start_date', { ascending: true });
  },

  async getEvent(id) {
    if (checkDemoMode()) {
      const events = getStorageData('events', SEED_EVENTS);
      const categories = getStorageData('categories', SEED_CATEGORIES);
      const found = events.find(e => e.id === id);
      if (!found) return { data: null, error: new Error('Event not found') };
      const category = categories.find(c => c.id === found.category_id);
      return { data: { ...found, category }, error: null };
    }
    return await supabase
      .from('events')
      .select('*, category:event_categories(name)')
      .eq('id', id)
      .single();
  },

  async createEvent(eventData, userId) {
    if (checkDemoMode()) {
      const events = getStorageData('events', SEED_EVENTS);
      const newEvent = {
        ...eventData,
        id: 'e' + (events.length + 10),
        code: generateEventCode(),
        created_by: userId || 'd1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      events.push(newEvent);
      setStorageData('events', events);
      return { data: newEvent, error: null };
    }
    const eventInsert = {
      ...eventData,
      code: generateEventCode(),
      created_by: userId,
    };
    return await supabase.from('events').insert(eventInsert).select().single();
  },

  async updateEvent(id, eventData) {
    if (checkDemoMode()) {
      const events = getStorageData('events', SEED_EVENTS);
      const idx = events.findIndex(e => e.id === id);
      if (idx === -1) return { data: null, error: new Error('Event not found') };
      const updated = {
        ...events[idx],
        ...eventData,
        updated_at: new Date().toISOString()
      };
      events[idx] = updated;
      setStorageData('events', events);
      return { data: updated, error: null };
    }
    return await supabase
      .from('events')
      .update({ ...eventData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
  },

  async deleteEvent(id) {
    if (checkDemoMode()) {
      const events = getStorageData('events', SEED_EVENTS);
      const filtered = events.filter(e => e.id !== id);
      setStorageData('events', filtered);
      return { error: null };
    }
    return await supabase.from('events').delete().eq('id', id);
  },

  async archiveEvent(id) {
    return await this.updateEvent(id, { status: 'Archived' });
  },

  async duplicateEvent(id, userId) {
    const { data: source, error } = await this.getEvent(id);
    if (error) return { data: null, error };
    
    const duplicateData = {
      name: `${source.name} (Copy)`,
      description: source.description,
      category_id: source.category_id,
      venue: source.venue,
      address: source.address,
      city: source.city,
      state: source.state,
      country: source.country,
      start_date: source.start_date,
      end_date: source.end_date,
      start_time: source.start_time,
      end_time: source.end_time,
      capacity: source.capacity,
      organizer_name: source.organizer_name,
      contact_email: source.contact_email,
      contact_phone: source.contact_phone,
      ticket_price: source.ticket_price,
      banner_url: source.banner_url,
      status: 'Draft', // duplicates should start as Draft
      visibility: source.visibility,
      notes: source.notes
    };
    return await this.createEvent(duplicateData, userId);
  },

  // --- ATTENDEES & REGISTRATIONS ---
  async getAttendees() {
    if (checkDemoMode()) {
      return { data: getStorageData('attendees', SEED_ATTENDEES), error: null };
    }
    return await supabase.from('attendees').select('*').order('created_at', { ascending: false });
  },

  async getRegistrations(eventId = null) {
    if (checkDemoMode()) {
      const registrations = getStorageData('registrations', SEED_REGISTRATIONS);
      const attendees = getStorageData('attendees', SEED_ATTENDEES);
      const events = getStorageData('events', SEED_EVENTS);
      const tickets = getStorageData('tickets', SEED_TICKETS);
      const payments = getStorageData('payments', SEED_PAYMENTS);

      let filtered = registrations;
      if (eventId) {
        filtered = registrations.filter(r => r.event_id === eventId);
      }

      const joined = filtered.map(r => {
        const attendee = attendees.find(a => a.id === r.attendee_id);
        const event = events.find(e => e.id === r.event_id);
        const ticket = tickets.find(t => t.registration_id === r.id);
        const payment = payments.find(p => p.registration_id === r.id);
        return {
          ...r,
          attendee,
          event,
          ticket,
          payment
        };
      });

      return { data: joined, error: null };
    }

    let query = supabase
      .from('registrations')
      .select('*, attendee:attendees(*), event:events(*), tickets(*), payments(*)');
    
    if (eventId) {
      query = query.eq('event_id', eventId);
    }
    
    const { data, error } = await query.order('registration_date', { ascending: false });
    if (error) return { data: null, error };
    
    // Format to look similar to demo mode structure
    const mapped = data.map(r => ({
      ...r,
      ticket: r.tickets?.[0] || null,
      payment: r.payments?.[0] || null
    }));
    return { data: mapped, error: null };
  },

  async registerAttendee(attendeeData, registrationData, paymentData = null) {
    if (checkDemoMode()) {
      const attendees = getStorageData('attendees', SEED_ATTENDEES);
      const registrations = getStorageData('registrations', SEED_REGISTRATIONS);
      const tickets = getStorageData('tickets', SEED_TICKETS);
      const payments = getStorageData('payments', SEED_PAYMENTS);
      const notifications = getStorageData('notifications', SEED_NOTIFICATIONS);

      // 1. Check or Insert Attendee
      let attendee = attendees.find(a => a.email.toLowerCase() === attendeeData.email.toLowerCase());
      if (!attendee) {
        attendee = {
          ...attendeeData,
          id: 'a' + (attendees.length + 10),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        attendees.push(attendee);
        setStorageData('attendees', attendees);
      } else {
        // Update existing attendee info if registration specifies updates
        const idx = attendees.findIndex(a => a.id === attendee.id);
        attendee = { ...attendee, ...attendeeData, updated_at: new Date().toISOString() };
        attendees[idx] = attendee;
        setStorageData('attendees', attendees);
      }

      // 2. Check for duplicate registration
      const duplicate = registrations.find(r => r.event_id === registrationData.event_id && r.attendee_id === attendee.id);
      if (duplicate) {
        return { data: null, error: new Error('Attendee is already registered for this event.') };
      }

      // 3. Create Registration
      const regId = 'r' + (registrations.length + 10);
      const qrData = `REG-${registrationData.event_id}-${attendee.id}-${attendee.full_name.replace(/\s+/g, '-').toUpperCase()}`;
      const newRegistration = {
        id: regId,
        event_id: registrationData.event_id,
        attendee_id: attendee.id,
        ticket_type: registrationData.ticket_type || 'Free',
        registration_date: new Date().toISOString(),
        status: 'Registered',
        qr_code_data: qrData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      registrations.push(newRegistration);
      setStorageData('registrations', registrations);

      // 4. Generate Ticket
      const ticketId = 't' + (tickets.length + 10);
      const newTicket = {
        id: ticketId,
        registration_id: regId,
        ticket_code: generateTicketCode(),
        pdf_url: null,
        created_at: new Date().toISOString()
      };
      tickets.push(newTicket);
      setStorageData('tickets', tickets);

      // 5. Generate Payment
      let newPayment = null;
      if (paymentData) {
        const payId = 'p' + (payments.length + 10);
        newPayment = {
          id: payId,
          registration_id: regId,
          amount: parseFloat(paymentData.amount) || 0,
          payment_status: paymentData.payment_status || 'Paid',
          payment_method: paymentData.payment_method || 'Credit Card',
          transaction_id: paymentData.transaction_id || 'ch_' + Math.random().toString(36).substring(2, 10),
          refunded_amount: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        payments.push(newPayment);
        setStorageData('payments', payments);
      }

      // 6. Notify
      const events = getStorageData('events', SEED_EVENTS);
      const event = events.find(e => e.id === registrationData.event_id);
      notifications.unshift({
        id: 'n' + (notifications.length + 10),
        user_id: null,
        title: 'New Registration',
        message: `${attendee.full_name} registered for ${event?.name || 'an event'}.`,
        type: 'New Registration',
        is_read: false,
        created_at: new Date().toISOString()
      });
      setStorageData('notifications', notifications);

      return {
        data: {
          registration: newRegistration,
          attendee,
          ticket: newTicket,
          payment: newPayment
        },
        error: null
      };
    }

    try {
      // 1. Check or create attendee
      let { data: attendee, error: attError } = await supabase
        .from('attendees')
        .select('*')
        .eq('email', attendeeData.email)
        .maybeSingle();

      if (attError) throw attError;

      if (!attendee) {
        const { data: newAtt, error: insError } = await supabase
          .from('attendees')
          .insert(attendeeData)
          .select()
          .single();
        if (insError) throw insError;
        attendee = newAtt;
      } else {
        const { data: updAtt, error: updError } = await supabase
          .from('attendees')
          .update(attendeeData)
          .eq('id', attendee.id)
          .select()
          .single();
        if (updError) throw updError;
        attendee = updAtt;
      }

      // 2. Create Registration
      const qrData = `REG-${registrationData.event_id}-${attendee.id}-${attendee.full_name.replace(/\s+/g, '-').toUpperCase()}`;
      const { data: registration, error: regError } = await supabase
        .from('registrations')
        .insert({
          event_id: registrationData.event_id,
          attendee_id: attendee.id,
          ticket_type: registrationData.ticket_type,
          qr_code_data: qrData
        })
        .select()
        .single();
      
      if (regError) {
        if (regError.code === '23505') { // Unique constraint violation
          throw new Error('Attendee is already registered for this event.');
        }
        throw regError;
      }

      // 3. Create Ticket
      const ticketCode = generateTicketCode();
      const { data: ticket, error: tktError } = await supabase
        .from('tickets')
        .insert({
          registration_id: registration.id,
          ticket_code: ticketCode
        })
        .select()
        .single();
      if (tktError) throw tktError;

      // 4. Create Payment if paid/required
      let payment = null;
      if (paymentData) {
        const { data: pay, error: payError } = await supabase
          .from('payments')
          .insert({
            registration_id: registration.id,
            amount: paymentData.amount,
            payment_status: paymentData.payment_status || 'Paid',
            payment_method: paymentData.payment_method,
            transaction_id: paymentData.transaction_id || 'ch_' + Math.random().toString(36).substring(2, 10),
          })
          .select()
          .single();
        if (payError) throw payError;
        payment = pay;
      }

      // 5. Create System Notification
      const { data: event } = await supabase.from('events').select('name').eq('id', registrationData.event_id).single();
      await supabase.from('notifications').insert({
        title: 'New Registration',
        message: `${attendee.full_name} registered for ${event?.name || 'an event'}.`,
        type: 'New Registration',
        is_read: false
      });

      return {
        data: { registration, attendee, ticket, payment },
        error: null
      };
    } catch (err) {
      return { data: null, error: err };
    }
  },

  async updateRegistrationStatus(id, status) {
    if (checkDemoMode()) {
      const registrations = getStorageData('registrations', SEED_REGISTRATIONS);
      const idx = registrations.findIndex(r => r.id === id);
      if (idx === -1) return { error: new Error('Registration not found') };
      registrations[idx] = {
        ...registrations[idx],
        status,
        updated_at: new Date().toISOString()
      };
      setStorageData('registrations', registrations);
      return { error: null };
    }
    return await supabase
      .from('registrations')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);
  },

  async deleteAttendee(id) {
    if (checkDemoMode()) {
      const attendees = getStorageData('attendees', SEED_ATTENDEES);
      const filtered = attendees.filter(a => a.id !== id);
      setStorageData('attendees', filtered);
      return { error: null };
    }
    return await supabase.from('attendees').delete().eq('id', id);
  },

  async updateAttendee(id, attendeeData) {
    if (checkDemoMode()) {
      const attendees = getStorageData('attendees', SEED_ATTENDEES);
      const idx = attendees.findIndex(a => a.id === id);
      if (idx === -1) return { data: null, error: new Error('Attendee not found') };
      const updated = {
        ...attendees[idx],
        ...attendeeData,
        updated_at: new Date().toISOString()
      };
      attendees[idx] = updated;
      setStorageData('attendees', attendees);
      return { data: updated, error: null };
    }
    return await supabase
      .from('attendees')
      .update({ ...attendeeData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
  },

  // --- PAYMENTS ---
  async getPayments() {
    if (checkDemoMode()) {
      const payments = getStorageData('payments', SEED_PAYMENTS);
      const registrations = getStorageData('registrations', SEED_REGISTRATIONS);
      const attendees = getStorageData('attendees', SEED_ATTENDEES);
      const events = getStorageData('events', SEED_EVENTS);

      const joined = payments.map(p => {
        const registration = registrations.find(r => r.id === p.registration_id) || {};
        const attendee = attendees.find(a => a.id === registration.attendee_id) || {};
        const event = events.find(e => e.id === registration.event_id) || {};
        return {
          ...p,
          registration: {
            ...registration,
            attendee,
            event
          }
        };
      });
      return { data: joined, error: null };
    }
    return await supabase
      .from('payments')
      .select('*, registration:registrations(*, attendee:attendees(*), event:events(*))')
      .order('created_at', { ascending: false });
  },

  async refundPayment(paymentId, refundAmount) {
    if (checkDemoMode()) {
      const payments = getStorageData('payments', SEED_PAYMENTS);
      const notifications = getStorageData('notifications', SEED_NOTIFICATIONS);
      const idx = payments.findIndex(p => p.id === paymentId);
      if (idx === -1) return { error: new Error('Payment record not found') };
      
      const p = payments[idx];
      const updated = {
        ...p,
        payment_status: 'Refunded',
        refunded_amount: parseFloat(refundAmount) || p.amount,
        updated_at: new Date().toISOString()
      };
      payments[idx] = updated;
      setStorageData('payments', payments);

      // Notify
      notifications.unshift({
        id: 'n' + (notifications.length + 10),
        user_id: null,
        title: 'Payment Confirmed', // Use matching type
        message: `Refund of $${refundAmount} processed for transaction ${p.transaction_id}.`,
        type: 'Payment Confirmation',
        is_read: false,
        created_at: new Date().toISOString()
      });
      setStorageData('notifications', notifications);

      return { data: updated, error: null };
    }
    return await supabase
      .from('payments')
      .update({
        payment_status: 'Refunded',
        refunded_amount: refundAmount,
        updated_at: new Date().toISOString()
      })
      .eq('id', paymentId)
      .select()
      .single();
  },

  // --- NOTIFICATIONS ---
  async getNotifications() {
    if (checkDemoMode()) {
      return { data: getStorageData('notifications', SEED_NOTIFICATIONS), error: null };
    }
    return await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false });
  },

  async markNotificationAsRead(id) {
    if (checkDemoMode()) {
      const notifications = getStorageData('notifications', SEED_NOTIFICATIONS);
      const idx = notifications.findIndex(n => n.id === id);
      if (idx !== -1) {
        notifications[idx].is_read = true;
        setStorageData('notifications', notifications);
      }
      return { error: null };
    }
    return await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  },

  async clearAllNotifications() {
    if (checkDemoMode()) {
      const notifications = getStorageData('notifications', SEED_NOTIFICATIONS);
      const cleared = notifications.map(n => ({ ...n, is_read: true }));
      setStorageData('notifications', cleared);
      return { error: null };
    }
    return await supabase.from('notifications').update({ is_read: true }).eq('is_read', false);
  },

  // --- SETTINGS ---
  async getSettings() {
    if (checkDemoMode()) {
      return { data: getStorageData('settings', SEED_SETTINGS), error: null };
    }
    // Read from settings table (where id is fixed to represent organization)
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .maybeSingle();

    if (!data && !error) {
      // If table empty, insert default seed
      const { data: inserted, error: insError } = await supabase
        .from('settings')
        .insert({
          id: '00000000-0000-0000-0000-000000000000',
          org_name: 'ApexEvents Inc.'
        })
        .select()
        .single();
      return { data: inserted, error: insError };
    }
    return { data, error };
  },

  async updateSettings(settingsData) {
    if (checkDemoMode()) {
      const settings = getStorageData('settings', SEED_SETTINGS);
      const updated = {
        ...settings,
        ...settingsData,
        updated_at: new Date().toISOString()
      };
      setStorageData('settings', updated);
      return { data: updated, error: null };
    }
    return await supabase
      .from('settings')
      .update({
        ...settingsData,
        updated_at: new Date().toISOString()
      })
      .eq('id', '00000000-0000-0000-0000-000000000000')
      .select()
      .single();
  },

  // --- REPORTS ---
  async getReports() {
    if (checkDemoMode()) {
      return { data: getStorageData('reports', SEED_REPORTS), error: null };
    }
    return await supabase.from('reports').select('*').order('created_at', { ascending: false });
  },

  async createReport(reportData, userId) {
    if (checkDemoMode()) {
      const reports = getStorageData('reports', SEED_REPORTS);
      const newReport = {
        ...reportData,
        id: 'rep' + (reports.length + 10),
        created_by: userId || 'd1',
        created_at: new Date().toISOString()
      };
      reports.push(newReport);
      setStorageData('reports', reports);
      return { data: newReport, error: null };
    }
    return await supabase
      .from('reports')
      .insert({ ...reportData, created_by: userId })
      .select()
      .single();
  }
};
