"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = buildApi;
const express_1 = __importDefault(require("express"));
const ingests_1 = __importDefault(require("./ingests"));
const apiRouter = express_1.default.Router();
function buildApi(pool) {
    apiRouter.use('/ingests', (0, ingests_1.default)(pool));
    return apiRouter;
}
apiRouter.get('/', (request, res) => {
    res.status(200).send('OK');
});
