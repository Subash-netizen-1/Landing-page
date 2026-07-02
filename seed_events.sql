-- Seed Example Events into public.events table

-- 1. Temporarily disable Row Level Security to allow SQL Editor inserts without a session user
ALTER TABLE public.events DISABLE ROW LEVEL SECURITY;

-- 2. Run the SQL inserts
DO $$
DECLARE
  conf_id UUID;
  work_id UUID;
  web_id UUID;
  concert_id UUID;
  admin_id UUID;
BEGIN
  -- Get Category UUIDs
  SELECT id INTO conf_id FROM public.event_categories WHERE name = 'Conference' LIMIT 1;
  SELECT id INTO work_id FROM public.event_categories WHERE name = 'Workshop' LIMIT 1;
  SELECT id INTO web_id FROM public.event_categories WHERE name = 'Webinar' LIMIT 1;
  SELECT id INTO concert_id FROM public.event_categories WHERE name = 'Music Concert' LIMIT 1;

  -- Get any profile UUID (to associate with created_by), or use NULL
  SELECT id INTO admin_id FROM public.profiles LIMIT 1;

  -- Insert Events
  INSERT INTO public.events (
    name, code, description, category_id, venue, address, city, state, country,
    start_date, end_date, start_time, end_time, capacity, organizer_name,
    contact_email, contact_phone, ticket_price, banner_url, status, visibility, notes, created_by
  ) VALUES
  (
    'Global Tech Innovations Summit 2026',
    'CON-20260702-GTIS',
    'The premier annual gathering of software engineering professionals, cloud architects, and tech executives to discuss the future of AI, developer tooling, and decentralized networks.',
    conf_id,
    'Convention Center, Hall A',
    '100 Metrotech Center',
    'Brooklyn',
    'NY',
    'USA',
    '2026-08-15',
    '2026-08-17',
    '09:00:00',
    '18:00:00',
    250,
    'ApexTech Media',
    'events@apextech.com',
    '+1 555-019-2831',
    299.00,
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80',
    'Published',
    'Public',
    'Premium lunch is included. VIP pass includes speaker meet & greet.',
    admin_id
  ),
  (
    'Advanced React Architecture Workshop',
    'WRK-20260702-REACT',
    'An intensive, hands-on workshop building high-performance React web applications using Server Components, State Machines, and modern caching strategies.',
    work_id,
    'Innovation Hub Room 402',
    '450 Science Parkway',
    'San Jose',
    'CA',
    'USA',
    '2026-07-20',
    '2026-07-20',
    '10:00:00',
    '16:00:00',
    45,
    'Frontend Guild',
    'training@frontendguild.org',
    '+1 555-014-9988',
    99.00,
    'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80',
    'Published',
    'Public',
    'Requires laptop with Node.js v20+ installed.',
    admin_id
  ),
  (
    'Future of Decentralized Finance (DeFi) Webinar',
    'WEB-20260702-DEFI',
    'A global panel discussion featuring leading blockchain economists, smart contract auditors, and regulatory compliance experts exploring DeFi trends.',
    web_id,
    'Zoom Webinar',
    'Online',
    'Virtual',
    '',
    'Global',
    '2026-07-12',
    '2026-07-12',
    '14:00:00',
    '16:30:00',
    1000,
    'CryptoResearch Group',
    'webinars@cryptoresearch.io',
    '',
    0.00,
    'https://images.unsplash.com/photo-1591115413009-d6368d89e5a8?auto=format&fit=crop&w=800&q=80',
    'Published',
    'Public',
    'Link will be sent to registered emails.',
    admin_id
  ),
  (
    'Summit Concert: Neon Nights Music Festival',
    'CON-20260702-NEON',
    'Featuring three stages of live electronic dance music, ambient soundscapes, and visual projection art under the stars.',
    concert_id,
    'Riverside Amphitheater',
    '500 Concert Way',
    'Austin',
    'TX',
    'USA',
    '2026-09-05',
    '2026-09-06',
    '18:00:00',
    '01:00:00',
    2500,
    'Starlight Live',
    'help@starlightlive.com',
    '+1 555-081-3944',
    150.00,
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
    'Published',
    'Public',
    '18+ event. Bring valid photo ID.',
    admin_id
  )
  ON CONFLICT (code) DO NOTHING;
END $$;

-- 3. Re-enable Row Level Security immediately after
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
