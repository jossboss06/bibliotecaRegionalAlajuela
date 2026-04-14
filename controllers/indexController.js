const { getConnection } = require('../config/db');
const oracledb = require('oracledb');

const obtenerVistas = async (req, res) => {
  let conn;

  try {
    conn = await getConnection();

    // Vista de prestamos por usuarios
    const usuarios = await conn.execute(
      `SELECT * FROM prestamos_por_usuario_vista`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    // Vista de prestamos libros
    const libros = await conn.execute(
      `SELECT * FROM prestamos_por_libro_vista`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    // Vista de prestamos libros no devueltos
    const prestamos = await conn.execute(
      `SELECT * FROM libros_no_devueltos_vista`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    // Vista de multas pendientes
    const multas = await conn.execute(
      `SELECT * FROM multas_pendientes_vista`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

  res.render('index', {
    title: '📚 Reportes',
    usuarios: usuarios.rows,
    libros: libros.rows,
    prestamos: prestamos.rows,
    multas: multas.rows
  });

  } catch (error) {
    console.error("ERROR COMPLETO:", error);
    res.send(error.message);
  } finally {
    if (conn) await conn.close();
  }
};

module.exports = { obtenerVistas };