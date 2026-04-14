const express = require('express');
const router = express.Router();

const {
  listarUsuarios,
  insertarUsuario,
  actualizarUsuario,
  eliminarUsuario
} = require('../controllers/usuariosController');

// GET
router.get('/', listarUsuarios);

// CREATE
router.post('/insertar', insertarUsuario);

// UPDATE
router.post('/actualizar', actualizarUsuario);

// DELETE
router.post('/eliminar', eliminarUsuario);

module.exports = router;