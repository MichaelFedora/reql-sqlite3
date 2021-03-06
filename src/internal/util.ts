import { Query, Datum, Value, SchemaEntry, DeepPartial } from '../types';

export function createQuery<T = any>(run: () => Promise<T>): Query<T> {
  return { run };
}

export async function resolveHValue<T = any>(value: Value<T>): Promise<T> {
  if(typeof value['run'] === 'function')
    return await (value as any).run();
  return value as any;
}

function _dptpRecurse<T = any>(doc: Datum<T>, obj: any): Datum<boolean> {
  let statement: Datum<boolean>;
  for(const k in obj) if(obj[k] != null) {
    if(typeof obj[k] === 'object')
      statement = statement ? statement.and(_dptpRecurse(doc(k), obj[k])) : _dptpRecurse(doc(k), obj[k]);
    else
      statement = statement ? statement.and(doc(k).eq(obj[k])) : doc(k).eq(obj[k]);
  }
  return statement;
}

export function deepPartialToPredicate<T = any>(obj: DeepPartial<T>): (doc: Datum<T>) => Datum<boolean> {
  return (doc: Datum<T>) => _dptpRecurse(doc, obj);
}

export function safen(value: any) {
  switch(typeof(value)) {
    case 'number':
        return value;
    case 'string':
    case 'object':
    default:
      let str = JSON.stringify(value).replace(/'/g, `''`).replace(/\\"/g, '"').replace(/^"|"$/g, `'`);
      if(str[0] !== `'`) str = `'` + str;
      if(str[str.length - 1] !== `'`) str += `'`;
      return str;
  }
}

export function coerceCorrectReturn<T = any>(obj: any, types: SchemaEntry[]): T {
  const boop: any = { }; // make boop[key] null or skip?
  for(const key in obj) if(obj[key] == null) { boop[key] = null; } else {
    const entry = types.find(a => a.name === key);
    switch(entry && entry.type) {
      case 'string':
        boop[key] = obj[key];
        break;
      case 'number':
        boop[key] = Number(obj[key]);
        break;
      case 'bool':
        boop[key] = Boolean(obj[key]);
        break;
      case 'object':
        boop[key] = JSON.parse(obj[key]);
        break;
      case 'any':
        try {
          boop[key] = JSON.parse(obj[key]);
        } catch(e) {
          boop[key] = obj[key];
        }
        break;
      default:
        throw new Error('Unknown type for key "' + key + '"!');
    }
  }
  return boop;
}
