CREATE POLICY "Allow authenticated users to update vehicles" ON public.vehicles
FOR UPDATE TO authenticated
USING (true);