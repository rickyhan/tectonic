/// <reference types="node" />
import { DBUpdate } from './typings';
export interface TectonicResponse {
    success: boolean;
    data: string;
}
export declare type SocketMsgCb = (res: TectonicResponse) => void;
export interface SocketQuery {
    message: string;
    cb: SocketMsgCb;
    onError: (err: any) => void;
}
export default class TectonicDB {
    port: number;
    address: string;
    socket: any;
    initialized: boolean;
    dead: boolean;
    private onDisconnect;
    private socketSendQueue;
    private activeQuery?;
    private readerBuffer;
    constructor(port?: number, address?: string, onDisconnect?: (queue: SocketQuery[]) => void);
    init(): Promise<void>;
    info(): Promise<TectonicResponse>;
    ping(): Promise<TectonicResponse>;
    help(): Promise<TectonicResponse>;
    add(update: DBUpdate): Promise<TectonicResponse>;
    insert(update: DBUpdate, db: string): Promise<TectonicResponse>;
    getall(): Promise<any>;
    get(n: number): Promise<any>;
    clear(): Promise<TectonicResponse>;
    clearall(): Promise<TectonicResponse>;
    flush(): Promise<TectonicResponse>;
    flushall(): Promise<TectonicResponse>;
    create(dbname: string): Promise<TectonicResponse>;
    use(dbname: string): Promise<TectonicResponse>;
    exists(dbname: string): Promise<TectonicResponse>;
    handleSocketData(data: Buffer): void;
    sendSocketMsg(msg: string): void;
    cmd(message: string | string[]): Promise<TectonicResponse>;
    exit(): void;
    getQueueLen(): number;
    concatQueue(otherQueue: SocketQuery[]): void;
}
