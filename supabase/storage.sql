-- ==========================================================================
-- راه‌اندازی Storage برای آواتارها — «پاتوق تخته‌نرد» (v3)
-- اجرا: داشبورد Supabase → SQL Editor → Run
-- نکته: اپ بدون این bucket هم کار می‌کند (خودکار به base64 برمی‌گردد)، ولی با
-- این bucket عکس‌ها دیگر حجم localStorage و جدول players را نمی‌گیرند.
-- ==========================================================================

-- ۱) ساخت bucket عمومی برای آواتارها
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- ۲) پالیسی‌ها: خواندن عمومی، نوشتن برای اعضا، حذف فقط ادمین
drop policy if exists avatars_public_read  on storage.objects;
drop policy if exists avatars_auth_insert  on storage.objects;
drop policy if exists avatars_auth_update  on storage.objects;
drop policy if exists avatars_admin_delete on storage.objects;

create policy avatars_public_read on storage.objects
  for select using (bucket_id = 'avatars');

create policy avatars_auth_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars');

create policy avatars_auth_update on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars') with check (bucket_id = 'avatars');

-- حذف فایل فقط برای ادمین (تابع is_admin از policies.sql)
-- اگر هنوز policies.sql نسخه‌ی ۲ را اجرا نکرده‌اید، ابتدا آن را اجرا کنید.
create policy avatars_admin_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and public.is_admin());
