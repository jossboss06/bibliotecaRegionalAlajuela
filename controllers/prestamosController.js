const { getConnection } = require('../config/db');
const oracledb = require('oracledb');

// Lista los prestamos existentes
const listarPrestamos = async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    
    // Cambiamos el SELECT * por uno con JOIN para traer los nombres
    const result = await conn.execute(
      `SELECT p.id_prestamo, 
          u.nombre AS usuario, 
          l.titulo AS libro, 
          dp.id_libro,  -- 👈 AQUÍ
          p.id_empleado, 
          p.fecha_prestamo, 
          p.fecha_limite, 
          p.estado 
        FROM prestamo p
        JOIN usuario u ON p.id_usuario = u.id_usuario
        LEFT JOIN detalle_prestamo dp ON p.id_prestamo = dp.id_prestamo
        LEFT JOIN libro l ON dp.id_libro = l.id_libro`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    res.render('prestamos', {
      layout: 'layout',
      title: '📦 Préstamos',
      prestamos: result.rows
    });
  } catch (err) {
    console.error("Error al listar:", err);
    res.status(500).send("Error en el servidor");
  } finally {
    if (conn) await conn.close();
  }
};

// Agrega un prestamo - LLAMADO CORREGIDO AL PROCEDIMIENTO REAL
const insertarPrestamo = async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    
    const { id_usuario, id_libro, id_empleado, fecha_limite } = req.body;

    await conn.execute(
      `BEGIN SP_INSERT_PRESTAMO(:usuario, :libro, :empleado, :fecha_limite); END;`,
      {
        usuario: Number(id_usuario),
        libro: Number(id_libro),
        empleado: Number(id_empleado),
        fecha_limite: new Date(fecha_limite)
      },
      { autoCommit: true }
    );

    res.redirect('/prestamos');

  } catch (err) {
    console.error("Error al insertar:", err);
    res.status(500).send("Error al insertar préstamo: " + err.message);

  } finally {
    if (conn) await conn.close();
  }
};

// Actualiza un prestamo
const actualizarPrestamo = async (req, res) => {
  let conn;
  try {
    conn = await getConnection();

    const { id_prestamo, fecha_limite, estado } = req.body;

    await conn.execute(
      `BEGIN SP_UPDATE_PRESTAMO(:id, :fecha, :estado); END;`,
      {
        id: Number(id_prestamo),
        fecha: new Date(fecha_limite),
        estado: estado
      },
      { autoCommit: true }
    );

    res.redirect('/prestamos');

  } catch (err) {
    console.error(err);
    res.send("Error al actualizar");
  } finally {
    if (conn) await conn.close();
  }
};

// Elimina un prestamo
const eliminarPrestamo = async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const { id_prestamo } = req.body; // Asegúrate que en el .ejs el input se llame 'id_prestamo'

    await conn.execute(
      `BEGIN sp_delete_prestamo(:id); END;`,
      { id: id_prestamo }, // Le pasamos el ID al procedimiento
      { autoCommit: true }
    );

    res.redirect('/prestamos');
  } catch (err) {
    console.error("Error al eliminar:", err);
    res.status(500).send("Error al eliminar: " + err.message);
  } finally {
    if (conn) await conn.close();
  }
};

module.exports = {
  listarPrestamos,
  insertarPrestamo,
  actualizarPrestamo,
  eliminarPrestamo
};