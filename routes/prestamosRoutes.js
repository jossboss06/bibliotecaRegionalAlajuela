const express = require('express');
const router = express.Router();

const { getConnection } = require('../config/db');
const oracledb = require('oracledb');

const {
  listarPrestamos,
  insertarPrestamo,
  actualizarPrestamo,
  eliminarPrestamo
} = require('../controllers/prestamosController');

router.get('/', listarPrestamos);
router.post('/insertar', insertarPrestamo);
router.post('/actualizar', actualizarPrestamo);
router.post('/eliminar', eliminarPrestamo);
router.get('/editar/:id', async (req, res) => {
  let conn;

  try {
    conn = await getConnection();

    const result = await conn.execute(
      `SELECT 
        p.id_prestamo,
        p.id_usuario,
        p.id_empleado,
        p.fecha_limite,
        p.estado,
        dp.id_libro,
        dp.cantidad
      FROM prestamo p
      LEFT JOIN detalle_prestamo dp 
        ON p.id_prestamo = dp.id_prestamo
      WHERE p.id_prestamo = :id`,
      { id: Number(req.params.id) },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    console.log("RAW RESULT:", result.rows);

    if (result.rows.length === 0) {
      return res.send("Préstamo no encontrado");
    }

    // 👉 Cabecera del préstamo (1 sola vez)
    const prestamo = {
      ID_PRESTAMO: result.rows[0].ID_PRESTAMO,
      ID_USUARIO: result.rows[0].ID_USUARIO,
      ID_EMPLEADO: result.rows[0].ID_EMPLEADO,
      FECHA_LIMITE: result.rows[0].FECHA_LIMITE,
      ESTADO: result.rows[0].ESTADO
    };

    // 👉 Detalle (varios libros)
    const libros = result.rows
      .filter(r => r.ID_LIBRO !== null)
      .map(r => ({
        ID_LIBRO: r.ID_LIBRO,
        CANTIDAD: r.CANTIDAD
      }));

    res.render('prestamo_actualizar', {
      layout: 'layout',
      title: '✏️ Actualizar Préstamo',
      prestamo,
      libros
    });

  } catch (err) {
    console.error("ERROR:", err);
    res.status(500).send(err.message);
  } finally {
    if (conn) await conn.close();
  }
});

module.exports = router;