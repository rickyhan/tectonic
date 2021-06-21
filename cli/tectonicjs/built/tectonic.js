"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const net = require('net');
const textEncoding = require('text-encoding');
const THREADS = 20;
const PORT = 9001;
const HOST = 'localhost';
const TextDecoder = textEncoding.TextDecoder;
class TectonicDB {
    // tslint:disable-next-line:no-empty
    constructor(port = PORT, address = HOST, onDisconnect = ((queue) => { })) {
        this.socket = new net.Socket();
        this.activeQuery = null;
        this.address = address || HOST;
        this.port = port || PORT;
        this.initialized = false;
        this.dead = false;
        this.onDisconnect = onDisconnect;
        this.init();
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            const client = this;
            client.socketSendQueue = [];
            client.readerBuffer = new Buffer([]);
            client.socket.connect(client.port, client.address, () => {
                // console.log(`Tectonic client connected to: ${client.address}:${client.port}`);
                this.initialized = true;
                // process any queued queries
                if (this.socketSendQueue.length > 0) {
                    // console.log('Sending queued message after DB connected...');
                    client.activeQuery = this.socketSendQueue.shift();
                    if (this.activeQuery != null)
                        client.sendSocketMsg(this.activeQuery.message);
                }
            });
            client.socket.on('close', () => {
                client.dead = true;
                client.onDisconnect(this.socketSendQueue);
            });
            client.socket.on('data', (data) => this.handleSocketData(data));
            client.socket.on('error', (err) => {
                if (client.activeQuery) {
                    client.activeQuery.onError(err);
                }
            });
        });
    }
    info() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.cmd('INFO');
        });
    }
    ping() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.cmd('PING');
        });
    }
    help() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.cmd('HELP');
        });
    }
    add(update) {
        return __awaiter(this, void 0, void 0, function* () {
            const { timestamp, seq, is_trade, is_bid, price, size } = update;
            return this.cmd(`ADD ${timestamp}, ${seq}, ${is_trade ? 't' : 'f'}, ${is_bid ? 't' : 'f'}, ${price}, ${size};`);
        });
    }
    insert(update, db) {
        return __awaiter(this, void 0, void 0, function* () {
            const { timestamp, seq, is_trade, is_bid, price, size } = update;
            return this.cmd(`ADD ${timestamp}, ${seq}, ${is_trade ? 't' : 'f'}, ${is_bid ? 't' : 'f'}, ${price}, ${size}; INTO ${db}`);
        });
    }
    getall() {
        return __awaiter(this, void 0, void 0, function* () {
            const { success, data } = yield this.cmd('GET ALL AS JSON');
            if (success) {
                return JSON.parse(data);
            }
            else {
                return null;
            }
        });
    }
    get(n) {
        return __awaiter(this, void 0, void 0, function* () {
            const { success, data } = yield this.cmd(`GET ${n} AS JSON`);
            if (success) {
                return JSON.parse(data);
            }
            else {
                return data;
            }
        });
    }
    clear() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.cmd('CLEAR');
        });
    }
    clearall() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.cmd('CLEAR ALL');
        });
    }
    flush() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.cmd('FLUSH');
        });
    }
    flushall() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.cmd('FLUSH ALL');
        });
    }
    create(dbname) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.cmd(`CREATE ${dbname}`);
        });
    }
    use(dbname) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.cmd(`USE ${dbname}`);
        });
    }
    exists(dbname) {
        return this.cmd(`EXISTS ${dbname}`);
    }
    handleSocketData(data) {
        const client = this;
        const totalLength = client.readerBuffer.length + data.length;
        client.readerBuffer = Buffer.concat([client.readerBuffer, data], totalLength);
        const success = client.readerBuffer.readUIntBE(0, 1, true);
        const len = (client.readerBuffer.readUInt32BE(1) << 8) + client.readerBuffer.readUInt32BE(5);
        // if incoming socket buffer does not contain all the payload, accumulate and read again
        if (client.readerBuffer.length - 9 < len) {
            return;
        }
        const text = client.readerBuffer.subarray(9);
        const dataBody = new TextDecoder("utf-8").decode(text);
        // console.log(success, len, dataBody);
        const response = {
            success: success === 1,
            data: dataBody,
        };
        const rest = client.readerBuffer.subarray(9 + len, client.readerBuffer.length);
        client.readerBuffer = new Buffer(rest);
        if (client.activeQuery) {
            // execute the stored callback with the result of the query, fulfilling the promise
            client.activeQuery.cb(response);
        }
        // if there's something left in the queue to process, do it next
        // otherwise set the current query to empty
        if (client.socketSendQueue.length === 0) {
            client.activeQuery = null;
        }
        else {
            // equivalent to `popFront()`
            client.activeQuery = this.socketSendQueue.shift();
            if (client.activeQuery)
                client.sendSocketMsg(client.activeQuery.message);
        }
    }
    sendSocketMsg(msg) {
        this.socket.write(msg + '\n');
    }
    cmd(message) {
        const client = this;
        let ret = null;
        if (Array.isArray(message)) {
            ret = new Promise((resolve, reject) => {
                for (const m of message) {
                    client.socketSendQueue.push({
                        message: m,
                        cb: m === 'DDAKLUB' ? resolve : () => { },
                        onError: reject,
                    });
                }
            });
        }
        else if (typeof message === 'string') {
            ret = new Promise((resolve, reject) => {
                const query = {
                    message,
                    cb: resolve,
                    onError: reject,
                };
                client.socketSendQueue.push(query);
            });
        }
        if (client.activeQuery == null && this.initialized) {
            client.activeQuery = this.socketSendQueue.shift();
            if (client.activeQuery != null)
                client.sendSocketMsg(client.activeQuery.message);
        }
        return ret;
    }
    exit() {
        this.socket.destroy();
    }
    getQueueLen() {
        return this.socketSendQueue.length;
    }
    concatQueue(otherQueue) {
        this.socketSendQueue = this.socketSendQueue
            .concat(otherQueue);
    }
}
exports.default = TectonicDB;
//# sourceMappingURL=tectonic.js.map