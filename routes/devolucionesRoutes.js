const express = require('express');
const router = express.Router();

const {
  listarDevoluciones,
  insertarDevolucion,
  actualizarDevolucion,
  eliminarDevolucion
} = require('../controllers/devolucionesController');

router.get('/', listarDevoluciones);
router.post('/insertar', insertarDevolucion);
router.post('/actualizar', actualizarDevolucion);
router.post('/eliminar', eliminarDevolucion);

module.exports = router;