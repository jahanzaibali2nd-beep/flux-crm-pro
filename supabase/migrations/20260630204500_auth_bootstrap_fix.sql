-- Redefine new user handler to automatically assign 'admin' role to the first registered user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  role_count INT;
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (user_id, name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)), NEW.email)
  ON CONFLICT (user_id) DO NOTHING;

  -- Check if any user roles exist
  SELECT COUNT(*) INTO role_count FROM public.user_roles;
  
  -- If this is the first user, assign admin role
  IF role_count = 0 THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END; $$;

-- Add a function to check if bootstrapping (creating the first admin) is needed
CREATE OR REPLACE FUNCTION public.is_bootstrap_needed()
RETURNS BOOLEAN LANGUAGE SQL SECURITY DEFINER SET search_path = public AS $$
  SELECT NOT EXISTS (SELECT 1 FROM public.user_roles);
$$;

-- Grant execute access to anonymous and authenticated users
GRANT EXECUTE ON FUNCTION public.is_bootstrap_needed() TO anon, authenticated;
