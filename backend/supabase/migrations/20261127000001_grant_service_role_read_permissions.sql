-- Allow service_role to read group-related data.

GRANT SELECT ON TABLE public.groups TO service_role;

GRANT SELECT ON TABLE public.group_members TO service_role;

GRANT SELECT ON TABLE public.profiles TO service_role;

GRANT SELECT ON TABLE public.transactions TO service_role;

GRANT SELECT ON TABLE public.member_bills TO service_role;