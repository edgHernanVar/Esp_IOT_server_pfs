"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 4000;
const api_1 = __importDefault(require("./routes/api"));
app.use('/api', api_1.default);
app.listen(PORT, () => {
    console.log(`Listening on ${PORT}`);
});
