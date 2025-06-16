/* Libraries to create the jwt */
import jwt from 'jsonwebtoken'
import fs from 'fs'
import Cryptr from 'cryptr'

export class Payload {

    public createToken(data: any) {
        try {
            let privateKey: any

            if (process.env.MODE !== 'dev') {
                privateKey = fs.readFileSync(process.env.PRIVATE_KEY || './src/keys/private.pem', 'utf8')
            } else {
                privateKey = fs.readFileSync('./src/keys/private.pem', 'utf8')
            }

            const cryptr = new Cryptr(process.env.CRYPTR_KEY || '')

            if (data.user_type === 'administrador') {
                const administradorId = cryptr.encrypt((data.administrator_id))
                const userType = cryptr.encrypt((data.user_type))

                const token = jwt.sign({
                    administradorId,
                    userType,
                }, privateKey, {algorithm: 'RS256', expiresIn: '9h'})

                return {ok: true, token}
            }

        } catch (e) {
            console.log(e)
            return {ok: false}
        }

    }
}
