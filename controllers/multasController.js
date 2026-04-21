const { getConnection } = require('../config/db');
const oracledb = require('oracledb');

const listarMultas = async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    
    // Llamamos al procedimiento almacenado para obtener los datos
    const result = await conn.execute(
      `BEGIN sp_listar_multas(:cursor); END;`,
      {
        cursor: { type: oracledb.CURSOR, dir: oracledb.BIND_OUT }
      },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const resultSet = result.outBinds.cursor;
    const rows = await resultSet.getRows(); // Obtenemos las filas del cursor
    await resultSet.close(); // Siempre cerrar el cursor

    res.render('multas', {
      layout: 'layout',
      title: '💰 Multas',
      multas: rows // Enviamos las filas a la vista
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Error al cargar multas desde el procedimiento");
  } finally {
    if (conn) await conn.close();
  }
};

const insertarMulta = async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    // Extraemos el nuevo campo detalle_texto
    const { id_detalle, monto, detalle_texto } = req.body;

    // Enviamos el texto directamente al procedimiento de la BD
    await conn.execute(
      `BEGIN sp_insertar_multa(:id, :mon, :det); END;`,
      { 
        id: id_detalle, 
        mon: monto, 
        det: detalle_texto 
      },
      { autoCommit: true }
    );

    res.redirect('/multas');
  } catch (err) {
    console.error(err);
    res.status(500).send("Error al insertar multa");
  } finally {
    if (conn) await conn.close();
  }
};

const actualizarMulta = async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const { id_multa, monto, pagada } = req.body;

    // Llamada pura al procedimiento de actualización
    await conn.execute(
      `BEGIN sp_update_multa(:id, :m, :p); END;`,
      { id: id_multa, m: monto, p: pagada },
      { autoCommit: true }
    );

    res.redirect('/multas');
  } catch (err) {
    res.status(500).send("Error al actualizar");
  } finally {
    if (conn) await conn.close();
  }
};

const eliminarMulta = async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const { id_multa } = req.body;

    // Llamada pura al procedimiento de borrado
    await conn.execute(
      `BEGIN sp_delete_multa(:id); END;`,
      { id: id_multa },
      { autoCommit: true }
    );

    res.redirect('/multas');
  } catch (err) {
    res.status(500).send("Error al eliminar");
  } finally {
    if (conn) await conn.close();
  }
};

module.exports = {
  listarMultas,
  insertarMulta,
  actualizarMulta,
  eliminarMulta
};