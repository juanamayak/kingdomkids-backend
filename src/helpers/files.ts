import fs from 'fs'
import moment from 'moment'

export class File {
    public async upload(data: any, lastFile: any, type: any) {

        let body: any;

        // @TODO Quitar


        body = JSON.parse(data.body.docData)


        /** Validamos y procesamos el archivo proporcionado */
        if (data.files == null) {
            return {
                ok: false,
                message: 'Favor de proporcionar un archivo a procesar'
            }
        } else if (!data.files.file) {
            return {
                ok: false,
                message: 'Si desea adjuntar un archivo pdf, es necesario proporcionar uno'
            }
        } else if (data.files.file == null) {
            return {
                ok: false,
                message: 'Favor de proporcionar un archivo a procesar'
            }
        }

        if (data.files.file.mimetype !== 'application/pdf') {
            return {
                ok: false,
                message: 'Favor de proporcionar un archivo con extensión ".pdf"'
            }
        }

        const size: number = data.files.file.size;
        const bytes: number = 1048576;
        const totalSize: number = (size / bytes)

        if (totalSize > 20.00) {
            return {
                ok: false,
                message: 'Favor de proporcionar un archivo menor o igual a 20 mb.'
            }
        }

        const file: any = data.files.file
        const nameFile: string = `${body.tradedid}_${body.req.toUpperCase()}_${moment().format('YYYY')}${moment().format('M')}${moment().format('D')}_${moment().format('HHmmss')}` // moment().unix()
        const path = (type === 'tipo_uno') ? process.env.FILE_PATH :
            (type === 'tipo_dos') ? process.env.FILE_PATH : null

        if (lastFile != null) {
            try {
                fs.unlinkSync(path + lastFile);
            } catch (e) {
                console.log('Error files linea 61 archivo files.ts a las: ' + moment().format('YYYY-MM-DD HH:mm:ss') + ', ' + e)
                return {
                    ok: false,
                    message: 'Existen problemas al momento de eliminar el archivo anterior'
                }
            }
        }

        try {
            if (!fs.existsSync(`${process.env.FILE_PATH}/${body.req}`)) {
                fs.mkdirSync(`${process.env.FILE_PATH}/${body.req}`);
            }
        } catch (e) {
            console.log('Error files archivo files.ts linea 74 a las: ' + moment().format('YYYY-MM-DD HH:mm:ss') + ', ' + e)
            return {
                ok: false,
                message: 'Existen problemas al momento de crear carpeta'
            }
        }

        return await File.moveFile(file, data, path, nameFile);
    }


    /**
     * Mover el archivo a la carpeta
     * @param file
     * @param data
     * @param path
     * @param nameFile
     */
    static moveFile(file: any, data: any, path: any, nameFile: any) {

        let body: any;

        // @TODO Quitar


        body = JSON.parse(data.body.docData)


        return new Promise(resolve => {
            file.mv(`${path}${body.req}/${nameFile}.pdf`, async (e: any) => {
                if (e) {
                    console.log('Error files a las: ' + moment().format('YYYY-MM-DD HH:mm:ss') + ', ' + e)
                    resolve({
                        ok: false,
                        message: 'Existen problemas al momento de salvar el archivo'
                    })
                }

                resolve({ok: true, nameFile: `${path}${body.req}/${nameFile}.pdf`});
            });
        });
    }

    /**
     * Descargar pdf
     * @param name
     * @param type
     */
    public async download(name: any) {

        const path = process.env.FILE_PATH;
        try {
            return {ok: true, qr: fs.readFileSync(path + '/' + name, {encoding: 'base64'})}
        } catch (e) {
            console.log(e)
            return {ok: false}
        }

    }

    public async converBase64ToJpg(data: any) {
        const base64Data = data.replace(/^data:image\/png;base64,/, "");
        const path = process.env.FILE_PATH;

        try{
            const image = moment().unix() + '.jpg';
            fs.writeFile(path + '/' + image, base64Data, {encoding: 'base64'},
                (err) => {
                    if (err) {
                        return {ok: false, message: 'Existen problemas al guardar el QR', err}
                    }
                });

            return {ok: true, image}
        } catch (e) {
            console.log(e);
            return {ok: false, message: 'Existen problemas al guardar el QR', e}
        }

    }

}
