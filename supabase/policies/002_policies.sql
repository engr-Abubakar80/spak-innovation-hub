-- Example RLS policies. Review and tailor to your auth model.
-- This app uses NextAuth (server-side) + Prisma; if you access DB directly
-- from client with Supabase anon key, these policies become critical.
-- If only server/service role accesses DB, RLS is bypassed for service role.

-- Public read for published content
DROP POLICY IF EXISTS "public_read_published_programmes" ON public."Programme";
CREATE POLICY "public_read_published_programmes"
ON public."Programme" FOR SELECT
USING (status = 'PUBLISHED');

DROP POLICY IF EXISTS "public_read_services" ON public."Service";
CREATE POLICY "public_read_services"
ON public."Service" FOR SELECT
USING (published = true);

DROP POLICY IF EXISTS "public_read_settings" ON public."OrganizationSetting";
CREATE POLICY "public_read_settings"
ON public."OrganizationSetting" FOR SELECT
USING (true);

-- Users can read their own bookings/messages (requires mapping auth.uid() to app user)
-- Uncomment/adapt when using Supabase Auth or a custom JWT claim for user id.
-- CREATE POLICY "users_read_own_bookings" ON public."Booking"
-- FOR SELECT USING (auth.uid()::text = "userId");

-- Admin/service role operations should go through server APIs or service_role key.
