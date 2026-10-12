-- ==========================================================================
-- پالیسی‌های RLS — «پاتوق تخته‌نرد» (نسخه‌ی ۳، بر اساس ممیزی ۲۰۲۶-۱۰-۱۱)
-- اجرا: داشبورد Supabase → SQL Editor → Run
-- این فایل idempotent است: ابتدا همه‌ی پالیسی‌های قبلیِ چهار جدول را
-- (با هر اسمی که داشته باشند) پاک می‌کند و سپس مجموعه‌ی جدید را می‌سازد.
--
-- ⚠️ پیش‌نیاز مهم: نقش ادمین را برای خودتان تنظیم کنید:
--    Dashboard → Authentication → Users → کاربر شما → App Metadata:
--    { "role": "admin" }
-- ==========================================================================

-- --------------------------------------------------------------------------
-- ۰) تابع کمکی: آیا کاربر جاری ادمین است؟
-- --------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(
    (select (raw_app_meta_data ->> 'role') = 'admin'
     from auth.users where id = auth.uid()),
    false
  );
$$;

-- --------------------------------------------------------------------------
-- ۱) پاک‌سازی همه‌ی پالیسی‌های قبلی (با هر نامی) روی چهار جدول
-- --------------------------------------------------------------------------
do $$
declare p record;
begin
  for p in
    select schemaname, tablename, policyname from pg_policies
    where schemaname = 'public'
      and tablename in ('games', 'players', 'tournament_state', 'activity_log')
  loop
    execute format('drop policy if exists %I on %I.%I',
                   p.policyname, p.schemaname, p.tablename);
  end loop;
end $$;

-- --------------------------------------------------------------------------
-- ۲) games — خواندن عمومی (حالت مهمان) · نوشتن فقط رکوردهای خود کاربر
--    حذف: هیچ‌کس (اپ با الگوی tombstone حذف می‌کند)
-- --------------------------------------------------------------------------
alter table public.games enable row level security;

create policy games_select_all on public.games
  for select using (true);

create policy games_insert_own on public.games
  for insert to authenticated
  with check (auth.uid() = user_id);

create policy games_update_own on public.games
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- --------------------------------------------------------------------------
-- ۳) players — ⭐ اصلاحیه‌ی مهم: حذف فقط برای ادمین
-- --------------------------------------------------------------------------
alter table public.players enable row level security;

create policy players_select_all on public.players
  for select using (true);

create policy players_insert_auth on public.players
  for insert to authenticated
  with check (true);

create policy players_update_auth on public.players
  for update to authenticated
  using (true) with check (true);

create policy players_delete_admin on public.players
  for delete to authenticated
  using (public.is_admin());

-- --------------------------------------------------------------------------
-- ۴) tournament_state — خواندن عمومی؛ نوشتن برای اعضا
-- --------------------------------------------------------------------------
alter table public.tournament_state enable row level security;

create policy tournament_select_all on public.tournament_state
  for select using (true);

create policy tournament_write_auth on public.tournament_state
  for all to authenticated
  using (true) with check (true);

-- --------------------------------------------------------------------------
-- ۵) activity_log — خواندن فقط برای اعضا (نه عموم)؛ نوشتن برای اعضا
-- --------------------------------------------------------------------------
alter table public.activity_log enable row level security;

create policy activity_select_auth on public.activity_log
  for select to authenticated
  using (true);

create policy activity_insert_auth on public.activity_log
  for insert to authenticated
  with check (true);
