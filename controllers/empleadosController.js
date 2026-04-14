const { getConnection } = require('../config/db');
const oracledb = require('oracledb');

// LISTAR
const listarEmpleados = async (req, res) => {
  let conn = await getConnection();

  const result = await conn.execute(
    `SELECT * FROM empleado`,
    [],
    { outFormat: oracledb.OUT_FORMAT_OBJECT }
  );

  await conn.close();

  res.render('empleados', {
    layout: 'layout',
    title: '🧑‍💼 Empleados',
    empleados: result.rows
  });
};

// INSERTAR
const insertarEmpleado = async (req, res) => {
  let conn = await getConnection();

  const { nombre, apellido, usuario, contrasena } = req.body;

  await conn.execute(
    `BEGIN sp_insert_empleado(:nombre, :apellido, :usuario, :contrasena); END;`,
    { nombre, apellido, usuario, contrasena }
  );

  await conn.close();
  res.redirect('/empleados');
};

// ACTUALIZAR
const actualizarEmpleado = async (req, res) => {
  let conn = await getConnection();

  const { id_empleado, nombre, apellido, usuario } = req.body;

  await conn.execute(
    `BEGIN sp_update_empleado(:id, :nombre, :apellido, :usuario); END;`,
    { id: id_empleado, nombre, apellido, usuario }
  );

  await conn.close();
  res.redirect('/empleados');
};

// ELIMINAR
const eliminarEmpleado = async (req, res) => {
  let conn = await getConnection();

  await conn.execute(
    `BEGIN sp_delete_empleado(:id); END;`,
    { id: req.body.id_empleado }
  );

  await conn.close();
  res.redirect('/empleados');
};

module.exports = {
  listarEmpleados,
  insertarEmpleado,
  actualizarEmpleado,
  eliminarEmpleado
};