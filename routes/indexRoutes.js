const express = require('express');
const router = express.Router();

const { obtenerVistas } = require('../controllers/indexController');

//Ruta principal del index
router.get('/', obtenerVistas);

module.exports = router;