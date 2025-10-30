import express, {Application} from 'express';
import cors from 'cors';

const app: Application = express();

const PORT: string| number = process.env.PORT || 4000;

import apiRouter from './routes/api';
app.use('/api/v1', apiRouter);

app.listen(PORT, (): void => {
    console.log(`Listening on ${PORT}`);

});

