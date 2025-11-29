CREATE POLICY "Allow authenticated users to delete vehicles" ON public.vehicles
FOR DELETE TO authenticated
USING (true);