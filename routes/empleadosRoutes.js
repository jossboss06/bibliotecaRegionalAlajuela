const express = require('express');
const router = express.Router();

const {
  listarEmpleados,
  insertarEmpleado,
  actualizarEmpleado,
  eliminarEmpleado
} = require('../controllers/empleadosController');

router.get('/', listarEmpleados);
router.post('/insertar', insertarEmpleado);
router.post('/actualizar', actualizarEmpleado);
router.post('/eliminar', eliminarEmpleado);

module.exports = router;