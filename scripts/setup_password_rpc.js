import pg from 'pg';
const { Client } = pg;

async function setup() {
  const client = new Client({
    host: 'db.jztoibexainhqsalihvb.supabase.co',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: 'y5ds60roNPlTvzRT',
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✓ Conectado a Supabase PostgreSQL');

    // 1. Asegurar extensión pgcrypto
    await client.query('CREATE EXTENSION IF NOT EXISTS pgcrypto;');
    console.log('✓ Extensión pgcrypto verificada');

    // 2. Crear función RPC admin_set_user_password
    const createFnSql = `
CREATE OR REPLACE FUNCTION public.admin_set_user_password(target_user_id uuid, new_password text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_count int;
  v_email text;
BEGIN
  IF new_password IS NULL OR length(trim(new_password)) < 6 THEN
    RETURN json_build_object('success', false, 'message', 'La contraseña debe tener al menos 6 caracteres');
  END IF;

  -- 1. Actualizar contraseña cifrada con bcrypt en auth.users
  UPDATE auth.users
  SET encrypted_password = extensions.crypt(new_password, extensions.gen_salt('bf')),
      updated_at = NOW()
  WHERE id = target_user_id
  RETURNING email INTO v_email;

  GET DIAGNOSTICS v_count = ROW_COUNT;

  IF v_count = 0 THEN
    RETURN json_build_object('success', false, 'message', 'Usuario no encontrado en auth.users con ese ID');
  END IF;

  RETURN json_build_object(
    'success', true, 
    'message', 'Contraseña actualizada exitosamente en auth.users',
    'email', v_email
  );
END;
$$;
    `;
    await client.query(createFnSql);
    console.log('✓ Función admin_set_user_password creada exitosamente');

    // 3. Otorgar permisos de ejecución
    await client.query('GRANT EXECUTE ON FUNCTION public.admin_set_user_password(uuid, text) TO anon, authenticated, service_role;');
    console.log('✓ Permisos GRANT otorgados a anon, authenticated, service_role');

    // 4. Recargar caché de esquema de PostgREST
    await client.query("NOTIFY pgrst, 'reload schema';");
    console.log('✓ Notificación enviada a PostgREST para recargar esquema');

    // 5. Verificar que sl@gmail.com existe en auth.users
    const userCheck = await client.query('SELECT id, email, created_at FROM auth.users WHERE email = $1', ['sl@gmail.com']);
    console.log('✓ Usuario sl@gmail.com en auth.users:', userCheck.rows);

  } catch (err) {
    console.error('Error en setup:', err);
  } finally {
    await client.end();
  }
}

setup();
