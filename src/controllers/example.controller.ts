import {Response, Request} from 'express'
import {JsonResponse} from "../enums/json-response";

export class ExampleController {

    public async example(req: Request, res: Response) {
        return res.status(200).json({
            ok: true,
            message: '¡Hola mundo! Soy un ejemplo :)'
        })
    }

    public async users(req: Request, res: Response) {
        return res.status(JsonResponse.OK).json({
            ok: true,
            users: [
                {'name': 'Xavier', 'password': 'Xavier123--'},
                {'name': 'Peter', 'password': 'Peter123--'},
                {'name': 'María', 'password': 'Maria123--'},
                {'name': 'Jhon', 'password': 'Jhon123--'},
                {'name': 'Adele', 'password': 'Adele123--'},
            ]
        })
    }
}

