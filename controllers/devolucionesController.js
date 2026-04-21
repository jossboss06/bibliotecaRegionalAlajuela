const { getConnection } = require('../config/db');
const oracledb = require('oracledb');

// Lista las devoluciones con información del libro
const listarDevoluciones = async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    
    // Unimos DEVOLUCION -> DETALLE_PRESTAMO -> LIBRO
    const result = await conn.execute(
      `SELECT dev.id_devolucion, 
              l.titulo AS detalle_libro, 
              dev.fecha_devolucion, 
              dev.observacion 
       FROM devolucion dev
       JOIN detalle_prestamo dp ON dev.id_detalle = dp.id_detalle
       JOIN libro l ON dp.id_libro = l.id_libro`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    res.render('devoluciones', {
      layout: 'layout',
      title: '🔄 Devoluciones',
      devoluciones: result.rows
    });
  } catch (err) {
    console.error("Error al listar devoluciones:", err);
    res.status(500).send("Error en el servidor");
  } finally {
    if (conn) await conn.close();
  }
};

const insertarDevolucion = async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    
    const { id_detalle, observacion } = req.body;

    // Llamamos al procedimiento (asegúrate que el nombre sea el que tienes en Oracle)
    await conn.execute(
      `BEGIN sp_insert_devolucion(:det, :obs); END;`,
      { 
        det: id_detalle, 
        obs: observacion 
      },
      { autoCommit: true }
    );

    res.redirect('/devoluciones');
  } catch (err) {
    console.error("Error al insertar devolución:", err);
    res.status(500).send("Error al insertar: " + err.message);
  } finally {
    if (conn) await conn.close();
  }
};

const actualizarDevolucion = async (req, res) => {
  let conn = await getConnection();

  const { id_devolucion, obs } = req.body;

  await conn.execute(
    `BEGIN sp_update_devolucion(:id,:obs); END;`,
    { id: id_devolucion, obs }
  );

  await conn.close();
  res.redirect('/devoluciones');
};

const eliminarDevolucion = async (req, res) => {
  let conn = await getConnection();

  await conn.execute(
    `BEGIN sp_delete_devolucion(:id); END;`,
    { id: req.body.id_devolucion }
  );

  await conn.close();
  res.redirect('/devoluciones');
};

module.exports = {
  listarDevoluciones,
  insertarDevolucion,
  actualizarDevolucion,
  eliminarDevolucion
};