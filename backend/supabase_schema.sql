-- Supabase Database Schema for ApexEvents - Professional Event Management System

-- Drop existing triggers/functions if they exist
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- 1. Create PROFILES Table
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  phone text,
  full_name text,
  role text not null default 'Staff' check (role in ('Super Admin', 'Event Manager', 'Staff')),
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for profiles
alter table public.profiles enable row level security;

-- 2. Create EVENT CATEGORIES Table
create table if not exists public.event_categories (
  id uuid default gen_random_uuid() primary key,
  name text unique not null,
  slug text unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.event_categories enable row level security;

-- 3. Create EVENTS Table
create table if not exists public.events (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  code text unique not null,
  description text,
  category_id uuid references public.event_categories(id) on delete set null,
  venue text not null,
  address text,
  city text,
  state text,
  country text,
  start_date date not null,
  end_date date not null,
  start_time time not null,
  end_time time not null,
  capacity integer not null default 100,
  organizer_name text,
  contact_email text,
  contact_phone text,
  ticket_price numeric not null default 0.00,
  banner_url text,
  status text not null default 'Draft' check (status in ('Draft', 'Published', 'Cancelled', 'Completed', 'Archived')),
  visibility text not null default 'Public' check (visibility in ('Public', 'Private')),
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.events enable row level security;

-- 4. Create ATTENDEES Table
create table if not exists public.attendees (
  id uuid default gen_random_uuid() primary key,
  full_name text not null,
  email text not null unique,
  phone text,
  gender text,
  dob date,
  address text,
  emergency_contact text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.attendees enable row level security;

-- 5. Create REGISTRATIONS Table
create table if not exists public.registrations (
  id uuid default gen_random_uuid() primary key,
  event_id uuid references public.events(id) on delete cascade not null,
  attendee_id uuid references public.attendees(id) on delete cascade not null,
  ticket_type text not null default 'Free' check (ticket_type in ('Free', 'Paid', 'VIP', 'Student', 'Early Bird')),
  registration_date timestamp with time zone default timezone('utc'::text, now()) not null,
  status text not null default 'Registered' check (status in ('Registered', 'Checked-in', 'Cancelled')),
  qr_code_data text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(event_id, attendee_id)
);

alter table public.registrations enable row level security;

-- 6. Create TICKETS Table
create table if not exists public.tickets (
  id uuid default gen_random_uuid() primary key,
  registration_id uuid references public.registrations(id) on delete cascade not null,
  ticket_code text unique not null,
  pdf_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.tickets enable row level security;

-- 7. Create PAYMENTS Table
create table if not exists public.payments (
  id uuid default gen_random_uuid() primary key,
  registration_id uuid references public.registrations(id) on delete cascade not null,
  amount numeric not null default 0.00,
  payment_status text not null default 'Pending' check (payment_status in ('Paid', 'Pending', 'Failed', 'Refunded')),
  payment_method text check (payment_method in ('Stripe', 'PayPal', 'Credit Card', 'Bank Transfer', 'Cash')),
  transaction_id text,
  refunded_amount numeric not null default 0.00,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.payments enable row level security;

-- 8. Create NOTIFICATIONS Table
create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade, -- Null means global/all staff
  title text not null,
  message text not null,
  type text not null check (type in ('New Registration', 'Event Reminder', 'Event Update', 'Payment Confirmation', 'Cancelled Event')),
  is_read boolean not null default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.notifications enable row level security;

-- 9. Create REPORTS Table
create table if not exists public.reports (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  type text not null check (type in ('Attendance', 'Revenue', 'Performance', 'Registration')),
  parameters jsonb default '{}'::jsonb,
  file_url text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.reports enable row level security;

-- 10. Create SETTINGS Table
create table if not exists public.settings (
  id uuid default gen_random_uuid() primary key,
  org_name text not null default 'ApexEvents Inc.',
  org_logo_url text,
  email_settings jsonb default '{"sender_email": "notifications@apexevents.com", "sender_name": "ApexEvents System"}'::jsonb,
  theme_settings jsonb default '{"primary_color": "#3b82f6", "default_theme": "dark"}'::jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.settings enable row level security;

-- -------------------------------------------------------------------
-- TRIGGERS & FUNCTIONS
-- -------------------------------------------------------------------

-- Function to handle creating public.profiles record when user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, phone, full_name, role, avatar_url)
  values (
    new.id,
    new.email,
    new.phone,
    coalesce(new.raw_user_meta_data->>'full_name', coalesce(split_part(new.email, '@', 1), 'User')),
    coalesce(new.raw_user_meta_data->>'role', 'Staff'),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to call handle_new_user()
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- -------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-- -------------------------------------------------------------------

-- HELPER FUNCTIONS FOR POLICIES (to check user role easily)
create or replace function public.get_user_role(user_id uuid)
returns text as $$
declare
  user_role text;
begin
  select role into user_role from public.profiles where id = user_id;
  return user_role;
end;
$$ language plpgsql security definer;

-- PROFILES Policies
create policy "Allow profile read to all authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Allow individual profile update to users themselves"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Allow Super Admin full control on profiles"
  on public.profiles for all
  to authenticated
  using (public.get_user_role(auth.uid()) = 'Super Admin');

-- EVENT_CATEGORIES Policies
create policy "Allow category read to all authenticated users"
  on public.event_categories for select
  to authenticated
  using (true);

create policy "Allow write to categories for Super Admins and Event Managers"
  on public.event_categories for all
  to authenticated
  using (public.get_user_role(auth.uid()) in ('Super Admin', 'Event Manager'));

-- EVENTS Policies
create policy "Allow events read to all authenticated users"
  on public.events for select
  to authenticated
  using (true);

create policy "Allow events write to Super Admin and Event Manager"
  on public.events for all
  to authenticated
  using (public.get_user_role(auth.uid()) in ('Super Admin', 'Event Manager'));

-- ATTENDEES Policies
create policy "Allow attendees read to all authenticated users"
  on public.attendees for select
  to authenticated
  using (true);

create policy "Allow attendees insert to all authenticated roles"
  on public.attendees for insert
  to authenticated
  with check (true);

create policy "Allow attendees update to all authenticated roles"
  on public.attendees for update
  to authenticated
  using (true)
  with check (true);

create policy "Allow attendees delete to Super Admin and Event Manager only"
  on public.attendees for delete
  to authenticated
  using (public.get_user_role(auth.uid()) in ('Super Admin', 'Event Manager'));

-- REGISTRATIONS Policies
create policy "Allow registrations read to all authenticated users"
  on public.registrations for select
  to authenticated
  using (true);

create policy "Allow registrations insert to all authenticated roles"
  on public.registrations for insert
  to authenticated
  with check (true);

create policy "Allow registrations update to all authenticated roles"
  on public.registrations for update
  to authenticated
  using (true)
  with check (true);

create policy "Allow registrations delete to Super Admin and Event Manager only"
  on public.registrations for delete
  to authenticated
  using (public.get_user_role(auth.uid()) in ('Super Admin', 'Event Manager'));

-- TICKETS Policies
create policy "Allow tickets read to all authenticated users"
  on public.tickets for select
  to authenticated
  using (true);

create policy "Allow tickets insert to all authenticated roles"
  on public.tickets for insert
  to authenticated
  with check (true);

create policy "Allow tickets update to all authenticated roles"
  on public.tickets for update
  to authenticated
  using (true)
  with check (true);

create policy "Allow tickets delete to Super Admin and Event Manager only"
  on public.tickets for delete
  to authenticated
  using (public.get_user_role(auth.uid()) in ('Super Admin', 'Event Manager'));

-- PAYMENTS Policies
create policy "Allow payments read to all authenticated users"
  on public.payments for select
  to authenticated
  using (true);

create policy "Allow payments write to Super Admins and Event Managers"
  on public.payments for all
  to authenticated
  using (public.get_user_role(auth.uid()) in ('Super Admin', 'Event Manager'));

-- NOTIFICATIONS Policies
create policy "Allow notifications read to matching users or general staff"
  on public.notifications for select
  to authenticated
  using (user_id is null or user_id = auth.uid());

create policy "Allow notifications insert to all authenticated users"
  on public.notifications for insert
  to authenticated
  with check (true);

create policy "Allow notifications update to targeted users only"
  on public.notifications for update
  to authenticated
  using (user_id is null or user_id = auth.uid())
  with check (user_id is null or user_id = auth.uid());

create policy "Allow notifications delete to Super Admin, Event Manager or targeted users"
  on public.notifications for delete
  to authenticated
  using (public.get_user_role(auth.uid()) in ('Super Admin', 'Event Manager') or user_id = auth.uid());

-- REPORTS Policies
create policy "Allow reports read to Super Admins and Event Managers"
  on public.reports for select
  to authenticated
  using (public.get_user_role(auth.uid()) in ('Super Admin', 'Event Manager'));

create policy "Allow reports write to Super Admins and Event Managers"
  on public.reports for all
  to authenticated
  using (public.get_user_role(auth.uid()) in ('Super Admin', 'Event Manager'));

-- SETTINGS Policies
create policy "Allow settings read to all authenticated users"
  on public.settings for select
  to authenticated
  using (true);

create policy "Allow settings update to Super Admins only"
  on public.settings for update
  to authenticated
  using (public.get_user_role(auth.uid()) = 'Super Admin');

-- -------------------------------------------------------------------
-- INITIAL SEED DATA
-- -------------------------------------------------------------------

-- Seed Settings (Ensure at least 1 record exists)
insert into public.settings (id, org_name)
values ('00000000-0000-0000-0000-000000000000', 'ApexEvents Inc.')
on conflict (id) do nothing;

-- Seed Categories
insert into public.event_categories (name, slug) values
  ('Conference', 'conference'),
  ('Seminar', 'seminar'),
  ('Workshop', 'workshop'),
  ('College Fest', 'college-fest'),
  ('Cultural Event', 'cultural-event'),
  ('Sports Event', 'sports-event'),
  ('Music Concert', 'music-concert'),
  ('Exhibition', 'exhibition'),
  ('Webinar', 'webinar'),
  ('Training', 'training'),
  ('Other', 'other')
on conflict (name) do nothing;
