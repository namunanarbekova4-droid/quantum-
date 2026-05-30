-- Community Groups
create table if not exists community_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  category text,
  is_vip boolean default false,
  member_count integer default 0,
  created_at timestamptz default now()
);

create table if not exists community_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references community_groups(id) on delete cascade,
  user_id text not null,
  joined_at timestamptz default now(),
  role text default 'member',
  unique(group_id, user_id)
);

create table if not exists community_messages (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references community_groups(id) on delete cascade,
  user_id text not null,
  user_name text not null,
  user_avatar text,
  content text not null,
  parent_id uuid references community_messages(id),
  is_pinned boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists message_reactions (
  id uuid primary key default gen_random_uuid(),
  message_id uuid references community_messages(id) on delete cascade,
  user_id text not null,
  emoji text not null,
  created_at timestamptz default now(),
  unique(message_id, user_id, emoji)
);

create table if not exists direct_conversations (
  id uuid primary key default gen_random_uuid(),
  participant1_id text not null,
  participant2_id text not null,
  created_at timestamptz default now(),
  last_message_at timestamptz default now(),
  unique(participant1_id, participant2_id)
);

create table if not exists direct_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references direct_conversations(id) on delete cascade,
  sender_id text not null,
  sender_name text not null,
  content text not null,
  read_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists user_presence (
  user_id text primary key,
  user_name text,
  last_seen timestamptz default now(),
  is_online boolean default false,
  updated_at timestamptz default now()
);

create table if not exists message_reports (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null,
  reporter_id text not null,
  reason text,
  created_at timestamptz default now()
);

-- Decision Voting
create table if not exists decision_votes (
  id uuid primary key default gen_random_uuid(),
  decision_id text not null,
  user_id text not null,
  vote_type text check (vote_type in ('go', 'caution', 'dont')) not null,
  created_at timestamptz default now(),
  unique(decision_id, user_id)
);

create table if not exists decision_comments (
  id uuid primary key default gen_random_uuid(),
  decision_id text not null,
  user_id text not null,
  content text not null,
  upvotes integer default 0,
  is_anonymous boolean default true,
  created_at timestamptz default now()
);

create table if not exists comment_votes (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid references decision_comments(id) on delete cascade,
  user_id text not null,
  created_at timestamptz default now(),
  unique(comment_id, user_id)
);

-- Mentor Connect
create table if not exists mentor_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id text unique not null,
  full_name text not null,
  expertise text not null,
  years_experience integer,
  linkedin_url text,
  industry text,
  biography text,
  why_mentor text,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  response_rate integer default 100,
  session_count integer default 0,
  created_at timestamptz default now()
);

create table if not exists mentor_requests (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid references mentor_profiles(id) on delete cascade,
  requester_id text not null,
  decision_id text,
  message text,
  status text default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz default now()
);

create table if not exists mentor_feedback (
  id uuid primary key default gen_random_uuid(),
  request_id uuid references mentor_requests(id) on delete cascade,
  mentor_id uuid references mentor_profiles(id),
  requester_id text not null,
  content text not null,
  created_at timestamptz default now()
);

create table if not exists mentor_reviews (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid references mentor_profiles(id) on delete cascade,
  reviewer_id text not null,
  rating integer check (rating between 1 and 5),
  comment text,
  created_at timestamptz default now()
);

-- Enable RLS
alter table community_groups enable row level security;
alter table community_members enable row level security;
alter table community_messages enable row level security;
alter table message_reactions enable row level security;
alter table direct_conversations enable row level security;
alter table direct_messages enable row level security;
alter table user_presence enable row level security;
alter table message_reports enable row level security;
alter table decision_votes enable row level security;
alter table decision_comments enable row level security;
alter table comment_votes enable row level security;
alter table mentor_profiles enable row level security;
alter table mentor_requests enable row level security;
alter table mentor_feedback enable row level security;
alter table mentor_reviews enable row level security;

-- RLS Policies for community_groups
create policy "Anyone can read groups" on community_groups for select using (true);
create policy "Service role can insert groups" on community_groups for insert with check (true);

-- RLS Policies for community_members
create policy "Anyone can read members" on community_members for select using (true);
create policy "Users can manage own membership" on community_members for insert with check (true);
create policy "Users can delete own membership" on community_members for delete using (true);

-- RLS Policies for community_messages
create policy "Anyone can read messages" on community_messages for select using (true);
create policy "Users can insert messages" on community_messages for insert with check (true);
create policy "Users can delete own messages" on community_messages for delete using (true);

-- RLS Policies for message_reactions
create policy "Anyone can read reactions" on message_reactions for select using (true);
create policy "Users can insert reactions" on message_reactions for insert with check (true);
create policy "Users can delete reactions" on message_reactions for delete using (true);

-- RLS Policies for direct_conversations
create policy "Anyone can read conversations" on direct_conversations for select using (true);
create policy "Users can create conversations" on direct_conversations for insert with check (true);

-- RLS Policies for direct_messages
create policy "Anyone can read direct messages" on direct_messages for select using (true);
create policy "Users can insert direct messages" on direct_messages for insert with check (true);
create policy "Users can update direct messages" on direct_messages for update using (true);

-- RLS Policies for user_presence
create policy "Anyone can read presence" on user_presence for select using (true);
create policy "Users can upsert presence" on user_presence for insert with check (true);
create policy "Users can update presence" on user_presence for update using (true);

-- RLS Policies for decision_votes
create policy "Anyone can read votes" on decision_votes for select using (true);
create policy "Users can insert votes" on decision_votes for insert with check (true);
create policy "Users can update votes" on decision_votes for update using (true);
create policy "Users can delete votes" on decision_votes for delete using (true);

-- RLS Policies for decision_comments
create policy "Anyone can read comments" on decision_comments for select using (true);
create policy "Users can insert comments" on decision_comments for insert with check (true);
create policy "Users can update comments" on decision_comments for update using (true);

-- RLS Policies for comment_votes
create policy "Anyone can read comment votes" on comment_votes for select using (true);
create policy "Users can insert comment votes" on comment_votes for insert with check (true);
create policy "Users can delete comment votes" on comment_votes for delete using (true);

-- RLS Policies for mentor_profiles
create policy "Anyone can read approved mentors" on mentor_profiles for select using (true);
create policy "Users can insert mentor profiles" on mentor_profiles for insert with check (true);
create policy "Users can update own mentor profile" on mentor_profiles for update using (true);

-- RLS Policies for mentor_requests
create policy "Anyone can read mentor requests" on mentor_requests for select using (true);
create policy "Users can create mentor requests" on mentor_requests for insert with check (true);
create policy "Users can update mentor requests" on mentor_requests for update using (true);

-- RLS Policies for mentor_feedback
create policy "Anyone can read mentor feedback" on mentor_feedback for select using (true);
create policy "Users can insert mentor feedback" on mentor_feedback for insert with check (true);

-- RLS Policies for mentor_reviews
create policy "Anyone can read mentor reviews" on mentor_reviews for select using (true);
create policy "Users can insert mentor reviews" on mentor_reviews for insert with check (true);

-- Seed community groups
insert into community_groups (name, slug, description, category, is_vip, member_count) values
  ('Startups', 'startups', 'Connect with early-stage founders, share learnings, and grow together.', 'Business', false, 0),
  ('Investing', 'investing', 'Discuss investment strategies, deal flow, and market opportunities.', 'Finance', false, 0),
  ('Marketing', 'marketing', 'Growth tactics, brand building, and customer acquisition strategies.', 'Growth', false, 0),
  ('Global Markets', 'global-markets', 'International market trends, geopolitics, and global expansion insights.', 'Finance', false, 0),
  ('AI & Tech', 'ai-tech', 'Artificial intelligence, emerging tech, and the future of business.', 'Technology', false, 0),
  ('Leadership', 'leadership', 'Executive leadership, team building, and organizational excellence.', 'People', false, 0),
  ('Real Estate', 'real-estate', 'Commercial and residential real estate investment and development.', 'Investment', false, 0),
  ('Crypto', 'crypto', 'Cryptocurrency, DeFi, blockchain technology, and digital assets.', 'Finance', false, 0),
  ('Entrepreneurship', 'entrepreneurship', 'The entrepreneur journey — from idea to exit.', 'Business', false, 0),
  ('Deal Flow', 'deal-flow', 'Exclusive deal sharing and co-investment opportunities for top members.', 'VIP', true, 0),
  ('Masterminds', 'masterminds', 'Small group strategic sessions with elite founders and investors.', 'VIP', true, 0),
  ('Alpha Intelligence', 'alpha-intelligence', 'Proprietary market intelligence and early signals for Max members.', 'VIP', true, 0),
  ('Founder x Investor', 'founder-x-investor', 'Direct founder-investor matchmaking and dialogue.', 'VIP', true, 0),
  ('Global Expansion', 'global-expansion', 'Confidential insights on international scaling for premium operators.', 'VIP', true, 0),
  ('Confidential Decisions', 'confidential-decisions', 'Share high-stakes decisions anonymously with trusted peers.', 'VIP', true, 0),
  ('Top 100', 'top-100', 'Reserved for the top 100 platform members by decision quality score.', 'VIP', true, 0)
on conflict (slug) do nothing;
