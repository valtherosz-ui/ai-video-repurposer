# Supabase Setup Instructions

Your Supabase URL has been configured: `https://ibrqxufcmhwluovlgvvt.supabase.co`

## Next Steps: Get Your API Keys

1. **Open your Supabase Dashboard:**
   - Go to: https://supabase.com/dashboard/project/ibrqxufcmhwluovlgvvt/settings/api

2. **Find the API Keys section:**
   - Scroll down to "Project API keys"

3. **Copy the following keys:**

   ### Anon Key (Public Key)
   - Find the field labeled **"anon public"**
   - Copy the key (it starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)
   - This key is safe to use in browser code

   ### Service Role Key (Secret Key)
   - Find the field labeled **"service_role"** 
   - Copy the key (also starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)
   - ⚠️ **IMPORTANT:** This key should NEVER be exposed in browser code or committed to git

4. **Update your .env.local file:**
   - Open: `MyProjects/ai-video-repurposer/.env.local`
   - Replace `your_supabase_anon_key_here` with your anon key
   - Replace `your_supabase_service_role_key_here` with your service role key

   Example:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://ibrqxufcmhwluovlgvvt.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

## Verify Your Setup

After adding the keys, you can verify the connection by:

1. Starting the development server:
   ```bash
   cd MyProjects/ai-video-repurposer
   npm run dev
   ```

2. Visit http://localhost:3000 and test the authentication flow

## Database Setup (Optional)

If you need to set up the database schema for authentication:

1. Go to: https://supabase.com/dashboard/project/ibrqxufcmhwluovlgvvt/sql
2. Run the following SQL to create the users table:

```sql
-- Create a custom users table (optional - Supabase auth has built-in user management)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);
```

## Need Help?

- Supabase Documentation: https://supabase.com/docs
- Next.js with Supabase Guide: https://supabase.com/docs/guides/auth/server-side/nextjs
