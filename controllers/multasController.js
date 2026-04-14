const { getConnection } = require('../config/db');
const oracledb = require('oracledb');

const listarMultas = async (req, res) => {
  let conn = await getConnection();

  const result = await conn.execute(
    `SELECT * FROM multa`,
    [],
    { outFormat: oracledb.OUT_FORMAT_OBJECT }
  );

  await conn.close();

  res.render('multas', {
      layout: 'layout',
      title: '💰 Multas',
      multas: result.rows
    });
};

const insertarMulta = async (req, res) => {
  let conn = await getConnection();

  const { detalle, monto } = req.body;

  await conn.execute(
    `BEGIN sp_insert_multa(:d,:m); END;`,
    { d: detalle, m: monto }
  );

  await conn.close();
  res.redirect('/multas');
};

const actualizarMulta = async (req, res) => {
  let conn = await getConnection();

  const { id_multa, monto, pagada } = req.body;

  await conn.execute(
    `BEGIN sp_update_multa(:id,:monto,:pagada); END;`,
    { id: id_multa, monto, pagada }
  );

  await conn.close();
  res.redirect('/multas');
};

const eliminarMulta = async (req, res) => {
  let conn = await getConnection();

  await conn.execute(
    `BEGIN sp_delete_multa(:id); END;`,
    { id: req.body.id_multa }
  );

  await conn.close();
  res.redirect('/multas');
};

module.exports = {
  listarMultas,
  insertarMulta,
  actualizarMulta,
  eliminarMulta
};