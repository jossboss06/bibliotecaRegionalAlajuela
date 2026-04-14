const { getConnection } = require('../config/db');
const oracledb = require('oracledb');

// Lista los prestamos existentes
const listarPrestamos = async (req, res) => {
  let conn = await getConnection();

  const result = await conn.execute(
    `SELECT * FROM prestamo`,
    [],
    { outFormat: oracledb.OUT_FORMAT_OBJECT }
  );

  await conn.close();

  res.render('prestamos', {
      layout: 'layout',
      title: '📦 Préstamos',
      prestamos: result.rows
    });
};

//Agrega un prestamo
const insertarPrestamo = async (req, res) => {
  let conn = await getConnection();

  const { usuario, empleado, fecha_limite } = req.body;

  await conn.execute(
    `BEGIN sp_insert_prestamo(:u,:e,:f); END;`,
    { u: usuario, e: empleado, f: fecha_limite }
  );

  await conn.close();
  res.redirect('/prestamos');
};

//Actualiza un prestamo
const actualizarPrestamo = async (req, res) => {
  let conn = await getConnection();

  const { id_prestamo, estado } = req.body;

  await conn.execute(
    `BEGIN sp_update_prestamo(:id,:estado); END;`,
    { id: id_prestamo, estado }
  );

  await conn.close();
  res.redirect('/prestamos');
};

//Elimina un prestamo
const eliminarPrestamo = async (req, res) => {
  let conn = await getConnection();

  await conn.execute(
    `BEGIN sp_delete_prestamo(:id); END;`,
    { id: req.body.id_prestamo }
  );

  await conn.close();
  res.redirect('/prestamos');
};

module.exports = {
  listarPrestamos,
  insertarPrestamo,
  actualizarPrestamo,
  eliminarPrestamo
};