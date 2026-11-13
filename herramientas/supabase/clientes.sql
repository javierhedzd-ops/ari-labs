-- Ari Labs · datos de las páginas de clientes. Cada negocio tiene sus datos en JSON;
-- cualquiera puede leerlos, y solo se cambian con la clave del negocio (función guardar).
create extension if not exists pgcrypto with schema extensions;
create table if not exists public.negocios (
  id text primary key,
  nombre text not null,
  datos jsonb not null default '{}'::jsonb,
  activa boolean not null default false,
  clave_hash text not null,
  actualizado timestamptz not null default now()
);
create table if not exists public.historial (
  n bigserial primary key,
  negocio text not null references public.negocios(id),
  datos jsonb not null,
  cuando timestamptz not null default now()
);
create table if not exists public.administradores (correo text primary key, clave_hash text not null);
alter table public.negocios enable row level security;
alter table public.historial enable row level security;
alter table public.administradores enable row level security;
revoke all on public.negocios, public.historial, public.administradores from anon, authenticated;
-- lectura pública solo de lo que se muestra (nunca el hash)
create or replace view public.paginas with (security_invoker = false) as
  select id, nombre, datos, activa, actualizado from public.negocios;
grant select on public.paginas to anon, authenticated;

create or replace function public.entrar(p_negocio text, p_clave text) returns boolean
language sql security definer set search_path = public, extensions as $$
  select exists(select 1 from negocios where id = p_negocio and clave_hash = crypt(p_clave, clave_hash));
$$;

create or replace function public.guardar(p_negocio text, p_clave text, p_datos jsonb) returns timestamptz
language plpgsql security definer set search_path = public, extensions as $$
declare v negocios%rowtype;
begin
  select * into v from negocios where id = p_negocio;
  if not found or v.clave_hash <> crypt(p_clave, v.clave_hash) then raise exception 'clave incorrecta'; end if;
  if jsonb_typeof(p_datos) <> 'object' or length(p_datos::text) > 20000 then raise exception 'datos no válidos'; end if;
  insert into historial(negocio, datos) values (p_negocio, v.datos);
  update negocios set datos = p_datos, actualizado = now() where id = p_negocio;
  return now();
end $$;

create or replace function public.deshacer(p_negocio text, p_clave text) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare v negocios%rowtype; h historial%rowtype;
begin
  select * into v from negocios where id = p_negocio;
  if not found or v.clave_hash <> crypt(p_clave, v.clave_hash) then raise exception 'clave incorrecta'; end if;
  select * into h from historial where negocio = p_negocio order by n desc limit 1;
  if not found then raise exception 'no hay cambios para deshacer'; end if;
  update negocios set datos = h.datos, actualizado = now() where id = p_negocio;
  delete from historial where n = h.n;
  return h.datos;
end $$;

-- Javi activa la página cuando el cliente paga (clave de administrador de Ari Labs)
create or replace function public.activar(p_negocio text, p_correo text, p_clave text, p_activa boolean) returns boolean
language plpgsql security definer set search_path = public, extensions as $$
declare a administradores%rowtype;
begin
  select * into a from administradores where correo = lower(p_correo);
  if not found or a.clave_hash <> crypt(p_clave, a.clave_hash) then raise exception 'clave incorrecta'; end if;
  update negocios set activa = p_activa, actualizado = now() where id = p_negocio;
  return p_activa;
end $$;

revoke all on function public.entrar(text,text), public.guardar(text,text,jsonb), public.deshacer(text,text), public.activar(text,text,text,boolean) from public;
grant execute on function public.entrar(text,text), public.guardar(text,text,jsonb), public.deshacer(text,text), public.activar(text,text,text,boolean) to anon, authenticated;
