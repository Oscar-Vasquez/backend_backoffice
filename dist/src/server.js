"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const firebase_config_1 = require("./config/firebase.config");
const PORT = process.env.PORT || 3001;
(0, firebase_config_1.initializeFirebase)();
app_1.default.listen(PORT, () => {
    console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
    console.log('🔥 Firebase inicializado');
});
//# sourceMappingURL=server.js.map