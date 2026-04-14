const express = require('express');
const router = express.Router();

const {
  listarLibros,
  insertarLibro,
  actualizarLibro,
  eliminarLibro
} = require('../controllers/librosController');

router.get('/', listarLibros);
router.post('/insertar', insertarLibro);
router.post('/actualizar', actualizarLibro);
router.post('/eliminar', eliminarLibro);

module.exports = router;