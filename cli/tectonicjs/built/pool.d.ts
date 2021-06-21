import { DBUpdate } from './typings';
import TectonicDB, { SocketQuery, TectonicResponse } from './tectonic';
export default class TectonicPool {
    threads: number;
    port: number;
    address: string;
    sockets: TectonicDB[];
    count: number;
    constructor(threads?: number, port?: number, address?: string);
    newSocket(): TectonicDB;
    onDisconnect(queue: SocketQuery[]): void;
    bestSocket(): TectonicDB;
    info(): Promise<TectonicResponse>;
    ping(): Promise<TectonicResponse>;
    help(): Promise<TectonicResponse>;
    add(update: DBUpdate): Promise<TectonicResponse>;
    insert(update: DBUpdate, db: string): Promise<void>;
    getall(): Promise<any>;
    get(n: number): Promise<any>;
    clear(): Promise<TectonicResponse>;
    clearall(): Promise<TectonicResponse>;
    flush(): Promise<TectonicResponse>;
    flushall(): Promise<TectonicResponse>;
    create(dbname: string): Promise<TectonicResponse>;
    use(dbname: string): Promise<TectonicResponse>;
    exists(dbname: string): Promise<TectonicResponse>;
    exit(): Promise<void>;
}
