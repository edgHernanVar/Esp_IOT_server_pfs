import express, { Request, Response } from 'express';

const apiRouter = express.Router();


apiRouter.get('/', (request: Request, res: Response): void => {
    res.status(200).send('OK');
});

export default apiRouter;