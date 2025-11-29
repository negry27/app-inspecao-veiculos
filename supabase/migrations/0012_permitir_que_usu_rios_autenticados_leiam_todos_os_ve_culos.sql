CREATE POLICY "Allow authenticated users to read all vehicles" ON public.vehicles
FOR SELECT TO authenticated
USING (true);