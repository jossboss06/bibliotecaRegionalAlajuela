const { getConnection } = require('../config/db');
const oracledb = require('oracledb');

// LISTAR
const listarLibros = async (req, res) => {
  let conn = await getConnection();

  const result = await conn.execute(
    `SELECT * FROM libro`,
    [],
    { outFormat: oracledb.OUT_FORMAT_OBJECT }
  );

  await conn.close();

  res.render('libros', {
    layout: 'layout',
    title: '📖 Libros',
    libros: result.rows
  });
};

// INSERTAR
const insertarLibro = async (req, res) => {
  let conn = await getConnection();

  const { titulo, id_autor, id_categoria, anio, isbn, total } = req.body;

  await conn.execute(
    `BEGIN sp_insert_libro(:titulo,:id_autor,:id_categoria,:anio,:isbn,:total); END;`,
    { titulo, id_autor, id_categoria, anio, isbn, total }
  );

  await conn.close();
  res.redirect('/libros');
};

// ACTUALIZAR
const actualizarLibro = async (req, res) => {
  let conn = await getConnection();

  const { id_libro, titulo, stock } = req.body;

  await conn.execute(
    `BEGIN sp_update_libro(:id,:titulo,:stock); END;`,
    { id: id_libro, titulo, stock }
  );

  await conn.close();
  res.redirect('/libros');
};

// ELIMINAR
const eliminarLibro = async (req, res) => {
  let conn = await getConnection();

  await conn.execute(
    `BEGIN sp_delete_libro(:id); END;`,
    { id: req.body.id_libro }
  );

  await conn.close();
  res.redirect('/libros');
};

module.exports = {
  listarLibros,
  insertarLibro,
  actualizarLibro,
  eliminarLibro
};