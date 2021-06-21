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
const tectonic_1 = require("./tectonic");
const THREADS = 20;
const PORT = 9001;
const HOST = '0.0.0.0';
class TectonicPool {
    constructor(threads = THREADS, port = PORT, address = HOST) {
        this.port = port;
        this.address = address;
        this.threads = threads;
        this.sockets = [];
        this.count = 0;
        for (let i = 0; i < this.threads; i++) {
            this.sockets.push(this.newSocket());
        }
    }
    newSocket() {
        return new tectonic_1.default(this.port, this.address, (e) => this.onDisconnect(e));
    }
    onDisconnect(queue) {
        this.sockets = this.sockets.map((socket) => socket.dead ? this.newSocket() : socket);
        this.bestSocket().concatQueue(queue);
    }
    bestSocket() {
        const lens = this.sockets.map((sock) => sock.getQueueLen());
        this.count++;
        if (this.count % 100) {
            console.log(lens.reduce((acc, i) => acc + i, 0));
        }
        const j = lens.indexOf(Math.min(...lens));
        return this.sockets[j];
    }
    info() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.bestSocket().info();
        });
    }
    ping() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.bestSocket().ping();
        });
    }
    help() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.bestSocket().help();
        });
    }
    add(update) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.bestSocket().add(update);
        });
    }
    insert(update, db) {
        return __awaiter(this, void 0, void 0, function* () {
            this.bestSocket().insert(update, db);
        });
    }
    getall() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.bestSocket().getall();
        });
    }
    get(n) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.bestSocket().get(n);
        });
    }
    clear() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.bestSocket().clear();
        });
    }
    clearall() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.bestSocket().clearall();
        });
    }
    flush() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.bestSocket().flush();
        });
    }
    flushall() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.bestSocket().flushall();
        });
    }
    create(dbname) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.bestSocket().create(dbname);
        });
    }
    use(dbname) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.bestSocket().use(dbname);
        });
    }
    exists(dbname) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.bestSocket().exists(dbname);
        });
    }
    exit() {
        return __awaiter(this, void 0, void 0, function* () {
            yield Promise.all(this.sockets.map((db) => db.exit()));
        });
    }
}
exports.default = TectonicPool;
//# sourceMappingURL=pool.js.map