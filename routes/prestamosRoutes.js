const express = require('express');
const router = express.Router();

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

module.exports = router;