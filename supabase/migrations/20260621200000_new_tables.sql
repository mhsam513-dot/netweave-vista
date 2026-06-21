-- ============================================================
-- Helper: check if the current user has a given role
-- ============================================================
CREATE OR REPLACE FUNCTION public.current_user_has_role(role_name public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = role_name
  );
$$;

-- ============================================================
-- Routers table (admin only writes, all authenticated read)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.routers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  ip_address TEXT,
  model TEXT,
  api_port INTEGER DEFAULT 8728,
  username TEXT DEFAULT 'admin',
  password TEXT,
  location TEXT,
  is_online BOOLEAN DEFAULT false,
  client_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.routers ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.routers TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.routers TO authenticated;
GRANT ALL ON public.routers TO service_role;
-- Admins: full access; everyone else: read-only
CREATE POLICY "routers_read" ON public.routers FOR SELECT TO authenticated USING (true);
CREATE POLICY "routers_write" ON public.routers FOR INSERT TO authenticated
  WITH CHECK (public.current_user_has_role('admin'));
CREATE POLICY "routers_update" ON public.routers FOR UPDATE TO authenticated
  USING (public.current_user_has_role('admin'))
  WITH CHECK (public.current_user_has_role('admin'));
CREATE POLICY "routers_delete" ON public.routers FOR DELETE TO authenticated
  USING (public.current_user_has_role('admin'));

-- ============================================================
-- Complaints / support tickets (admin+recharge write, all read)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'inProgress', 'resolved', 'closed')),
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.complaints TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.complaints TO authenticated;
GRANT ALL ON public.complaints TO service_role;
CREATE POLICY "complaints_read" ON public.complaints FOR SELECT TO authenticated USING (true);
CREATE POLICY "complaints_insert" ON public.complaints FOR INSERT TO authenticated
  WITH CHECK (public.current_user_has_role('admin') OR public.current_user_has_role('recharge'));
CREATE POLICY "complaints_update" ON public.complaints FOR UPDATE TO authenticated
  USING (public.current_user_has_role('admin') OR public.current_user_has_role('recharge'))
  WITH CHECK (public.current_user_has_role('admin') OR public.current_user_has_role('recharge'));
CREATE POLICY "complaints_delete" ON public.complaints FOR DELETE TO authenticated
  USING (public.current_user_has_role('admin'));

-- ============================================================
-- Notifications (users see their own or global; admin inserts)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'error')),
  is_read BOOLEAN NOT NULL DEFAULT false,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.notifications TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
CREATE POLICY "notifications_read_own" ON public.notifications FOR SELECT TO authenticated
  USING (user_id IS NULL OR user_id = auth.uid());
CREATE POLICY "notifications_insert_admin" ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (public.current_user_has_role('admin'));
CREATE POLICY "notifications_update_own" ON public.notifications FOR UPDATE TO authenticated
  USING (user_id IS NULL OR user_id = auth.uid())
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());
CREATE POLICY "notifications_delete_admin" ON public.notifications FOR DELETE TO authenticated
  USING (public.current_user_has_role('admin'));

-- ============================================================
-- Invoices (admin full, recharge insert only, viewer read)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  invoice_number SERIAL,
  amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'paid', 'overdue')),
  due_date DATE,
  notes TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.invoices TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.invoices TO authenticated;
GRANT ALL ON public.invoices TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.invoices_invoice_number_seq TO authenticated;
CREATE POLICY "invoices_read" ON public.invoices FOR SELECT TO authenticated USING (true);
CREATE POLICY "invoices_insert" ON public.invoices FOR INSERT TO authenticated
  WITH CHECK (public.current_user_has_role('admin') OR public.current_user_has_role('recharge'));
CREATE POLICY "invoices_update" ON public.invoices FOR UPDATE TO authenticated
  USING (public.current_user_has_role('admin') OR public.current_user_has_role('recharge'))
  WITH CHECK (public.current_user_has_role('admin') OR public.current_user_has_role('recharge'));
CREATE POLICY "invoices_delete" ON public.invoices FOR DELETE TO authenticated
  USING (public.current_user_has_role('admin'));

-- ============================================================
-- Payments (admin full, recharge insert, viewer read)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  method TEXT NOT NULL DEFAULT 'cash' CHECK (method IN ('cash', 'bank', 'online')),
  reference TEXT,
  notes TEXT,
  received_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.payments TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
CREATE POLICY "payments_read" ON public.payments FOR SELECT TO authenticated USING (true);
CREATE POLICY "payments_insert" ON public.payments FOR INSERT TO authenticated
  WITH CHECK (public.current_user_has_role('admin') OR public.current_user_has_role('recharge'));
CREATE POLICY "payments_update" ON public.payments FOR UPDATE TO authenticated
  USING (public.current_user_has_role('admin'))
  WITH CHECK (public.current_user_has_role('admin'));
CREATE POLICY "payments_delete" ON public.payments FOR DELETE TO authenticated
  USING (public.current_user_has_role('admin'));

-- ============================================================
-- Hotspot Cards / Vouchers (admin+recharge write, viewer read)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.hotspot_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  profile TEXT,
  validity_days INTEGER NOT NULL DEFAULT 1,
  bandwidth_limit TEXT,
  status TEXT NOT NULL DEFAULT 'unused' CHECK (status IN ('unused', 'active', 'expired', 'revoked')),
  router_id UUID REFERENCES public.routers(id) ON DELETE SET NULL,
  used_by TEXT,
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.hotspot_cards ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.hotspot_cards TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.hotspot_cards TO authenticated;
GRANT ALL ON public.hotspot_cards TO service_role;
CREATE POLICY "hotspot_cards_read" ON public.hotspot_cards FOR SELECT TO authenticated USING (true);
CREATE POLICY "hotspot_cards_insert" ON public.hotspot_cards FOR INSERT TO authenticated
  WITH CHECK (public.current_user_has_role('admin') OR public.current_user_has_role('recharge'));
CREATE POLICY "hotspot_cards_update" ON public.hotspot_cards FOR UPDATE TO authenticated
  USING (public.current_user_has_role('admin') OR public.current_user_has_role('recharge'))
  WITH CHECK (public.current_user_has_role('admin') OR public.current_user_has_role('recharge'));
CREATE POLICY "hotspot_cards_delete" ON public.hotspot_cards FOR DELETE TO authenticated
  USING (public.current_user_has_role('admin'));

-- ============================================================
-- Settings (single-row per company; admin write, all read)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  company_name TEXT NOT NULL DEFAULT 'ME Internet',
  company_email TEXT,
  company_phone TEXT,
  currency TEXT NOT NULL DEFAULT 'USD',
  timezone TEXT NOT NULL DEFAULT 'Asia/Riyadh',
  invoice_prefix TEXT NOT NULL DEFAULT 'INV',
  invoice_due_days INTEGER NOT NULL DEFAULT 30,
  tax_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  default_network_profile TEXT,
  smtp_host TEXT,
  smtp_port INTEGER,
  smtp_user TEXT,
  logo_url TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.settings TO authenticated;
GRANT INSERT, UPDATE ON public.settings TO authenticated;
GRANT ALL ON public.settings TO service_role;
CREATE POLICY "settings_read" ON public.settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "settings_write" ON public.settings FOR INSERT TO authenticated
  WITH CHECK (public.current_user_has_role('admin'));
CREATE POLICY "settings_update" ON public.settings FOR UPDATE TO authenticated
  USING (public.current_user_has_role('admin'))
  WITH CHECK (public.current_user_has_role('admin'));

-- Seed default settings row
INSERT INTO public.settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Seed some sample notifications
INSERT INTO public.notifications (title, message, type, is_read) VALUES
  ('System started', 'ME Internet Manager is now running.', 'success', false),
  ('Welcome', 'Welcome to the ISP Management Platform. Set up your first router and packages.', 'info', false)
ON CONFLICT DO NOTHING;
