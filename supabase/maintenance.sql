-- ==========================================================================
-- نگهداری دوره‌ای: پاک‌سازی رکوردهای tombstone (حذف نرم) — v3
-- اپ بازی‌ها را واقعاً DELETE نمی‌کند؛ رکوردی با data.deleted=true می‌گذارد.
-- این تابع آن‌ها را پس از گذشت مهلت (پیش‌فرض ۳۰ روز) پاک می‌کند.
-- ==========================================================================

create or replace function public.cleanup_tombstones(older_ms bigint default 2592000000)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer;
begin
  delete from public.games
  where coalesce((data->>'deleted')::boolean, false) = true
    and coalesce((data->>'deletedAt')::bigint, 0)
        < (floor(extract(epoch from now()) * 1000) - older_ms);
  get diagnostics n = row_count;
  return n;
end;
$$;

-- اجرای دستی (هر از گاهی در SQL Editor):
--   select public.cleanup_tombstones();

-- زمان‌بندی خودکار هفتگی (فقط اگر افزونه‌ی pg_cron در پروژه‌ی شما فعال است):
--   select cron.schedule('cleanup-tombstones', '0 4 * * 0', 'select public.cleanup_tombstones();');
