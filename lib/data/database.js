"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sqlite3_wrapper_1 = require("../internal/sqlite3-wrapper");
const util_1 = require("../internal/util");
const static_datum_1 = require("./static-datum");
const table_1 = require("./table");
class SQLite3ReQLDatabase {
    constructor() {
        this.typemapsType = Object.freeze([
            { name: 'table', type: 'string' },
            { name: 'types', type: 'string' },
        ]);
        this.typemapsTableName = '__reql_typemap__';
        this.valueTypeMap = {
            string: 'text',
            bool: 'numeric',
            number: 'numeric',
            object: 'text',
        };
    }
    async init(options) {
        options = Object.assign({ logger: 'sqlite3' }, options);
        this.db = await sqlite3_wrapper_1.create(Object.assign(options, { logger: options.logger + '.raw' }));
        const tableList = await this.tableList().run();
        if (!tableList.find(a => a === this.typemapsTableName)) {
            await this.tableCreate(this.typemapsTableName, this.typemapsType).run();
        }
    }
    get typemaps() {
        return this.table(this.typemapsTableName);
    }
    tableCreate(tableName, schema) {
        const indexes = [];
        let keys = '';
        for (const key of schema) {
            if (!keys) { // primary key
                keys = `[${key.name}] ${this.valueTypeMap[key.type] || 'text'} primary key`;
            }
            else {
                keys += `, [${key.name}] ${this.valueTypeMap[key.type] || 'text'}`;
            }
            if (key.index)
                indexes.push(key.name);
        }
        if (keys.length === 0)
            throw new Error('Must have a schema of at least one entry!');
        return static_datum_1.createStaticDatum(util_1.createQuery(async () => {
            if (typeof tableName !== 'string')
                tableName = await tableName.run();
            await this.db.exec(`CREATE TABLE IF NOT EXISTS [${tableName}] (${keys})`);
            await this.typemaps.insert({ table: tableName, types: JSON.stringify(schema) }, { conflict: 'replace' }).run();
            for (const index of indexes)
                await this.db.exec(`CREATE INDEX [${tableName}_${index}] ON [${tableName}]([${index}])`);
            return { tables_created: 1 };
        }));
    }
    tableDrop(tableName) {
        return static_datum_1.createStaticDatum(util_1.createQuery(async () => {
            if (typeof tableName !== 'string')
                tableName = await tableName.run();
            await this.db.exec(`DROP TABLE IF EXISTS [${tableName}]`);
            return { tables_dropped: 1 };
        }));
    }
    tableList() {
        return static_datum_1.createStaticDatum(util_1.createQuery(async () => {
            const result = await this.db.all(`SELECT name FROM sqlite_master WHERE type='table'`);
            return result.map(a => a.name);
        }));
    }
    table(tableName) {
        return new table_1.SQLite3Table(this.db, tableName, util_1.createQuery(async () => tableName !== this.typemapsTableName
            ? await this.typemaps.get(tableName)('types').run().then(a => JSON.parse(a))
            : this.typemapsType));
    }
}
exports.SQLite3ReQLDatabase = SQLite3ReQLDatabase;
async function create(options) {
    const db = new SQLite3ReQLDatabase();
    await db.init(options);
    return db;
}
exports.create = create;
exports.default = create;
//# sourceMappingURL=database.js.map