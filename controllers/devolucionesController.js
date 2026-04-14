const { getConnection } = require('../config/db');
const oracledb = require('oracledb');

const listarDevoluciones = async (req, res) => {
  let conn = await getConnection();

  const result = await conn.execute(
    `SELECT * FROM devolucion`,
    [],
    { outFormat: oracledb.OUT_FORMAT_OBJECT }
  );

  await conn.close();

  res.render('devoluciones', {
      layout: 'layout',
      title: '🔄 Devoluciones',
      devoluciones: result.rows
    });
};

const insertarDevolucion = async (req, res) => {
  let conn = await getConnection();

  const { detalle, obs } = req.body;

  await conn.execute(
    `BEGIN sp_insert_devolucion(:d,:o); END;`,
    { d: detalle, o: obs }
  );

  await conn.close();
  res.redirect('/devoluciones');
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