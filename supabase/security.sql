-- =====================================================================
-- پاتوق تخته‌نرد — امن‌سازی دیتابیس Supabase (RLS + تریگرها)
-- این فایل رو یک‌جا در Supabase → SQL Editor اجرا کن.
-- چند بار اجرا کردنش مشکلی ایجاد نمی‌کنه.
--
-- قبل از اجرا: از دیتابیس بکاپ بگیر (Database → Backups) یا از داخل
-- برنامه «پشتیبان‌گیری» بزن.
--
-- توجه: این اسکریپت همه‌ی policyهای قبلی چهار جدول زیر رو پاک می‌کنه
-- و policyهای جدید می‌سازه. (policyها با هم OR می‌شن؛ اگه یک policy
-- قدیمیِ باز بمونه، بقیه بی‌اثر می‌شن.)
-- =====================================================================

-- ---------- تابع کمکی: آیا کاربر فعلی ادمینه؟ ----------
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
$$;

-- ---------- پاک کردن policyهای قبلی ----------
do $$
declare r record;
begin
  for r in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('games', 'players', 'tournament_state', 'activity_log')
  loop
    execute format('drop policy if exists %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;
end $$;

-- =====================================================================
-- games
-- =====================================================================
alter table public.games add column if not exists user_id uuid;
alter table public.games alter column user_id set default auth.uid();
alter table public.games enable row level security;

-- مالک بازی رو سرور تعیین می‌کنه، نه کلاینت
create or replace function public.games_set_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if new.user_id is null or not public.is_admin() then
      new.user_id := auth.uid();
    end if;
  elsif tg_op = 'UPDATE' then
    if not public.is_admin() then
      new.user_id := old.user_id;
    end if;
  end if;
  return new;
end $$;

drop trigger if exists games_set_owner on public.games;
create trigger games_set_owner
  before insert or update on public.games
  for each row execute function public.games_set_owner();

create policy games_select on public.games
  for select to anon, authenticated using (true);

create policy games_insert on public.games
  for insert to authenticated
  with check (user_id = auth.uid() or public.is_admin());

create policy games_update on public.games
  for update to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

create policy games_delete on public.games
  for delete to authenticated using (public.is_admin());

-- =====================================================================
-- players
-- =====================================================================
alter table public.players enable row level security;

create policy players_select on public.players
  for select to anon, authenticated using (true);

create policy players_insert on public.players
  for insert to authenticated
  with check (char_length(name) between 1 and 40);

-- آپلود عکس توسط کاربرای عادی مجازه (upsert به insert + update نیاز داره)
create policy players_update on public.players
  for update to authenticated
  using (true)
  with check (char_length(name) between 1 and 40);

create policy players_delete on public.players
  for delete to authenticated using (public.is_admin());

-- محدودیت حجم عکس (حدود ۴۰۰ کیلوبایت، مثل کلاینت)
do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'players' and column_name = 'avatar') then
    alter table public.players drop constraint if exists players_avatar_size;
    alter table public.players add constraint players_avatar_size
      check (avatar is null or char_length(avatar) <= 400000) not valid;
  end if;
end $$;

-- =====================================================================
-- tournament_state  (فقط ادمین می‌نویسه)
-- =====================================================================
alter table public.tournament_state enable row level security;

create policy tournament_select on public.tournament_state
  for select to anon, authenticated using (true);

create policy tournament_insert on public.tournament_state
  for insert to authenticated with check (public.is_admin());

create policy tournament_update on public.tournament_state
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

create policy tournament_delete on public.tournament_state
  for delete to authenticated using (public.is_admin());

-- =====================================================================
-- activity_log
-- =====================================================================
alter table public.activity_log add column if not exists user_id uuid;
alter table public.activity_log enable row level security;

-- نام و شناسه‌ی کاربر رو سرور از توکن پر می‌کنه؛ کلاینت نمی‌تونه جعل کنه
create or replace function public.activity_log_set_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.user_id := auth.uid();
  new.user_name := coalesce(
    nullif(auth.jwt() -> 'user_metadata' ->> 'display_name', ''),
    split_part(coalesce(auth.jwt() ->> 'email', ''), '@', 1),
    new.user_name
  );
  return new;
end $$;

drop trigger if exists activity_log_set_user on public.activity_log;
create trigger activity_log_set_user
  before insert on public.activity_log
  for each row execute function public.activity_log_set_user();

create policy activity_insert on public.activity_log
  for insert to authenticated with check (auth.uid() is not null);

create policy activity_select on public.activity_log
  for select to authenticated using (public.is_admin());

-- =====================================================================
-- (اختیاری) اسم نمایشی ادمین‌ها رو در متادیتای حساب ذخیره کن.
-- بعد از این، دیگه به NAME_MAP داخل js/sync.js نیازی نیست.
-- =====================================================================
-- update auth.users set raw_user_meta_data = coalesce(raw_user_meta_data,'{}'::jsonb) || '{"display_name":"سعید جنائی"}'  where email = 'saeed@backgammon.local';
-- update auth.users set raw_user_meta_data = coalesce(raw_user_meta_data,'{}'::jsonb) || '{"display_name":"مجتبی دهقان"}' where email = 'mojtaba@backgammon.local';
-- update auth.users set raw_user_meta_data = coalesce(raw_user_meta_data,'{}'::jsonb) || '{"display_name":"حسین دهقان"}'  where email = 'hossein@backgammon.local';

-- (اختیاری) ادمین کردن یک حساب:
-- update auth.users set raw_app_meta_data = coalesce(raw_app_meta_data,'{}'::jsonb) || '{"role":"admin"}' where email = 'saeed@backgammon.local';

-- بازی‌های قدیمی که user_id ندارن فقط توسط ادمین قابل ویرایش‌اند.
-- اگه می‌خوای همه‌شون مال یک ادمین باشن:
-- update public.games set user_id = (select id from auth.users where email = 'saeed@backgammon.local') where user_id is null;
