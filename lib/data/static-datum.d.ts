import { Datum, Value, DatumPartial } from '../types';
import { Selectable } from './selectable';
import { SQLite3DatumPartial } from './datum';
declare class SQLite3StaticDatumPartial<T = any> extends SQLite3DatumPartial<T> implements DatumPartial<T>, Selectable<T> {
    private initialValue;
    constructor(initialValue: Value<T>);
    _sel<U extends string | number>(attribute: Value<U>): U extends keyof T ? SQLite3StaticDatumPartial<T[U]> : SQLite3StaticDatumPartial<any>;
    run(): Promise<T>;
}
export declare function resolveQueryStatic<T = any>(query: {
    cmd: string;
    params?: readonly Value<any>[];
}[], initialValue: Value<T>): Promise<T>;
export interface SQLite3StaticDatum<T = any> extends SQLite3StaticDatumPartial<T>, Datum<T> {
}
export declare function createStaticDatum<T = any>(initialValue: Value<T> | Value<T>): SQLite3StaticDatum<T>;
export {};
