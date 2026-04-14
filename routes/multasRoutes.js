const express = require('express');
const router = express.Router();

const {
  listarMultas,
  insertarMulta,
  actualizarMulta,
  eliminarMulta
} = require('../controllers/multasController');

router.get('/', listarMultas);
router.post('/insertar', insertarMulta);
router.post('/actualizar', actualizarMulta);
router.post('/eliminar', eliminarMulta);

module.exports = router;