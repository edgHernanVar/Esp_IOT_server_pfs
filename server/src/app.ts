import express, {Application} from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import pool, {initDb} from "./db/index";
import buildApi from "./routes/api";

const PORT: string| number = process.env.SERVER_PORT || 4000;

const app: Application = express();
app.use(express.json());

(async () => {
    await initDb();
})();

const apiRouter = buildApi(pool);

app.use('/api', apiRouter);


app.listen(PORT, (): void => {
    console.log(`Listening on ${PORT}`);

});

