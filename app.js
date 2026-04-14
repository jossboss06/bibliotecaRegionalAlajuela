const express = require('express');
const path = require('path');
require('dotenv').config();

const expressLayouts = require('express-ejs-layouts');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🔥 EJS CONFIG
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 🔥 LAYOUT (DEBE IR AQUÍ)
app.use(expressLayouts);
app.set('layout', 'layout');

// RUTAS (DESPUÉS DEL LAYOUT)
const indexRoutes = require('./routes/indexRoutes');
const usuariosRoutes = require('./routes/usuariosRoutes');
const empleadosRoutes = require('./routes/empleadosRoutes');
const librosRoutes = require('./routes/librosRoutes');
const prestamosRoutes = require('./routes/prestamosRoutes');
const devolucionesRoutes = require('./routes/devolucionesRoutes');
const multasRoutes = require('./routes/multasRoutes');

app.use('/', indexRoutes);
app.use('/usuarios', usuariosRoutes);
app.use('/empleados', empleadosRoutes);
app.use('/libros', librosRoutes);
app.use('/prestamos', prestamosRoutes);
app.use('/devoluciones', devolucionesRoutes);
app.use('/multas', multasRoutes);

// SERVIDOR
const PORT = process.env.PORT || 4500;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});