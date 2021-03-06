"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("../internal/util");
const stream_1 = require("./stream");
const static_datum_1 = require("./static-datum");
class SQLite3Selection extends stream_1.SQLite3Stream {
    constructor(db, tableName, keys, index, types) {
        super(db, tableName);
        this.keys = keys;
        this.index = index;
        this.types = types;
    }
    async makeSelection() {
        const keys = await util_1.resolveHValue(this.keys);
        const index = await util_1.resolveHValue(this.index);
        let selection = '';
        for (const key of keys) {
            if (!selection) {
                selection = `[${index}]=${util_1.safen(key)}`;
            }
            else {
                selection += `OR [${index}]=${util_1.safen(key)}`;
            }
        }
        return selection;
    }
    count() {
        return static_datum_1.createStaticDatum(util_1.createQuery(async () => {
            const tableName = await util_1.resolveHValue(this.tableName);
            const selection = await this.makeSelection();
            if (this.query.length) {
                const { post, kill, limit } = await this.computeQuery();
                if (kill)
                    return 0;
                const poost = (post ? ' AND ' + post : '') + (limit ? ' LIMIT ' + limit : '');
                return this.db.get(`SELECT COUNT(*) FROM [${tableName}] WHERE ${selection}${poost}`).then(a => a['COUNT(*)']);
            }
            return this.db.get(`SELECT COUNT(*) FROM [${tableName}] WHERE ${selection}`).then(a => a['COUNT(*)']);
        }));
    }
    delete() {
        return static_datum_1.createStaticDatum(util_1.createQuery(async () => {
            const tableName = await util_1.resolveHValue(this.tableName);
            const selection = await this.makeSelection();
            if (this.query.length) {
                const { post, kill, limit } = await this.computeQuery();
                if (kill)
                    return { deleted: 0, skipped: 0, errors: 0, inserted: 0, replaced: 0, unchanged: 1 };
                const poost = (post ? ' AND ' + post : '') + (limit ? ' LIMIT ' + limit : '');
                return this.db.exec(`DELETE FROM [${tableName}] WHERE ${selection}${poost}`).then(() => ({ deleted: 1, skipped: 0, errors: 0, inserted: 0, replaced: 0, unchanged: 0 }), e => ({ deleted: 0, skipped: 1, errors: 1, first_error: String(e), inserted: 0, replaced: 0, unchanged: 1 }));
            }
            return this.db.exec(`DELETE FROM [${tableName}] WHERE ${selection}`).then(() => ({ deleted: 1, skipped: 0, errors: 0, inserted: 0, replaced: 0, unchanged: 0 }), e => ({ deleted: 0, skipped: 1, errors: 1, first_error: String(e), inserted: 0, replaced: 0, unchanged: 1 }));
        }));
    }
    async run() {
        const tableName = await util_1.resolveHValue(this.tableName);
        const selection = await this.makeSelection();
        if (this.query.length) {
            const { select, post, kill, limit } = await this.computeQuery();
            if (kill)
                return [];
            const poost = (post ? ' AND ' + post : '') + (limit ? ' LIMIT ' + limit : '');
            return this.db.all(`SELECT ${select} FROM [${tableName}] WHERE ${selection}${poost}`).then(async (rs) => {
                const types = await util_1.resolveHValue(this.types);
                let res = rs.map(r => util_1.coerceCorrectReturn(r, types));
                const maps = this.query.filter(a => a.cmd === 'map');
                for (const map of maps)
                    res = await Promise.all(res.map(r => util_1.resolveHValue(map.params[0](static_datum_1.createStaticDatum(r)))));
                this.query = [];
                return res;
            });
        }
        return this.db.all(`SELECT * FROM [${tableName}] WHERE ${selection}`).then(async (rs) => {
            const types = await util_1.resolveHValue(this.types);
            return rs.map(r => util_1.coerceCorrectReturn(r, types));
        });
    }
}
exports.SQLite3Selection = SQLite3Selection;
//# sourceMappingURL=selection.js.map