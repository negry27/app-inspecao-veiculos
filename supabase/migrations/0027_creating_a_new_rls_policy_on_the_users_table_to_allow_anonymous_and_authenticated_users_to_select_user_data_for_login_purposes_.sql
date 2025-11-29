-- Drop existing SELECT policy that restricts access to 'authenticated' only
DROP POLICY IF EXISTS "Allow authenticated users to select active users" ON public.users;

-- Create a new SELECT policy allowing all users (anon and authenticated) to read user data
CREATE POLICY "Allow all users to select user data for login" ON public.users 
FOR SELECT USING (true);