"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cors_1 = require("cors");
const email_routes_1 = require("./routes/email.routes");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});
app.use('/api/v1/email', email_routes_1.default);
app.use((err, req, res, next) => {
    console.error('❌ Error en la aplicación:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
});
app.use((req, res) => {
    console.log('❌ Ruta no encontrada:', req.url);
    res.status(404).json({ error: 'Ruta no encontrada' });
});
exports.default = app;
//# sourceMappingURL=app.js.map