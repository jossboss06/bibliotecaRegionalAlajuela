const { getConnection } = require('../config/db');
const oracledb = require('oracledb');

// LISTAR
const listarUsuarios = async (req, res) => {
  let conn;

  try {
    conn = await getConnection();

    const result = await conn.execute(
      `SELECT * FROM usuario`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    res.render('usuarios', {
      layout: 'layout',
      title: '👤 Usuarios',
      usuarios: result.rows
    });

  } catch (error) {
    console.error(error);
    res.send(error.message);
  } finally {
    if (conn) await conn.close();
  }
};

// INSERTAR (SP)
const insertarUsuario = async (req, res) => {
  let conn;

  try {
    const { nombre, apellidos, correo, telefono } = req.body;

    conn = await getConnection();

    await conn.execute(
      `BEGIN sp_insert_usuario(:nombre, :apellidos, :correo, :telefono); END;`,
      { nombre, apellidos, correo, telefono }
    );

    res.redirect('/usuarios');

  } catch (error) {
    console.error(error);
    res.send(error.message);
  } finally {
    if (conn) await conn.close();
  }
};

// ACTUALIZAR (SP)
const actualizarUsuario = async (req, res) => {
  let conn;

  try {
    const { id_usuario, nombre, apellidos } = req.body;

    conn = await getConnection();

    await conn.execute(
      `BEGIN sp_update_usuario(:id, :nombre, :apellidos); END;`,
      { id: id_usuario, nombre, apellidos }
    );

    res.redirect('/usuarios');

  } catch (error) {
    console.error(error);
    res.send(error.message);
  } finally {
    if (conn) await conn.close();
  }
};

// ELIMINAR (SP)
const eliminarUsuario = async (req, res) => {
  let conn;

  try {
    const { id_usuario } = req.body;

    conn = await getConnection();

    await conn.execute(
      `BEGIN sp_delete_usuario(:id); END;`,
      { id: id_usuario }
    );

    res.redirect('/usuarios');

  } catch (error) {
    console.error(error);
    res.send(error.message);
  } finally {
    if (conn) await conn.close();
  }
};

module.exports = {
  listarUsuarios,
  insertarUsuario,
  actualizarUsuario,
  eliminarUsuario
};