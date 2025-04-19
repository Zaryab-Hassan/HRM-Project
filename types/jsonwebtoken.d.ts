declare module 'jsonwebtoken' {
    export interface SignOptions {
        expiresIn?: string | number;
    }

    export function sign(
        payload: string | object | Buffer,
        secretOrPrivateKey: string | Buffer,
        options?: SignOptions
    ): string;

    export function verify(
        token: string,
        secretOrPublicKey: string | Buffer
    ): any;
}
