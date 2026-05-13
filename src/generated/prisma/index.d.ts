
/**
 * Client
**/

import * as runtime from './runtime/client.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model User
 * 
 */
export type User = $Result.DefaultSelection<Prisma.$UserPayload>
/**
 * Model Post
 * 
 */
export type Post = $Result.DefaultSelection<Prisma.$PostPayload>
/**
 * Model PerformanceTest
 * 
 */
export type PerformanceTest = $Result.DefaultSelection<Prisma.$PerformanceTestPayload>
/**
 * Model Raca
 * 
 */
export type Raca = $Result.DefaultSelection<Prisma.$RacaPayload>
/**
 * Model Lote
 * 
 */
export type Lote = $Result.DefaultSelection<Prisma.$LotePayload>
/**
 * Model Fazenda
 * 
 */
export type Fazenda = $Result.DefaultSelection<Prisma.$FazendaPayload>
/**
 * Model Animal
 * 
 */
export type Animal = $Result.DefaultSelection<Prisma.$AnimalPayload>

/**
 * Enums
 */
export namespace $Enums {
  export const Sexo: {
  M: 'M',
  F: 'F'
};

export type Sexo = (typeof Sexo)[keyof typeof Sexo]


export const AnimalOrigem: {
  NASCIMENTO: 'NASCIMENTO',
  COMPRA: 'COMPRA',
  TRANSFERENCIA: 'TRANSFERENCIA'
};

export type AnimalOrigem = (typeof AnimalOrigem)[keyof typeof AnimalOrigem]


export const AnimalStatus: {
  ATIVO: 'ATIVO',
  VENDIDO: 'VENDIDO',
  MORTO: 'MORTO',
  TRANSFERIDO: 'TRANSFERIDO',
  DESCARTE: 'DESCARTE',
  ABATE: 'ABATE'
};

export type AnimalStatus = (typeof AnimalStatus)[keyof typeof AnimalStatus]

}

export type Sexo = $Enums.Sexo

export const Sexo: typeof $Enums.Sexo

export type AnimalOrigem = $Enums.AnimalOrigem

export const AnimalOrigem: typeof $Enums.AnimalOrigem

export type AnimalStatus = $Enums.AnimalStatus

export const AnimalStatus: typeof $Enums.AnimalStatus

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient({
 *   adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL })
 * })
 * // Fetch zero or more Users
 * const users = await prisma.user.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://pris.ly/d/client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  const U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient({
   *   adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL })
   * })
   * // Fetch zero or more Users
   * const users = await prisma.user.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://pris.ly/d/client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/orm/prisma-client/queries/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>

  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.user`: Exposes CRUD operations for the **User** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Users
    * const users = await prisma.user.findMany()
    * ```
    */
  get user(): Prisma.UserDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.post`: Exposes CRUD operations for the **Post** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Posts
    * const posts = await prisma.post.findMany()
    * ```
    */
  get post(): Prisma.PostDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.performanceTest`: Exposes CRUD operations for the **PerformanceTest** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more PerformanceTests
    * const performanceTests = await prisma.performanceTest.findMany()
    * ```
    */
  get performanceTest(): Prisma.PerformanceTestDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.raca`: Exposes CRUD operations for the **Raca** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Racas
    * const racas = await prisma.raca.findMany()
    * ```
    */
  get raca(): Prisma.RacaDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.lote`: Exposes CRUD operations for the **Lote** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Lotes
    * const lotes = await prisma.lote.findMany()
    * ```
    */
  get lote(): Prisma.LoteDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.fazenda`: Exposes CRUD operations for the **Fazenda** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Fazendas
    * const fazendas = await prisma.fazenda.findMany()
    * ```
    */
  get fazenda(): Prisma.FazendaDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.animal`: Exposes CRUD operations for the **Animal** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Animals
    * const animals = await prisma.animal.findMany()
    * ```
    */
  get animal(): Prisma.AnimalDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 7.7.0
   * Query Engine version: 75cbdc1eb7150937890ad5465d861175c6624711
   */
  export type PrismaVersion = {
    client: string
    engine: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import Bytes = runtime.Bytes
  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    User: 'User',
    Post: 'Post',
    PerformanceTest: 'PerformanceTest',
    Raca: 'Raca',
    Lote: 'Lote',
    Fazenda: 'Fazenda',
    Animal: 'Animal'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]



  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "user" | "post" | "performanceTest" | "raca" | "lote" | "fazenda" | "animal"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      User: {
        payload: Prisma.$UserPayload<ExtArgs>
        fields: Prisma.UserFieldRefs
        operations: {
          findUnique: {
            args: Prisma.UserFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.UserFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findFirst: {
            args: Prisma.UserFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.UserFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findMany: {
            args: Prisma.UserFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          create: {
            args: Prisma.UserCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          createMany: {
            args: Prisma.UserCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.UserCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          delete: {
            args: Prisma.UserDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          update: {
            args: Prisma.UserUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          deleteMany: {
            args: Prisma.UserDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.UserUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.UserUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          upsert: {
            args: Prisma.UserUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          aggregate: {
            args: Prisma.UserAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateUser>
          }
          groupBy: {
            args: Prisma.UserGroupByArgs<ExtArgs>
            result: $Utils.Optional<UserGroupByOutputType>[]
          }
          count: {
            args: Prisma.UserCountArgs<ExtArgs>
            result: $Utils.Optional<UserCountAggregateOutputType> | number
          }
        }
      }
      Post: {
        payload: Prisma.$PostPayload<ExtArgs>
        fields: Prisma.PostFieldRefs
        operations: {
          findUnique: {
            args: Prisma.PostFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PostPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.PostFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PostPayload>
          }
          findFirst: {
            args: Prisma.PostFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PostPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.PostFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PostPayload>
          }
          findMany: {
            args: Prisma.PostFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PostPayload>[]
          }
          create: {
            args: Prisma.PostCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PostPayload>
          }
          createMany: {
            args: Prisma.PostCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.PostCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PostPayload>[]
          }
          delete: {
            args: Prisma.PostDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PostPayload>
          }
          update: {
            args: Prisma.PostUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PostPayload>
          }
          deleteMany: {
            args: Prisma.PostDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.PostUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.PostUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PostPayload>[]
          }
          upsert: {
            args: Prisma.PostUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PostPayload>
          }
          aggregate: {
            args: Prisma.PostAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregatePost>
          }
          groupBy: {
            args: Prisma.PostGroupByArgs<ExtArgs>
            result: $Utils.Optional<PostGroupByOutputType>[]
          }
          count: {
            args: Prisma.PostCountArgs<ExtArgs>
            result: $Utils.Optional<PostCountAggregateOutputType> | number
          }
        }
      }
      PerformanceTest: {
        payload: Prisma.$PerformanceTestPayload<ExtArgs>
        fields: Prisma.PerformanceTestFieldRefs
        operations: {
          findUnique: {
            args: Prisma.PerformanceTestFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PerformanceTestPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.PerformanceTestFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PerformanceTestPayload>
          }
          findFirst: {
            args: Prisma.PerformanceTestFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PerformanceTestPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.PerformanceTestFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PerformanceTestPayload>
          }
          findMany: {
            args: Prisma.PerformanceTestFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PerformanceTestPayload>[]
          }
          create: {
            args: Prisma.PerformanceTestCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PerformanceTestPayload>
          }
          createMany: {
            args: Prisma.PerformanceTestCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.PerformanceTestCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PerformanceTestPayload>[]
          }
          delete: {
            args: Prisma.PerformanceTestDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PerformanceTestPayload>
          }
          update: {
            args: Prisma.PerformanceTestUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PerformanceTestPayload>
          }
          deleteMany: {
            args: Prisma.PerformanceTestDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.PerformanceTestUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.PerformanceTestUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PerformanceTestPayload>[]
          }
          upsert: {
            args: Prisma.PerformanceTestUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PerformanceTestPayload>
          }
          aggregate: {
            args: Prisma.PerformanceTestAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregatePerformanceTest>
          }
          groupBy: {
            args: Prisma.PerformanceTestGroupByArgs<ExtArgs>
            result: $Utils.Optional<PerformanceTestGroupByOutputType>[]
          }
          count: {
            args: Prisma.PerformanceTestCountArgs<ExtArgs>
            result: $Utils.Optional<PerformanceTestCountAggregateOutputType> | number
          }
        }
      }
      Raca: {
        payload: Prisma.$RacaPayload<ExtArgs>
        fields: Prisma.RacaFieldRefs
        operations: {
          findUnique: {
            args: Prisma.RacaFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RacaPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.RacaFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RacaPayload>
          }
          findFirst: {
            args: Prisma.RacaFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RacaPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.RacaFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RacaPayload>
          }
          findMany: {
            args: Prisma.RacaFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RacaPayload>[]
          }
          create: {
            args: Prisma.RacaCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RacaPayload>
          }
          createMany: {
            args: Prisma.RacaCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.RacaCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RacaPayload>[]
          }
          delete: {
            args: Prisma.RacaDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RacaPayload>
          }
          update: {
            args: Prisma.RacaUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RacaPayload>
          }
          deleteMany: {
            args: Prisma.RacaDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.RacaUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.RacaUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RacaPayload>[]
          }
          upsert: {
            args: Prisma.RacaUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RacaPayload>
          }
          aggregate: {
            args: Prisma.RacaAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateRaca>
          }
          groupBy: {
            args: Prisma.RacaGroupByArgs<ExtArgs>
            result: $Utils.Optional<RacaGroupByOutputType>[]
          }
          count: {
            args: Prisma.RacaCountArgs<ExtArgs>
            result: $Utils.Optional<RacaCountAggregateOutputType> | number
          }
        }
      }
      Lote: {
        payload: Prisma.$LotePayload<ExtArgs>
        fields: Prisma.LoteFieldRefs
        operations: {
          findUnique: {
            args: Prisma.LoteFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LotePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.LoteFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LotePayload>
          }
          findFirst: {
            args: Prisma.LoteFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LotePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.LoteFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LotePayload>
          }
          findMany: {
            args: Prisma.LoteFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LotePayload>[]
          }
          create: {
            args: Prisma.LoteCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LotePayload>
          }
          createMany: {
            args: Prisma.LoteCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.LoteCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LotePayload>[]
          }
          delete: {
            args: Prisma.LoteDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LotePayload>
          }
          update: {
            args: Prisma.LoteUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LotePayload>
          }
          deleteMany: {
            args: Prisma.LoteDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.LoteUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.LoteUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LotePayload>[]
          }
          upsert: {
            args: Prisma.LoteUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LotePayload>
          }
          aggregate: {
            args: Prisma.LoteAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateLote>
          }
          groupBy: {
            args: Prisma.LoteGroupByArgs<ExtArgs>
            result: $Utils.Optional<LoteGroupByOutputType>[]
          }
          count: {
            args: Prisma.LoteCountArgs<ExtArgs>
            result: $Utils.Optional<LoteCountAggregateOutputType> | number
          }
        }
      }
      Fazenda: {
        payload: Prisma.$FazendaPayload<ExtArgs>
        fields: Prisma.FazendaFieldRefs
        operations: {
          findUnique: {
            args: Prisma.FazendaFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FazendaPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.FazendaFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FazendaPayload>
          }
          findFirst: {
            args: Prisma.FazendaFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FazendaPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.FazendaFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FazendaPayload>
          }
          findMany: {
            args: Prisma.FazendaFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FazendaPayload>[]
          }
          create: {
            args: Prisma.FazendaCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FazendaPayload>
          }
          createMany: {
            args: Prisma.FazendaCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.FazendaCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FazendaPayload>[]
          }
          delete: {
            args: Prisma.FazendaDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FazendaPayload>
          }
          update: {
            args: Prisma.FazendaUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FazendaPayload>
          }
          deleteMany: {
            args: Prisma.FazendaDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.FazendaUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.FazendaUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FazendaPayload>[]
          }
          upsert: {
            args: Prisma.FazendaUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FazendaPayload>
          }
          aggregate: {
            args: Prisma.FazendaAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateFazenda>
          }
          groupBy: {
            args: Prisma.FazendaGroupByArgs<ExtArgs>
            result: $Utils.Optional<FazendaGroupByOutputType>[]
          }
          count: {
            args: Prisma.FazendaCountArgs<ExtArgs>
            result: $Utils.Optional<FazendaCountAggregateOutputType> | number
          }
        }
      }
      Animal: {
        payload: Prisma.$AnimalPayload<ExtArgs>
        fields: Prisma.AnimalFieldRefs
        operations: {
          findUnique: {
            args: Prisma.AnimalFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AnimalPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.AnimalFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AnimalPayload>
          }
          findFirst: {
            args: Prisma.AnimalFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AnimalPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.AnimalFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AnimalPayload>
          }
          findMany: {
            args: Prisma.AnimalFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AnimalPayload>[]
          }
          create: {
            args: Prisma.AnimalCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AnimalPayload>
          }
          createMany: {
            args: Prisma.AnimalCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.AnimalCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AnimalPayload>[]
          }
          delete: {
            args: Prisma.AnimalDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AnimalPayload>
          }
          update: {
            args: Prisma.AnimalUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AnimalPayload>
          }
          deleteMany: {
            args: Prisma.AnimalDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.AnimalUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.AnimalUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AnimalPayload>[]
          }
          upsert: {
            args: Prisma.AnimalUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AnimalPayload>
          }
          aggregate: {
            args: Prisma.AnimalAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateAnimal>
          }
          groupBy: {
            args: Prisma.AnimalGroupByArgs<ExtArgs>
            result: $Utils.Optional<AnimalGroupByOutputType>[]
          }
          count: {
            args: Prisma.AnimalCountArgs<ExtArgs>
            result: $Utils.Optional<AnimalCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Shorthand for `emit: 'stdout'`
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events only
     * log: [
     *   { emit: 'event', level: 'query' },
     *   { emit: 'event', level: 'info' },
     *   { emit: 'event', level: 'warn' }
     *   { emit: 'event', level: 'error' }
     * ]
     * 
     * / Emit as events and log to stdout
     * og: [
     *  { emit: 'stdout', level: 'query' },
     *  { emit: 'stdout', level: 'info' },
     *  { emit: 'stdout', level: 'warn' }
     *  { emit: 'stdout', level: 'error' }
     * 
     * ```
     * Read more in our [docs](https://pris.ly/d/logging).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Instance of a Driver Adapter, e.g., like one provided by `@prisma/adapter-planetscale`
     */
    adapter?: runtime.SqlDriverAdapterFactory
    /**
     * Prisma Accelerate URL allowing the client to connect through Accelerate instead of a direct database.
     */
    accelerateUrl?: string
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
    /**
     * SQL commenter plugins that add metadata to SQL queries as comments.
     * Comments follow the sqlcommenter format: https://google.github.io/sqlcommenter/
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   adapter,
     *   comments: [
     *     traceContext(),
     *     queryInsights(),
     *   ],
     * })
     * ```
     */
    comments?: runtime.SqlCommenterPlugin[]
  }
  export type GlobalOmitConfig = {
    user?: UserOmit
    post?: PostOmit
    performanceTest?: PerformanceTestOmit
    raca?: RacaOmit
    lote?: LoteOmit
    fazenda?: FazendaOmit
    animal?: AnimalOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type CheckIsLogLevel<T> = T extends LogLevel ? T : never;

  export type GetLogType<T> = CheckIsLogLevel<
    T extends LogDefinition ? T['level'] : T
  >;

  export type GetEvents<T extends any[]> = T extends Array<LogLevel | LogDefinition>
    ? GetLogType<T[number]>
    : never;

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type UserCountOutputType
   */

  export type UserCountOutputType = {
    posts: number
  }

  export type UserCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    posts?: boolean | UserCountOutputTypeCountPostsArgs
  }

  // Custom InputTypes
  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserCountOutputType
     */
    select?: UserCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountPostsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PostWhereInput
  }


  /**
   * Count Type RacaCountOutputType
   */

  export type RacaCountOutputType = {
    animais: number
  }

  export type RacaCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    animais?: boolean | RacaCountOutputTypeCountAnimaisArgs
  }

  // Custom InputTypes
  /**
   * RacaCountOutputType without action
   */
  export type RacaCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RacaCountOutputType
     */
    select?: RacaCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * RacaCountOutputType without action
   */
  export type RacaCountOutputTypeCountAnimaisArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: AnimalWhereInput
  }


  /**
   * Count Type LoteCountOutputType
   */

  export type LoteCountOutputType = {
    animais: number
  }

  export type LoteCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    animais?: boolean | LoteCountOutputTypeCountAnimaisArgs
  }

  // Custom InputTypes
  /**
   * LoteCountOutputType without action
   */
  export type LoteCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LoteCountOutputType
     */
    select?: LoteCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * LoteCountOutputType without action
   */
  export type LoteCountOutputTypeCountAnimaisArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: AnimalWhereInput
  }


  /**
   * Count Type FazendaCountOutputType
   */

  export type FazendaCountOutputType = {
    animaisOrigem: number
  }

  export type FazendaCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    animaisOrigem?: boolean | FazendaCountOutputTypeCountAnimaisOrigemArgs
  }

  // Custom InputTypes
  /**
   * FazendaCountOutputType without action
   */
  export type FazendaCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FazendaCountOutputType
     */
    select?: FazendaCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * FazendaCountOutputType without action
   */
  export type FazendaCountOutputTypeCountAnimaisOrigemArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: AnimalWhereInput
  }


  /**
   * Count Type AnimalCountOutputType
   */

  export type AnimalCountOutputType = {
    filhosMae: number
    filhosPai: number
  }

  export type AnimalCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    filhosMae?: boolean | AnimalCountOutputTypeCountFilhosMaeArgs
    filhosPai?: boolean | AnimalCountOutputTypeCountFilhosPaiArgs
  }

  // Custom InputTypes
  /**
   * AnimalCountOutputType without action
   */
  export type AnimalCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AnimalCountOutputType
     */
    select?: AnimalCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * AnimalCountOutputType without action
   */
  export type AnimalCountOutputTypeCountFilhosMaeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: AnimalWhereInput
  }

  /**
   * AnimalCountOutputType without action
   */
  export type AnimalCountOutputTypeCountFilhosPaiArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: AnimalWhereInput
  }


  /**
   * Models
   */

  /**
   * Model User
   */

  export type AggregateUser = {
    _count: UserCountAggregateOutputType | null
    _avg: UserAvgAggregateOutputType | null
    _sum: UserSumAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  export type UserAvgAggregateOutputType = {
    id: number | null
  }

  export type UserSumAggregateOutputType = {
    id: number | null
  }

  export type UserMinAggregateOutputType = {
    id: number | null
    email: string | null
    name: string | null
  }

  export type UserMaxAggregateOutputType = {
    id: number | null
    email: string | null
    name: string | null
  }

  export type UserCountAggregateOutputType = {
    id: number
    email: number
    name: number
    _all: number
  }


  export type UserAvgAggregateInputType = {
    id?: true
  }

  export type UserSumAggregateInputType = {
    id?: true
  }

  export type UserMinAggregateInputType = {
    id?: true
    email?: true
    name?: true
  }

  export type UserMaxAggregateInputType = {
    id?: true
    email?: true
    name?: true
  }

  export type UserCountAggregateInputType = {
    id?: true
    email?: true
    name?: true
    _all?: true
  }

  export type UserAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which User to aggregate.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Users
    **/
    _count?: true | UserCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: UserAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: UserSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: UserMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: UserMaxAggregateInputType
  }

  export type GetUserAggregateType<T extends UserAggregateArgs> = {
        [P in keyof T & keyof AggregateUser]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateUser[P]>
      : GetScalarType<T[P], AggregateUser[P]>
  }




  export type UserGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: UserWhereInput
    orderBy?: UserOrderByWithAggregationInput | UserOrderByWithAggregationInput[]
    by: UserScalarFieldEnum[] | UserScalarFieldEnum
    having?: UserScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: UserCountAggregateInputType | true
    _avg?: UserAvgAggregateInputType
    _sum?: UserSumAggregateInputType
    _min?: UserMinAggregateInputType
    _max?: UserMaxAggregateInputType
  }

  export type UserGroupByOutputType = {
    id: number
    email: string
    name: string | null
    _count: UserCountAggregateOutputType | null
    _avg: UserAvgAggregateOutputType | null
    _sum: UserSumAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  type GetUserGroupByPayload<T extends UserGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<UserGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof UserGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], UserGroupByOutputType[P]>
            : GetScalarType<T[P], UserGroupByOutputType[P]>
        }
      >
    >


  export type UserSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    email?: boolean
    name?: boolean
    posts?: boolean | User$postsArgs<ExtArgs>
    _count?: boolean | UserCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["user"]>

  export type UserSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    email?: boolean
    name?: boolean
  }, ExtArgs["result"]["user"]>

  export type UserSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    email?: boolean
    name?: boolean
  }, ExtArgs["result"]["user"]>

  export type UserSelectScalar = {
    id?: boolean
    email?: boolean
    name?: boolean
  }

  export type UserOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "email" | "name", ExtArgs["result"]["user"]>
  export type UserInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    posts?: boolean | User$postsArgs<ExtArgs>
    _count?: boolean | UserCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type UserIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type UserIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $UserPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "User"
    objects: {
      posts: Prisma.$PostPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      email: string
      name: string | null
    }, ExtArgs["result"]["user"]>
    composites: {}
  }

  type UserGetPayload<S extends boolean | null | undefined | UserDefaultArgs> = $Result.GetResult<Prisma.$UserPayload, S>

  type UserCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<UserFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: UserCountAggregateInputType | true
    }

  export interface UserDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['User'], meta: { name: 'User' } }
    /**
     * Find zero or one User that matches the filter.
     * @param {UserFindUniqueArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends UserFindUniqueArgs>(args: SelectSubset<T, UserFindUniqueArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one User that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {UserFindUniqueOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends UserFindUniqueOrThrowArgs>(args: SelectSubset<T, UserFindUniqueOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first User that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends UserFindFirstArgs>(args?: SelectSubset<T, UserFindFirstArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first User that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends UserFindFirstOrThrowArgs>(args?: SelectSubset<T, UserFindFirstOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Users that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Users
     * const users = await prisma.user.findMany()
     * 
     * // Get first 10 Users
     * const users = await prisma.user.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const userWithIdOnly = await prisma.user.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends UserFindManyArgs>(args?: SelectSubset<T, UserFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a User.
     * @param {UserCreateArgs} args - Arguments to create a User.
     * @example
     * // Create one User
     * const User = await prisma.user.create({
     *   data: {
     *     // ... data to create a User
     *   }
     * })
     * 
     */
    create<T extends UserCreateArgs>(args: SelectSubset<T, UserCreateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Users.
     * @param {UserCreateManyArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends UserCreateManyArgs>(args?: SelectSubset<T, UserCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Users and returns the data saved in the database.
     * @param {UserCreateManyAndReturnArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Users and only return the `id`
     * const userWithIdOnly = await prisma.user.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends UserCreateManyAndReturnArgs>(args?: SelectSubset<T, UserCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a User.
     * @param {UserDeleteArgs} args - Arguments to delete one User.
     * @example
     * // Delete one User
     * const User = await prisma.user.delete({
     *   where: {
     *     // ... filter to delete one User
     *   }
     * })
     * 
     */
    delete<T extends UserDeleteArgs>(args: SelectSubset<T, UserDeleteArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one User.
     * @param {UserUpdateArgs} args - Arguments to update one User.
     * @example
     * // Update one User
     * const user = await prisma.user.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends UserUpdateArgs>(args: SelectSubset<T, UserUpdateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Users.
     * @param {UserDeleteManyArgs} args - Arguments to filter Users to delete.
     * @example
     * // Delete a few Users
     * const { count } = await prisma.user.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends UserDeleteManyArgs>(args?: SelectSubset<T, UserDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Users
     * const user = await prisma.user.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends UserUpdateManyArgs>(args: SelectSubset<T, UserUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Users and returns the data updated in the database.
     * @param {UserUpdateManyAndReturnArgs} args - Arguments to update many Users.
     * @example
     * // Update many Users
     * const user = await prisma.user.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Users and only return the `id`
     * const userWithIdOnly = await prisma.user.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends UserUpdateManyAndReturnArgs>(args: SelectSubset<T, UserUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one User.
     * @param {UserUpsertArgs} args - Arguments to update or create a User.
     * @example
     * // Update or create a User
     * const user = await prisma.user.upsert({
     *   create: {
     *     // ... data to create a User
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the User we want to update
     *   }
     * })
     */
    upsert<T extends UserUpsertArgs>(args: SelectSubset<T, UserUpsertArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserCountArgs} args - Arguments to filter Users to count.
     * @example
     * // Count the number of Users
     * const count = await prisma.user.count({
     *   where: {
     *     // ... the filter for the Users we want to count
     *   }
     * })
    **/
    count<T extends UserCountArgs>(
      args?: Subset<T, UserCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], UserCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends UserAggregateArgs>(args: Subset<T, UserAggregateArgs>): Prisma.PrismaPromise<GetUserAggregateType<T>>

    /**
     * Group by User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends UserGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: UserGroupByArgs['orderBy'] }
        : { orderBy?: UserGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, UserGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetUserGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the User model
   */
  readonly fields: UserFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for User.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__UserClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    posts<T extends User$postsArgs<ExtArgs> = {}>(args?: Subset<T, User$postsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the User model
   */
  interface UserFieldRefs {
    readonly id: FieldRef<"User", 'Int'>
    readonly email: FieldRef<"User", 'String'>
    readonly name: FieldRef<"User", 'String'>
  }
    

  // Custom InputTypes
  /**
   * User findUnique
   */
  export type UserFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findUniqueOrThrow
   */
  export type UserFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findFirst
   */
  export type UserFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findFirstOrThrow
   */
  export type UserFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findMany
   */
  export type UserFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which Users to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User create
   */
  export type UserCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The data needed to create a User.
     */
    data: XOR<UserCreateInput, UserUncheckedCreateInput>
  }

  /**
   * User createMany
   */
  export type UserCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Users.
     */
    data: UserCreateManyInput | UserCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * User createManyAndReturn
   */
  export type UserCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * The data used to create many Users.
     */
    data: UserCreateManyInput | UserCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * User update
   */
  export type UserUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The data needed to update a User.
     */
    data: XOR<UserUpdateInput, UserUncheckedUpdateInput>
    /**
     * Choose, which User to update.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User updateMany
   */
  export type UserUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Users.
     */
    data: XOR<UserUpdateManyMutationInput, UserUncheckedUpdateManyInput>
    /**
     * Filter which Users to update
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to update.
     */
    limit?: number
  }

  /**
   * User updateManyAndReturn
   */
  export type UserUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * The data used to update Users.
     */
    data: XOR<UserUpdateManyMutationInput, UserUncheckedUpdateManyInput>
    /**
     * Filter which Users to update
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to update.
     */
    limit?: number
  }

  /**
   * User upsert
   */
  export type UserUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The filter to search for the User to update in case it exists.
     */
    where: UserWhereUniqueInput
    /**
     * In case the User found by the `where` argument doesn't exist, create a new User with this data.
     */
    create: XOR<UserCreateInput, UserUncheckedCreateInput>
    /**
     * In case the User was found with the provided `where` argument, update it with this data.
     */
    update: XOR<UserUpdateInput, UserUncheckedUpdateInput>
  }

  /**
   * User delete
   */
  export type UserDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter which User to delete.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User deleteMany
   */
  export type UserDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Users to delete
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to delete.
     */
    limit?: number
  }

  /**
   * User.posts
   */
  export type User$postsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Post
     */
    select?: PostSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Post
     */
    omit?: PostOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PostInclude<ExtArgs> | null
    where?: PostWhereInput
    orderBy?: PostOrderByWithRelationInput | PostOrderByWithRelationInput[]
    cursor?: PostWhereUniqueInput
    take?: number
    skip?: number
    distinct?: PostScalarFieldEnum | PostScalarFieldEnum[]
  }

  /**
   * User without action
   */
  export type UserDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
  }


  /**
   * Model Post
   */

  export type AggregatePost = {
    _count: PostCountAggregateOutputType | null
    _avg: PostAvgAggregateOutputType | null
    _sum: PostSumAggregateOutputType | null
    _min: PostMinAggregateOutputType | null
    _max: PostMaxAggregateOutputType | null
  }

  export type PostAvgAggregateOutputType = {
    id: number | null
    authorId: number | null
  }

  export type PostSumAggregateOutputType = {
    id: number | null
    authorId: number | null
  }

  export type PostMinAggregateOutputType = {
    id: number | null
    title: string | null
    content: string | null
    published: boolean | null
    authorId: number | null
  }

  export type PostMaxAggregateOutputType = {
    id: number | null
    title: string | null
    content: string | null
    published: boolean | null
    authorId: number | null
  }

  export type PostCountAggregateOutputType = {
    id: number
    title: number
    content: number
    published: number
    authorId: number
    _all: number
  }


  export type PostAvgAggregateInputType = {
    id?: true
    authorId?: true
  }

  export type PostSumAggregateInputType = {
    id?: true
    authorId?: true
  }

  export type PostMinAggregateInputType = {
    id?: true
    title?: true
    content?: true
    published?: true
    authorId?: true
  }

  export type PostMaxAggregateInputType = {
    id?: true
    title?: true
    content?: true
    published?: true
    authorId?: true
  }

  export type PostCountAggregateInputType = {
    id?: true
    title?: true
    content?: true
    published?: true
    authorId?: true
    _all?: true
  }

  export type PostAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Post to aggregate.
     */
    where?: PostWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Posts to fetch.
     */
    orderBy?: PostOrderByWithRelationInput | PostOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: PostWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Posts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Posts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Posts
    **/
    _count?: true | PostCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: PostAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: PostSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: PostMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: PostMaxAggregateInputType
  }

  export type GetPostAggregateType<T extends PostAggregateArgs> = {
        [P in keyof T & keyof AggregatePost]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregatePost[P]>
      : GetScalarType<T[P], AggregatePost[P]>
  }




  export type PostGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PostWhereInput
    orderBy?: PostOrderByWithAggregationInput | PostOrderByWithAggregationInput[]
    by: PostScalarFieldEnum[] | PostScalarFieldEnum
    having?: PostScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: PostCountAggregateInputType | true
    _avg?: PostAvgAggregateInputType
    _sum?: PostSumAggregateInputType
    _min?: PostMinAggregateInputType
    _max?: PostMaxAggregateInputType
  }

  export type PostGroupByOutputType = {
    id: number
    title: string
    content: string | null
    published: boolean
    authorId: number
    _count: PostCountAggregateOutputType | null
    _avg: PostAvgAggregateOutputType | null
    _sum: PostSumAggregateOutputType | null
    _min: PostMinAggregateOutputType | null
    _max: PostMaxAggregateOutputType | null
  }

  type GetPostGroupByPayload<T extends PostGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<PostGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof PostGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], PostGroupByOutputType[P]>
            : GetScalarType<T[P], PostGroupByOutputType[P]>
        }
      >
    >


  export type PostSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    title?: boolean
    content?: boolean
    published?: boolean
    authorId?: boolean
    author?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["post"]>

  export type PostSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    title?: boolean
    content?: boolean
    published?: boolean
    authorId?: boolean
    author?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["post"]>

  export type PostSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    title?: boolean
    content?: boolean
    published?: boolean
    authorId?: boolean
    author?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["post"]>

  export type PostSelectScalar = {
    id?: boolean
    title?: boolean
    content?: boolean
    published?: boolean
    authorId?: boolean
  }

  export type PostOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "title" | "content" | "published" | "authorId", ExtArgs["result"]["post"]>
  export type PostInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    author?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type PostIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    author?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type PostIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    author?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $PostPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Post"
    objects: {
      author: Prisma.$UserPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      title: string
      content: string | null
      published: boolean
      authorId: number
    }, ExtArgs["result"]["post"]>
    composites: {}
  }

  type PostGetPayload<S extends boolean | null | undefined | PostDefaultArgs> = $Result.GetResult<Prisma.$PostPayload, S>

  type PostCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<PostFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: PostCountAggregateInputType | true
    }

  export interface PostDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Post'], meta: { name: 'Post' } }
    /**
     * Find zero or one Post that matches the filter.
     * @param {PostFindUniqueArgs} args - Arguments to find a Post
     * @example
     * // Get one Post
     * const post = await prisma.post.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends PostFindUniqueArgs>(args: SelectSubset<T, PostFindUniqueArgs<ExtArgs>>): Prisma__PostClient<$Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Post that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {PostFindUniqueOrThrowArgs} args - Arguments to find a Post
     * @example
     * // Get one Post
     * const post = await prisma.post.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends PostFindUniqueOrThrowArgs>(args: SelectSubset<T, PostFindUniqueOrThrowArgs<ExtArgs>>): Prisma__PostClient<$Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Post that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PostFindFirstArgs} args - Arguments to find a Post
     * @example
     * // Get one Post
     * const post = await prisma.post.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends PostFindFirstArgs>(args?: SelectSubset<T, PostFindFirstArgs<ExtArgs>>): Prisma__PostClient<$Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Post that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PostFindFirstOrThrowArgs} args - Arguments to find a Post
     * @example
     * // Get one Post
     * const post = await prisma.post.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends PostFindFirstOrThrowArgs>(args?: SelectSubset<T, PostFindFirstOrThrowArgs<ExtArgs>>): Prisma__PostClient<$Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Posts that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PostFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Posts
     * const posts = await prisma.post.findMany()
     * 
     * // Get first 10 Posts
     * const posts = await prisma.post.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const postWithIdOnly = await prisma.post.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends PostFindManyArgs>(args?: SelectSubset<T, PostFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Post.
     * @param {PostCreateArgs} args - Arguments to create a Post.
     * @example
     * // Create one Post
     * const Post = await prisma.post.create({
     *   data: {
     *     // ... data to create a Post
     *   }
     * })
     * 
     */
    create<T extends PostCreateArgs>(args: SelectSubset<T, PostCreateArgs<ExtArgs>>): Prisma__PostClient<$Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Posts.
     * @param {PostCreateManyArgs} args - Arguments to create many Posts.
     * @example
     * // Create many Posts
     * const post = await prisma.post.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends PostCreateManyArgs>(args?: SelectSubset<T, PostCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Posts and returns the data saved in the database.
     * @param {PostCreateManyAndReturnArgs} args - Arguments to create many Posts.
     * @example
     * // Create many Posts
     * const post = await prisma.post.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Posts and only return the `id`
     * const postWithIdOnly = await prisma.post.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends PostCreateManyAndReturnArgs>(args?: SelectSubset<T, PostCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Post.
     * @param {PostDeleteArgs} args - Arguments to delete one Post.
     * @example
     * // Delete one Post
     * const Post = await prisma.post.delete({
     *   where: {
     *     // ... filter to delete one Post
     *   }
     * })
     * 
     */
    delete<T extends PostDeleteArgs>(args: SelectSubset<T, PostDeleteArgs<ExtArgs>>): Prisma__PostClient<$Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Post.
     * @param {PostUpdateArgs} args - Arguments to update one Post.
     * @example
     * // Update one Post
     * const post = await prisma.post.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends PostUpdateArgs>(args: SelectSubset<T, PostUpdateArgs<ExtArgs>>): Prisma__PostClient<$Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Posts.
     * @param {PostDeleteManyArgs} args - Arguments to filter Posts to delete.
     * @example
     * // Delete a few Posts
     * const { count } = await prisma.post.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends PostDeleteManyArgs>(args?: SelectSubset<T, PostDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Posts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PostUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Posts
     * const post = await prisma.post.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends PostUpdateManyArgs>(args: SelectSubset<T, PostUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Posts and returns the data updated in the database.
     * @param {PostUpdateManyAndReturnArgs} args - Arguments to update many Posts.
     * @example
     * // Update many Posts
     * const post = await prisma.post.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Posts and only return the `id`
     * const postWithIdOnly = await prisma.post.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends PostUpdateManyAndReturnArgs>(args: SelectSubset<T, PostUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Post.
     * @param {PostUpsertArgs} args - Arguments to update or create a Post.
     * @example
     * // Update or create a Post
     * const post = await prisma.post.upsert({
     *   create: {
     *     // ... data to create a Post
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Post we want to update
     *   }
     * })
     */
    upsert<T extends PostUpsertArgs>(args: SelectSubset<T, PostUpsertArgs<ExtArgs>>): Prisma__PostClient<$Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Posts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PostCountArgs} args - Arguments to filter Posts to count.
     * @example
     * // Count the number of Posts
     * const count = await prisma.post.count({
     *   where: {
     *     // ... the filter for the Posts we want to count
     *   }
     * })
    **/
    count<T extends PostCountArgs>(
      args?: Subset<T, PostCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], PostCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Post.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PostAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends PostAggregateArgs>(args: Subset<T, PostAggregateArgs>): Prisma.PrismaPromise<GetPostAggregateType<T>>

    /**
     * Group by Post.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PostGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends PostGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: PostGroupByArgs['orderBy'] }
        : { orderBy?: PostGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, PostGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetPostGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Post model
   */
  readonly fields: PostFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Post.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__PostClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    author<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Post model
   */
  interface PostFieldRefs {
    readonly id: FieldRef<"Post", 'Int'>
    readonly title: FieldRef<"Post", 'String'>
    readonly content: FieldRef<"Post", 'String'>
    readonly published: FieldRef<"Post", 'Boolean'>
    readonly authorId: FieldRef<"Post", 'Int'>
  }
    

  // Custom InputTypes
  /**
   * Post findUnique
   */
  export type PostFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Post
     */
    select?: PostSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Post
     */
    omit?: PostOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PostInclude<ExtArgs> | null
    /**
     * Filter, which Post to fetch.
     */
    where: PostWhereUniqueInput
  }

  /**
   * Post findUniqueOrThrow
   */
  export type PostFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Post
     */
    select?: PostSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Post
     */
    omit?: PostOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PostInclude<ExtArgs> | null
    /**
     * Filter, which Post to fetch.
     */
    where: PostWhereUniqueInput
  }

  /**
   * Post findFirst
   */
  export type PostFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Post
     */
    select?: PostSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Post
     */
    omit?: PostOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PostInclude<ExtArgs> | null
    /**
     * Filter, which Post to fetch.
     */
    where?: PostWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Posts to fetch.
     */
    orderBy?: PostOrderByWithRelationInput | PostOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Posts.
     */
    cursor?: PostWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Posts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Posts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Posts.
     */
    distinct?: PostScalarFieldEnum | PostScalarFieldEnum[]
  }

  /**
   * Post findFirstOrThrow
   */
  export type PostFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Post
     */
    select?: PostSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Post
     */
    omit?: PostOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PostInclude<ExtArgs> | null
    /**
     * Filter, which Post to fetch.
     */
    where?: PostWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Posts to fetch.
     */
    orderBy?: PostOrderByWithRelationInput | PostOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Posts.
     */
    cursor?: PostWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Posts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Posts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Posts.
     */
    distinct?: PostScalarFieldEnum | PostScalarFieldEnum[]
  }

  /**
   * Post findMany
   */
  export type PostFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Post
     */
    select?: PostSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Post
     */
    omit?: PostOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PostInclude<ExtArgs> | null
    /**
     * Filter, which Posts to fetch.
     */
    where?: PostWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Posts to fetch.
     */
    orderBy?: PostOrderByWithRelationInput | PostOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Posts.
     */
    cursor?: PostWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Posts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Posts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Posts.
     */
    distinct?: PostScalarFieldEnum | PostScalarFieldEnum[]
  }

  /**
   * Post create
   */
  export type PostCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Post
     */
    select?: PostSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Post
     */
    omit?: PostOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PostInclude<ExtArgs> | null
    /**
     * The data needed to create a Post.
     */
    data: XOR<PostCreateInput, PostUncheckedCreateInput>
  }

  /**
   * Post createMany
   */
  export type PostCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Posts.
     */
    data: PostCreateManyInput | PostCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Post createManyAndReturn
   */
  export type PostCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Post
     */
    select?: PostSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Post
     */
    omit?: PostOmit<ExtArgs> | null
    /**
     * The data used to create many Posts.
     */
    data: PostCreateManyInput | PostCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PostIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Post update
   */
  export type PostUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Post
     */
    select?: PostSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Post
     */
    omit?: PostOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PostInclude<ExtArgs> | null
    /**
     * The data needed to update a Post.
     */
    data: XOR<PostUpdateInput, PostUncheckedUpdateInput>
    /**
     * Choose, which Post to update.
     */
    where: PostWhereUniqueInput
  }

  /**
   * Post updateMany
   */
  export type PostUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Posts.
     */
    data: XOR<PostUpdateManyMutationInput, PostUncheckedUpdateManyInput>
    /**
     * Filter which Posts to update
     */
    where?: PostWhereInput
    /**
     * Limit how many Posts to update.
     */
    limit?: number
  }

  /**
   * Post updateManyAndReturn
   */
  export type PostUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Post
     */
    select?: PostSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Post
     */
    omit?: PostOmit<ExtArgs> | null
    /**
     * The data used to update Posts.
     */
    data: XOR<PostUpdateManyMutationInput, PostUncheckedUpdateManyInput>
    /**
     * Filter which Posts to update
     */
    where?: PostWhereInput
    /**
     * Limit how many Posts to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PostIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Post upsert
   */
  export type PostUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Post
     */
    select?: PostSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Post
     */
    omit?: PostOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PostInclude<ExtArgs> | null
    /**
     * The filter to search for the Post to update in case it exists.
     */
    where: PostWhereUniqueInput
    /**
     * In case the Post found by the `where` argument doesn't exist, create a new Post with this data.
     */
    create: XOR<PostCreateInput, PostUncheckedCreateInput>
    /**
     * In case the Post was found with the provided `where` argument, update it with this data.
     */
    update: XOR<PostUpdateInput, PostUncheckedUpdateInput>
  }

  /**
   * Post delete
   */
  export type PostDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Post
     */
    select?: PostSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Post
     */
    omit?: PostOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PostInclude<ExtArgs> | null
    /**
     * Filter which Post to delete.
     */
    where: PostWhereUniqueInput
  }

  /**
   * Post deleteMany
   */
  export type PostDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Posts to delete
     */
    where?: PostWhereInput
    /**
     * Limit how many Posts to delete.
     */
    limit?: number
  }

  /**
   * Post without action
   */
  export type PostDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Post
     */
    select?: PostSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Post
     */
    omit?: PostOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PostInclude<ExtArgs> | null
  }


  /**
   * Model PerformanceTest
   */

  export type AggregatePerformanceTest = {
    _count: PerformanceTestCountAggregateOutputType | null
    _avg: PerformanceTestAvgAggregateOutputType | null
    _sum: PerformanceTestSumAggregateOutputType | null
    _min: PerformanceTestMinAggregateOutputType | null
    _max: PerformanceTestMaxAggregateOutputType | null
  }

  export type PerformanceTestAvgAggregateOutputType = {
    id: number | null
  }

  export type PerformanceTestSumAggregateOutputType = {
    id: number | null
  }

  export type PerformanceTestMinAggregateOutputType = {
    id: number | null
    description: string | null
    date: Date | null
  }

  export type PerformanceTestMaxAggregateOutputType = {
    id: number | null
    description: string | null
    date: Date | null
  }

  export type PerformanceTestCountAggregateOutputType = {
    id: number
    description: number
    date: number
    _all: number
  }


  export type PerformanceTestAvgAggregateInputType = {
    id?: true
  }

  export type PerformanceTestSumAggregateInputType = {
    id?: true
  }

  export type PerformanceTestMinAggregateInputType = {
    id?: true
    description?: true
    date?: true
  }

  export type PerformanceTestMaxAggregateInputType = {
    id?: true
    description?: true
    date?: true
  }

  export type PerformanceTestCountAggregateInputType = {
    id?: true
    description?: true
    date?: true
    _all?: true
  }

  export type PerformanceTestAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PerformanceTest to aggregate.
     */
    where?: PerformanceTestWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PerformanceTests to fetch.
     */
    orderBy?: PerformanceTestOrderByWithRelationInput | PerformanceTestOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: PerformanceTestWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PerformanceTests from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PerformanceTests.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned PerformanceTests
    **/
    _count?: true | PerformanceTestCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: PerformanceTestAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: PerformanceTestSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: PerformanceTestMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: PerformanceTestMaxAggregateInputType
  }

  export type GetPerformanceTestAggregateType<T extends PerformanceTestAggregateArgs> = {
        [P in keyof T & keyof AggregatePerformanceTest]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregatePerformanceTest[P]>
      : GetScalarType<T[P], AggregatePerformanceTest[P]>
  }




  export type PerformanceTestGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PerformanceTestWhereInput
    orderBy?: PerformanceTestOrderByWithAggregationInput | PerformanceTestOrderByWithAggregationInput[]
    by: PerformanceTestScalarFieldEnum[] | PerformanceTestScalarFieldEnum
    having?: PerformanceTestScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: PerformanceTestCountAggregateInputType | true
    _avg?: PerformanceTestAvgAggregateInputType
    _sum?: PerformanceTestSumAggregateInputType
    _min?: PerformanceTestMinAggregateInputType
    _max?: PerformanceTestMaxAggregateInputType
  }

  export type PerformanceTestGroupByOutputType = {
    id: number
    description: string
    date: Date
    _count: PerformanceTestCountAggregateOutputType | null
    _avg: PerformanceTestAvgAggregateOutputType | null
    _sum: PerformanceTestSumAggregateOutputType | null
    _min: PerformanceTestMinAggregateOutputType | null
    _max: PerformanceTestMaxAggregateOutputType | null
  }

  type GetPerformanceTestGroupByPayload<T extends PerformanceTestGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<PerformanceTestGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof PerformanceTestGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], PerformanceTestGroupByOutputType[P]>
            : GetScalarType<T[P], PerformanceTestGroupByOutputType[P]>
        }
      >
    >


  export type PerformanceTestSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    description?: boolean
    date?: boolean
  }, ExtArgs["result"]["performanceTest"]>

  export type PerformanceTestSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    description?: boolean
    date?: boolean
  }, ExtArgs["result"]["performanceTest"]>

  export type PerformanceTestSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    description?: boolean
    date?: boolean
  }, ExtArgs["result"]["performanceTest"]>

  export type PerformanceTestSelectScalar = {
    id?: boolean
    description?: boolean
    date?: boolean
  }

  export type PerformanceTestOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "description" | "date", ExtArgs["result"]["performanceTest"]>

  export type $PerformanceTestPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "PerformanceTest"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: number
      description: string
      date: Date
    }, ExtArgs["result"]["performanceTest"]>
    composites: {}
  }

  type PerformanceTestGetPayload<S extends boolean | null | undefined | PerformanceTestDefaultArgs> = $Result.GetResult<Prisma.$PerformanceTestPayload, S>

  type PerformanceTestCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<PerformanceTestFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: PerformanceTestCountAggregateInputType | true
    }

  export interface PerformanceTestDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['PerformanceTest'], meta: { name: 'PerformanceTest' } }
    /**
     * Find zero or one PerformanceTest that matches the filter.
     * @param {PerformanceTestFindUniqueArgs} args - Arguments to find a PerformanceTest
     * @example
     * // Get one PerformanceTest
     * const performanceTest = await prisma.performanceTest.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends PerformanceTestFindUniqueArgs>(args: SelectSubset<T, PerformanceTestFindUniqueArgs<ExtArgs>>): Prisma__PerformanceTestClient<$Result.GetResult<Prisma.$PerformanceTestPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one PerformanceTest that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {PerformanceTestFindUniqueOrThrowArgs} args - Arguments to find a PerformanceTest
     * @example
     * // Get one PerformanceTest
     * const performanceTest = await prisma.performanceTest.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends PerformanceTestFindUniqueOrThrowArgs>(args: SelectSubset<T, PerformanceTestFindUniqueOrThrowArgs<ExtArgs>>): Prisma__PerformanceTestClient<$Result.GetResult<Prisma.$PerformanceTestPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first PerformanceTest that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PerformanceTestFindFirstArgs} args - Arguments to find a PerformanceTest
     * @example
     * // Get one PerformanceTest
     * const performanceTest = await prisma.performanceTest.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends PerformanceTestFindFirstArgs>(args?: SelectSubset<T, PerformanceTestFindFirstArgs<ExtArgs>>): Prisma__PerformanceTestClient<$Result.GetResult<Prisma.$PerformanceTestPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first PerformanceTest that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PerformanceTestFindFirstOrThrowArgs} args - Arguments to find a PerformanceTest
     * @example
     * // Get one PerformanceTest
     * const performanceTest = await prisma.performanceTest.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends PerformanceTestFindFirstOrThrowArgs>(args?: SelectSubset<T, PerformanceTestFindFirstOrThrowArgs<ExtArgs>>): Prisma__PerformanceTestClient<$Result.GetResult<Prisma.$PerformanceTestPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more PerformanceTests that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PerformanceTestFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all PerformanceTests
     * const performanceTests = await prisma.performanceTest.findMany()
     * 
     * // Get first 10 PerformanceTests
     * const performanceTests = await prisma.performanceTest.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const performanceTestWithIdOnly = await prisma.performanceTest.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends PerformanceTestFindManyArgs>(args?: SelectSubset<T, PerformanceTestFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PerformanceTestPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a PerformanceTest.
     * @param {PerformanceTestCreateArgs} args - Arguments to create a PerformanceTest.
     * @example
     * // Create one PerformanceTest
     * const PerformanceTest = await prisma.performanceTest.create({
     *   data: {
     *     // ... data to create a PerformanceTest
     *   }
     * })
     * 
     */
    create<T extends PerformanceTestCreateArgs>(args: SelectSubset<T, PerformanceTestCreateArgs<ExtArgs>>): Prisma__PerformanceTestClient<$Result.GetResult<Prisma.$PerformanceTestPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many PerformanceTests.
     * @param {PerformanceTestCreateManyArgs} args - Arguments to create many PerformanceTests.
     * @example
     * // Create many PerformanceTests
     * const performanceTest = await prisma.performanceTest.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends PerformanceTestCreateManyArgs>(args?: SelectSubset<T, PerformanceTestCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many PerformanceTests and returns the data saved in the database.
     * @param {PerformanceTestCreateManyAndReturnArgs} args - Arguments to create many PerformanceTests.
     * @example
     * // Create many PerformanceTests
     * const performanceTest = await prisma.performanceTest.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many PerformanceTests and only return the `id`
     * const performanceTestWithIdOnly = await prisma.performanceTest.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends PerformanceTestCreateManyAndReturnArgs>(args?: SelectSubset<T, PerformanceTestCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PerformanceTestPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a PerformanceTest.
     * @param {PerformanceTestDeleteArgs} args - Arguments to delete one PerformanceTest.
     * @example
     * // Delete one PerformanceTest
     * const PerformanceTest = await prisma.performanceTest.delete({
     *   where: {
     *     // ... filter to delete one PerformanceTest
     *   }
     * })
     * 
     */
    delete<T extends PerformanceTestDeleteArgs>(args: SelectSubset<T, PerformanceTestDeleteArgs<ExtArgs>>): Prisma__PerformanceTestClient<$Result.GetResult<Prisma.$PerformanceTestPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one PerformanceTest.
     * @param {PerformanceTestUpdateArgs} args - Arguments to update one PerformanceTest.
     * @example
     * // Update one PerformanceTest
     * const performanceTest = await prisma.performanceTest.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends PerformanceTestUpdateArgs>(args: SelectSubset<T, PerformanceTestUpdateArgs<ExtArgs>>): Prisma__PerformanceTestClient<$Result.GetResult<Prisma.$PerformanceTestPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more PerformanceTests.
     * @param {PerformanceTestDeleteManyArgs} args - Arguments to filter PerformanceTests to delete.
     * @example
     * // Delete a few PerformanceTests
     * const { count } = await prisma.performanceTest.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends PerformanceTestDeleteManyArgs>(args?: SelectSubset<T, PerformanceTestDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more PerformanceTests.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PerformanceTestUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many PerformanceTests
     * const performanceTest = await prisma.performanceTest.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends PerformanceTestUpdateManyArgs>(args: SelectSubset<T, PerformanceTestUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more PerformanceTests and returns the data updated in the database.
     * @param {PerformanceTestUpdateManyAndReturnArgs} args - Arguments to update many PerformanceTests.
     * @example
     * // Update many PerformanceTests
     * const performanceTest = await prisma.performanceTest.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more PerformanceTests and only return the `id`
     * const performanceTestWithIdOnly = await prisma.performanceTest.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends PerformanceTestUpdateManyAndReturnArgs>(args: SelectSubset<T, PerformanceTestUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PerformanceTestPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one PerformanceTest.
     * @param {PerformanceTestUpsertArgs} args - Arguments to update or create a PerformanceTest.
     * @example
     * // Update or create a PerformanceTest
     * const performanceTest = await prisma.performanceTest.upsert({
     *   create: {
     *     // ... data to create a PerformanceTest
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the PerformanceTest we want to update
     *   }
     * })
     */
    upsert<T extends PerformanceTestUpsertArgs>(args: SelectSubset<T, PerformanceTestUpsertArgs<ExtArgs>>): Prisma__PerformanceTestClient<$Result.GetResult<Prisma.$PerformanceTestPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of PerformanceTests.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PerformanceTestCountArgs} args - Arguments to filter PerformanceTests to count.
     * @example
     * // Count the number of PerformanceTests
     * const count = await prisma.performanceTest.count({
     *   where: {
     *     // ... the filter for the PerformanceTests we want to count
     *   }
     * })
    **/
    count<T extends PerformanceTestCountArgs>(
      args?: Subset<T, PerformanceTestCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], PerformanceTestCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a PerformanceTest.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PerformanceTestAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends PerformanceTestAggregateArgs>(args: Subset<T, PerformanceTestAggregateArgs>): Prisma.PrismaPromise<GetPerformanceTestAggregateType<T>>

    /**
     * Group by PerformanceTest.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PerformanceTestGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends PerformanceTestGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: PerformanceTestGroupByArgs['orderBy'] }
        : { orderBy?: PerformanceTestGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, PerformanceTestGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetPerformanceTestGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the PerformanceTest model
   */
  readonly fields: PerformanceTestFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for PerformanceTest.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__PerformanceTestClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the PerformanceTest model
   */
  interface PerformanceTestFieldRefs {
    readonly id: FieldRef<"PerformanceTest", 'Int'>
    readonly description: FieldRef<"PerformanceTest", 'String'>
    readonly date: FieldRef<"PerformanceTest", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * PerformanceTest findUnique
   */
  export type PerformanceTestFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PerformanceTest
     */
    select?: PerformanceTestSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PerformanceTest
     */
    omit?: PerformanceTestOmit<ExtArgs> | null
    /**
     * Filter, which PerformanceTest to fetch.
     */
    where: PerformanceTestWhereUniqueInput
  }

  /**
   * PerformanceTest findUniqueOrThrow
   */
  export type PerformanceTestFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PerformanceTest
     */
    select?: PerformanceTestSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PerformanceTest
     */
    omit?: PerformanceTestOmit<ExtArgs> | null
    /**
     * Filter, which PerformanceTest to fetch.
     */
    where: PerformanceTestWhereUniqueInput
  }

  /**
   * PerformanceTest findFirst
   */
  export type PerformanceTestFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PerformanceTest
     */
    select?: PerformanceTestSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PerformanceTest
     */
    omit?: PerformanceTestOmit<ExtArgs> | null
    /**
     * Filter, which PerformanceTest to fetch.
     */
    where?: PerformanceTestWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PerformanceTests to fetch.
     */
    orderBy?: PerformanceTestOrderByWithRelationInput | PerformanceTestOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PerformanceTests.
     */
    cursor?: PerformanceTestWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PerformanceTests from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PerformanceTests.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PerformanceTests.
     */
    distinct?: PerformanceTestScalarFieldEnum | PerformanceTestScalarFieldEnum[]
  }

  /**
   * PerformanceTest findFirstOrThrow
   */
  export type PerformanceTestFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PerformanceTest
     */
    select?: PerformanceTestSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PerformanceTest
     */
    omit?: PerformanceTestOmit<ExtArgs> | null
    /**
     * Filter, which PerformanceTest to fetch.
     */
    where?: PerformanceTestWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PerformanceTests to fetch.
     */
    orderBy?: PerformanceTestOrderByWithRelationInput | PerformanceTestOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PerformanceTests.
     */
    cursor?: PerformanceTestWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PerformanceTests from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PerformanceTests.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PerformanceTests.
     */
    distinct?: PerformanceTestScalarFieldEnum | PerformanceTestScalarFieldEnum[]
  }

  /**
   * PerformanceTest findMany
   */
  export type PerformanceTestFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PerformanceTest
     */
    select?: PerformanceTestSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PerformanceTest
     */
    omit?: PerformanceTestOmit<ExtArgs> | null
    /**
     * Filter, which PerformanceTests to fetch.
     */
    where?: PerformanceTestWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PerformanceTests to fetch.
     */
    orderBy?: PerformanceTestOrderByWithRelationInput | PerformanceTestOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing PerformanceTests.
     */
    cursor?: PerformanceTestWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PerformanceTests from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PerformanceTests.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PerformanceTests.
     */
    distinct?: PerformanceTestScalarFieldEnum | PerformanceTestScalarFieldEnum[]
  }

  /**
   * PerformanceTest create
   */
  export type PerformanceTestCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PerformanceTest
     */
    select?: PerformanceTestSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PerformanceTest
     */
    omit?: PerformanceTestOmit<ExtArgs> | null
    /**
     * The data needed to create a PerformanceTest.
     */
    data: XOR<PerformanceTestCreateInput, PerformanceTestUncheckedCreateInput>
  }

  /**
   * PerformanceTest createMany
   */
  export type PerformanceTestCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many PerformanceTests.
     */
    data: PerformanceTestCreateManyInput | PerformanceTestCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * PerformanceTest createManyAndReturn
   */
  export type PerformanceTestCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PerformanceTest
     */
    select?: PerformanceTestSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the PerformanceTest
     */
    omit?: PerformanceTestOmit<ExtArgs> | null
    /**
     * The data used to create many PerformanceTests.
     */
    data: PerformanceTestCreateManyInput | PerformanceTestCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * PerformanceTest update
   */
  export type PerformanceTestUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PerformanceTest
     */
    select?: PerformanceTestSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PerformanceTest
     */
    omit?: PerformanceTestOmit<ExtArgs> | null
    /**
     * The data needed to update a PerformanceTest.
     */
    data: XOR<PerformanceTestUpdateInput, PerformanceTestUncheckedUpdateInput>
    /**
     * Choose, which PerformanceTest to update.
     */
    where: PerformanceTestWhereUniqueInput
  }

  /**
   * PerformanceTest updateMany
   */
  export type PerformanceTestUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update PerformanceTests.
     */
    data: XOR<PerformanceTestUpdateManyMutationInput, PerformanceTestUncheckedUpdateManyInput>
    /**
     * Filter which PerformanceTests to update
     */
    where?: PerformanceTestWhereInput
    /**
     * Limit how many PerformanceTests to update.
     */
    limit?: number
  }

  /**
   * PerformanceTest updateManyAndReturn
   */
  export type PerformanceTestUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PerformanceTest
     */
    select?: PerformanceTestSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the PerformanceTest
     */
    omit?: PerformanceTestOmit<ExtArgs> | null
    /**
     * The data used to update PerformanceTests.
     */
    data: XOR<PerformanceTestUpdateManyMutationInput, PerformanceTestUncheckedUpdateManyInput>
    /**
     * Filter which PerformanceTests to update
     */
    where?: PerformanceTestWhereInput
    /**
     * Limit how many PerformanceTests to update.
     */
    limit?: number
  }

  /**
   * PerformanceTest upsert
   */
  export type PerformanceTestUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PerformanceTest
     */
    select?: PerformanceTestSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PerformanceTest
     */
    omit?: PerformanceTestOmit<ExtArgs> | null
    /**
     * The filter to search for the PerformanceTest to update in case it exists.
     */
    where: PerformanceTestWhereUniqueInput
    /**
     * In case the PerformanceTest found by the `where` argument doesn't exist, create a new PerformanceTest with this data.
     */
    create: XOR<PerformanceTestCreateInput, PerformanceTestUncheckedCreateInput>
    /**
     * In case the PerformanceTest was found with the provided `where` argument, update it with this data.
     */
    update: XOR<PerformanceTestUpdateInput, PerformanceTestUncheckedUpdateInput>
  }

  /**
   * PerformanceTest delete
   */
  export type PerformanceTestDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PerformanceTest
     */
    select?: PerformanceTestSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PerformanceTest
     */
    omit?: PerformanceTestOmit<ExtArgs> | null
    /**
     * Filter which PerformanceTest to delete.
     */
    where: PerformanceTestWhereUniqueInput
  }

  /**
   * PerformanceTest deleteMany
   */
  export type PerformanceTestDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PerformanceTests to delete
     */
    where?: PerformanceTestWhereInput
    /**
     * Limit how many PerformanceTests to delete.
     */
    limit?: number
  }

  /**
   * PerformanceTest without action
   */
  export type PerformanceTestDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PerformanceTest
     */
    select?: PerformanceTestSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PerformanceTest
     */
    omit?: PerformanceTestOmit<ExtArgs> | null
  }


  /**
   * Model Raca
   */

  export type AggregateRaca = {
    _count: RacaCountAggregateOutputType | null
    _avg: RacaAvgAggregateOutputType | null
    _sum: RacaSumAggregateOutputType | null
    _min: RacaMinAggregateOutputType | null
    _max: RacaMaxAggregateOutputType | null
  }

  export type RacaAvgAggregateOutputType = {
    id: number | null
  }

  export type RacaSumAggregateOutputType = {
    id: number | null
  }

  export type RacaMinAggregateOutputType = {
    id: number | null
    nome: string | null
  }

  export type RacaMaxAggregateOutputType = {
    id: number | null
    nome: string | null
  }

  export type RacaCountAggregateOutputType = {
    id: number
    nome: number
    _all: number
  }


  export type RacaAvgAggregateInputType = {
    id?: true
  }

  export type RacaSumAggregateInputType = {
    id?: true
  }

  export type RacaMinAggregateInputType = {
    id?: true
    nome?: true
  }

  export type RacaMaxAggregateInputType = {
    id?: true
    nome?: true
  }

  export type RacaCountAggregateInputType = {
    id?: true
    nome?: true
    _all?: true
  }

  export type RacaAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Raca to aggregate.
     */
    where?: RacaWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Racas to fetch.
     */
    orderBy?: RacaOrderByWithRelationInput | RacaOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: RacaWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Racas from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Racas.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Racas
    **/
    _count?: true | RacaCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: RacaAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: RacaSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: RacaMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: RacaMaxAggregateInputType
  }

  export type GetRacaAggregateType<T extends RacaAggregateArgs> = {
        [P in keyof T & keyof AggregateRaca]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateRaca[P]>
      : GetScalarType<T[P], AggregateRaca[P]>
  }




  export type RacaGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: RacaWhereInput
    orderBy?: RacaOrderByWithAggregationInput | RacaOrderByWithAggregationInput[]
    by: RacaScalarFieldEnum[] | RacaScalarFieldEnum
    having?: RacaScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: RacaCountAggregateInputType | true
    _avg?: RacaAvgAggregateInputType
    _sum?: RacaSumAggregateInputType
    _min?: RacaMinAggregateInputType
    _max?: RacaMaxAggregateInputType
  }

  export type RacaGroupByOutputType = {
    id: number
    nome: string
    _count: RacaCountAggregateOutputType | null
    _avg: RacaAvgAggregateOutputType | null
    _sum: RacaSumAggregateOutputType | null
    _min: RacaMinAggregateOutputType | null
    _max: RacaMaxAggregateOutputType | null
  }

  type GetRacaGroupByPayload<T extends RacaGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<RacaGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof RacaGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], RacaGroupByOutputType[P]>
            : GetScalarType<T[P], RacaGroupByOutputType[P]>
        }
      >
    >


  export type RacaSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    nome?: boolean
    animais?: boolean | Raca$animaisArgs<ExtArgs>
    _count?: boolean | RacaCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["raca"]>

  export type RacaSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    nome?: boolean
  }, ExtArgs["result"]["raca"]>

  export type RacaSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    nome?: boolean
  }, ExtArgs["result"]["raca"]>

  export type RacaSelectScalar = {
    id?: boolean
    nome?: boolean
  }

  export type RacaOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "nome", ExtArgs["result"]["raca"]>
  export type RacaInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    animais?: boolean | Raca$animaisArgs<ExtArgs>
    _count?: boolean | RacaCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type RacaIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type RacaIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $RacaPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Raca"
    objects: {
      animais: Prisma.$AnimalPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      nome: string
    }, ExtArgs["result"]["raca"]>
    composites: {}
  }

  type RacaGetPayload<S extends boolean | null | undefined | RacaDefaultArgs> = $Result.GetResult<Prisma.$RacaPayload, S>

  type RacaCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<RacaFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: RacaCountAggregateInputType | true
    }

  export interface RacaDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Raca'], meta: { name: 'Raca' } }
    /**
     * Find zero or one Raca that matches the filter.
     * @param {RacaFindUniqueArgs} args - Arguments to find a Raca
     * @example
     * // Get one Raca
     * const raca = await prisma.raca.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends RacaFindUniqueArgs>(args: SelectSubset<T, RacaFindUniqueArgs<ExtArgs>>): Prisma__RacaClient<$Result.GetResult<Prisma.$RacaPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Raca that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {RacaFindUniqueOrThrowArgs} args - Arguments to find a Raca
     * @example
     * // Get one Raca
     * const raca = await prisma.raca.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends RacaFindUniqueOrThrowArgs>(args: SelectSubset<T, RacaFindUniqueOrThrowArgs<ExtArgs>>): Prisma__RacaClient<$Result.GetResult<Prisma.$RacaPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Raca that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RacaFindFirstArgs} args - Arguments to find a Raca
     * @example
     * // Get one Raca
     * const raca = await prisma.raca.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends RacaFindFirstArgs>(args?: SelectSubset<T, RacaFindFirstArgs<ExtArgs>>): Prisma__RacaClient<$Result.GetResult<Prisma.$RacaPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Raca that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RacaFindFirstOrThrowArgs} args - Arguments to find a Raca
     * @example
     * // Get one Raca
     * const raca = await prisma.raca.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends RacaFindFirstOrThrowArgs>(args?: SelectSubset<T, RacaFindFirstOrThrowArgs<ExtArgs>>): Prisma__RacaClient<$Result.GetResult<Prisma.$RacaPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Racas that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RacaFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Racas
     * const racas = await prisma.raca.findMany()
     * 
     * // Get first 10 Racas
     * const racas = await prisma.raca.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const racaWithIdOnly = await prisma.raca.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends RacaFindManyArgs>(args?: SelectSubset<T, RacaFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RacaPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Raca.
     * @param {RacaCreateArgs} args - Arguments to create a Raca.
     * @example
     * // Create one Raca
     * const Raca = await prisma.raca.create({
     *   data: {
     *     // ... data to create a Raca
     *   }
     * })
     * 
     */
    create<T extends RacaCreateArgs>(args: SelectSubset<T, RacaCreateArgs<ExtArgs>>): Prisma__RacaClient<$Result.GetResult<Prisma.$RacaPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Racas.
     * @param {RacaCreateManyArgs} args - Arguments to create many Racas.
     * @example
     * // Create many Racas
     * const raca = await prisma.raca.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends RacaCreateManyArgs>(args?: SelectSubset<T, RacaCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Racas and returns the data saved in the database.
     * @param {RacaCreateManyAndReturnArgs} args - Arguments to create many Racas.
     * @example
     * // Create many Racas
     * const raca = await prisma.raca.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Racas and only return the `id`
     * const racaWithIdOnly = await prisma.raca.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends RacaCreateManyAndReturnArgs>(args?: SelectSubset<T, RacaCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RacaPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Raca.
     * @param {RacaDeleteArgs} args - Arguments to delete one Raca.
     * @example
     * // Delete one Raca
     * const Raca = await prisma.raca.delete({
     *   where: {
     *     // ... filter to delete one Raca
     *   }
     * })
     * 
     */
    delete<T extends RacaDeleteArgs>(args: SelectSubset<T, RacaDeleteArgs<ExtArgs>>): Prisma__RacaClient<$Result.GetResult<Prisma.$RacaPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Raca.
     * @param {RacaUpdateArgs} args - Arguments to update one Raca.
     * @example
     * // Update one Raca
     * const raca = await prisma.raca.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends RacaUpdateArgs>(args: SelectSubset<T, RacaUpdateArgs<ExtArgs>>): Prisma__RacaClient<$Result.GetResult<Prisma.$RacaPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Racas.
     * @param {RacaDeleteManyArgs} args - Arguments to filter Racas to delete.
     * @example
     * // Delete a few Racas
     * const { count } = await prisma.raca.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends RacaDeleteManyArgs>(args?: SelectSubset<T, RacaDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Racas.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RacaUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Racas
     * const raca = await prisma.raca.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends RacaUpdateManyArgs>(args: SelectSubset<T, RacaUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Racas and returns the data updated in the database.
     * @param {RacaUpdateManyAndReturnArgs} args - Arguments to update many Racas.
     * @example
     * // Update many Racas
     * const raca = await prisma.raca.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Racas and only return the `id`
     * const racaWithIdOnly = await prisma.raca.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends RacaUpdateManyAndReturnArgs>(args: SelectSubset<T, RacaUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RacaPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Raca.
     * @param {RacaUpsertArgs} args - Arguments to update or create a Raca.
     * @example
     * // Update or create a Raca
     * const raca = await prisma.raca.upsert({
     *   create: {
     *     // ... data to create a Raca
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Raca we want to update
     *   }
     * })
     */
    upsert<T extends RacaUpsertArgs>(args: SelectSubset<T, RacaUpsertArgs<ExtArgs>>): Prisma__RacaClient<$Result.GetResult<Prisma.$RacaPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Racas.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RacaCountArgs} args - Arguments to filter Racas to count.
     * @example
     * // Count the number of Racas
     * const count = await prisma.raca.count({
     *   where: {
     *     // ... the filter for the Racas we want to count
     *   }
     * })
    **/
    count<T extends RacaCountArgs>(
      args?: Subset<T, RacaCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], RacaCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Raca.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RacaAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends RacaAggregateArgs>(args: Subset<T, RacaAggregateArgs>): Prisma.PrismaPromise<GetRacaAggregateType<T>>

    /**
     * Group by Raca.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RacaGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends RacaGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: RacaGroupByArgs['orderBy'] }
        : { orderBy?: RacaGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, RacaGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetRacaGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Raca model
   */
  readonly fields: RacaFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Raca.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__RacaClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    animais<T extends Raca$animaisArgs<ExtArgs> = {}>(args?: Subset<T, Raca$animaisArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AnimalPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Raca model
   */
  interface RacaFieldRefs {
    readonly id: FieldRef<"Raca", 'Int'>
    readonly nome: FieldRef<"Raca", 'String'>
  }
    

  // Custom InputTypes
  /**
   * Raca findUnique
   */
  export type RacaFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Raca
     */
    select?: RacaSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Raca
     */
    omit?: RacaOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RacaInclude<ExtArgs> | null
    /**
     * Filter, which Raca to fetch.
     */
    where: RacaWhereUniqueInput
  }

  /**
   * Raca findUniqueOrThrow
   */
  export type RacaFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Raca
     */
    select?: RacaSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Raca
     */
    omit?: RacaOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RacaInclude<ExtArgs> | null
    /**
     * Filter, which Raca to fetch.
     */
    where: RacaWhereUniqueInput
  }

  /**
   * Raca findFirst
   */
  export type RacaFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Raca
     */
    select?: RacaSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Raca
     */
    omit?: RacaOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RacaInclude<ExtArgs> | null
    /**
     * Filter, which Raca to fetch.
     */
    where?: RacaWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Racas to fetch.
     */
    orderBy?: RacaOrderByWithRelationInput | RacaOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Racas.
     */
    cursor?: RacaWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Racas from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Racas.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Racas.
     */
    distinct?: RacaScalarFieldEnum | RacaScalarFieldEnum[]
  }

  /**
   * Raca findFirstOrThrow
   */
  export type RacaFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Raca
     */
    select?: RacaSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Raca
     */
    omit?: RacaOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RacaInclude<ExtArgs> | null
    /**
     * Filter, which Raca to fetch.
     */
    where?: RacaWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Racas to fetch.
     */
    orderBy?: RacaOrderByWithRelationInput | RacaOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Racas.
     */
    cursor?: RacaWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Racas from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Racas.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Racas.
     */
    distinct?: RacaScalarFieldEnum | RacaScalarFieldEnum[]
  }

  /**
   * Raca findMany
   */
  export type RacaFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Raca
     */
    select?: RacaSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Raca
     */
    omit?: RacaOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RacaInclude<ExtArgs> | null
    /**
     * Filter, which Racas to fetch.
     */
    where?: RacaWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Racas to fetch.
     */
    orderBy?: RacaOrderByWithRelationInput | RacaOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Racas.
     */
    cursor?: RacaWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Racas from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Racas.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Racas.
     */
    distinct?: RacaScalarFieldEnum | RacaScalarFieldEnum[]
  }

  /**
   * Raca create
   */
  export type RacaCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Raca
     */
    select?: RacaSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Raca
     */
    omit?: RacaOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RacaInclude<ExtArgs> | null
    /**
     * The data needed to create a Raca.
     */
    data: XOR<RacaCreateInput, RacaUncheckedCreateInput>
  }

  /**
   * Raca createMany
   */
  export type RacaCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Racas.
     */
    data: RacaCreateManyInput | RacaCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Raca createManyAndReturn
   */
  export type RacaCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Raca
     */
    select?: RacaSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Raca
     */
    omit?: RacaOmit<ExtArgs> | null
    /**
     * The data used to create many Racas.
     */
    data: RacaCreateManyInput | RacaCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Raca update
   */
  export type RacaUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Raca
     */
    select?: RacaSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Raca
     */
    omit?: RacaOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RacaInclude<ExtArgs> | null
    /**
     * The data needed to update a Raca.
     */
    data: XOR<RacaUpdateInput, RacaUncheckedUpdateInput>
    /**
     * Choose, which Raca to update.
     */
    where: RacaWhereUniqueInput
  }

  /**
   * Raca updateMany
   */
  export type RacaUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Racas.
     */
    data: XOR<RacaUpdateManyMutationInput, RacaUncheckedUpdateManyInput>
    /**
     * Filter which Racas to update
     */
    where?: RacaWhereInput
    /**
     * Limit how many Racas to update.
     */
    limit?: number
  }

  /**
   * Raca updateManyAndReturn
   */
  export type RacaUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Raca
     */
    select?: RacaSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Raca
     */
    omit?: RacaOmit<ExtArgs> | null
    /**
     * The data used to update Racas.
     */
    data: XOR<RacaUpdateManyMutationInput, RacaUncheckedUpdateManyInput>
    /**
     * Filter which Racas to update
     */
    where?: RacaWhereInput
    /**
     * Limit how many Racas to update.
     */
    limit?: number
  }

  /**
   * Raca upsert
   */
  export type RacaUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Raca
     */
    select?: RacaSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Raca
     */
    omit?: RacaOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RacaInclude<ExtArgs> | null
    /**
     * The filter to search for the Raca to update in case it exists.
     */
    where: RacaWhereUniqueInput
    /**
     * In case the Raca found by the `where` argument doesn't exist, create a new Raca with this data.
     */
    create: XOR<RacaCreateInput, RacaUncheckedCreateInput>
    /**
     * In case the Raca was found with the provided `where` argument, update it with this data.
     */
    update: XOR<RacaUpdateInput, RacaUncheckedUpdateInput>
  }

  /**
   * Raca delete
   */
  export type RacaDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Raca
     */
    select?: RacaSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Raca
     */
    omit?: RacaOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RacaInclude<ExtArgs> | null
    /**
     * Filter which Raca to delete.
     */
    where: RacaWhereUniqueInput
  }

  /**
   * Raca deleteMany
   */
  export type RacaDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Racas to delete
     */
    where?: RacaWhereInput
    /**
     * Limit how many Racas to delete.
     */
    limit?: number
  }

  /**
   * Raca.animais
   */
  export type Raca$animaisArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Animal
     */
    select?: AnimalSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Animal
     */
    omit?: AnimalOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AnimalInclude<ExtArgs> | null
    where?: AnimalWhereInput
    orderBy?: AnimalOrderByWithRelationInput | AnimalOrderByWithRelationInput[]
    cursor?: AnimalWhereUniqueInput
    take?: number
    skip?: number
    distinct?: AnimalScalarFieldEnum | AnimalScalarFieldEnum[]
  }

  /**
   * Raca without action
   */
  export type RacaDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Raca
     */
    select?: RacaSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Raca
     */
    omit?: RacaOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RacaInclude<ExtArgs> | null
  }


  /**
   * Model Lote
   */

  export type AggregateLote = {
    _count: LoteCountAggregateOutputType | null
    _avg: LoteAvgAggregateOutputType | null
    _sum: LoteSumAggregateOutputType | null
    _min: LoteMinAggregateOutputType | null
    _max: LoteMaxAggregateOutputType | null
  }

  export type LoteAvgAggregateOutputType = {
    id: number | null
  }

  export type LoteSumAggregateOutputType = {
    id: number | null
  }

  export type LoteMinAggregateOutputType = {
    id: number | null
    nome: string | null
  }

  export type LoteMaxAggregateOutputType = {
    id: number | null
    nome: string | null
  }

  export type LoteCountAggregateOutputType = {
    id: number
    nome: number
    _all: number
  }


  export type LoteAvgAggregateInputType = {
    id?: true
  }

  export type LoteSumAggregateInputType = {
    id?: true
  }

  export type LoteMinAggregateInputType = {
    id?: true
    nome?: true
  }

  export type LoteMaxAggregateInputType = {
    id?: true
    nome?: true
  }

  export type LoteCountAggregateInputType = {
    id?: true
    nome?: true
    _all?: true
  }

  export type LoteAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Lote to aggregate.
     */
    where?: LoteWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Lotes to fetch.
     */
    orderBy?: LoteOrderByWithRelationInput | LoteOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: LoteWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Lotes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Lotes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Lotes
    **/
    _count?: true | LoteCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: LoteAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: LoteSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: LoteMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: LoteMaxAggregateInputType
  }

  export type GetLoteAggregateType<T extends LoteAggregateArgs> = {
        [P in keyof T & keyof AggregateLote]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateLote[P]>
      : GetScalarType<T[P], AggregateLote[P]>
  }




  export type LoteGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: LoteWhereInput
    orderBy?: LoteOrderByWithAggregationInput | LoteOrderByWithAggregationInput[]
    by: LoteScalarFieldEnum[] | LoteScalarFieldEnum
    having?: LoteScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: LoteCountAggregateInputType | true
    _avg?: LoteAvgAggregateInputType
    _sum?: LoteSumAggregateInputType
    _min?: LoteMinAggregateInputType
    _max?: LoteMaxAggregateInputType
  }

  export type LoteGroupByOutputType = {
    id: number
    nome: string
    _count: LoteCountAggregateOutputType | null
    _avg: LoteAvgAggregateOutputType | null
    _sum: LoteSumAggregateOutputType | null
    _min: LoteMinAggregateOutputType | null
    _max: LoteMaxAggregateOutputType | null
  }

  type GetLoteGroupByPayload<T extends LoteGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<LoteGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof LoteGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], LoteGroupByOutputType[P]>
            : GetScalarType<T[P], LoteGroupByOutputType[P]>
        }
      >
    >


  export type LoteSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    nome?: boolean
    animais?: boolean | Lote$animaisArgs<ExtArgs>
    _count?: boolean | LoteCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["lote"]>

  export type LoteSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    nome?: boolean
  }, ExtArgs["result"]["lote"]>

  export type LoteSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    nome?: boolean
  }, ExtArgs["result"]["lote"]>

  export type LoteSelectScalar = {
    id?: boolean
    nome?: boolean
  }

  export type LoteOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "nome", ExtArgs["result"]["lote"]>
  export type LoteInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    animais?: boolean | Lote$animaisArgs<ExtArgs>
    _count?: boolean | LoteCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type LoteIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type LoteIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $LotePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Lote"
    objects: {
      animais: Prisma.$AnimalPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      nome: string
    }, ExtArgs["result"]["lote"]>
    composites: {}
  }

  type LoteGetPayload<S extends boolean | null | undefined | LoteDefaultArgs> = $Result.GetResult<Prisma.$LotePayload, S>

  type LoteCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<LoteFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: LoteCountAggregateInputType | true
    }

  export interface LoteDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Lote'], meta: { name: 'Lote' } }
    /**
     * Find zero or one Lote that matches the filter.
     * @param {LoteFindUniqueArgs} args - Arguments to find a Lote
     * @example
     * // Get one Lote
     * const lote = await prisma.lote.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends LoteFindUniqueArgs>(args: SelectSubset<T, LoteFindUniqueArgs<ExtArgs>>): Prisma__LoteClient<$Result.GetResult<Prisma.$LotePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Lote that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {LoteFindUniqueOrThrowArgs} args - Arguments to find a Lote
     * @example
     * // Get one Lote
     * const lote = await prisma.lote.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends LoteFindUniqueOrThrowArgs>(args: SelectSubset<T, LoteFindUniqueOrThrowArgs<ExtArgs>>): Prisma__LoteClient<$Result.GetResult<Prisma.$LotePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Lote that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LoteFindFirstArgs} args - Arguments to find a Lote
     * @example
     * // Get one Lote
     * const lote = await prisma.lote.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends LoteFindFirstArgs>(args?: SelectSubset<T, LoteFindFirstArgs<ExtArgs>>): Prisma__LoteClient<$Result.GetResult<Prisma.$LotePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Lote that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LoteFindFirstOrThrowArgs} args - Arguments to find a Lote
     * @example
     * // Get one Lote
     * const lote = await prisma.lote.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends LoteFindFirstOrThrowArgs>(args?: SelectSubset<T, LoteFindFirstOrThrowArgs<ExtArgs>>): Prisma__LoteClient<$Result.GetResult<Prisma.$LotePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Lotes that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LoteFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Lotes
     * const lotes = await prisma.lote.findMany()
     * 
     * // Get first 10 Lotes
     * const lotes = await prisma.lote.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const loteWithIdOnly = await prisma.lote.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends LoteFindManyArgs>(args?: SelectSubset<T, LoteFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LotePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Lote.
     * @param {LoteCreateArgs} args - Arguments to create a Lote.
     * @example
     * // Create one Lote
     * const Lote = await prisma.lote.create({
     *   data: {
     *     // ... data to create a Lote
     *   }
     * })
     * 
     */
    create<T extends LoteCreateArgs>(args: SelectSubset<T, LoteCreateArgs<ExtArgs>>): Prisma__LoteClient<$Result.GetResult<Prisma.$LotePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Lotes.
     * @param {LoteCreateManyArgs} args - Arguments to create many Lotes.
     * @example
     * // Create many Lotes
     * const lote = await prisma.lote.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends LoteCreateManyArgs>(args?: SelectSubset<T, LoteCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Lotes and returns the data saved in the database.
     * @param {LoteCreateManyAndReturnArgs} args - Arguments to create many Lotes.
     * @example
     * // Create many Lotes
     * const lote = await prisma.lote.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Lotes and only return the `id`
     * const loteWithIdOnly = await prisma.lote.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends LoteCreateManyAndReturnArgs>(args?: SelectSubset<T, LoteCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LotePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Lote.
     * @param {LoteDeleteArgs} args - Arguments to delete one Lote.
     * @example
     * // Delete one Lote
     * const Lote = await prisma.lote.delete({
     *   where: {
     *     // ... filter to delete one Lote
     *   }
     * })
     * 
     */
    delete<T extends LoteDeleteArgs>(args: SelectSubset<T, LoteDeleteArgs<ExtArgs>>): Prisma__LoteClient<$Result.GetResult<Prisma.$LotePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Lote.
     * @param {LoteUpdateArgs} args - Arguments to update one Lote.
     * @example
     * // Update one Lote
     * const lote = await prisma.lote.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends LoteUpdateArgs>(args: SelectSubset<T, LoteUpdateArgs<ExtArgs>>): Prisma__LoteClient<$Result.GetResult<Prisma.$LotePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Lotes.
     * @param {LoteDeleteManyArgs} args - Arguments to filter Lotes to delete.
     * @example
     * // Delete a few Lotes
     * const { count } = await prisma.lote.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends LoteDeleteManyArgs>(args?: SelectSubset<T, LoteDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Lotes.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LoteUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Lotes
     * const lote = await prisma.lote.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends LoteUpdateManyArgs>(args: SelectSubset<T, LoteUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Lotes and returns the data updated in the database.
     * @param {LoteUpdateManyAndReturnArgs} args - Arguments to update many Lotes.
     * @example
     * // Update many Lotes
     * const lote = await prisma.lote.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Lotes and only return the `id`
     * const loteWithIdOnly = await prisma.lote.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends LoteUpdateManyAndReturnArgs>(args: SelectSubset<T, LoteUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LotePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Lote.
     * @param {LoteUpsertArgs} args - Arguments to update or create a Lote.
     * @example
     * // Update or create a Lote
     * const lote = await prisma.lote.upsert({
     *   create: {
     *     // ... data to create a Lote
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Lote we want to update
     *   }
     * })
     */
    upsert<T extends LoteUpsertArgs>(args: SelectSubset<T, LoteUpsertArgs<ExtArgs>>): Prisma__LoteClient<$Result.GetResult<Prisma.$LotePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Lotes.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LoteCountArgs} args - Arguments to filter Lotes to count.
     * @example
     * // Count the number of Lotes
     * const count = await prisma.lote.count({
     *   where: {
     *     // ... the filter for the Lotes we want to count
     *   }
     * })
    **/
    count<T extends LoteCountArgs>(
      args?: Subset<T, LoteCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], LoteCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Lote.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LoteAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends LoteAggregateArgs>(args: Subset<T, LoteAggregateArgs>): Prisma.PrismaPromise<GetLoteAggregateType<T>>

    /**
     * Group by Lote.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LoteGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends LoteGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: LoteGroupByArgs['orderBy'] }
        : { orderBy?: LoteGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, LoteGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetLoteGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Lote model
   */
  readonly fields: LoteFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Lote.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__LoteClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    animais<T extends Lote$animaisArgs<ExtArgs> = {}>(args?: Subset<T, Lote$animaisArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AnimalPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Lote model
   */
  interface LoteFieldRefs {
    readonly id: FieldRef<"Lote", 'Int'>
    readonly nome: FieldRef<"Lote", 'String'>
  }
    

  // Custom InputTypes
  /**
   * Lote findUnique
   */
  export type LoteFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Lote
     */
    select?: LoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Lote
     */
    omit?: LoteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LoteInclude<ExtArgs> | null
    /**
     * Filter, which Lote to fetch.
     */
    where: LoteWhereUniqueInput
  }

  /**
   * Lote findUniqueOrThrow
   */
  export type LoteFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Lote
     */
    select?: LoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Lote
     */
    omit?: LoteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LoteInclude<ExtArgs> | null
    /**
     * Filter, which Lote to fetch.
     */
    where: LoteWhereUniqueInput
  }

  /**
   * Lote findFirst
   */
  export type LoteFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Lote
     */
    select?: LoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Lote
     */
    omit?: LoteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LoteInclude<ExtArgs> | null
    /**
     * Filter, which Lote to fetch.
     */
    where?: LoteWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Lotes to fetch.
     */
    orderBy?: LoteOrderByWithRelationInput | LoteOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Lotes.
     */
    cursor?: LoteWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Lotes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Lotes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Lotes.
     */
    distinct?: LoteScalarFieldEnum | LoteScalarFieldEnum[]
  }

  /**
   * Lote findFirstOrThrow
   */
  export type LoteFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Lote
     */
    select?: LoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Lote
     */
    omit?: LoteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LoteInclude<ExtArgs> | null
    /**
     * Filter, which Lote to fetch.
     */
    where?: LoteWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Lotes to fetch.
     */
    orderBy?: LoteOrderByWithRelationInput | LoteOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Lotes.
     */
    cursor?: LoteWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Lotes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Lotes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Lotes.
     */
    distinct?: LoteScalarFieldEnum | LoteScalarFieldEnum[]
  }

  /**
   * Lote findMany
   */
  export type LoteFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Lote
     */
    select?: LoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Lote
     */
    omit?: LoteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LoteInclude<ExtArgs> | null
    /**
     * Filter, which Lotes to fetch.
     */
    where?: LoteWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Lotes to fetch.
     */
    orderBy?: LoteOrderByWithRelationInput | LoteOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Lotes.
     */
    cursor?: LoteWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Lotes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Lotes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Lotes.
     */
    distinct?: LoteScalarFieldEnum | LoteScalarFieldEnum[]
  }

  /**
   * Lote create
   */
  export type LoteCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Lote
     */
    select?: LoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Lote
     */
    omit?: LoteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LoteInclude<ExtArgs> | null
    /**
     * The data needed to create a Lote.
     */
    data: XOR<LoteCreateInput, LoteUncheckedCreateInput>
  }

  /**
   * Lote createMany
   */
  export type LoteCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Lotes.
     */
    data: LoteCreateManyInput | LoteCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Lote createManyAndReturn
   */
  export type LoteCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Lote
     */
    select?: LoteSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Lote
     */
    omit?: LoteOmit<ExtArgs> | null
    /**
     * The data used to create many Lotes.
     */
    data: LoteCreateManyInput | LoteCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Lote update
   */
  export type LoteUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Lote
     */
    select?: LoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Lote
     */
    omit?: LoteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LoteInclude<ExtArgs> | null
    /**
     * The data needed to update a Lote.
     */
    data: XOR<LoteUpdateInput, LoteUncheckedUpdateInput>
    /**
     * Choose, which Lote to update.
     */
    where: LoteWhereUniqueInput
  }

  /**
   * Lote updateMany
   */
  export type LoteUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Lotes.
     */
    data: XOR<LoteUpdateManyMutationInput, LoteUncheckedUpdateManyInput>
    /**
     * Filter which Lotes to update
     */
    where?: LoteWhereInput
    /**
     * Limit how many Lotes to update.
     */
    limit?: number
  }

  /**
   * Lote updateManyAndReturn
   */
  export type LoteUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Lote
     */
    select?: LoteSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Lote
     */
    omit?: LoteOmit<ExtArgs> | null
    /**
     * The data used to update Lotes.
     */
    data: XOR<LoteUpdateManyMutationInput, LoteUncheckedUpdateManyInput>
    /**
     * Filter which Lotes to update
     */
    where?: LoteWhereInput
    /**
     * Limit how many Lotes to update.
     */
    limit?: number
  }

  /**
   * Lote upsert
   */
  export type LoteUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Lote
     */
    select?: LoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Lote
     */
    omit?: LoteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LoteInclude<ExtArgs> | null
    /**
     * The filter to search for the Lote to update in case it exists.
     */
    where: LoteWhereUniqueInput
    /**
     * In case the Lote found by the `where` argument doesn't exist, create a new Lote with this data.
     */
    create: XOR<LoteCreateInput, LoteUncheckedCreateInput>
    /**
     * In case the Lote was found with the provided `where` argument, update it with this data.
     */
    update: XOR<LoteUpdateInput, LoteUncheckedUpdateInput>
  }

  /**
   * Lote delete
   */
  export type LoteDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Lote
     */
    select?: LoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Lote
     */
    omit?: LoteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LoteInclude<ExtArgs> | null
    /**
     * Filter which Lote to delete.
     */
    where: LoteWhereUniqueInput
  }

  /**
   * Lote deleteMany
   */
  export type LoteDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Lotes to delete
     */
    where?: LoteWhereInput
    /**
     * Limit how many Lotes to delete.
     */
    limit?: number
  }

  /**
   * Lote.animais
   */
  export type Lote$animaisArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Animal
     */
    select?: AnimalSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Animal
     */
    omit?: AnimalOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AnimalInclude<ExtArgs> | null
    where?: AnimalWhereInput
    orderBy?: AnimalOrderByWithRelationInput | AnimalOrderByWithRelationInput[]
    cursor?: AnimalWhereUniqueInput
    take?: number
    skip?: number
    distinct?: AnimalScalarFieldEnum | AnimalScalarFieldEnum[]
  }

  /**
   * Lote without action
   */
  export type LoteDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Lote
     */
    select?: LoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Lote
     */
    omit?: LoteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LoteInclude<ExtArgs> | null
  }


  /**
   * Model Fazenda
   */

  export type AggregateFazenda = {
    _count: FazendaCountAggregateOutputType | null
    _avg: FazendaAvgAggregateOutputType | null
    _sum: FazendaSumAggregateOutputType | null
    _min: FazendaMinAggregateOutputType | null
    _max: FazendaMaxAggregateOutputType | null
  }

  export type FazendaAvgAggregateOutputType = {
    id: number | null
  }

  export type FazendaSumAggregateOutputType = {
    id: number | null
  }

  export type FazendaMinAggregateOutputType = {
    id: number | null
    nome: string | null
  }

  export type FazendaMaxAggregateOutputType = {
    id: number | null
    nome: string | null
  }

  export type FazendaCountAggregateOutputType = {
    id: number
    nome: number
    _all: number
  }


  export type FazendaAvgAggregateInputType = {
    id?: true
  }

  export type FazendaSumAggregateInputType = {
    id?: true
  }

  export type FazendaMinAggregateInputType = {
    id?: true
    nome?: true
  }

  export type FazendaMaxAggregateInputType = {
    id?: true
    nome?: true
  }

  export type FazendaCountAggregateInputType = {
    id?: true
    nome?: true
    _all?: true
  }

  export type FazendaAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Fazenda to aggregate.
     */
    where?: FazendaWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Fazendas to fetch.
     */
    orderBy?: FazendaOrderByWithRelationInput | FazendaOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: FazendaWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Fazendas from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Fazendas.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Fazendas
    **/
    _count?: true | FazendaCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: FazendaAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: FazendaSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: FazendaMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: FazendaMaxAggregateInputType
  }

  export type GetFazendaAggregateType<T extends FazendaAggregateArgs> = {
        [P in keyof T & keyof AggregateFazenda]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateFazenda[P]>
      : GetScalarType<T[P], AggregateFazenda[P]>
  }




  export type FazendaGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: FazendaWhereInput
    orderBy?: FazendaOrderByWithAggregationInput | FazendaOrderByWithAggregationInput[]
    by: FazendaScalarFieldEnum[] | FazendaScalarFieldEnum
    having?: FazendaScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: FazendaCountAggregateInputType | true
    _avg?: FazendaAvgAggregateInputType
    _sum?: FazendaSumAggregateInputType
    _min?: FazendaMinAggregateInputType
    _max?: FazendaMaxAggregateInputType
  }

  export type FazendaGroupByOutputType = {
    id: number
    nome: string
    _count: FazendaCountAggregateOutputType | null
    _avg: FazendaAvgAggregateOutputType | null
    _sum: FazendaSumAggregateOutputType | null
    _min: FazendaMinAggregateOutputType | null
    _max: FazendaMaxAggregateOutputType | null
  }

  type GetFazendaGroupByPayload<T extends FazendaGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<FazendaGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof FazendaGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], FazendaGroupByOutputType[P]>
            : GetScalarType<T[P], FazendaGroupByOutputType[P]>
        }
      >
    >


  export type FazendaSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    nome?: boolean
    animaisOrigem?: boolean | Fazenda$animaisOrigemArgs<ExtArgs>
    _count?: boolean | FazendaCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["fazenda"]>

  export type FazendaSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    nome?: boolean
  }, ExtArgs["result"]["fazenda"]>

  export type FazendaSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    nome?: boolean
  }, ExtArgs["result"]["fazenda"]>

  export type FazendaSelectScalar = {
    id?: boolean
    nome?: boolean
  }

  export type FazendaOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "nome", ExtArgs["result"]["fazenda"]>
  export type FazendaInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    animaisOrigem?: boolean | Fazenda$animaisOrigemArgs<ExtArgs>
    _count?: boolean | FazendaCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type FazendaIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type FazendaIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $FazendaPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Fazenda"
    objects: {
      animaisOrigem: Prisma.$AnimalPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      nome: string
    }, ExtArgs["result"]["fazenda"]>
    composites: {}
  }

  type FazendaGetPayload<S extends boolean | null | undefined | FazendaDefaultArgs> = $Result.GetResult<Prisma.$FazendaPayload, S>

  type FazendaCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<FazendaFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: FazendaCountAggregateInputType | true
    }

  export interface FazendaDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Fazenda'], meta: { name: 'Fazenda' } }
    /**
     * Find zero or one Fazenda that matches the filter.
     * @param {FazendaFindUniqueArgs} args - Arguments to find a Fazenda
     * @example
     * // Get one Fazenda
     * const fazenda = await prisma.fazenda.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends FazendaFindUniqueArgs>(args: SelectSubset<T, FazendaFindUniqueArgs<ExtArgs>>): Prisma__FazendaClient<$Result.GetResult<Prisma.$FazendaPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Fazenda that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {FazendaFindUniqueOrThrowArgs} args - Arguments to find a Fazenda
     * @example
     * // Get one Fazenda
     * const fazenda = await prisma.fazenda.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends FazendaFindUniqueOrThrowArgs>(args: SelectSubset<T, FazendaFindUniqueOrThrowArgs<ExtArgs>>): Prisma__FazendaClient<$Result.GetResult<Prisma.$FazendaPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Fazenda that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FazendaFindFirstArgs} args - Arguments to find a Fazenda
     * @example
     * // Get one Fazenda
     * const fazenda = await prisma.fazenda.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends FazendaFindFirstArgs>(args?: SelectSubset<T, FazendaFindFirstArgs<ExtArgs>>): Prisma__FazendaClient<$Result.GetResult<Prisma.$FazendaPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Fazenda that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FazendaFindFirstOrThrowArgs} args - Arguments to find a Fazenda
     * @example
     * // Get one Fazenda
     * const fazenda = await prisma.fazenda.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends FazendaFindFirstOrThrowArgs>(args?: SelectSubset<T, FazendaFindFirstOrThrowArgs<ExtArgs>>): Prisma__FazendaClient<$Result.GetResult<Prisma.$FazendaPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Fazendas that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FazendaFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Fazendas
     * const fazendas = await prisma.fazenda.findMany()
     * 
     * // Get first 10 Fazendas
     * const fazendas = await prisma.fazenda.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const fazendaWithIdOnly = await prisma.fazenda.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends FazendaFindManyArgs>(args?: SelectSubset<T, FazendaFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$FazendaPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Fazenda.
     * @param {FazendaCreateArgs} args - Arguments to create a Fazenda.
     * @example
     * // Create one Fazenda
     * const Fazenda = await prisma.fazenda.create({
     *   data: {
     *     // ... data to create a Fazenda
     *   }
     * })
     * 
     */
    create<T extends FazendaCreateArgs>(args: SelectSubset<T, FazendaCreateArgs<ExtArgs>>): Prisma__FazendaClient<$Result.GetResult<Prisma.$FazendaPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Fazendas.
     * @param {FazendaCreateManyArgs} args - Arguments to create many Fazendas.
     * @example
     * // Create many Fazendas
     * const fazenda = await prisma.fazenda.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends FazendaCreateManyArgs>(args?: SelectSubset<T, FazendaCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Fazendas and returns the data saved in the database.
     * @param {FazendaCreateManyAndReturnArgs} args - Arguments to create many Fazendas.
     * @example
     * // Create many Fazendas
     * const fazenda = await prisma.fazenda.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Fazendas and only return the `id`
     * const fazendaWithIdOnly = await prisma.fazenda.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends FazendaCreateManyAndReturnArgs>(args?: SelectSubset<T, FazendaCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$FazendaPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Fazenda.
     * @param {FazendaDeleteArgs} args - Arguments to delete one Fazenda.
     * @example
     * // Delete one Fazenda
     * const Fazenda = await prisma.fazenda.delete({
     *   where: {
     *     // ... filter to delete one Fazenda
     *   }
     * })
     * 
     */
    delete<T extends FazendaDeleteArgs>(args: SelectSubset<T, FazendaDeleteArgs<ExtArgs>>): Prisma__FazendaClient<$Result.GetResult<Prisma.$FazendaPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Fazenda.
     * @param {FazendaUpdateArgs} args - Arguments to update one Fazenda.
     * @example
     * // Update one Fazenda
     * const fazenda = await prisma.fazenda.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends FazendaUpdateArgs>(args: SelectSubset<T, FazendaUpdateArgs<ExtArgs>>): Prisma__FazendaClient<$Result.GetResult<Prisma.$FazendaPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Fazendas.
     * @param {FazendaDeleteManyArgs} args - Arguments to filter Fazendas to delete.
     * @example
     * // Delete a few Fazendas
     * const { count } = await prisma.fazenda.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends FazendaDeleteManyArgs>(args?: SelectSubset<T, FazendaDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Fazendas.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FazendaUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Fazendas
     * const fazenda = await prisma.fazenda.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends FazendaUpdateManyArgs>(args: SelectSubset<T, FazendaUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Fazendas and returns the data updated in the database.
     * @param {FazendaUpdateManyAndReturnArgs} args - Arguments to update many Fazendas.
     * @example
     * // Update many Fazendas
     * const fazenda = await prisma.fazenda.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Fazendas and only return the `id`
     * const fazendaWithIdOnly = await prisma.fazenda.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends FazendaUpdateManyAndReturnArgs>(args: SelectSubset<T, FazendaUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$FazendaPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Fazenda.
     * @param {FazendaUpsertArgs} args - Arguments to update or create a Fazenda.
     * @example
     * // Update or create a Fazenda
     * const fazenda = await prisma.fazenda.upsert({
     *   create: {
     *     // ... data to create a Fazenda
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Fazenda we want to update
     *   }
     * })
     */
    upsert<T extends FazendaUpsertArgs>(args: SelectSubset<T, FazendaUpsertArgs<ExtArgs>>): Prisma__FazendaClient<$Result.GetResult<Prisma.$FazendaPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Fazendas.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FazendaCountArgs} args - Arguments to filter Fazendas to count.
     * @example
     * // Count the number of Fazendas
     * const count = await prisma.fazenda.count({
     *   where: {
     *     // ... the filter for the Fazendas we want to count
     *   }
     * })
    **/
    count<T extends FazendaCountArgs>(
      args?: Subset<T, FazendaCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], FazendaCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Fazenda.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FazendaAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends FazendaAggregateArgs>(args: Subset<T, FazendaAggregateArgs>): Prisma.PrismaPromise<GetFazendaAggregateType<T>>

    /**
     * Group by Fazenda.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FazendaGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends FazendaGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: FazendaGroupByArgs['orderBy'] }
        : { orderBy?: FazendaGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, FazendaGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetFazendaGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Fazenda model
   */
  readonly fields: FazendaFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Fazenda.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__FazendaClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    animaisOrigem<T extends Fazenda$animaisOrigemArgs<ExtArgs> = {}>(args?: Subset<T, Fazenda$animaisOrigemArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AnimalPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Fazenda model
   */
  interface FazendaFieldRefs {
    readonly id: FieldRef<"Fazenda", 'Int'>
    readonly nome: FieldRef<"Fazenda", 'String'>
  }
    

  // Custom InputTypes
  /**
   * Fazenda findUnique
   */
  export type FazendaFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Fazenda
     */
    select?: FazendaSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Fazenda
     */
    omit?: FazendaOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FazendaInclude<ExtArgs> | null
    /**
     * Filter, which Fazenda to fetch.
     */
    where: FazendaWhereUniqueInput
  }

  /**
   * Fazenda findUniqueOrThrow
   */
  export type FazendaFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Fazenda
     */
    select?: FazendaSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Fazenda
     */
    omit?: FazendaOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FazendaInclude<ExtArgs> | null
    /**
     * Filter, which Fazenda to fetch.
     */
    where: FazendaWhereUniqueInput
  }

  /**
   * Fazenda findFirst
   */
  export type FazendaFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Fazenda
     */
    select?: FazendaSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Fazenda
     */
    omit?: FazendaOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FazendaInclude<ExtArgs> | null
    /**
     * Filter, which Fazenda to fetch.
     */
    where?: FazendaWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Fazendas to fetch.
     */
    orderBy?: FazendaOrderByWithRelationInput | FazendaOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Fazendas.
     */
    cursor?: FazendaWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Fazendas from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Fazendas.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Fazendas.
     */
    distinct?: FazendaScalarFieldEnum | FazendaScalarFieldEnum[]
  }

  /**
   * Fazenda findFirstOrThrow
   */
  export type FazendaFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Fazenda
     */
    select?: FazendaSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Fazenda
     */
    omit?: FazendaOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FazendaInclude<ExtArgs> | null
    /**
     * Filter, which Fazenda to fetch.
     */
    where?: FazendaWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Fazendas to fetch.
     */
    orderBy?: FazendaOrderByWithRelationInput | FazendaOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Fazendas.
     */
    cursor?: FazendaWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Fazendas from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Fazendas.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Fazendas.
     */
    distinct?: FazendaScalarFieldEnum | FazendaScalarFieldEnum[]
  }

  /**
   * Fazenda findMany
   */
  export type FazendaFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Fazenda
     */
    select?: FazendaSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Fazenda
     */
    omit?: FazendaOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FazendaInclude<ExtArgs> | null
    /**
     * Filter, which Fazendas to fetch.
     */
    where?: FazendaWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Fazendas to fetch.
     */
    orderBy?: FazendaOrderByWithRelationInput | FazendaOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Fazendas.
     */
    cursor?: FazendaWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Fazendas from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Fazendas.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Fazendas.
     */
    distinct?: FazendaScalarFieldEnum | FazendaScalarFieldEnum[]
  }

  /**
   * Fazenda create
   */
  export type FazendaCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Fazenda
     */
    select?: FazendaSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Fazenda
     */
    omit?: FazendaOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FazendaInclude<ExtArgs> | null
    /**
     * The data needed to create a Fazenda.
     */
    data: XOR<FazendaCreateInput, FazendaUncheckedCreateInput>
  }

  /**
   * Fazenda createMany
   */
  export type FazendaCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Fazendas.
     */
    data: FazendaCreateManyInput | FazendaCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Fazenda createManyAndReturn
   */
  export type FazendaCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Fazenda
     */
    select?: FazendaSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Fazenda
     */
    omit?: FazendaOmit<ExtArgs> | null
    /**
     * The data used to create many Fazendas.
     */
    data: FazendaCreateManyInput | FazendaCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Fazenda update
   */
  export type FazendaUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Fazenda
     */
    select?: FazendaSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Fazenda
     */
    omit?: FazendaOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FazendaInclude<ExtArgs> | null
    /**
     * The data needed to update a Fazenda.
     */
    data: XOR<FazendaUpdateInput, FazendaUncheckedUpdateInput>
    /**
     * Choose, which Fazenda to update.
     */
    where: FazendaWhereUniqueInput
  }

  /**
   * Fazenda updateMany
   */
  export type FazendaUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Fazendas.
     */
    data: XOR<FazendaUpdateManyMutationInput, FazendaUncheckedUpdateManyInput>
    /**
     * Filter which Fazendas to update
     */
    where?: FazendaWhereInput
    /**
     * Limit how many Fazendas to update.
     */
    limit?: number
  }

  /**
   * Fazenda updateManyAndReturn
   */
  export type FazendaUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Fazenda
     */
    select?: FazendaSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Fazenda
     */
    omit?: FazendaOmit<ExtArgs> | null
    /**
     * The data used to update Fazendas.
     */
    data: XOR<FazendaUpdateManyMutationInput, FazendaUncheckedUpdateManyInput>
    /**
     * Filter which Fazendas to update
     */
    where?: FazendaWhereInput
    /**
     * Limit how many Fazendas to update.
     */
    limit?: number
  }

  /**
   * Fazenda upsert
   */
  export type FazendaUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Fazenda
     */
    select?: FazendaSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Fazenda
     */
    omit?: FazendaOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FazendaInclude<ExtArgs> | null
    /**
     * The filter to search for the Fazenda to update in case it exists.
     */
    where: FazendaWhereUniqueInput
    /**
     * In case the Fazenda found by the `where` argument doesn't exist, create a new Fazenda with this data.
     */
    create: XOR<FazendaCreateInput, FazendaUncheckedCreateInput>
    /**
     * In case the Fazenda was found with the provided `where` argument, update it with this data.
     */
    update: XOR<FazendaUpdateInput, FazendaUncheckedUpdateInput>
  }

  /**
   * Fazenda delete
   */
  export type FazendaDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Fazenda
     */
    select?: FazendaSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Fazenda
     */
    omit?: FazendaOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FazendaInclude<ExtArgs> | null
    /**
     * Filter which Fazenda to delete.
     */
    where: FazendaWhereUniqueInput
  }

  /**
   * Fazenda deleteMany
   */
  export type FazendaDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Fazendas to delete
     */
    where?: FazendaWhereInput
    /**
     * Limit how many Fazendas to delete.
     */
    limit?: number
  }

  /**
   * Fazenda.animaisOrigem
   */
  export type Fazenda$animaisOrigemArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Animal
     */
    select?: AnimalSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Animal
     */
    omit?: AnimalOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AnimalInclude<ExtArgs> | null
    where?: AnimalWhereInput
    orderBy?: AnimalOrderByWithRelationInput | AnimalOrderByWithRelationInput[]
    cursor?: AnimalWhereUniqueInput
    take?: number
    skip?: number
    distinct?: AnimalScalarFieldEnum | AnimalScalarFieldEnum[]
  }

  /**
   * Fazenda without action
   */
  export type FazendaDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Fazenda
     */
    select?: FazendaSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Fazenda
     */
    omit?: FazendaOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FazendaInclude<ExtArgs> | null
  }


  /**
   * Model Animal
   */

  export type AggregateAnimal = {
    _count: AnimalCountAggregateOutputType | null
    _avg: AnimalAvgAggregateOutputType | null
    _sum: AnimalSumAggregateOutputType | null
    _min: AnimalMinAggregateOutputType | null
    _max: AnimalMaxAggregateOutputType | null
  }

  export type AnimalAvgAggregateOutputType = {
    peso_nascimento_kg: number | null
    raca_id: number | null
    lote_id: number | null
    fazenda_origem_id: number | null
    valor_compra: number | null
    idade_entrada_meses: number | null
    peso_atual_kg: number | null
  }

  export type AnimalSumAggregateOutputType = {
    peso_nascimento_kg: number | null
    raca_id: number | null
    lote_id: number | null
    fazenda_origem_id: number | null
    valor_compra: number | null
    idade_entrada_meses: number | null
    peso_atual_kg: number | null
  }

  export type AnimalMinAggregateOutputType = {
    id: string | null
    rfid: string | null
    brinco: string | null
    nome_apelido: string | null
    sexo: $Enums.Sexo | null
    data_nascimento: Date | null
    peso_nascimento_kg: number | null
    origem: $Enums.AnimalOrigem | null
    status: $Enums.AnimalStatus | null
    raca_id: number | null
    lote_id: number | null
    mae_id: string | null
    pai_id: string | null
    fazenda_origem_id: number | null
    fazenda_origem_nome: string | null
    data_aquisicao: Date | null
    valor_compra: number | null
    idade_entrada_meses: number | null
    peso_atual_kg: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type AnimalMaxAggregateOutputType = {
    id: string | null
    rfid: string | null
    brinco: string | null
    nome_apelido: string | null
    sexo: $Enums.Sexo | null
    data_nascimento: Date | null
    peso_nascimento_kg: number | null
    origem: $Enums.AnimalOrigem | null
    status: $Enums.AnimalStatus | null
    raca_id: number | null
    lote_id: number | null
    mae_id: string | null
    pai_id: string | null
    fazenda_origem_id: number | null
    fazenda_origem_nome: string | null
    data_aquisicao: Date | null
    valor_compra: number | null
    idade_entrada_meses: number | null
    peso_atual_kg: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type AnimalCountAggregateOutputType = {
    id: number
    rfid: number
    brinco: number
    nome_apelido: number
    sexo: number
    data_nascimento: number
    peso_nascimento_kg: number
    origem: number
    status: number
    raca_id: number
    lote_id: number
    mae_id: number
    pai_id: number
    fazenda_origem_id: number
    fazenda_origem_nome: number
    data_aquisicao: number
    valor_compra: number
    idade_entrada_meses: number
    peso_atual_kg: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type AnimalAvgAggregateInputType = {
    peso_nascimento_kg?: true
    raca_id?: true
    lote_id?: true
    fazenda_origem_id?: true
    valor_compra?: true
    idade_entrada_meses?: true
    peso_atual_kg?: true
  }

  export type AnimalSumAggregateInputType = {
    peso_nascimento_kg?: true
    raca_id?: true
    lote_id?: true
    fazenda_origem_id?: true
    valor_compra?: true
    idade_entrada_meses?: true
    peso_atual_kg?: true
  }

  export type AnimalMinAggregateInputType = {
    id?: true
    rfid?: true
    brinco?: true
    nome_apelido?: true
    sexo?: true
    data_nascimento?: true
    peso_nascimento_kg?: true
    origem?: true
    status?: true
    raca_id?: true
    lote_id?: true
    mae_id?: true
    pai_id?: true
    fazenda_origem_id?: true
    fazenda_origem_nome?: true
    data_aquisicao?: true
    valor_compra?: true
    idade_entrada_meses?: true
    peso_atual_kg?: true
    createdAt?: true
    updatedAt?: true
  }

  export type AnimalMaxAggregateInputType = {
    id?: true
    rfid?: true
    brinco?: true
    nome_apelido?: true
    sexo?: true
    data_nascimento?: true
    peso_nascimento_kg?: true
    origem?: true
    status?: true
    raca_id?: true
    lote_id?: true
    mae_id?: true
    pai_id?: true
    fazenda_origem_id?: true
    fazenda_origem_nome?: true
    data_aquisicao?: true
    valor_compra?: true
    idade_entrada_meses?: true
    peso_atual_kg?: true
    createdAt?: true
    updatedAt?: true
  }

  export type AnimalCountAggregateInputType = {
    id?: true
    rfid?: true
    brinco?: true
    nome_apelido?: true
    sexo?: true
    data_nascimento?: true
    peso_nascimento_kg?: true
    origem?: true
    status?: true
    raca_id?: true
    lote_id?: true
    mae_id?: true
    pai_id?: true
    fazenda_origem_id?: true
    fazenda_origem_nome?: true
    data_aquisicao?: true
    valor_compra?: true
    idade_entrada_meses?: true
    peso_atual_kg?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type AnimalAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Animal to aggregate.
     */
    where?: AnimalWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Animals to fetch.
     */
    orderBy?: AnimalOrderByWithRelationInput | AnimalOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: AnimalWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Animals from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Animals.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Animals
    **/
    _count?: true | AnimalCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: AnimalAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: AnimalSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: AnimalMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: AnimalMaxAggregateInputType
  }

  export type GetAnimalAggregateType<T extends AnimalAggregateArgs> = {
        [P in keyof T & keyof AggregateAnimal]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateAnimal[P]>
      : GetScalarType<T[P], AggregateAnimal[P]>
  }




  export type AnimalGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: AnimalWhereInput
    orderBy?: AnimalOrderByWithAggregationInput | AnimalOrderByWithAggregationInput[]
    by: AnimalScalarFieldEnum[] | AnimalScalarFieldEnum
    having?: AnimalScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: AnimalCountAggregateInputType | true
    _avg?: AnimalAvgAggregateInputType
    _sum?: AnimalSumAggregateInputType
    _min?: AnimalMinAggregateInputType
    _max?: AnimalMaxAggregateInputType
  }

  export type AnimalGroupByOutputType = {
    id: string
    rfid: string | null
    brinco: string | null
    nome_apelido: string | null
    sexo: $Enums.Sexo
    data_nascimento: Date | null
    peso_nascimento_kg: number | null
    origem: $Enums.AnimalOrigem
    status: $Enums.AnimalStatus
    raca_id: number | null
    lote_id: number | null
    mae_id: string | null
    pai_id: string | null
    fazenda_origem_id: number | null
    fazenda_origem_nome: string | null
    data_aquisicao: Date | null
    valor_compra: number | null
    idade_entrada_meses: number | null
    peso_atual_kg: number | null
    createdAt: Date
    updatedAt: Date
    _count: AnimalCountAggregateOutputType | null
    _avg: AnimalAvgAggregateOutputType | null
    _sum: AnimalSumAggregateOutputType | null
    _min: AnimalMinAggregateOutputType | null
    _max: AnimalMaxAggregateOutputType | null
  }

  type GetAnimalGroupByPayload<T extends AnimalGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<AnimalGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof AnimalGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], AnimalGroupByOutputType[P]>
            : GetScalarType<T[P], AnimalGroupByOutputType[P]>
        }
      >
    >


  export type AnimalSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    rfid?: boolean
    brinco?: boolean
    nome_apelido?: boolean
    sexo?: boolean
    data_nascimento?: boolean
    peso_nascimento_kg?: boolean
    origem?: boolean
    status?: boolean
    raca_id?: boolean
    lote_id?: boolean
    mae_id?: boolean
    pai_id?: boolean
    fazenda_origem_id?: boolean
    fazenda_origem_nome?: boolean
    data_aquisicao?: boolean
    valor_compra?: boolean
    idade_entrada_meses?: boolean
    peso_atual_kg?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    raca?: boolean | Animal$racaArgs<ExtArgs>
    lote?: boolean | Animal$loteArgs<ExtArgs>
    mae?: boolean | Animal$maeArgs<ExtArgs>
    filhosMae?: boolean | Animal$filhosMaeArgs<ExtArgs>
    pai?: boolean | Animal$paiArgs<ExtArgs>
    filhosPai?: boolean | Animal$filhosPaiArgs<ExtArgs>
    fazenda_origem?: boolean | Animal$fazenda_origemArgs<ExtArgs>
    _count?: boolean | AnimalCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["animal"]>

  export type AnimalSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    rfid?: boolean
    brinco?: boolean
    nome_apelido?: boolean
    sexo?: boolean
    data_nascimento?: boolean
    peso_nascimento_kg?: boolean
    origem?: boolean
    status?: boolean
    raca_id?: boolean
    lote_id?: boolean
    mae_id?: boolean
    pai_id?: boolean
    fazenda_origem_id?: boolean
    fazenda_origem_nome?: boolean
    data_aquisicao?: boolean
    valor_compra?: boolean
    idade_entrada_meses?: boolean
    peso_atual_kg?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    raca?: boolean | Animal$racaArgs<ExtArgs>
    lote?: boolean | Animal$loteArgs<ExtArgs>
    mae?: boolean | Animal$maeArgs<ExtArgs>
    pai?: boolean | Animal$paiArgs<ExtArgs>
    fazenda_origem?: boolean | Animal$fazenda_origemArgs<ExtArgs>
  }, ExtArgs["result"]["animal"]>

  export type AnimalSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    rfid?: boolean
    brinco?: boolean
    nome_apelido?: boolean
    sexo?: boolean
    data_nascimento?: boolean
    peso_nascimento_kg?: boolean
    origem?: boolean
    status?: boolean
    raca_id?: boolean
    lote_id?: boolean
    mae_id?: boolean
    pai_id?: boolean
    fazenda_origem_id?: boolean
    fazenda_origem_nome?: boolean
    data_aquisicao?: boolean
    valor_compra?: boolean
    idade_entrada_meses?: boolean
    peso_atual_kg?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    raca?: boolean | Animal$racaArgs<ExtArgs>
    lote?: boolean | Animal$loteArgs<ExtArgs>
    mae?: boolean | Animal$maeArgs<ExtArgs>
    pai?: boolean | Animal$paiArgs<ExtArgs>
    fazenda_origem?: boolean | Animal$fazenda_origemArgs<ExtArgs>
  }, ExtArgs["result"]["animal"]>

  export type AnimalSelectScalar = {
    id?: boolean
    rfid?: boolean
    brinco?: boolean
    nome_apelido?: boolean
    sexo?: boolean
    data_nascimento?: boolean
    peso_nascimento_kg?: boolean
    origem?: boolean
    status?: boolean
    raca_id?: boolean
    lote_id?: boolean
    mae_id?: boolean
    pai_id?: boolean
    fazenda_origem_id?: boolean
    fazenda_origem_nome?: boolean
    data_aquisicao?: boolean
    valor_compra?: boolean
    idade_entrada_meses?: boolean
    peso_atual_kg?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type AnimalOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "rfid" | "brinco" | "nome_apelido" | "sexo" | "data_nascimento" | "peso_nascimento_kg" | "origem" | "status" | "raca_id" | "lote_id" | "mae_id" | "pai_id" | "fazenda_origem_id" | "fazenda_origem_nome" | "data_aquisicao" | "valor_compra" | "idade_entrada_meses" | "peso_atual_kg" | "createdAt" | "updatedAt", ExtArgs["result"]["animal"]>
  export type AnimalInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    raca?: boolean | Animal$racaArgs<ExtArgs>
    lote?: boolean | Animal$loteArgs<ExtArgs>
    mae?: boolean | Animal$maeArgs<ExtArgs>
    filhosMae?: boolean | Animal$filhosMaeArgs<ExtArgs>
    pai?: boolean | Animal$paiArgs<ExtArgs>
    filhosPai?: boolean | Animal$filhosPaiArgs<ExtArgs>
    fazenda_origem?: boolean | Animal$fazenda_origemArgs<ExtArgs>
    _count?: boolean | AnimalCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type AnimalIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    raca?: boolean | Animal$racaArgs<ExtArgs>
    lote?: boolean | Animal$loteArgs<ExtArgs>
    mae?: boolean | Animal$maeArgs<ExtArgs>
    pai?: boolean | Animal$paiArgs<ExtArgs>
    fazenda_origem?: boolean | Animal$fazenda_origemArgs<ExtArgs>
  }
  export type AnimalIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    raca?: boolean | Animal$racaArgs<ExtArgs>
    lote?: boolean | Animal$loteArgs<ExtArgs>
    mae?: boolean | Animal$maeArgs<ExtArgs>
    pai?: boolean | Animal$paiArgs<ExtArgs>
    fazenda_origem?: boolean | Animal$fazenda_origemArgs<ExtArgs>
  }

  export type $AnimalPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Animal"
    objects: {
      raca: Prisma.$RacaPayload<ExtArgs> | null
      lote: Prisma.$LotePayload<ExtArgs> | null
      mae: Prisma.$AnimalPayload<ExtArgs> | null
      filhosMae: Prisma.$AnimalPayload<ExtArgs>[]
      pai: Prisma.$AnimalPayload<ExtArgs> | null
      filhosPai: Prisma.$AnimalPayload<ExtArgs>[]
      fazenda_origem: Prisma.$FazendaPayload<ExtArgs> | null
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      rfid: string | null
      brinco: string | null
      nome_apelido: string | null
      sexo: $Enums.Sexo
      data_nascimento: Date | null
      peso_nascimento_kg: number | null
      origem: $Enums.AnimalOrigem
      status: $Enums.AnimalStatus
      raca_id: number | null
      lote_id: number | null
      mae_id: string | null
      pai_id: string | null
      fazenda_origem_id: number | null
      fazenda_origem_nome: string | null
      data_aquisicao: Date | null
      valor_compra: number | null
      idade_entrada_meses: number | null
      peso_atual_kg: number | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["animal"]>
    composites: {}
  }

  type AnimalGetPayload<S extends boolean | null | undefined | AnimalDefaultArgs> = $Result.GetResult<Prisma.$AnimalPayload, S>

  type AnimalCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<AnimalFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: AnimalCountAggregateInputType | true
    }

  export interface AnimalDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Animal'], meta: { name: 'Animal' } }
    /**
     * Find zero or one Animal that matches the filter.
     * @param {AnimalFindUniqueArgs} args - Arguments to find a Animal
     * @example
     * // Get one Animal
     * const animal = await prisma.animal.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends AnimalFindUniqueArgs>(args: SelectSubset<T, AnimalFindUniqueArgs<ExtArgs>>): Prisma__AnimalClient<$Result.GetResult<Prisma.$AnimalPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Animal that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {AnimalFindUniqueOrThrowArgs} args - Arguments to find a Animal
     * @example
     * // Get one Animal
     * const animal = await prisma.animal.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends AnimalFindUniqueOrThrowArgs>(args: SelectSubset<T, AnimalFindUniqueOrThrowArgs<ExtArgs>>): Prisma__AnimalClient<$Result.GetResult<Prisma.$AnimalPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Animal that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AnimalFindFirstArgs} args - Arguments to find a Animal
     * @example
     * // Get one Animal
     * const animal = await prisma.animal.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends AnimalFindFirstArgs>(args?: SelectSubset<T, AnimalFindFirstArgs<ExtArgs>>): Prisma__AnimalClient<$Result.GetResult<Prisma.$AnimalPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Animal that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AnimalFindFirstOrThrowArgs} args - Arguments to find a Animal
     * @example
     * // Get one Animal
     * const animal = await prisma.animal.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends AnimalFindFirstOrThrowArgs>(args?: SelectSubset<T, AnimalFindFirstOrThrowArgs<ExtArgs>>): Prisma__AnimalClient<$Result.GetResult<Prisma.$AnimalPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Animals that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AnimalFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Animals
     * const animals = await prisma.animal.findMany()
     * 
     * // Get first 10 Animals
     * const animals = await prisma.animal.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const animalWithIdOnly = await prisma.animal.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends AnimalFindManyArgs>(args?: SelectSubset<T, AnimalFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AnimalPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Animal.
     * @param {AnimalCreateArgs} args - Arguments to create a Animal.
     * @example
     * // Create one Animal
     * const Animal = await prisma.animal.create({
     *   data: {
     *     // ... data to create a Animal
     *   }
     * })
     * 
     */
    create<T extends AnimalCreateArgs>(args: SelectSubset<T, AnimalCreateArgs<ExtArgs>>): Prisma__AnimalClient<$Result.GetResult<Prisma.$AnimalPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Animals.
     * @param {AnimalCreateManyArgs} args - Arguments to create many Animals.
     * @example
     * // Create many Animals
     * const animal = await prisma.animal.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends AnimalCreateManyArgs>(args?: SelectSubset<T, AnimalCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Animals and returns the data saved in the database.
     * @param {AnimalCreateManyAndReturnArgs} args - Arguments to create many Animals.
     * @example
     * // Create many Animals
     * const animal = await prisma.animal.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Animals and only return the `id`
     * const animalWithIdOnly = await prisma.animal.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends AnimalCreateManyAndReturnArgs>(args?: SelectSubset<T, AnimalCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AnimalPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Animal.
     * @param {AnimalDeleteArgs} args - Arguments to delete one Animal.
     * @example
     * // Delete one Animal
     * const Animal = await prisma.animal.delete({
     *   where: {
     *     // ... filter to delete one Animal
     *   }
     * })
     * 
     */
    delete<T extends AnimalDeleteArgs>(args: SelectSubset<T, AnimalDeleteArgs<ExtArgs>>): Prisma__AnimalClient<$Result.GetResult<Prisma.$AnimalPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Animal.
     * @param {AnimalUpdateArgs} args - Arguments to update one Animal.
     * @example
     * // Update one Animal
     * const animal = await prisma.animal.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends AnimalUpdateArgs>(args: SelectSubset<T, AnimalUpdateArgs<ExtArgs>>): Prisma__AnimalClient<$Result.GetResult<Prisma.$AnimalPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Animals.
     * @param {AnimalDeleteManyArgs} args - Arguments to filter Animals to delete.
     * @example
     * // Delete a few Animals
     * const { count } = await prisma.animal.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends AnimalDeleteManyArgs>(args?: SelectSubset<T, AnimalDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Animals.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AnimalUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Animals
     * const animal = await prisma.animal.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends AnimalUpdateManyArgs>(args: SelectSubset<T, AnimalUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Animals and returns the data updated in the database.
     * @param {AnimalUpdateManyAndReturnArgs} args - Arguments to update many Animals.
     * @example
     * // Update many Animals
     * const animal = await prisma.animal.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Animals and only return the `id`
     * const animalWithIdOnly = await prisma.animal.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends AnimalUpdateManyAndReturnArgs>(args: SelectSubset<T, AnimalUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AnimalPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Animal.
     * @param {AnimalUpsertArgs} args - Arguments to update or create a Animal.
     * @example
     * // Update or create a Animal
     * const animal = await prisma.animal.upsert({
     *   create: {
     *     // ... data to create a Animal
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Animal we want to update
     *   }
     * })
     */
    upsert<T extends AnimalUpsertArgs>(args: SelectSubset<T, AnimalUpsertArgs<ExtArgs>>): Prisma__AnimalClient<$Result.GetResult<Prisma.$AnimalPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Animals.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AnimalCountArgs} args - Arguments to filter Animals to count.
     * @example
     * // Count the number of Animals
     * const count = await prisma.animal.count({
     *   where: {
     *     // ... the filter for the Animals we want to count
     *   }
     * })
    **/
    count<T extends AnimalCountArgs>(
      args?: Subset<T, AnimalCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], AnimalCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Animal.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AnimalAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends AnimalAggregateArgs>(args: Subset<T, AnimalAggregateArgs>): Prisma.PrismaPromise<GetAnimalAggregateType<T>>

    /**
     * Group by Animal.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AnimalGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends AnimalGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: AnimalGroupByArgs['orderBy'] }
        : { orderBy?: AnimalGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, AnimalGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetAnimalGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Animal model
   */
  readonly fields: AnimalFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Animal.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__AnimalClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    raca<T extends Animal$racaArgs<ExtArgs> = {}>(args?: Subset<T, Animal$racaArgs<ExtArgs>>): Prisma__RacaClient<$Result.GetResult<Prisma.$RacaPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    lote<T extends Animal$loteArgs<ExtArgs> = {}>(args?: Subset<T, Animal$loteArgs<ExtArgs>>): Prisma__LoteClient<$Result.GetResult<Prisma.$LotePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    mae<T extends Animal$maeArgs<ExtArgs> = {}>(args?: Subset<T, Animal$maeArgs<ExtArgs>>): Prisma__AnimalClient<$Result.GetResult<Prisma.$AnimalPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    filhosMae<T extends Animal$filhosMaeArgs<ExtArgs> = {}>(args?: Subset<T, Animal$filhosMaeArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AnimalPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    pai<T extends Animal$paiArgs<ExtArgs> = {}>(args?: Subset<T, Animal$paiArgs<ExtArgs>>): Prisma__AnimalClient<$Result.GetResult<Prisma.$AnimalPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    filhosPai<T extends Animal$filhosPaiArgs<ExtArgs> = {}>(args?: Subset<T, Animal$filhosPaiArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AnimalPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    fazenda_origem<T extends Animal$fazenda_origemArgs<ExtArgs> = {}>(args?: Subset<T, Animal$fazenda_origemArgs<ExtArgs>>): Prisma__FazendaClient<$Result.GetResult<Prisma.$FazendaPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Animal model
   */
  interface AnimalFieldRefs {
    readonly id: FieldRef<"Animal", 'String'>
    readonly rfid: FieldRef<"Animal", 'String'>
    readonly brinco: FieldRef<"Animal", 'String'>
    readonly nome_apelido: FieldRef<"Animal", 'String'>
    readonly sexo: FieldRef<"Animal", 'Sexo'>
    readonly data_nascimento: FieldRef<"Animal", 'DateTime'>
    readonly peso_nascimento_kg: FieldRef<"Animal", 'Float'>
    readonly origem: FieldRef<"Animal", 'AnimalOrigem'>
    readonly status: FieldRef<"Animal", 'AnimalStatus'>
    readonly raca_id: FieldRef<"Animal", 'Int'>
    readonly lote_id: FieldRef<"Animal", 'Int'>
    readonly mae_id: FieldRef<"Animal", 'String'>
    readonly pai_id: FieldRef<"Animal", 'String'>
    readonly fazenda_origem_id: FieldRef<"Animal", 'Int'>
    readonly fazenda_origem_nome: FieldRef<"Animal", 'String'>
    readonly data_aquisicao: FieldRef<"Animal", 'DateTime'>
    readonly valor_compra: FieldRef<"Animal", 'Float'>
    readonly idade_entrada_meses: FieldRef<"Animal", 'Int'>
    readonly peso_atual_kg: FieldRef<"Animal", 'Float'>
    readonly createdAt: FieldRef<"Animal", 'DateTime'>
    readonly updatedAt: FieldRef<"Animal", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Animal findUnique
   */
  export type AnimalFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Animal
     */
    select?: AnimalSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Animal
     */
    omit?: AnimalOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AnimalInclude<ExtArgs> | null
    /**
     * Filter, which Animal to fetch.
     */
    where: AnimalWhereUniqueInput
  }

  /**
   * Animal findUniqueOrThrow
   */
  export type AnimalFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Animal
     */
    select?: AnimalSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Animal
     */
    omit?: AnimalOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AnimalInclude<ExtArgs> | null
    /**
     * Filter, which Animal to fetch.
     */
    where: AnimalWhereUniqueInput
  }

  /**
   * Animal findFirst
   */
  export type AnimalFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Animal
     */
    select?: AnimalSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Animal
     */
    omit?: AnimalOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AnimalInclude<ExtArgs> | null
    /**
     * Filter, which Animal to fetch.
     */
    where?: AnimalWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Animals to fetch.
     */
    orderBy?: AnimalOrderByWithRelationInput | AnimalOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Animals.
     */
    cursor?: AnimalWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Animals from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Animals.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Animals.
     */
    distinct?: AnimalScalarFieldEnum | AnimalScalarFieldEnum[]
  }

  /**
   * Animal findFirstOrThrow
   */
  export type AnimalFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Animal
     */
    select?: AnimalSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Animal
     */
    omit?: AnimalOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AnimalInclude<ExtArgs> | null
    /**
     * Filter, which Animal to fetch.
     */
    where?: AnimalWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Animals to fetch.
     */
    orderBy?: AnimalOrderByWithRelationInput | AnimalOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Animals.
     */
    cursor?: AnimalWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Animals from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Animals.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Animals.
     */
    distinct?: AnimalScalarFieldEnum | AnimalScalarFieldEnum[]
  }

  /**
   * Animal findMany
   */
  export type AnimalFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Animal
     */
    select?: AnimalSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Animal
     */
    omit?: AnimalOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AnimalInclude<ExtArgs> | null
    /**
     * Filter, which Animals to fetch.
     */
    where?: AnimalWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Animals to fetch.
     */
    orderBy?: AnimalOrderByWithRelationInput | AnimalOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Animals.
     */
    cursor?: AnimalWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Animals from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Animals.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Animals.
     */
    distinct?: AnimalScalarFieldEnum | AnimalScalarFieldEnum[]
  }

  /**
   * Animal create
   */
  export type AnimalCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Animal
     */
    select?: AnimalSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Animal
     */
    omit?: AnimalOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AnimalInclude<ExtArgs> | null
    /**
     * The data needed to create a Animal.
     */
    data: XOR<AnimalCreateInput, AnimalUncheckedCreateInput>
  }

  /**
   * Animal createMany
   */
  export type AnimalCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Animals.
     */
    data: AnimalCreateManyInput | AnimalCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Animal createManyAndReturn
   */
  export type AnimalCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Animal
     */
    select?: AnimalSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Animal
     */
    omit?: AnimalOmit<ExtArgs> | null
    /**
     * The data used to create many Animals.
     */
    data: AnimalCreateManyInput | AnimalCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AnimalIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Animal update
   */
  export type AnimalUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Animal
     */
    select?: AnimalSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Animal
     */
    omit?: AnimalOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AnimalInclude<ExtArgs> | null
    /**
     * The data needed to update a Animal.
     */
    data: XOR<AnimalUpdateInput, AnimalUncheckedUpdateInput>
    /**
     * Choose, which Animal to update.
     */
    where: AnimalWhereUniqueInput
  }

  /**
   * Animal updateMany
   */
  export type AnimalUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Animals.
     */
    data: XOR<AnimalUpdateManyMutationInput, AnimalUncheckedUpdateManyInput>
    /**
     * Filter which Animals to update
     */
    where?: AnimalWhereInput
    /**
     * Limit how many Animals to update.
     */
    limit?: number
  }

  /**
   * Animal updateManyAndReturn
   */
  export type AnimalUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Animal
     */
    select?: AnimalSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Animal
     */
    omit?: AnimalOmit<ExtArgs> | null
    /**
     * The data used to update Animals.
     */
    data: XOR<AnimalUpdateManyMutationInput, AnimalUncheckedUpdateManyInput>
    /**
     * Filter which Animals to update
     */
    where?: AnimalWhereInput
    /**
     * Limit how many Animals to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AnimalIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Animal upsert
   */
  export type AnimalUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Animal
     */
    select?: AnimalSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Animal
     */
    omit?: AnimalOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AnimalInclude<ExtArgs> | null
    /**
     * The filter to search for the Animal to update in case it exists.
     */
    where: AnimalWhereUniqueInput
    /**
     * In case the Animal found by the `where` argument doesn't exist, create a new Animal with this data.
     */
    create: XOR<AnimalCreateInput, AnimalUncheckedCreateInput>
    /**
     * In case the Animal was found with the provided `where` argument, update it with this data.
     */
    update: XOR<AnimalUpdateInput, AnimalUncheckedUpdateInput>
  }

  /**
   * Animal delete
   */
  export type AnimalDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Animal
     */
    select?: AnimalSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Animal
     */
    omit?: AnimalOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AnimalInclude<ExtArgs> | null
    /**
     * Filter which Animal to delete.
     */
    where: AnimalWhereUniqueInput
  }

  /**
   * Animal deleteMany
   */
  export type AnimalDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Animals to delete
     */
    where?: AnimalWhereInput
    /**
     * Limit how many Animals to delete.
     */
    limit?: number
  }

  /**
   * Animal.raca
   */
  export type Animal$racaArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Raca
     */
    select?: RacaSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Raca
     */
    omit?: RacaOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RacaInclude<ExtArgs> | null
    where?: RacaWhereInput
  }

  /**
   * Animal.lote
   */
  export type Animal$loteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Lote
     */
    select?: LoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Lote
     */
    omit?: LoteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LoteInclude<ExtArgs> | null
    where?: LoteWhereInput
  }

  /**
   * Animal.mae
   */
  export type Animal$maeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Animal
     */
    select?: AnimalSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Animal
     */
    omit?: AnimalOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AnimalInclude<ExtArgs> | null
    where?: AnimalWhereInput
  }

  /**
   * Animal.filhosMae
   */
  export type Animal$filhosMaeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Animal
     */
    select?: AnimalSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Animal
     */
    omit?: AnimalOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AnimalInclude<ExtArgs> | null
    where?: AnimalWhereInput
    orderBy?: AnimalOrderByWithRelationInput | AnimalOrderByWithRelationInput[]
    cursor?: AnimalWhereUniqueInput
    take?: number
    skip?: number
    distinct?: AnimalScalarFieldEnum | AnimalScalarFieldEnum[]
  }

  /**
   * Animal.pai
   */
  export type Animal$paiArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Animal
     */
    select?: AnimalSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Animal
     */
    omit?: AnimalOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AnimalInclude<ExtArgs> | null
    where?: AnimalWhereInput
  }

  /**
   * Animal.filhosPai
   */
  export type Animal$filhosPaiArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Animal
     */
    select?: AnimalSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Animal
     */
    omit?: AnimalOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AnimalInclude<ExtArgs> | null
    where?: AnimalWhereInput
    orderBy?: AnimalOrderByWithRelationInput | AnimalOrderByWithRelationInput[]
    cursor?: AnimalWhereUniqueInput
    take?: number
    skip?: number
    distinct?: AnimalScalarFieldEnum | AnimalScalarFieldEnum[]
  }

  /**
   * Animal.fazenda_origem
   */
  export type Animal$fazenda_origemArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Fazenda
     */
    select?: FazendaSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Fazenda
     */
    omit?: FazendaOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FazendaInclude<ExtArgs> | null
    where?: FazendaWhereInput
  }

  /**
   * Animal without action
   */
  export type AnimalDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Animal
     */
    select?: AnimalSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Animal
     */
    omit?: AnimalOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AnimalInclude<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const UserScalarFieldEnum: {
    id: 'id',
    email: 'email',
    name: 'name'
  };

  export type UserScalarFieldEnum = (typeof UserScalarFieldEnum)[keyof typeof UserScalarFieldEnum]


  export const PostScalarFieldEnum: {
    id: 'id',
    title: 'title',
    content: 'content',
    published: 'published',
    authorId: 'authorId'
  };

  export type PostScalarFieldEnum = (typeof PostScalarFieldEnum)[keyof typeof PostScalarFieldEnum]


  export const PerformanceTestScalarFieldEnum: {
    id: 'id',
    description: 'description',
    date: 'date'
  };

  export type PerformanceTestScalarFieldEnum = (typeof PerformanceTestScalarFieldEnum)[keyof typeof PerformanceTestScalarFieldEnum]


  export const RacaScalarFieldEnum: {
    id: 'id',
    nome: 'nome'
  };

  export type RacaScalarFieldEnum = (typeof RacaScalarFieldEnum)[keyof typeof RacaScalarFieldEnum]


  export const LoteScalarFieldEnum: {
    id: 'id',
    nome: 'nome'
  };

  export type LoteScalarFieldEnum = (typeof LoteScalarFieldEnum)[keyof typeof LoteScalarFieldEnum]


  export const FazendaScalarFieldEnum: {
    id: 'id',
    nome: 'nome'
  };

  export type FazendaScalarFieldEnum = (typeof FazendaScalarFieldEnum)[keyof typeof FazendaScalarFieldEnum]


  export const AnimalScalarFieldEnum: {
    id: 'id',
    rfid: 'rfid',
    brinco: 'brinco',
    nome_apelido: 'nome_apelido',
    sexo: 'sexo',
    data_nascimento: 'data_nascimento',
    peso_nascimento_kg: 'peso_nascimento_kg',
    origem: 'origem',
    status: 'status',
    raca_id: 'raca_id',
    lote_id: 'lote_id',
    mae_id: 'mae_id',
    pai_id: 'pai_id',
    fazenda_origem_id: 'fazenda_origem_id',
    fazenda_origem_nome: 'fazenda_origem_nome',
    data_aquisicao: 'data_aquisicao',
    valor_compra: 'valor_compra',
    idade_entrada_meses: 'idade_entrada_meses',
    peso_atual_kg: 'peso_atual_kg',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type AnimalScalarFieldEnum = (typeof AnimalScalarFieldEnum)[keyof typeof AnimalScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'Sexo'
   */
  export type EnumSexoFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Sexo'>
    


  /**
   * Reference to a field of type 'Sexo[]'
   */
  export type ListEnumSexoFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Sexo[]'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Float[]'
   */
  export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>
    


  /**
   * Reference to a field of type 'AnimalOrigem'
   */
  export type EnumAnimalOrigemFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'AnimalOrigem'>
    


  /**
   * Reference to a field of type 'AnimalOrigem[]'
   */
  export type ListEnumAnimalOrigemFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'AnimalOrigem[]'>
    


  /**
   * Reference to a field of type 'AnimalStatus'
   */
  export type EnumAnimalStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'AnimalStatus'>
    


  /**
   * Reference to a field of type 'AnimalStatus[]'
   */
  export type ListEnumAnimalStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'AnimalStatus[]'>
    
  /**
   * Deep Input Types
   */


  export type UserWhereInput = {
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    id?: IntFilter<"User"> | number
    email?: StringFilter<"User"> | string
    name?: StringNullableFilter<"User"> | string | null
    posts?: PostListRelationFilter
  }

  export type UserOrderByWithRelationInput = {
    id?: SortOrder
    email?: SortOrder
    name?: SortOrderInput | SortOrder
    posts?: PostOrderByRelationAggregateInput
  }

  export type UserWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    email?: string
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    name?: StringNullableFilter<"User"> | string | null
    posts?: PostListRelationFilter
  }, "id" | "email">

  export type UserOrderByWithAggregationInput = {
    id?: SortOrder
    email?: SortOrder
    name?: SortOrderInput | SortOrder
    _count?: UserCountOrderByAggregateInput
    _avg?: UserAvgOrderByAggregateInput
    _max?: UserMaxOrderByAggregateInput
    _min?: UserMinOrderByAggregateInput
    _sum?: UserSumOrderByAggregateInput
  }

  export type UserScalarWhereWithAggregatesInput = {
    AND?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    OR?: UserScalarWhereWithAggregatesInput[]
    NOT?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"User"> | number
    email?: StringWithAggregatesFilter<"User"> | string
    name?: StringNullableWithAggregatesFilter<"User"> | string | null
  }

  export type PostWhereInput = {
    AND?: PostWhereInput | PostWhereInput[]
    OR?: PostWhereInput[]
    NOT?: PostWhereInput | PostWhereInput[]
    id?: IntFilter<"Post"> | number
    title?: StringFilter<"Post"> | string
    content?: StringNullableFilter<"Post"> | string | null
    published?: BoolFilter<"Post"> | boolean
    authorId?: IntFilter<"Post"> | number
    author?: XOR<UserScalarRelationFilter, UserWhereInput>
  }

  export type PostOrderByWithRelationInput = {
    id?: SortOrder
    title?: SortOrder
    content?: SortOrderInput | SortOrder
    published?: SortOrder
    authorId?: SortOrder
    author?: UserOrderByWithRelationInput
  }

  export type PostWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    AND?: PostWhereInput | PostWhereInput[]
    OR?: PostWhereInput[]
    NOT?: PostWhereInput | PostWhereInput[]
    title?: StringFilter<"Post"> | string
    content?: StringNullableFilter<"Post"> | string | null
    published?: BoolFilter<"Post"> | boolean
    authorId?: IntFilter<"Post"> | number
    author?: XOR<UserScalarRelationFilter, UserWhereInput>
  }, "id">

  export type PostOrderByWithAggregationInput = {
    id?: SortOrder
    title?: SortOrder
    content?: SortOrderInput | SortOrder
    published?: SortOrder
    authorId?: SortOrder
    _count?: PostCountOrderByAggregateInput
    _avg?: PostAvgOrderByAggregateInput
    _max?: PostMaxOrderByAggregateInput
    _min?: PostMinOrderByAggregateInput
    _sum?: PostSumOrderByAggregateInput
  }

  export type PostScalarWhereWithAggregatesInput = {
    AND?: PostScalarWhereWithAggregatesInput | PostScalarWhereWithAggregatesInput[]
    OR?: PostScalarWhereWithAggregatesInput[]
    NOT?: PostScalarWhereWithAggregatesInput | PostScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"Post"> | number
    title?: StringWithAggregatesFilter<"Post"> | string
    content?: StringNullableWithAggregatesFilter<"Post"> | string | null
    published?: BoolWithAggregatesFilter<"Post"> | boolean
    authorId?: IntWithAggregatesFilter<"Post"> | number
  }

  export type PerformanceTestWhereInput = {
    AND?: PerformanceTestWhereInput | PerformanceTestWhereInput[]
    OR?: PerformanceTestWhereInput[]
    NOT?: PerformanceTestWhereInput | PerformanceTestWhereInput[]
    id?: IntFilter<"PerformanceTest"> | number
    description?: StringFilter<"PerformanceTest"> | string
    date?: DateTimeFilter<"PerformanceTest"> | Date | string
  }

  export type PerformanceTestOrderByWithRelationInput = {
    id?: SortOrder
    description?: SortOrder
    date?: SortOrder
  }

  export type PerformanceTestWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    AND?: PerformanceTestWhereInput | PerformanceTestWhereInput[]
    OR?: PerformanceTestWhereInput[]
    NOT?: PerformanceTestWhereInput | PerformanceTestWhereInput[]
    description?: StringFilter<"PerformanceTest"> | string
    date?: DateTimeFilter<"PerformanceTest"> | Date | string
  }, "id">

  export type PerformanceTestOrderByWithAggregationInput = {
    id?: SortOrder
    description?: SortOrder
    date?: SortOrder
    _count?: PerformanceTestCountOrderByAggregateInput
    _avg?: PerformanceTestAvgOrderByAggregateInput
    _max?: PerformanceTestMaxOrderByAggregateInput
    _min?: PerformanceTestMinOrderByAggregateInput
    _sum?: PerformanceTestSumOrderByAggregateInput
  }

  export type PerformanceTestScalarWhereWithAggregatesInput = {
    AND?: PerformanceTestScalarWhereWithAggregatesInput | PerformanceTestScalarWhereWithAggregatesInput[]
    OR?: PerformanceTestScalarWhereWithAggregatesInput[]
    NOT?: PerformanceTestScalarWhereWithAggregatesInput | PerformanceTestScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"PerformanceTest"> | number
    description?: StringWithAggregatesFilter<"PerformanceTest"> | string
    date?: DateTimeWithAggregatesFilter<"PerformanceTest"> | Date | string
  }

  export type RacaWhereInput = {
    AND?: RacaWhereInput | RacaWhereInput[]
    OR?: RacaWhereInput[]
    NOT?: RacaWhereInput | RacaWhereInput[]
    id?: IntFilter<"Raca"> | number
    nome?: StringFilter<"Raca"> | string
    animais?: AnimalListRelationFilter
  }

  export type RacaOrderByWithRelationInput = {
    id?: SortOrder
    nome?: SortOrder
    animais?: AnimalOrderByRelationAggregateInput
  }

  export type RacaWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    nome?: string
    AND?: RacaWhereInput | RacaWhereInput[]
    OR?: RacaWhereInput[]
    NOT?: RacaWhereInput | RacaWhereInput[]
    animais?: AnimalListRelationFilter
  }, "id" | "nome">

  export type RacaOrderByWithAggregationInput = {
    id?: SortOrder
    nome?: SortOrder
    _count?: RacaCountOrderByAggregateInput
    _avg?: RacaAvgOrderByAggregateInput
    _max?: RacaMaxOrderByAggregateInput
    _min?: RacaMinOrderByAggregateInput
    _sum?: RacaSumOrderByAggregateInput
  }

  export type RacaScalarWhereWithAggregatesInput = {
    AND?: RacaScalarWhereWithAggregatesInput | RacaScalarWhereWithAggregatesInput[]
    OR?: RacaScalarWhereWithAggregatesInput[]
    NOT?: RacaScalarWhereWithAggregatesInput | RacaScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"Raca"> | number
    nome?: StringWithAggregatesFilter<"Raca"> | string
  }

  export type LoteWhereInput = {
    AND?: LoteWhereInput | LoteWhereInput[]
    OR?: LoteWhereInput[]
    NOT?: LoteWhereInput | LoteWhereInput[]
    id?: IntFilter<"Lote"> | number
    nome?: StringFilter<"Lote"> | string
    animais?: AnimalListRelationFilter
  }

  export type LoteOrderByWithRelationInput = {
    id?: SortOrder
    nome?: SortOrder
    animais?: AnimalOrderByRelationAggregateInput
  }

  export type LoteWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    nome?: string
    AND?: LoteWhereInput | LoteWhereInput[]
    OR?: LoteWhereInput[]
    NOT?: LoteWhereInput | LoteWhereInput[]
    animais?: AnimalListRelationFilter
  }, "id" | "nome">

  export type LoteOrderByWithAggregationInput = {
    id?: SortOrder
    nome?: SortOrder
    _count?: LoteCountOrderByAggregateInput
    _avg?: LoteAvgOrderByAggregateInput
    _max?: LoteMaxOrderByAggregateInput
    _min?: LoteMinOrderByAggregateInput
    _sum?: LoteSumOrderByAggregateInput
  }

  export type LoteScalarWhereWithAggregatesInput = {
    AND?: LoteScalarWhereWithAggregatesInput | LoteScalarWhereWithAggregatesInput[]
    OR?: LoteScalarWhereWithAggregatesInput[]
    NOT?: LoteScalarWhereWithAggregatesInput | LoteScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"Lote"> | number
    nome?: StringWithAggregatesFilter<"Lote"> | string
  }

  export type FazendaWhereInput = {
    AND?: FazendaWhereInput | FazendaWhereInput[]
    OR?: FazendaWhereInput[]
    NOT?: FazendaWhereInput | FazendaWhereInput[]
    id?: IntFilter<"Fazenda"> | number
    nome?: StringFilter<"Fazenda"> | string
    animaisOrigem?: AnimalListRelationFilter
  }

  export type FazendaOrderByWithRelationInput = {
    id?: SortOrder
    nome?: SortOrder
    animaisOrigem?: AnimalOrderByRelationAggregateInput
  }

  export type FazendaWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    nome?: string
    AND?: FazendaWhereInput | FazendaWhereInput[]
    OR?: FazendaWhereInput[]
    NOT?: FazendaWhereInput | FazendaWhereInput[]
    animaisOrigem?: AnimalListRelationFilter
  }, "id" | "nome">

  export type FazendaOrderByWithAggregationInput = {
    id?: SortOrder
    nome?: SortOrder
    _count?: FazendaCountOrderByAggregateInput
    _avg?: FazendaAvgOrderByAggregateInput
    _max?: FazendaMaxOrderByAggregateInput
    _min?: FazendaMinOrderByAggregateInput
    _sum?: FazendaSumOrderByAggregateInput
  }

  export type FazendaScalarWhereWithAggregatesInput = {
    AND?: FazendaScalarWhereWithAggregatesInput | FazendaScalarWhereWithAggregatesInput[]
    OR?: FazendaScalarWhereWithAggregatesInput[]
    NOT?: FazendaScalarWhereWithAggregatesInput | FazendaScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"Fazenda"> | number
    nome?: StringWithAggregatesFilter<"Fazenda"> | string
  }

  export type AnimalWhereInput = {
    AND?: AnimalWhereInput | AnimalWhereInput[]
    OR?: AnimalWhereInput[]
    NOT?: AnimalWhereInput | AnimalWhereInput[]
    id?: StringFilter<"Animal"> | string
    rfid?: StringNullableFilter<"Animal"> | string | null
    brinco?: StringNullableFilter<"Animal"> | string | null
    nome_apelido?: StringNullableFilter<"Animal"> | string | null
    sexo?: EnumSexoFilter<"Animal"> | $Enums.Sexo
    data_nascimento?: DateTimeNullableFilter<"Animal"> | Date | string | null
    peso_nascimento_kg?: FloatNullableFilter<"Animal"> | number | null
    origem?: EnumAnimalOrigemFilter<"Animal"> | $Enums.AnimalOrigem
    status?: EnumAnimalStatusFilter<"Animal"> | $Enums.AnimalStatus
    raca_id?: IntNullableFilter<"Animal"> | number | null
    lote_id?: IntNullableFilter<"Animal"> | number | null
    mae_id?: StringNullableFilter<"Animal"> | string | null
    pai_id?: StringNullableFilter<"Animal"> | string | null
    fazenda_origem_id?: IntNullableFilter<"Animal"> | number | null
    fazenda_origem_nome?: StringNullableFilter<"Animal"> | string | null
    data_aquisicao?: DateTimeNullableFilter<"Animal"> | Date | string | null
    valor_compra?: FloatNullableFilter<"Animal"> | number | null
    idade_entrada_meses?: IntNullableFilter<"Animal"> | number | null
    peso_atual_kg?: FloatNullableFilter<"Animal"> | number | null
    createdAt?: DateTimeFilter<"Animal"> | Date | string
    updatedAt?: DateTimeFilter<"Animal"> | Date | string
    raca?: XOR<RacaNullableScalarRelationFilter, RacaWhereInput> | null
    lote?: XOR<LoteNullableScalarRelationFilter, LoteWhereInput> | null
    mae?: XOR<AnimalNullableScalarRelationFilter, AnimalWhereInput> | null
    filhosMae?: AnimalListRelationFilter
    pai?: XOR<AnimalNullableScalarRelationFilter, AnimalWhereInput> | null
    filhosPai?: AnimalListRelationFilter
    fazenda_origem?: XOR<FazendaNullableScalarRelationFilter, FazendaWhereInput> | null
  }

  export type AnimalOrderByWithRelationInput = {
    id?: SortOrder
    rfid?: SortOrderInput | SortOrder
    brinco?: SortOrderInput | SortOrder
    nome_apelido?: SortOrderInput | SortOrder
    sexo?: SortOrder
    data_nascimento?: SortOrderInput | SortOrder
    peso_nascimento_kg?: SortOrderInput | SortOrder
    origem?: SortOrder
    status?: SortOrder
    raca_id?: SortOrderInput | SortOrder
    lote_id?: SortOrderInput | SortOrder
    mae_id?: SortOrderInput | SortOrder
    pai_id?: SortOrderInput | SortOrder
    fazenda_origem_id?: SortOrderInput | SortOrder
    fazenda_origem_nome?: SortOrderInput | SortOrder
    data_aquisicao?: SortOrderInput | SortOrder
    valor_compra?: SortOrderInput | SortOrder
    idade_entrada_meses?: SortOrderInput | SortOrder
    peso_atual_kg?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    raca?: RacaOrderByWithRelationInput
    lote?: LoteOrderByWithRelationInput
    mae?: AnimalOrderByWithRelationInput
    filhosMae?: AnimalOrderByRelationAggregateInput
    pai?: AnimalOrderByWithRelationInput
    filhosPai?: AnimalOrderByRelationAggregateInput
    fazenda_origem?: FazendaOrderByWithRelationInput
  }

  export type AnimalWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    rfid?: string
    brinco?: string
    AND?: AnimalWhereInput | AnimalWhereInput[]
    OR?: AnimalWhereInput[]
    NOT?: AnimalWhereInput | AnimalWhereInput[]
    nome_apelido?: StringNullableFilter<"Animal"> | string | null
    sexo?: EnumSexoFilter<"Animal"> | $Enums.Sexo
    data_nascimento?: DateTimeNullableFilter<"Animal"> | Date | string | null
    peso_nascimento_kg?: FloatNullableFilter<"Animal"> | number | null
    origem?: EnumAnimalOrigemFilter<"Animal"> | $Enums.AnimalOrigem
    status?: EnumAnimalStatusFilter<"Animal"> | $Enums.AnimalStatus
    raca_id?: IntNullableFilter<"Animal"> | number | null
    lote_id?: IntNullableFilter<"Animal"> | number | null
    mae_id?: StringNullableFilter<"Animal"> | string | null
    pai_id?: StringNullableFilter<"Animal"> | string | null
    fazenda_origem_id?: IntNullableFilter<"Animal"> | number | null
    fazenda_origem_nome?: StringNullableFilter<"Animal"> | string | null
    data_aquisicao?: DateTimeNullableFilter<"Animal"> | Date | string | null
    valor_compra?: FloatNullableFilter<"Animal"> | number | null
    idade_entrada_meses?: IntNullableFilter<"Animal"> | number | null
    peso_atual_kg?: FloatNullableFilter<"Animal"> | number | null
    createdAt?: DateTimeFilter<"Animal"> | Date | string
    updatedAt?: DateTimeFilter<"Animal"> | Date | string
    raca?: XOR<RacaNullableScalarRelationFilter, RacaWhereInput> | null
    lote?: XOR<LoteNullableScalarRelationFilter, LoteWhereInput> | null
    mae?: XOR<AnimalNullableScalarRelationFilter, AnimalWhereInput> | null
    filhosMae?: AnimalListRelationFilter
    pai?: XOR<AnimalNullableScalarRelationFilter, AnimalWhereInput> | null
    filhosPai?: AnimalListRelationFilter
    fazenda_origem?: XOR<FazendaNullableScalarRelationFilter, FazendaWhereInput> | null
  }, "id" | "rfid" | "brinco">

  export type AnimalOrderByWithAggregationInput = {
    id?: SortOrder
    rfid?: SortOrderInput | SortOrder
    brinco?: SortOrderInput | SortOrder
    nome_apelido?: SortOrderInput | SortOrder
    sexo?: SortOrder
    data_nascimento?: SortOrderInput | SortOrder
    peso_nascimento_kg?: SortOrderInput | SortOrder
    origem?: SortOrder
    status?: SortOrder
    raca_id?: SortOrderInput | SortOrder
    lote_id?: SortOrderInput | SortOrder
    mae_id?: SortOrderInput | SortOrder
    pai_id?: SortOrderInput | SortOrder
    fazenda_origem_id?: SortOrderInput | SortOrder
    fazenda_origem_nome?: SortOrderInput | SortOrder
    data_aquisicao?: SortOrderInput | SortOrder
    valor_compra?: SortOrderInput | SortOrder
    idade_entrada_meses?: SortOrderInput | SortOrder
    peso_atual_kg?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: AnimalCountOrderByAggregateInput
    _avg?: AnimalAvgOrderByAggregateInput
    _max?: AnimalMaxOrderByAggregateInput
    _min?: AnimalMinOrderByAggregateInput
    _sum?: AnimalSumOrderByAggregateInput
  }

  export type AnimalScalarWhereWithAggregatesInput = {
    AND?: AnimalScalarWhereWithAggregatesInput | AnimalScalarWhereWithAggregatesInput[]
    OR?: AnimalScalarWhereWithAggregatesInput[]
    NOT?: AnimalScalarWhereWithAggregatesInput | AnimalScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Animal"> | string
    rfid?: StringNullableWithAggregatesFilter<"Animal"> | string | null
    brinco?: StringNullableWithAggregatesFilter<"Animal"> | string | null
    nome_apelido?: StringNullableWithAggregatesFilter<"Animal"> | string | null
    sexo?: EnumSexoWithAggregatesFilter<"Animal"> | $Enums.Sexo
    data_nascimento?: DateTimeNullableWithAggregatesFilter<"Animal"> | Date | string | null
    peso_nascimento_kg?: FloatNullableWithAggregatesFilter<"Animal"> | number | null
    origem?: EnumAnimalOrigemWithAggregatesFilter<"Animal"> | $Enums.AnimalOrigem
    status?: EnumAnimalStatusWithAggregatesFilter<"Animal"> | $Enums.AnimalStatus
    raca_id?: IntNullableWithAggregatesFilter<"Animal"> | number | null
    lote_id?: IntNullableWithAggregatesFilter<"Animal"> | number | null
    mae_id?: StringNullableWithAggregatesFilter<"Animal"> | string | null
    pai_id?: StringNullableWithAggregatesFilter<"Animal"> | string | null
    fazenda_origem_id?: IntNullableWithAggregatesFilter<"Animal"> | number | null
    fazenda_origem_nome?: StringNullableWithAggregatesFilter<"Animal"> | string | null
    data_aquisicao?: DateTimeNullableWithAggregatesFilter<"Animal"> | Date | string | null
    valor_compra?: FloatNullableWithAggregatesFilter<"Animal"> | number | null
    idade_entrada_meses?: IntNullableWithAggregatesFilter<"Animal"> | number | null
    peso_atual_kg?: FloatNullableWithAggregatesFilter<"Animal"> | number | null
    createdAt?: DateTimeWithAggregatesFilter<"Animal"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Animal"> | Date | string
  }

  export type UserCreateInput = {
    email: string
    name?: string | null
    posts?: PostCreateNestedManyWithoutAuthorInput
  }

  export type UserUncheckedCreateInput = {
    id?: number
    email: string
    name?: string | null
    posts?: PostUncheckedCreateNestedManyWithoutAuthorInput
  }

  export type UserUpdateInput = {
    email?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    posts?: PostUpdateManyWithoutAuthorNestedInput
  }

  export type UserUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    email?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    posts?: PostUncheckedUpdateManyWithoutAuthorNestedInput
  }

  export type UserCreateManyInput = {
    id?: number
    email: string
    name?: string | null
  }

  export type UserUpdateManyMutationInput = {
    email?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type UserUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    email?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type PostCreateInput = {
    title: string
    content?: string | null
    published?: boolean
    author: UserCreateNestedOneWithoutPostsInput
  }

  export type PostUncheckedCreateInput = {
    id?: number
    title: string
    content?: string | null
    published?: boolean
    authorId: number
  }

  export type PostUpdateInput = {
    title?: StringFieldUpdateOperationsInput | string
    content?: NullableStringFieldUpdateOperationsInput | string | null
    published?: BoolFieldUpdateOperationsInput | boolean
    author?: UserUpdateOneRequiredWithoutPostsNestedInput
  }

  export type PostUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    title?: StringFieldUpdateOperationsInput | string
    content?: NullableStringFieldUpdateOperationsInput | string | null
    published?: BoolFieldUpdateOperationsInput | boolean
    authorId?: IntFieldUpdateOperationsInput | number
  }

  export type PostCreateManyInput = {
    id?: number
    title: string
    content?: string | null
    published?: boolean
    authorId: number
  }

  export type PostUpdateManyMutationInput = {
    title?: StringFieldUpdateOperationsInput | string
    content?: NullableStringFieldUpdateOperationsInput | string | null
    published?: BoolFieldUpdateOperationsInput | boolean
  }

  export type PostUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    title?: StringFieldUpdateOperationsInput | string
    content?: NullableStringFieldUpdateOperationsInput | string | null
    published?: BoolFieldUpdateOperationsInput | boolean
    authorId?: IntFieldUpdateOperationsInput | number
  }

  export type PerformanceTestCreateInput = {
    id: number
    description: string
    date: Date | string
  }

  export type PerformanceTestUncheckedCreateInput = {
    id: number
    description: string
    date: Date | string
  }

  export type PerformanceTestUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    description?: StringFieldUpdateOperationsInput | string
    date?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PerformanceTestUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    description?: StringFieldUpdateOperationsInput | string
    date?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PerformanceTestCreateManyInput = {
    id: number
    description: string
    date: Date | string
  }

  export type PerformanceTestUpdateManyMutationInput = {
    id?: IntFieldUpdateOperationsInput | number
    description?: StringFieldUpdateOperationsInput | string
    date?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PerformanceTestUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    description?: StringFieldUpdateOperationsInput | string
    date?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type RacaCreateInput = {
    nome: string
    animais?: AnimalCreateNestedManyWithoutRacaInput
  }

  export type RacaUncheckedCreateInput = {
    id?: number
    nome: string
    animais?: AnimalUncheckedCreateNestedManyWithoutRacaInput
  }

  export type RacaUpdateInput = {
    nome?: StringFieldUpdateOperationsInput | string
    animais?: AnimalUpdateManyWithoutRacaNestedInput
  }

  export type RacaUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    nome?: StringFieldUpdateOperationsInput | string
    animais?: AnimalUncheckedUpdateManyWithoutRacaNestedInput
  }

  export type RacaCreateManyInput = {
    id?: number
    nome: string
  }

  export type RacaUpdateManyMutationInput = {
    nome?: StringFieldUpdateOperationsInput | string
  }

  export type RacaUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    nome?: StringFieldUpdateOperationsInput | string
  }

  export type LoteCreateInput = {
    nome: string
    animais?: AnimalCreateNestedManyWithoutLoteInput
  }

  export type LoteUncheckedCreateInput = {
    id?: number
    nome: string
    animais?: AnimalUncheckedCreateNestedManyWithoutLoteInput
  }

  export type LoteUpdateInput = {
    nome?: StringFieldUpdateOperationsInput | string
    animais?: AnimalUpdateManyWithoutLoteNestedInput
  }

  export type LoteUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    nome?: StringFieldUpdateOperationsInput | string
    animais?: AnimalUncheckedUpdateManyWithoutLoteNestedInput
  }

  export type LoteCreateManyInput = {
    id?: number
    nome: string
  }

  export type LoteUpdateManyMutationInput = {
    nome?: StringFieldUpdateOperationsInput | string
  }

  export type LoteUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    nome?: StringFieldUpdateOperationsInput | string
  }

  export type FazendaCreateInput = {
    nome: string
    animaisOrigem?: AnimalCreateNestedManyWithoutFazenda_origemInput
  }

  export type FazendaUncheckedCreateInput = {
    id?: number
    nome: string
    animaisOrigem?: AnimalUncheckedCreateNestedManyWithoutFazenda_origemInput
  }

  export type FazendaUpdateInput = {
    nome?: StringFieldUpdateOperationsInput | string
    animaisOrigem?: AnimalUpdateManyWithoutFazenda_origemNestedInput
  }

  export type FazendaUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    nome?: StringFieldUpdateOperationsInput | string
    animaisOrigem?: AnimalUncheckedUpdateManyWithoutFazenda_origemNestedInput
  }

  export type FazendaCreateManyInput = {
    id?: number
    nome: string
  }

  export type FazendaUpdateManyMutationInput = {
    nome?: StringFieldUpdateOperationsInput | string
  }

  export type FazendaUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    nome?: StringFieldUpdateOperationsInput | string
  }

  export type AnimalCreateInput = {
    id?: string
    rfid?: string | null
    brinco?: string | null
    nome_apelido?: string | null
    sexo: $Enums.Sexo
    data_nascimento?: Date | string | null
    peso_nascimento_kg?: number | null
    origem?: $Enums.AnimalOrigem
    status?: $Enums.AnimalStatus
    fazenda_origem_nome?: string | null
    data_aquisicao?: Date | string | null
    valor_compra?: number | null
    idade_entrada_meses?: number | null
    peso_atual_kg?: number | null
    createdAt?: Date | string
    updatedAt?: Date | string
    raca?: RacaCreateNestedOneWithoutAnimaisInput
    lote?: LoteCreateNestedOneWithoutAnimaisInput
    mae?: AnimalCreateNestedOneWithoutFilhosMaeInput
    filhosMae?: AnimalCreateNestedManyWithoutMaeInput
    pai?: AnimalCreateNestedOneWithoutFilhosPaiInput
    filhosPai?: AnimalCreateNestedManyWithoutPaiInput
    fazenda_origem?: FazendaCreateNestedOneWithoutAnimaisOrigemInput
  }

  export type AnimalUncheckedCreateInput = {
    id?: string
    rfid?: string | null
    brinco?: string | null
    nome_apelido?: string | null
    sexo: $Enums.Sexo
    data_nascimento?: Date | string | null
    peso_nascimento_kg?: number | null
    origem?: $Enums.AnimalOrigem
    status?: $Enums.AnimalStatus
    raca_id?: number | null
    lote_id?: number | null
    mae_id?: string | null
    pai_id?: string | null
    fazenda_origem_id?: number | null
    fazenda_origem_nome?: string | null
    data_aquisicao?: Date | string | null
    valor_compra?: number | null
    idade_entrada_meses?: number | null
    peso_atual_kg?: number | null
    createdAt?: Date | string
    updatedAt?: Date | string
    filhosMae?: AnimalUncheckedCreateNestedManyWithoutMaeInput
    filhosPai?: AnimalUncheckedCreateNestedManyWithoutPaiInput
  }

  export type AnimalUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    rfid?: NullableStringFieldUpdateOperationsInput | string | null
    brinco?: NullableStringFieldUpdateOperationsInput | string | null
    nome_apelido?: NullableStringFieldUpdateOperationsInput | string | null
    sexo?: EnumSexoFieldUpdateOperationsInput | $Enums.Sexo
    data_nascimento?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    peso_nascimento_kg?: NullableFloatFieldUpdateOperationsInput | number | null
    origem?: EnumAnimalOrigemFieldUpdateOperationsInput | $Enums.AnimalOrigem
    status?: EnumAnimalStatusFieldUpdateOperationsInput | $Enums.AnimalStatus
    fazenda_origem_nome?: NullableStringFieldUpdateOperationsInput | string | null
    data_aquisicao?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    valor_compra?: NullableFloatFieldUpdateOperationsInput | number | null
    idade_entrada_meses?: NullableIntFieldUpdateOperationsInput | number | null
    peso_atual_kg?: NullableFloatFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    raca?: RacaUpdateOneWithoutAnimaisNestedInput
    lote?: LoteUpdateOneWithoutAnimaisNestedInput
    mae?: AnimalUpdateOneWithoutFilhosMaeNestedInput
    filhosMae?: AnimalUpdateManyWithoutMaeNestedInput
    pai?: AnimalUpdateOneWithoutFilhosPaiNestedInput
    filhosPai?: AnimalUpdateManyWithoutPaiNestedInput
    fazenda_origem?: FazendaUpdateOneWithoutAnimaisOrigemNestedInput
  }

  export type AnimalUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    rfid?: NullableStringFieldUpdateOperationsInput | string | null
    brinco?: NullableStringFieldUpdateOperationsInput | string | null
    nome_apelido?: NullableStringFieldUpdateOperationsInput | string | null
    sexo?: EnumSexoFieldUpdateOperationsInput | $Enums.Sexo
    data_nascimento?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    peso_nascimento_kg?: NullableFloatFieldUpdateOperationsInput | number | null
    origem?: EnumAnimalOrigemFieldUpdateOperationsInput | $Enums.AnimalOrigem
    status?: EnumAnimalStatusFieldUpdateOperationsInput | $Enums.AnimalStatus
    raca_id?: NullableIntFieldUpdateOperationsInput | number | null
    lote_id?: NullableIntFieldUpdateOperationsInput | number | null
    mae_id?: NullableStringFieldUpdateOperationsInput | string | null
    pai_id?: NullableStringFieldUpdateOperationsInput | string | null
    fazenda_origem_id?: NullableIntFieldUpdateOperationsInput | number | null
    fazenda_origem_nome?: NullableStringFieldUpdateOperationsInput | string | null
    data_aquisicao?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    valor_compra?: NullableFloatFieldUpdateOperationsInput | number | null
    idade_entrada_meses?: NullableIntFieldUpdateOperationsInput | number | null
    peso_atual_kg?: NullableFloatFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    filhosMae?: AnimalUncheckedUpdateManyWithoutMaeNestedInput
    filhosPai?: AnimalUncheckedUpdateManyWithoutPaiNestedInput
  }

  export type AnimalCreateManyInput = {
    id?: string
    rfid?: string | null
    brinco?: string | null
    nome_apelido?: string | null
    sexo: $Enums.Sexo
    data_nascimento?: Date | string | null
    peso_nascimento_kg?: number | null
    origem?: $Enums.AnimalOrigem
    status?: $Enums.AnimalStatus
    raca_id?: number | null
    lote_id?: number | null
    mae_id?: string | null
    pai_id?: string | null
    fazenda_origem_id?: number | null
    fazenda_origem_nome?: string | null
    data_aquisicao?: Date | string | null
    valor_compra?: number | null
    idade_entrada_meses?: number | null
    peso_atual_kg?: number | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type AnimalUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    rfid?: NullableStringFieldUpdateOperationsInput | string | null
    brinco?: NullableStringFieldUpdateOperationsInput | string | null
    nome_apelido?: NullableStringFieldUpdateOperationsInput | string | null
    sexo?: EnumSexoFieldUpdateOperationsInput | $Enums.Sexo
    data_nascimento?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    peso_nascimento_kg?: NullableFloatFieldUpdateOperationsInput | number | null
    origem?: EnumAnimalOrigemFieldUpdateOperationsInput | $Enums.AnimalOrigem
    status?: EnumAnimalStatusFieldUpdateOperationsInput | $Enums.AnimalStatus
    fazenda_origem_nome?: NullableStringFieldUpdateOperationsInput | string | null
    data_aquisicao?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    valor_compra?: NullableFloatFieldUpdateOperationsInput | number | null
    idade_entrada_meses?: NullableIntFieldUpdateOperationsInput | number | null
    peso_atual_kg?: NullableFloatFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AnimalUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    rfid?: NullableStringFieldUpdateOperationsInput | string | null
    brinco?: NullableStringFieldUpdateOperationsInput | string | null
    nome_apelido?: NullableStringFieldUpdateOperationsInput | string | null
    sexo?: EnumSexoFieldUpdateOperationsInput | $Enums.Sexo
    data_nascimento?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    peso_nascimento_kg?: NullableFloatFieldUpdateOperationsInput | number | null
    origem?: EnumAnimalOrigemFieldUpdateOperationsInput | $Enums.AnimalOrigem
    status?: EnumAnimalStatusFieldUpdateOperationsInput | $Enums.AnimalStatus
    raca_id?: NullableIntFieldUpdateOperationsInput | number | null
    lote_id?: NullableIntFieldUpdateOperationsInput | number | null
    mae_id?: NullableStringFieldUpdateOperationsInput | string | null
    pai_id?: NullableStringFieldUpdateOperationsInput | string | null
    fazenda_origem_id?: NullableIntFieldUpdateOperationsInput | number | null
    fazenda_origem_nome?: NullableStringFieldUpdateOperationsInput | string | null
    data_aquisicao?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    valor_compra?: NullableFloatFieldUpdateOperationsInput | number | null
    idade_entrada_meses?: NullableIntFieldUpdateOperationsInput | number | null
    peso_atual_kg?: NullableFloatFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type PostListRelationFilter = {
    every?: PostWhereInput
    some?: PostWhereInput
    none?: PostWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type PostOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type UserCountOrderByAggregateInput = {
    id?: SortOrder
    email?: SortOrder
    name?: SortOrder
  }

  export type UserAvgOrderByAggregateInput = {
    id?: SortOrder
  }

  export type UserMaxOrderByAggregateInput = {
    id?: SortOrder
    email?: SortOrder
    name?: SortOrder
  }

  export type UserMinOrderByAggregateInput = {
    id?: SortOrder
    email?: SortOrder
    name?: SortOrder
  }

  export type UserSumOrderByAggregateInput = {
    id?: SortOrder
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type UserScalarRelationFilter = {
    is?: UserWhereInput
    isNot?: UserWhereInput
  }

  export type PostCountOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
    content?: SortOrder
    published?: SortOrder
    authorId?: SortOrder
  }

  export type PostAvgOrderByAggregateInput = {
    id?: SortOrder
    authorId?: SortOrder
  }

  export type PostMaxOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
    content?: SortOrder
    published?: SortOrder
    authorId?: SortOrder
  }

  export type PostMinOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
    content?: SortOrder
    published?: SortOrder
    authorId?: SortOrder
  }

  export type PostSumOrderByAggregateInput = {
    id?: SortOrder
    authorId?: SortOrder
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type PerformanceTestCountOrderByAggregateInput = {
    id?: SortOrder
    description?: SortOrder
    date?: SortOrder
  }

  export type PerformanceTestAvgOrderByAggregateInput = {
    id?: SortOrder
  }

  export type PerformanceTestMaxOrderByAggregateInput = {
    id?: SortOrder
    description?: SortOrder
    date?: SortOrder
  }

  export type PerformanceTestMinOrderByAggregateInput = {
    id?: SortOrder
    description?: SortOrder
    date?: SortOrder
  }

  export type PerformanceTestSumOrderByAggregateInput = {
    id?: SortOrder
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type AnimalListRelationFilter = {
    every?: AnimalWhereInput
    some?: AnimalWhereInput
    none?: AnimalWhereInput
  }

  export type AnimalOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type RacaCountOrderByAggregateInput = {
    id?: SortOrder
    nome?: SortOrder
  }

  export type RacaAvgOrderByAggregateInput = {
    id?: SortOrder
  }

  export type RacaMaxOrderByAggregateInput = {
    id?: SortOrder
    nome?: SortOrder
  }

  export type RacaMinOrderByAggregateInput = {
    id?: SortOrder
    nome?: SortOrder
  }

  export type RacaSumOrderByAggregateInput = {
    id?: SortOrder
  }

  export type LoteCountOrderByAggregateInput = {
    id?: SortOrder
    nome?: SortOrder
  }

  export type LoteAvgOrderByAggregateInput = {
    id?: SortOrder
  }

  export type LoteMaxOrderByAggregateInput = {
    id?: SortOrder
    nome?: SortOrder
  }

  export type LoteMinOrderByAggregateInput = {
    id?: SortOrder
    nome?: SortOrder
  }

  export type LoteSumOrderByAggregateInput = {
    id?: SortOrder
  }

  export type FazendaCountOrderByAggregateInput = {
    id?: SortOrder
    nome?: SortOrder
  }

  export type FazendaAvgOrderByAggregateInput = {
    id?: SortOrder
  }

  export type FazendaMaxOrderByAggregateInput = {
    id?: SortOrder
    nome?: SortOrder
  }

  export type FazendaMinOrderByAggregateInput = {
    id?: SortOrder
    nome?: SortOrder
  }

  export type FazendaSumOrderByAggregateInput = {
    id?: SortOrder
  }

  export type EnumSexoFilter<$PrismaModel = never> = {
    equals?: $Enums.Sexo | EnumSexoFieldRefInput<$PrismaModel>
    in?: $Enums.Sexo[] | ListEnumSexoFieldRefInput<$PrismaModel>
    notIn?: $Enums.Sexo[] | ListEnumSexoFieldRefInput<$PrismaModel>
    not?: NestedEnumSexoFilter<$PrismaModel> | $Enums.Sexo
  }

  export type DateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type FloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
  }

  export type EnumAnimalOrigemFilter<$PrismaModel = never> = {
    equals?: $Enums.AnimalOrigem | EnumAnimalOrigemFieldRefInput<$PrismaModel>
    in?: $Enums.AnimalOrigem[] | ListEnumAnimalOrigemFieldRefInput<$PrismaModel>
    notIn?: $Enums.AnimalOrigem[] | ListEnumAnimalOrigemFieldRefInput<$PrismaModel>
    not?: NestedEnumAnimalOrigemFilter<$PrismaModel> | $Enums.AnimalOrigem
  }

  export type EnumAnimalStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.AnimalStatus | EnumAnimalStatusFieldRefInput<$PrismaModel>
    in?: $Enums.AnimalStatus[] | ListEnumAnimalStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.AnimalStatus[] | ListEnumAnimalStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumAnimalStatusFilter<$PrismaModel> | $Enums.AnimalStatus
  }

  export type IntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type RacaNullableScalarRelationFilter = {
    is?: RacaWhereInput | null
    isNot?: RacaWhereInput | null
  }

  export type LoteNullableScalarRelationFilter = {
    is?: LoteWhereInput | null
    isNot?: LoteWhereInput | null
  }

  export type AnimalNullableScalarRelationFilter = {
    is?: AnimalWhereInput | null
    isNot?: AnimalWhereInput | null
  }

  export type FazendaNullableScalarRelationFilter = {
    is?: FazendaWhereInput | null
    isNot?: FazendaWhereInput | null
  }

  export type AnimalCountOrderByAggregateInput = {
    id?: SortOrder
    rfid?: SortOrder
    brinco?: SortOrder
    nome_apelido?: SortOrder
    sexo?: SortOrder
    data_nascimento?: SortOrder
    peso_nascimento_kg?: SortOrder
    origem?: SortOrder
    status?: SortOrder
    raca_id?: SortOrder
    lote_id?: SortOrder
    mae_id?: SortOrder
    pai_id?: SortOrder
    fazenda_origem_id?: SortOrder
    fazenda_origem_nome?: SortOrder
    data_aquisicao?: SortOrder
    valor_compra?: SortOrder
    idade_entrada_meses?: SortOrder
    peso_atual_kg?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type AnimalAvgOrderByAggregateInput = {
    peso_nascimento_kg?: SortOrder
    raca_id?: SortOrder
    lote_id?: SortOrder
    fazenda_origem_id?: SortOrder
    valor_compra?: SortOrder
    idade_entrada_meses?: SortOrder
    peso_atual_kg?: SortOrder
  }

  export type AnimalMaxOrderByAggregateInput = {
    id?: SortOrder
    rfid?: SortOrder
    brinco?: SortOrder
    nome_apelido?: SortOrder
    sexo?: SortOrder
    data_nascimento?: SortOrder
    peso_nascimento_kg?: SortOrder
    origem?: SortOrder
    status?: SortOrder
    raca_id?: SortOrder
    lote_id?: SortOrder
    mae_id?: SortOrder
    pai_id?: SortOrder
    fazenda_origem_id?: SortOrder
    fazenda_origem_nome?: SortOrder
    data_aquisicao?: SortOrder
    valor_compra?: SortOrder
    idade_entrada_meses?: SortOrder
    peso_atual_kg?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type AnimalMinOrderByAggregateInput = {
    id?: SortOrder
    rfid?: SortOrder
    brinco?: SortOrder
    nome_apelido?: SortOrder
    sexo?: SortOrder
    data_nascimento?: SortOrder
    peso_nascimento_kg?: SortOrder
    origem?: SortOrder
    status?: SortOrder
    raca_id?: SortOrder
    lote_id?: SortOrder
    mae_id?: SortOrder
    pai_id?: SortOrder
    fazenda_origem_id?: SortOrder
    fazenda_origem_nome?: SortOrder
    data_aquisicao?: SortOrder
    valor_compra?: SortOrder
    idade_entrada_meses?: SortOrder
    peso_atual_kg?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type AnimalSumOrderByAggregateInput = {
    peso_nascimento_kg?: SortOrder
    raca_id?: SortOrder
    lote_id?: SortOrder
    fazenda_origem_id?: SortOrder
    valor_compra?: SortOrder
    idade_entrada_meses?: SortOrder
    peso_atual_kg?: SortOrder
  }

  export type EnumSexoWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.Sexo | EnumSexoFieldRefInput<$PrismaModel>
    in?: $Enums.Sexo[] | ListEnumSexoFieldRefInput<$PrismaModel>
    notIn?: $Enums.Sexo[] | ListEnumSexoFieldRefInput<$PrismaModel>
    not?: NestedEnumSexoWithAggregatesFilter<$PrismaModel> | $Enums.Sexo
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumSexoFilter<$PrismaModel>
    _max?: NestedEnumSexoFilter<$PrismaModel>
  }

  export type DateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type FloatNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedFloatNullableFilter<$PrismaModel>
    _min?: NestedFloatNullableFilter<$PrismaModel>
    _max?: NestedFloatNullableFilter<$PrismaModel>
  }

  export type EnumAnimalOrigemWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.AnimalOrigem | EnumAnimalOrigemFieldRefInput<$PrismaModel>
    in?: $Enums.AnimalOrigem[] | ListEnumAnimalOrigemFieldRefInput<$PrismaModel>
    notIn?: $Enums.AnimalOrigem[] | ListEnumAnimalOrigemFieldRefInput<$PrismaModel>
    not?: NestedEnumAnimalOrigemWithAggregatesFilter<$PrismaModel> | $Enums.AnimalOrigem
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumAnimalOrigemFilter<$PrismaModel>
    _max?: NestedEnumAnimalOrigemFilter<$PrismaModel>
  }

  export type EnumAnimalStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.AnimalStatus | EnumAnimalStatusFieldRefInput<$PrismaModel>
    in?: $Enums.AnimalStatus[] | ListEnumAnimalStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.AnimalStatus[] | ListEnumAnimalStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumAnimalStatusWithAggregatesFilter<$PrismaModel> | $Enums.AnimalStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumAnimalStatusFilter<$PrismaModel>
    _max?: NestedEnumAnimalStatusFilter<$PrismaModel>
  }

  export type IntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type PostCreateNestedManyWithoutAuthorInput = {
    create?: XOR<PostCreateWithoutAuthorInput, PostUncheckedCreateWithoutAuthorInput> | PostCreateWithoutAuthorInput[] | PostUncheckedCreateWithoutAuthorInput[]
    connectOrCreate?: PostCreateOrConnectWithoutAuthorInput | PostCreateOrConnectWithoutAuthorInput[]
    createMany?: PostCreateManyAuthorInputEnvelope
    connect?: PostWhereUniqueInput | PostWhereUniqueInput[]
  }

  export type PostUncheckedCreateNestedManyWithoutAuthorInput = {
    create?: XOR<PostCreateWithoutAuthorInput, PostUncheckedCreateWithoutAuthorInput> | PostCreateWithoutAuthorInput[] | PostUncheckedCreateWithoutAuthorInput[]
    connectOrCreate?: PostCreateOrConnectWithoutAuthorInput | PostCreateOrConnectWithoutAuthorInput[]
    createMany?: PostCreateManyAuthorInputEnvelope
    connect?: PostWhereUniqueInput | PostWhereUniqueInput[]
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type PostUpdateManyWithoutAuthorNestedInput = {
    create?: XOR<PostCreateWithoutAuthorInput, PostUncheckedCreateWithoutAuthorInput> | PostCreateWithoutAuthorInput[] | PostUncheckedCreateWithoutAuthorInput[]
    connectOrCreate?: PostCreateOrConnectWithoutAuthorInput | PostCreateOrConnectWithoutAuthorInput[]
    upsert?: PostUpsertWithWhereUniqueWithoutAuthorInput | PostUpsertWithWhereUniqueWithoutAuthorInput[]
    createMany?: PostCreateManyAuthorInputEnvelope
    set?: PostWhereUniqueInput | PostWhereUniqueInput[]
    disconnect?: PostWhereUniqueInput | PostWhereUniqueInput[]
    delete?: PostWhereUniqueInput | PostWhereUniqueInput[]
    connect?: PostWhereUniqueInput | PostWhereUniqueInput[]
    update?: PostUpdateWithWhereUniqueWithoutAuthorInput | PostUpdateWithWhereUniqueWithoutAuthorInput[]
    updateMany?: PostUpdateManyWithWhereWithoutAuthorInput | PostUpdateManyWithWhereWithoutAuthorInput[]
    deleteMany?: PostScalarWhereInput | PostScalarWhereInput[]
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type PostUncheckedUpdateManyWithoutAuthorNestedInput = {
    create?: XOR<PostCreateWithoutAuthorInput, PostUncheckedCreateWithoutAuthorInput> | PostCreateWithoutAuthorInput[] | PostUncheckedCreateWithoutAuthorInput[]
    connectOrCreate?: PostCreateOrConnectWithoutAuthorInput | PostCreateOrConnectWithoutAuthorInput[]
    upsert?: PostUpsertWithWhereUniqueWithoutAuthorInput | PostUpsertWithWhereUniqueWithoutAuthorInput[]
    createMany?: PostCreateManyAuthorInputEnvelope
    set?: PostWhereUniqueInput | PostWhereUniqueInput[]
    disconnect?: PostWhereUniqueInput | PostWhereUniqueInput[]
    delete?: PostWhereUniqueInput | PostWhereUniqueInput[]
    connect?: PostWhereUniqueInput | PostWhereUniqueInput[]
    update?: PostUpdateWithWhereUniqueWithoutAuthorInput | PostUpdateWithWhereUniqueWithoutAuthorInput[]
    updateMany?: PostUpdateManyWithWhereWithoutAuthorInput | PostUpdateManyWithWhereWithoutAuthorInput[]
    deleteMany?: PostScalarWhereInput | PostScalarWhereInput[]
  }

  export type UserCreateNestedOneWithoutPostsInput = {
    create?: XOR<UserCreateWithoutPostsInput, UserUncheckedCreateWithoutPostsInput>
    connectOrCreate?: UserCreateOrConnectWithoutPostsInput
    connect?: UserWhereUniqueInput
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type UserUpdateOneRequiredWithoutPostsNestedInput = {
    create?: XOR<UserCreateWithoutPostsInput, UserUncheckedCreateWithoutPostsInput>
    connectOrCreate?: UserCreateOrConnectWithoutPostsInput
    upsert?: UserUpsertWithoutPostsInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutPostsInput, UserUpdateWithoutPostsInput>, UserUncheckedUpdateWithoutPostsInput>
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type AnimalCreateNestedManyWithoutRacaInput = {
    create?: XOR<AnimalCreateWithoutRacaInput, AnimalUncheckedCreateWithoutRacaInput> | AnimalCreateWithoutRacaInput[] | AnimalUncheckedCreateWithoutRacaInput[]
    connectOrCreate?: AnimalCreateOrConnectWithoutRacaInput | AnimalCreateOrConnectWithoutRacaInput[]
    createMany?: AnimalCreateManyRacaInputEnvelope
    connect?: AnimalWhereUniqueInput | AnimalWhereUniqueInput[]
  }

  export type AnimalUncheckedCreateNestedManyWithoutRacaInput = {
    create?: XOR<AnimalCreateWithoutRacaInput, AnimalUncheckedCreateWithoutRacaInput> | AnimalCreateWithoutRacaInput[] | AnimalUncheckedCreateWithoutRacaInput[]
    connectOrCreate?: AnimalCreateOrConnectWithoutRacaInput | AnimalCreateOrConnectWithoutRacaInput[]
    createMany?: AnimalCreateManyRacaInputEnvelope
    connect?: AnimalWhereUniqueInput | AnimalWhereUniqueInput[]
  }

  export type AnimalUpdateManyWithoutRacaNestedInput = {
    create?: XOR<AnimalCreateWithoutRacaInput, AnimalUncheckedCreateWithoutRacaInput> | AnimalCreateWithoutRacaInput[] | AnimalUncheckedCreateWithoutRacaInput[]
    connectOrCreate?: AnimalCreateOrConnectWithoutRacaInput | AnimalCreateOrConnectWithoutRacaInput[]
    upsert?: AnimalUpsertWithWhereUniqueWithoutRacaInput | AnimalUpsertWithWhereUniqueWithoutRacaInput[]
    createMany?: AnimalCreateManyRacaInputEnvelope
    set?: AnimalWhereUniqueInput | AnimalWhereUniqueInput[]
    disconnect?: AnimalWhereUniqueInput | AnimalWhereUniqueInput[]
    delete?: AnimalWhereUniqueInput | AnimalWhereUniqueInput[]
    connect?: AnimalWhereUniqueInput | AnimalWhereUniqueInput[]
    update?: AnimalUpdateWithWhereUniqueWithoutRacaInput | AnimalUpdateWithWhereUniqueWithoutRacaInput[]
    updateMany?: AnimalUpdateManyWithWhereWithoutRacaInput | AnimalUpdateManyWithWhereWithoutRacaInput[]
    deleteMany?: AnimalScalarWhereInput | AnimalScalarWhereInput[]
  }

  export type AnimalUncheckedUpdateManyWithoutRacaNestedInput = {
    create?: XOR<AnimalCreateWithoutRacaInput, AnimalUncheckedCreateWithoutRacaInput> | AnimalCreateWithoutRacaInput[] | AnimalUncheckedCreateWithoutRacaInput[]
    connectOrCreate?: AnimalCreateOrConnectWithoutRacaInput | AnimalCreateOrConnectWithoutRacaInput[]
    upsert?: AnimalUpsertWithWhereUniqueWithoutRacaInput | AnimalUpsertWithWhereUniqueWithoutRacaInput[]
    createMany?: AnimalCreateManyRacaInputEnvelope
    set?: AnimalWhereUniqueInput | AnimalWhereUniqueInput[]
    disconnect?: AnimalWhereUniqueInput | AnimalWhereUniqueInput[]
    delete?: AnimalWhereUniqueInput | AnimalWhereUniqueInput[]
    connect?: AnimalWhereUniqueInput | AnimalWhereUniqueInput[]
    update?: AnimalUpdateWithWhereUniqueWithoutRacaInput | AnimalUpdateWithWhereUniqueWithoutRacaInput[]
    updateMany?: AnimalUpdateManyWithWhereWithoutRacaInput | AnimalUpdateManyWithWhereWithoutRacaInput[]
    deleteMany?: AnimalScalarWhereInput | AnimalScalarWhereInput[]
  }

  export type AnimalCreateNestedManyWithoutLoteInput = {
    create?: XOR<AnimalCreateWithoutLoteInput, AnimalUncheckedCreateWithoutLoteInput> | AnimalCreateWithoutLoteInput[] | AnimalUncheckedCreateWithoutLoteInput[]
    connectOrCreate?: AnimalCreateOrConnectWithoutLoteInput | AnimalCreateOrConnectWithoutLoteInput[]
    createMany?: AnimalCreateManyLoteInputEnvelope
    connect?: AnimalWhereUniqueInput | AnimalWhereUniqueInput[]
  }

  export type AnimalUncheckedCreateNestedManyWithoutLoteInput = {
    create?: XOR<AnimalCreateWithoutLoteInput, AnimalUncheckedCreateWithoutLoteInput> | AnimalCreateWithoutLoteInput[] | AnimalUncheckedCreateWithoutLoteInput[]
    connectOrCreate?: AnimalCreateOrConnectWithoutLoteInput | AnimalCreateOrConnectWithoutLoteInput[]
    createMany?: AnimalCreateManyLoteInputEnvelope
    connect?: AnimalWhereUniqueInput | AnimalWhereUniqueInput[]
  }

  export type AnimalUpdateManyWithoutLoteNestedInput = {
    create?: XOR<AnimalCreateWithoutLoteInput, AnimalUncheckedCreateWithoutLoteInput> | AnimalCreateWithoutLoteInput[] | AnimalUncheckedCreateWithoutLoteInput[]
    connectOrCreate?: AnimalCreateOrConnectWithoutLoteInput | AnimalCreateOrConnectWithoutLoteInput[]
    upsert?: AnimalUpsertWithWhereUniqueWithoutLoteInput | AnimalUpsertWithWhereUniqueWithoutLoteInput[]
    createMany?: AnimalCreateManyLoteInputEnvelope
    set?: AnimalWhereUniqueInput | AnimalWhereUniqueInput[]
    disconnect?: AnimalWhereUniqueInput | AnimalWhereUniqueInput[]
    delete?: AnimalWhereUniqueInput | AnimalWhereUniqueInput[]
    connect?: AnimalWhereUniqueInput | AnimalWhereUniqueInput[]
    update?: AnimalUpdateWithWhereUniqueWithoutLoteInput | AnimalUpdateWithWhereUniqueWithoutLoteInput[]
    updateMany?: AnimalUpdateManyWithWhereWithoutLoteInput | AnimalUpdateManyWithWhereWithoutLoteInput[]
    deleteMany?: AnimalScalarWhereInput | AnimalScalarWhereInput[]
  }

  export type AnimalUncheckedUpdateManyWithoutLoteNestedInput = {
    create?: XOR<AnimalCreateWithoutLoteInput, AnimalUncheckedCreateWithoutLoteInput> | AnimalCreateWithoutLoteInput[] | AnimalUncheckedCreateWithoutLoteInput[]
    connectOrCreate?: AnimalCreateOrConnectWithoutLoteInput | AnimalCreateOrConnectWithoutLoteInput[]
    upsert?: AnimalUpsertWithWhereUniqueWithoutLoteInput | AnimalUpsertWithWhereUniqueWithoutLoteInput[]
    createMany?: AnimalCreateManyLoteInputEnvelope
    set?: AnimalWhereUniqueInput | AnimalWhereUniqueInput[]
    disconnect?: AnimalWhereUniqueInput | AnimalWhereUniqueInput[]
    delete?: AnimalWhereUniqueInput | AnimalWhereUniqueInput[]
    connect?: AnimalWhereUniqueInput | AnimalWhereUniqueInput[]
    update?: AnimalUpdateWithWhereUniqueWithoutLoteInput | AnimalUpdateWithWhereUniqueWithoutLoteInput[]
    updateMany?: AnimalUpdateManyWithWhereWithoutLoteInput | AnimalUpdateManyWithWhereWithoutLoteInput[]
    deleteMany?: AnimalScalarWhereInput | AnimalScalarWhereInput[]
  }

  export type AnimalCreateNestedManyWithoutFazenda_origemInput = {
    create?: XOR<AnimalCreateWithoutFazenda_origemInput, AnimalUncheckedCreateWithoutFazenda_origemInput> | AnimalCreateWithoutFazenda_origemInput[] | AnimalUncheckedCreateWithoutFazenda_origemInput[]
    connectOrCreate?: AnimalCreateOrConnectWithoutFazenda_origemInput | AnimalCreateOrConnectWithoutFazenda_origemInput[]
    createMany?: AnimalCreateManyFazenda_origemInputEnvelope
    connect?: AnimalWhereUniqueInput | AnimalWhereUniqueInput[]
  }

  export type AnimalUncheckedCreateNestedManyWithoutFazenda_origemInput = {
    create?: XOR<AnimalCreateWithoutFazenda_origemInput, AnimalUncheckedCreateWithoutFazenda_origemInput> | AnimalCreateWithoutFazenda_origemInput[] | AnimalUncheckedCreateWithoutFazenda_origemInput[]
    connectOrCreate?: AnimalCreateOrConnectWithoutFazenda_origemInput | AnimalCreateOrConnectWithoutFazenda_origemInput[]
    createMany?: AnimalCreateManyFazenda_origemInputEnvelope
    connect?: AnimalWhereUniqueInput | AnimalWhereUniqueInput[]
  }

  export type AnimalUpdateManyWithoutFazenda_origemNestedInput = {
    create?: XOR<AnimalCreateWithoutFazenda_origemInput, AnimalUncheckedCreateWithoutFazenda_origemInput> | AnimalCreateWithoutFazenda_origemInput[] | AnimalUncheckedCreateWithoutFazenda_origemInput[]
    connectOrCreate?: AnimalCreateOrConnectWithoutFazenda_origemInput | AnimalCreateOrConnectWithoutFazenda_origemInput[]
    upsert?: AnimalUpsertWithWhereUniqueWithoutFazenda_origemInput | AnimalUpsertWithWhereUniqueWithoutFazenda_origemInput[]
    createMany?: AnimalCreateManyFazenda_origemInputEnvelope
    set?: AnimalWhereUniqueInput | AnimalWhereUniqueInput[]
    disconnect?: AnimalWhereUniqueInput | AnimalWhereUniqueInput[]
    delete?: AnimalWhereUniqueInput | AnimalWhereUniqueInput[]
    connect?: AnimalWhereUniqueInput | AnimalWhereUniqueInput[]
    update?: AnimalUpdateWithWhereUniqueWithoutFazenda_origemInput | AnimalUpdateWithWhereUniqueWithoutFazenda_origemInput[]
    updateMany?: AnimalUpdateManyWithWhereWithoutFazenda_origemInput | AnimalUpdateManyWithWhereWithoutFazenda_origemInput[]
    deleteMany?: AnimalScalarWhereInput | AnimalScalarWhereInput[]
  }

  export type AnimalUncheckedUpdateManyWithoutFazenda_origemNestedInput = {
    create?: XOR<AnimalCreateWithoutFazenda_origemInput, AnimalUncheckedCreateWithoutFazenda_origemInput> | AnimalCreateWithoutFazenda_origemInput[] | AnimalUncheckedCreateWithoutFazenda_origemInput[]
    connectOrCreate?: AnimalCreateOrConnectWithoutFazenda_origemInput | AnimalCreateOrConnectWithoutFazenda_origemInput[]
    upsert?: AnimalUpsertWithWhereUniqueWithoutFazenda_origemInput | AnimalUpsertWithWhereUniqueWithoutFazenda_origemInput[]
    createMany?: AnimalCreateManyFazenda_origemInputEnvelope
    set?: AnimalWhereUniqueInput | AnimalWhereUniqueInput[]
    disconnect?: AnimalWhereUniqueInput | AnimalWhereUniqueInput[]
    delete?: AnimalWhereUniqueInput | AnimalWhereUniqueInput[]
    connect?: AnimalWhereUniqueInput | AnimalWhereUniqueInput[]
    update?: AnimalUpdateWithWhereUniqueWithoutFazenda_origemInput | AnimalUpdateWithWhereUniqueWithoutFazenda_origemInput[]
    updateMany?: AnimalUpdateManyWithWhereWithoutFazenda_origemInput | AnimalUpdateManyWithWhereWithoutFazenda_origemInput[]
    deleteMany?: AnimalScalarWhereInput | AnimalScalarWhereInput[]
  }

  export type RacaCreateNestedOneWithoutAnimaisInput = {
    create?: XOR<RacaCreateWithoutAnimaisInput, RacaUncheckedCreateWithoutAnimaisInput>
    connectOrCreate?: RacaCreateOrConnectWithoutAnimaisInput
    connect?: RacaWhereUniqueInput
  }

  export type LoteCreateNestedOneWithoutAnimaisInput = {
    create?: XOR<LoteCreateWithoutAnimaisInput, LoteUncheckedCreateWithoutAnimaisInput>
    connectOrCreate?: LoteCreateOrConnectWithoutAnimaisInput
    connect?: LoteWhereUniqueInput
  }

  export type AnimalCreateNestedOneWithoutFilhosMaeInput = {
    create?: XOR<AnimalCreateWithoutFilhosMaeInput, AnimalUncheckedCreateWithoutFilhosMaeInput>
    connectOrCreate?: AnimalCreateOrConnectWithoutFilhosMaeInput
    connect?: AnimalWhereUniqueInput
  }

  export type AnimalCreateNestedManyWithoutMaeInput = {
    create?: XOR<AnimalCreateWithoutMaeInput, AnimalUncheckedCreateWithoutMaeInput> | AnimalCreateWithoutMaeInput[] | AnimalUncheckedCreateWithoutMaeInput[]
    connectOrCreate?: AnimalCreateOrConnectWithoutMaeInput | AnimalCreateOrConnectWithoutMaeInput[]
    createMany?: AnimalCreateManyMaeInputEnvelope
    connect?: AnimalWhereUniqueInput | AnimalWhereUniqueInput[]
  }

  export type AnimalCreateNestedOneWithoutFilhosPaiInput = {
    create?: XOR<AnimalCreateWithoutFilhosPaiInput, AnimalUncheckedCreateWithoutFilhosPaiInput>
    connectOrCreate?: AnimalCreateOrConnectWithoutFilhosPaiInput
    connect?: AnimalWhereUniqueInput
  }

  export type AnimalCreateNestedManyWithoutPaiInput = {
    create?: XOR<AnimalCreateWithoutPaiInput, AnimalUncheckedCreateWithoutPaiInput> | AnimalCreateWithoutPaiInput[] | AnimalUncheckedCreateWithoutPaiInput[]
    connectOrCreate?: AnimalCreateOrConnectWithoutPaiInput | AnimalCreateOrConnectWithoutPaiInput[]
    createMany?: AnimalCreateManyPaiInputEnvelope
    connect?: AnimalWhereUniqueInput | AnimalWhereUniqueInput[]
  }

  export type FazendaCreateNestedOneWithoutAnimaisOrigemInput = {
    create?: XOR<FazendaCreateWithoutAnimaisOrigemInput, FazendaUncheckedCreateWithoutAnimaisOrigemInput>
    connectOrCreate?: FazendaCreateOrConnectWithoutAnimaisOrigemInput
    connect?: FazendaWhereUniqueInput
  }

  export type AnimalUncheckedCreateNestedManyWithoutMaeInput = {
    create?: XOR<AnimalCreateWithoutMaeInput, AnimalUncheckedCreateWithoutMaeInput> | AnimalCreateWithoutMaeInput[] | AnimalUncheckedCreateWithoutMaeInput[]
    connectOrCreate?: AnimalCreateOrConnectWithoutMaeInput | AnimalCreateOrConnectWithoutMaeInput[]
    createMany?: AnimalCreateManyMaeInputEnvelope
    connect?: AnimalWhereUniqueInput | AnimalWhereUniqueInput[]
  }

  export type AnimalUncheckedCreateNestedManyWithoutPaiInput = {
    create?: XOR<AnimalCreateWithoutPaiInput, AnimalUncheckedCreateWithoutPaiInput> | AnimalCreateWithoutPaiInput[] | AnimalUncheckedCreateWithoutPaiInput[]
    connectOrCreate?: AnimalCreateOrConnectWithoutPaiInput | AnimalCreateOrConnectWithoutPaiInput[]
    createMany?: AnimalCreateManyPaiInputEnvelope
    connect?: AnimalWhereUniqueInput | AnimalWhereUniqueInput[]
  }

  export type EnumSexoFieldUpdateOperationsInput = {
    set?: $Enums.Sexo
  }

  export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null
  }

  export type NullableFloatFieldUpdateOperationsInput = {
    set?: number | null
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type EnumAnimalOrigemFieldUpdateOperationsInput = {
    set?: $Enums.AnimalOrigem
  }

  export type EnumAnimalStatusFieldUpdateOperationsInput = {
    set?: $Enums.AnimalStatus
  }

  export type NullableIntFieldUpdateOperationsInput = {
    set?: number | null
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type RacaUpdateOneWithoutAnimaisNestedInput = {
    create?: XOR<RacaCreateWithoutAnimaisInput, RacaUncheckedCreateWithoutAnimaisInput>
    connectOrCreate?: RacaCreateOrConnectWithoutAnimaisInput
    upsert?: RacaUpsertWithoutAnimaisInput
    disconnect?: RacaWhereInput | boolean
    delete?: RacaWhereInput | boolean
    connect?: RacaWhereUniqueInput
    update?: XOR<XOR<RacaUpdateToOneWithWhereWithoutAnimaisInput, RacaUpdateWithoutAnimaisInput>, RacaUncheckedUpdateWithoutAnimaisInput>
  }

  export type LoteUpdateOneWithoutAnimaisNestedInput = {
    create?: XOR<LoteCreateWithoutAnimaisInput, LoteUncheckedCreateWithoutAnimaisInput>
    connectOrCreate?: LoteCreateOrConnectWithoutAnimaisInput
    upsert?: LoteUpsertWithoutAnimaisInput
    disconnect?: LoteWhereInput | boolean
    delete?: LoteWhereInput | boolean
    connect?: LoteWhereUniqueInput
    update?: XOR<XOR<LoteUpdateToOneWithWhereWithoutAnimaisInput, LoteUpdateWithoutAnimaisInput>, LoteUncheckedUpdateWithoutAnimaisInput>
  }

  export type AnimalUpdateOneWithoutFilhosMaeNestedInput = {
    create?: XOR<AnimalCreateWithoutFilhosMaeInput, AnimalUncheckedCreateWithoutFilhosMaeInput>
    connectOrCreate?: AnimalCreateOrConnectWithoutFilhosMaeInput
    upsert?: AnimalUpsertWithoutFilhosMaeInput
    disconnect?: AnimalWhereInput | boolean
    delete?: AnimalWhereInput | boolean
    connect?: AnimalWhereUniqueInput
    update?: XOR<XOR<AnimalUpdateToOneWithWhereWithoutFilhosMaeInput, AnimalUpdateWithoutFilhosMaeInput>, AnimalUncheckedUpdateWithoutFilhosMaeInput>
  }

  export type AnimalUpdateManyWithoutMaeNestedInput = {
    create?: XOR<AnimalCreateWithoutMaeInput, AnimalUncheckedCreateWithoutMaeInput> | AnimalCreateWithoutMaeInput[] | AnimalUncheckedCreateWithoutMaeInput[]
    connectOrCreate?: AnimalCreateOrConnectWithoutMaeInput | AnimalCreateOrConnectWithoutMaeInput[]
    upsert?: AnimalUpsertWithWhereUniqueWithoutMaeInput | AnimalUpsertWithWhereUniqueWithoutMaeInput[]
    createMany?: AnimalCreateManyMaeInputEnvelope
    set?: AnimalWhereUniqueInput | AnimalWhereUniqueInput[]
    disconnect?: AnimalWhereUniqueInput | AnimalWhereUniqueInput[]
    delete?: AnimalWhereUniqueInput | AnimalWhereUniqueInput[]
    connect?: AnimalWhereUniqueInput | AnimalWhereUniqueInput[]
    update?: AnimalUpdateWithWhereUniqueWithoutMaeInput | AnimalUpdateWithWhereUniqueWithoutMaeInput[]
    updateMany?: AnimalUpdateManyWithWhereWithoutMaeInput | AnimalUpdateManyWithWhereWithoutMaeInput[]
    deleteMany?: AnimalScalarWhereInput | AnimalScalarWhereInput[]
  }

  export type AnimalUpdateOneWithoutFilhosPaiNestedInput = {
    create?: XOR<AnimalCreateWithoutFilhosPaiInput, AnimalUncheckedCreateWithoutFilhosPaiInput>
    connectOrCreate?: AnimalCreateOrConnectWithoutFilhosPaiInput
    upsert?: AnimalUpsertWithoutFilhosPaiInput
    disconnect?: AnimalWhereInput | boolean
    delete?: AnimalWhereInput | boolean
    connect?: AnimalWhereUniqueInput
    update?: XOR<XOR<AnimalUpdateToOneWithWhereWithoutFilhosPaiInput, AnimalUpdateWithoutFilhosPaiInput>, AnimalUncheckedUpdateWithoutFilhosPaiInput>
  }

  export type AnimalUpdateManyWithoutPaiNestedInput = {
    create?: XOR<AnimalCreateWithoutPaiInput, AnimalUncheckedCreateWithoutPaiInput> | AnimalCreateWithoutPaiInput[] | AnimalUncheckedCreateWithoutPaiInput[]
    connectOrCreate?: AnimalCreateOrConnectWithoutPaiInput | AnimalCreateOrConnectWithoutPaiInput[]
    upsert?: AnimalUpsertWithWhereUniqueWithoutPaiInput | AnimalUpsertWithWhereUniqueWithoutPaiInput[]
    createMany?: AnimalCreateManyPaiInputEnvelope
    set?: AnimalWhereUniqueInput | AnimalWhereUniqueInput[]
    disconnect?: AnimalWhereUniqueInput | AnimalWhereUniqueInput[]
    delete?: AnimalWhereUniqueInput | AnimalWhereUniqueInput[]
    connect?: AnimalWhereUniqueInput | AnimalWhereUniqueInput[]
    update?: AnimalUpdateWithWhereUniqueWithoutPaiInput | AnimalUpdateWithWhereUniqueWithoutPaiInput[]
    updateMany?: AnimalUpdateManyWithWhereWithoutPaiInput | AnimalUpdateManyWithWhereWithoutPaiInput[]
    deleteMany?: AnimalScalarWhereInput | AnimalScalarWhereInput[]
  }

  export type FazendaUpdateOneWithoutAnimaisOrigemNestedInput = {
    create?: XOR<FazendaCreateWithoutAnimaisOrigemInput, FazendaUncheckedCreateWithoutAnimaisOrigemInput>
    connectOrCreate?: FazendaCreateOrConnectWithoutAnimaisOrigemInput
    upsert?: FazendaUpsertWithoutAnimaisOrigemInput
    disconnect?: FazendaWhereInput | boolean
    delete?: FazendaWhereInput | boolean
    connect?: FazendaWhereUniqueInput
    update?: XOR<XOR<FazendaUpdateToOneWithWhereWithoutAnimaisOrigemInput, FazendaUpdateWithoutAnimaisOrigemInput>, FazendaUncheckedUpdateWithoutAnimaisOrigemInput>
  }

  export type AnimalUncheckedUpdateManyWithoutMaeNestedInput = {
    create?: XOR<AnimalCreateWithoutMaeInput, AnimalUncheckedCreateWithoutMaeInput> | AnimalCreateWithoutMaeInput[] | AnimalUncheckedCreateWithoutMaeInput[]
    connectOrCreate?: AnimalCreateOrConnectWithoutMaeInput | AnimalCreateOrConnectWithoutMaeInput[]
    upsert?: AnimalUpsertWithWhereUniqueWithoutMaeInput | AnimalUpsertWithWhereUniqueWithoutMaeInput[]
    createMany?: AnimalCreateManyMaeInputEnvelope
    set?: AnimalWhereUniqueInput | AnimalWhereUniqueInput[]
    disconnect?: AnimalWhereUniqueInput | AnimalWhereUniqueInput[]
    delete?: AnimalWhereUniqueInput | AnimalWhereUniqueInput[]
    connect?: AnimalWhereUniqueInput | AnimalWhereUniqueInput[]
    update?: AnimalUpdateWithWhereUniqueWithoutMaeInput | AnimalUpdateWithWhereUniqueWithoutMaeInput[]
    updateMany?: AnimalUpdateManyWithWhereWithoutMaeInput | AnimalUpdateManyWithWhereWithoutMaeInput[]
    deleteMany?: AnimalScalarWhereInput | AnimalScalarWhereInput[]
  }

  export type AnimalUncheckedUpdateManyWithoutPaiNestedInput = {
    create?: XOR<AnimalCreateWithoutPaiInput, AnimalUncheckedCreateWithoutPaiInput> | AnimalCreateWithoutPaiInput[] | AnimalUncheckedCreateWithoutPaiInput[]
    connectOrCreate?: AnimalCreateOrConnectWithoutPaiInput | AnimalCreateOrConnectWithoutPaiInput[]
    upsert?: AnimalUpsertWithWhereUniqueWithoutPaiInput | AnimalUpsertWithWhereUniqueWithoutPaiInput[]
    createMany?: AnimalCreateManyPaiInputEnvelope
    set?: AnimalWhereUniqueInput | AnimalWhereUniqueInput[]
    disconnect?: AnimalWhereUniqueInput | AnimalWhereUniqueInput[]
    delete?: AnimalWhereUniqueInput | AnimalWhereUniqueInput[]
    connect?: AnimalWhereUniqueInput | AnimalWhereUniqueInput[]
    update?: AnimalUpdateWithWhereUniqueWithoutPaiInput | AnimalUpdateWithWhereUniqueWithoutPaiInput[]
    updateMany?: AnimalUpdateManyWithWhereWithoutPaiInput | AnimalUpdateManyWithWhereWithoutPaiInput[]
    deleteMany?: AnimalScalarWhereInput | AnimalScalarWhereInput[]
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedEnumSexoFilter<$PrismaModel = never> = {
    equals?: $Enums.Sexo | EnumSexoFieldRefInput<$PrismaModel>
    in?: $Enums.Sexo[] | ListEnumSexoFieldRefInput<$PrismaModel>
    notIn?: $Enums.Sexo[] | ListEnumSexoFieldRefInput<$PrismaModel>
    not?: NestedEnumSexoFilter<$PrismaModel> | $Enums.Sexo
  }

  export type NestedDateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type NestedFloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
  }

  export type NestedEnumAnimalOrigemFilter<$PrismaModel = never> = {
    equals?: $Enums.AnimalOrigem | EnumAnimalOrigemFieldRefInput<$PrismaModel>
    in?: $Enums.AnimalOrigem[] | ListEnumAnimalOrigemFieldRefInput<$PrismaModel>
    notIn?: $Enums.AnimalOrigem[] | ListEnumAnimalOrigemFieldRefInput<$PrismaModel>
    not?: NestedEnumAnimalOrigemFilter<$PrismaModel> | $Enums.AnimalOrigem
  }

  export type NestedEnumAnimalStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.AnimalStatus | EnumAnimalStatusFieldRefInput<$PrismaModel>
    in?: $Enums.AnimalStatus[] | ListEnumAnimalStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.AnimalStatus[] | ListEnumAnimalStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumAnimalStatusFilter<$PrismaModel> | $Enums.AnimalStatus
  }

  export type NestedEnumSexoWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.Sexo | EnumSexoFieldRefInput<$PrismaModel>
    in?: $Enums.Sexo[] | ListEnumSexoFieldRefInput<$PrismaModel>
    notIn?: $Enums.Sexo[] | ListEnumSexoFieldRefInput<$PrismaModel>
    not?: NestedEnumSexoWithAggregatesFilter<$PrismaModel> | $Enums.Sexo
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumSexoFilter<$PrismaModel>
    _max?: NestedEnumSexoFilter<$PrismaModel>
  }

  export type NestedDateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type NestedFloatNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedFloatNullableFilter<$PrismaModel>
    _min?: NestedFloatNullableFilter<$PrismaModel>
    _max?: NestedFloatNullableFilter<$PrismaModel>
  }

  export type NestedEnumAnimalOrigemWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.AnimalOrigem | EnumAnimalOrigemFieldRefInput<$PrismaModel>
    in?: $Enums.AnimalOrigem[] | ListEnumAnimalOrigemFieldRefInput<$PrismaModel>
    notIn?: $Enums.AnimalOrigem[] | ListEnumAnimalOrigemFieldRefInput<$PrismaModel>
    not?: NestedEnumAnimalOrigemWithAggregatesFilter<$PrismaModel> | $Enums.AnimalOrigem
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumAnimalOrigemFilter<$PrismaModel>
    _max?: NestedEnumAnimalOrigemFilter<$PrismaModel>
  }

  export type NestedEnumAnimalStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.AnimalStatus | EnumAnimalStatusFieldRefInput<$PrismaModel>
    in?: $Enums.AnimalStatus[] | ListEnumAnimalStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.AnimalStatus[] | ListEnumAnimalStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumAnimalStatusWithAggregatesFilter<$PrismaModel> | $Enums.AnimalStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumAnimalStatusFilter<$PrismaModel>
    _max?: NestedEnumAnimalStatusFilter<$PrismaModel>
  }

  export type NestedIntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type PostCreateWithoutAuthorInput = {
    title: string
    content?: string | null
    published?: boolean
  }

  export type PostUncheckedCreateWithoutAuthorInput = {
    id?: number
    title: string
    content?: string | null
    published?: boolean
  }

  export type PostCreateOrConnectWithoutAuthorInput = {
    where: PostWhereUniqueInput
    create: XOR<PostCreateWithoutAuthorInput, PostUncheckedCreateWithoutAuthorInput>
  }

  export type PostCreateManyAuthorInputEnvelope = {
    data: PostCreateManyAuthorInput | PostCreateManyAuthorInput[]
    skipDuplicates?: boolean
  }

  export type PostUpsertWithWhereUniqueWithoutAuthorInput = {
    where: PostWhereUniqueInput
    update: XOR<PostUpdateWithoutAuthorInput, PostUncheckedUpdateWithoutAuthorInput>
    create: XOR<PostCreateWithoutAuthorInput, PostUncheckedCreateWithoutAuthorInput>
  }

  export type PostUpdateWithWhereUniqueWithoutAuthorInput = {
    where: PostWhereUniqueInput
    data: XOR<PostUpdateWithoutAuthorInput, PostUncheckedUpdateWithoutAuthorInput>
  }

  export type PostUpdateManyWithWhereWithoutAuthorInput = {
    where: PostScalarWhereInput
    data: XOR<PostUpdateManyMutationInput, PostUncheckedUpdateManyWithoutAuthorInput>
  }

  export type PostScalarWhereInput = {
    AND?: PostScalarWhereInput | PostScalarWhereInput[]
    OR?: PostScalarWhereInput[]
    NOT?: PostScalarWhereInput | PostScalarWhereInput[]
    id?: IntFilter<"Post"> | number
    title?: StringFilter<"Post"> | string
    content?: StringNullableFilter<"Post"> | string | null
    published?: BoolFilter<"Post"> | boolean
    authorId?: IntFilter<"Post"> | number
  }

  export type UserCreateWithoutPostsInput = {
    email: string
    name?: string | null
  }

  export type UserUncheckedCreateWithoutPostsInput = {
    id?: number
    email: string
    name?: string | null
  }

  export type UserCreateOrConnectWithoutPostsInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutPostsInput, UserUncheckedCreateWithoutPostsInput>
  }

  export type UserUpsertWithoutPostsInput = {
    update: XOR<UserUpdateWithoutPostsInput, UserUncheckedUpdateWithoutPostsInput>
    create: XOR<UserCreateWithoutPostsInput, UserUncheckedCreateWithoutPostsInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutPostsInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutPostsInput, UserUncheckedUpdateWithoutPostsInput>
  }

  export type UserUpdateWithoutPostsInput = {
    email?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type UserUncheckedUpdateWithoutPostsInput = {
    id?: IntFieldUpdateOperationsInput | number
    email?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type AnimalCreateWithoutRacaInput = {
    id?: string
    rfid?: string | null
    brinco?: string | null
    nome_apelido?: string | null
    sexo: $Enums.Sexo
    data_nascimento?: Date | string | null
    peso_nascimento_kg?: number | null
    origem?: $Enums.AnimalOrigem
    status?: $Enums.AnimalStatus
    fazenda_origem_nome?: string | null
    data_aquisicao?: Date | string | null
    valor_compra?: number | null
    idade_entrada_meses?: number | null
    peso_atual_kg?: number | null
    createdAt?: Date | string
    updatedAt?: Date | string
    lote?: LoteCreateNestedOneWithoutAnimaisInput
    mae?: AnimalCreateNestedOneWithoutFilhosMaeInput
    filhosMae?: AnimalCreateNestedManyWithoutMaeInput
    pai?: AnimalCreateNestedOneWithoutFilhosPaiInput
    filhosPai?: AnimalCreateNestedManyWithoutPaiInput
    fazenda_origem?: FazendaCreateNestedOneWithoutAnimaisOrigemInput
  }

  export type AnimalUncheckedCreateWithoutRacaInput = {
    id?: string
    rfid?: string | null
    brinco?: string | null
    nome_apelido?: string | null
    sexo: $Enums.Sexo
    data_nascimento?: Date | string | null
    peso_nascimento_kg?: number | null
    origem?: $Enums.AnimalOrigem
    status?: $Enums.AnimalStatus
    lote_id?: number | null
    mae_id?: string | null
    pai_id?: string | null
    fazenda_origem_id?: number | null
    fazenda_origem_nome?: string | null
    data_aquisicao?: Date | string | null
    valor_compra?: number | null
    idade_entrada_meses?: number | null
    peso_atual_kg?: number | null
    createdAt?: Date | string
    updatedAt?: Date | string
    filhosMae?: AnimalUncheckedCreateNestedManyWithoutMaeInput
    filhosPai?: AnimalUncheckedCreateNestedManyWithoutPaiInput
  }

  export type AnimalCreateOrConnectWithoutRacaInput = {
    where: AnimalWhereUniqueInput
    create: XOR<AnimalCreateWithoutRacaInput, AnimalUncheckedCreateWithoutRacaInput>
  }

  export type AnimalCreateManyRacaInputEnvelope = {
    data: AnimalCreateManyRacaInput | AnimalCreateManyRacaInput[]
    skipDuplicates?: boolean
  }

  export type AnimalUpsertWithWhereUniqueWithoutRacaInput = {
    where: AnimalWhereUniqueInput
    update: XOR<AnimalUpdateWithoutRacaInput, AnimalUncheckedUpdateWithoutRacaInput>
    create: XOR<AnimalCreateWithoutRacaInput, AnimalUncheckedCreateWithoutRacaInput>
  }

  export type AnimalUpdateWithWhereUniqueWithoutRacaInput = {
    where: AnimalWhereUniqueInput
    data: XOR<AnimalUpdateWithoutRacaInput, AnimalUncheckedUpdateWithoutRacaInput>
  }

  export type AnimalUpdateManyWithWhereWithoutRacaInput = {
    where: AnimalScalarWhereInput
    data: XOR<AnimalUpdateManyMutationInput, AnimalUncheckedUpdateManyWithoutRacaInput>
  }

  export type AnimalScalarWhereInput = {
    AND?: AnimalScalarWhereInput | AnimalScalarWhereInput[]
    OR?: AnimalScalarWhereInput[]
    NOT?: AnimalScalarWhereInput | AnimalScalarWhereInput[]
    id?: StringFilter<"Animal"> | string
    rfid?: StringNullableFilter<"Animal"> | string | null
    brinco?: StringNullableFilter<"Animal"> | string | null
    nome_apelido?: StringNullableFilter<"Animal"> | string | null
    sexo?: EnumSexoFilter<"Animal"> | $Enums.Sexo
    data_nascimento?: DateTimeNullableFilter<"Animal"> | Date | string | null
    peso_nascimento_kg?: FloatNullableFilter<"Animal"> | number | null
    origem?: EnumAnimalOrigemFilter<"Animal"> | $Enums.AnimalOrigem
    status?: EnumAnimalStatusFilter<"Animal"> | $Enums.AnimalStatus
    raca_id?: IntNullableFilter<"Animal"> | number | null
    lote_id?: IntNullableFilter<"Animal"> | number | null
    mae_id?: StringNullableFilter<"Animal"> | string | null
    pai_id?: StringNullableFilter<"Animal"> | string | null
    fazenda_origem_id?: IntNullableFilter<"Animal"> | number | null
    fazenda_origem_nome?: StringNullableFilter<"Animal"> | string | null
    data_aquisicao?: DateTimeNullableFilter<"Animal"> | Date | string | null
    valor_compra?: FloatNullableFilter<"Animal"> | number | null
    idade_entrada_meses?: IntNullableFilter<"Animal"> | number | null
    peso_atual_kg?: FloatNullableFilter<"Animal"> | number | null
    createdAt?: DateTimeFilter<"Animal"> | Date | string
    updatedAt?: DateTimeFilter<"Animal"> | Date | string
  }

  export type AnimalCreateWithoutLoteInput = {
    id?: string
    rfid?: string | null
    brinco?: string | null
    nome_apelido?: string | null
    sexo: $Enums.Sexo
    data_nascimento?: Date | string | null
    peso_nascimento_kg?: number | null
    origem?: $Enums.AnimalOrigem
    status?: $Enums.AnimalStatus
    fazenda_origem_nome?: string | null
    data_aquisicao?: Date | string | null
    valor_compra?: number | null
    idade_entrada_meses?: number | null
    peso_atual_kg?: number | null
    createdAt?: Date | string
    updatedAt?: Date | string
    raca?: RacaCreateNestedOneWithoutAnimaisInput
    mae?: AnimalCreateNestedOneWithoutFilhosMaeInput
    filhosMae?: AnimalCreateNestedManyWithoutMaeInput
    pai?: AnimalCreateNestedOneWithoutFilhosPaiInput
    filhosPai?: AnimalCreateNestedManyWithoutPaiInput
    fazenda_origem?: FazendaCreateNestedOneWithoutAnimaisOrigemInput
  }

  export type AnimalUncheckedCreateWithoutLoteInput = {
    id?: string
    rfid?: string | null
    brinco?: string | null
    nome_apelido?: string | null
    sexo: $Enums.Sexo
    data_nascimento?: Date | string | null
    peso_nascimento_kg?: number | null
    origem?: $Enums.AnimalOrigem
    status?: $Enums.AnimalStatus
    raca_id?: number | null
    mae_id?: string | null
    pai_id?: string | null
    fazenda_origem_id?: number | null
    fazenda_origem_nome?: string | null
    data_aquisicao?: Date | string | null
    valor_compra?: number | null
    idade_entrada_meses?: number | null
    peso_atual_kg?: number | null
    createdAt?: Date | string
    updatedAt?: Date | string
    filhosMae?: AnimalUncheckedCreateNestedManyWithoutMaeInput
    filhosPai?: AnimalUncheckedCreateNestedManyWithoutPaiInput
  }

  export type AnimalCreateOrConnectWithoutLoteInput = {
    where: AnimalWhereUniqueInput
    create: XOR<AnimalCreateWithoutLoteInput, AnimalUncheckedCreateWithoutLoteInput>
  }

  export type AnimalCreateManyLoteInputEnvelope = {
    data: AnimalCreateManyLoteInput | AnimalCreateManyLoteInput[]
    skipDuplicates?: boolean
  }

  export type AnimalUpsertWithWhereUniqueWithoutLoteInput = {
    where: AnimalWhereUniqueInput
    update: XOR<AnimalUpdateWithoutLoteInput, AnimalUncheckedUpdateWithoutLoteInput>
    create: XOR<AnimalCreateWithoutLoteInput, AnimalUncheckedCreateWithoutLoteInput>
  }

  export type AnimalUpdateWithWhereUniqueWithoutLoteInput = {
    where: AnimalWhereUniqueInput
    data: XOR<AnimalUpdateWithoutLoteInput, AnimalUncheckedUpdateWithoutLoteInput>
  }

  export type AnimalUpdateManyWithWhereWithoutLoteInput = {
    where: AnimalScalarWhereInput
    data: XOR<AnimalUpdateManyMutationInput, AnimalUncheckedUpdateManyWithoutLoteInput>
  }

  export type AnimalCreateWithoutFazenda_origemInput = {
    id?: string
    rfid?: string | null
    brinco?: string | null
    nome_apelido?: string | null
    sexo: $Enums.Sexo
    data_nascimento?: Date | string | null
    peso_nascimento_kg?: number | null
    origem?: $Enums.AnimalOrigem
    status?: $Enums.AnimalStatus
    fazenda_origem_nome?: string | null
    data_aquisicao?: Date | string | null
    valor_compra?: number | null
    idade_entrada_meses?: number | null
    peso_atual_kg?: number | null
    createdAt?: Date | string
    updatedAt?: Date | string
    raca?: RacaCreateNestedOneWithoutAnimaisInput
    lote?: LoteCreateNestedOneWithoutAnimaisInput
    mae?: AnimalCreateNestedOneWithoutFilhosMaeInput
    filhosMae?: AnimalCreateNestedManyWithoutMaeInput
    pai?: AnimalCreateNestedOneWithoutFilhosPaiInput
    filhosPai?: AnimalCreateNestedManyWithoutPaiInput
  }

  export type AnimalUncheckedCreateWithoutFazenda_origemInput = {
    id?: string
    rfid?: string | null
    brinco?: string | null
    nome_apelido?: string | null
    sexo: $Enums.Sexo
    data_nascimento?: Date | string | null
    peso_nascimento_kg?: number | null
    origem?: $Enums.AnimalOrigem
    status?: $Enums.AnimalStatus
    raca_id?: number | null
    lote_id?: number | null
    mae_id?: string | null
    pai_id?: string | null
    fazenda_origem_nome?: string | null
    data_aquisicao?: Date | string | null
    valor_compra?: number | null
    idade_entrada_meses?: number | null
    peso_atual_kg?: number | null
    createdAt?: Date | string
    updatedAt?: Date | string
    filhosMae?: AnimalUncheckedCreateNestedManyWithoutMaeInput
    filhosPai?: AnimalUncheckedCreateNestedManyWithoutPaiInput
  }

  export type AnimalCreateOrConnectWithoutFazenda_origemInput = {
    where: AnimalWhereUniqueInput
    create: XOR<AnimalCreateWithoutFazenda_origemInput, AnimalUncheckedCreateWithoutFazenda_origemInput>
  }

  export type AnimalCreateManyFazenda_origemInputEnvelope = {
    data: AnimalCreateManyFazenda_origemInput | AnimalCreateManyFazenda_origemInput[]
    skipDuplicates?: boolean
  }

  export type AnimalUpsertWithWhereUniqueWithoutFazenda_origemInput = {
    where: AnimalWhereUniqueInput
    update: XOR<AnimalUpdateWithoutFazenda_origemInput, AnimalUncheckedUpdateWithoutFazenda_origemInput>
    create: XOR<AnimalCreateWithoutFazenda_origemInput, AnimalUncheckedCreateWithoutFazenda_origemInput>
  }

  export type AnimalUpdateWithWhereUniqueWithoutFazenda_origemInput = {
    where: AnimalWhereUniqueInput
    data: XOR<AnimalUpdateWithoutFazenda_origemInput, AnimalUncheckedUpdateWithoutFazenda_origemInput>
  }

  export type AnimalUpdateManyWithWhereWithoutFazenda_origemInput = {
    where: AnimalScalarWhereInput
    data: XOR<AnimalUpdateManyMutationInput, AnimalUncheckedUpdateManyWithoutFazenda_origemInput>
  }

  export type RacaCreateWithoutAnimaisInput = {
    nome: string
  }

  export type RacaUncheckedCreateWithoutAnimaisInput = {
    id?: number
    nome: string
  }

  export type RacaCreateOrConnectWithoutAnimaisInput = {
    where: RacaWhereUniqueInput
    create: XOR<RacaCreateWithoutAnimaisInput, RacaUncheckedCreateWithoutAnimaisInput>
  }

  export type LoteCreateWithoutAnimaisInput = {
    nome: string
  }

  export type LoteUncheckedCreateWithoutAnimaisInput = {
    id?: number
    nome: string
  }

  export type LoteCreateOrConnectWithoutAnimaisInput = {
    where: LoteWhereUniqueInput
    create: XOR<LoteCreateWithoutAnimaisInput, LoteUncheckedCreateWithoutAnimaisInput>
  }

  export type AnimalCreateWithoutFilhosMaeInput = {
    id?: string
    rfid?: string | null
    brinco?: string | null
    nome_apelido?: string | null
    sexo: $Enums.Sexo
    data_nascimento?: Date | string | null
    peso_nascimento_kg?: number | null
    origem?: $Enums.AnimalOrigem
    status?: $Enums.AnimalStatus
    fazenda_origem_nome?: string | null
    data_aquisicao?: Date | string | null
    valor_compra?: number | null
    idade_entrada_meses?: number | null
    peso_atual_kg?: number | null
    createdAt?: Date | string
    updatedAt?: Date | string
    raca?: RacaCreateNestedOneWithoutAnimaisInput
    lote?: LoteCreateNestedOneWithoutAnimaisInput
    mae?: AnimalCreateNestedOneWithoutFilhosMaeInput
    pai?: AnimalCreateNestedOneWithoutFilhosPaiInput
    filhosPai?: AnimalCreateNestedManyWithoutPaiInput
    fazenda_origem?: FazendaCreateNestedOneWithoutAnimaisOrigemInput
  }

  export type AnimalUncheckedCreateWithoutFilhosMaeInput = {
    id?: string
    rfid?: string | null
    brinco?: string | null
    nome_apelido?: string | null
    sexo: $Enums.Sexo
    data_nascimento?: Date | string | null
    peso_nascimento_kg?: number | null
    origem?: $Enums.AnimalOrigem
    status?: $Enums.AnimalStatus
    raca_id?: number | null
    lote_id?: number | null
    mae_id?: string | null
    pai_id?: string | null
    fazenda_origem_id?: number | null
    fazenda_origem_nome?: string | null
    data_aquisicao?: Date | string | null
    valor_compra?: number | null
    idade_entrada_meses?: number | null
    peso_atual_kg?: number | null
    createdAt?: Date | string
    updatedAt?: Date | string
    filhosPai?: AnimalUncheckedCreateNestedManyWithoutPaiInput
  }

  export type AnimalCreateOrConnectWithoutFilhosMaeInput = {
    where: AnimalWhereUniqueInput
    create: XOR<AnimalCreateWithoutFilhosMaeInput, AnimalUncheckedCreateWithoutFilhosMaeInput>
  }

  export type AnimalCreateWithoutMaeInput = {
    id?: string
    rfid?: string | null
    brinco?: string | null
    nome_apelido?: string | null
    sexo: $Enums.Sexo
    data_nascimento?: Date | string | null
    peso_nascimento_kg?: number | null
    origem?: $Enums.AnimalOrigem
    status?: $Enums.AnimalStatus
    fazenda_origem_nome?: string | null
    data_aquisicao?: Date | string | null
    valor_compra?: number | null
    idade_entrada_meses?: number | null
    peso_atual_kg?: number | null
    createdAt?: Date | string
    updatedAt?: Date | string
    raca?: RacaCreateNestedOneWithoutAnimaisInput
    lote?: LoteCreateNestedOneWithoutAnimaisInput
    filhosMae?: AnimalCreateNestedManyWithoutMaeInput
    pai?: AnimalCreateNestedOneWithoutFilhosPaiInput
    filhosPai?: AnimalCreateNestedManyWithoutPaiInput
    fazenda_origem?: FazendaCreateNestedOneWithoutAnimaisOrigemInput
  }

  export type AnimalUncheckedCreateWithoutMaeInput = {
    id?: string
    rfid?: string | null
    brinco?: string | null
    nome_apelido?: string | null
    sexo: $Enums.Sexo
    data_nascimento?: Date | string | null
    peso_nascimento_kg?: number | null
    origem?: $Enums.AnimalOrigem
    status?: $Enums.AnimalStatus
    raca_id?: number | null
    lote_id?: number | null
    pai_id?: string | null
    fazenda_origem_id?: number | null
    fazenda_origem_nome?: string | null
    data_aquisicao?: Date | string | null
    valor_compra?: number | null
    idade_entrada_meses?: number | null
    peso_atual_kg?: number | null
    createdAt?: Date | string
    updatedAt?: Date | string
    filhosMae?: AnimalUncheckedCreateNestedManyWithoutMaeInput
    filhosPai?: AnimalUncheckedCreateNestedManyWithoutPaiInput
  }

  export type AnimalCreateOrConnectWithoutMaeInput = {
    where: AnimalWhereUniqueInput
    create: XOR<AnimalCreateWithoutMaeInput, AnimalUncheckedCreateWithoutMaeInput>
  }

  export type AnimalCreateManyMaeInputEnvelope = {
    data: AnimalCreateManyMaeInput | AnimalCreateManyMaeInput[]
    skipDuplicates?: boolean
  }

  export type AnimalCreateWithoutFilhosPaiInput = {
    id?: string
    rfid?: string | null
    brinco?: string | null
    nome_apelido?: string | null
    sexo: $Enums.Sexo
    data_nascimento?: Date | string | null
    peso_nascimento_kg?: number | null
    origem?: $Enums.AnimalOrigem
    status?: $Enums.AnimalStatus
    fazenda_origem_nome?: string | null
    data_aquisicao?: Date | string | null
    valor_compra?: number | null
    idade_entrada_meses?: number | null
    peso_atual_kg?: number | null
    createdAt?: Date | string
    updatedAt?: Date | string
    raca?: RacaCreateNestedOneWithoutAnimaisInput
    lote?: LoteCreateNestedOneWithoutAnimaisInput
    mae?: AnimalCreateNestedOneWithoutFilhosMaeInput
    filhosMae?: AnimalCreateNestedManyWithoutMaeInput
    pai?: AnimalCreateNestedOneWithoutFilhosPaiInput
    fazenda_origem?: FazendaCreateNestedOneWithoutAnimaisOrigemInput
  }

  export type AnimalUncheckedCreateWithoutFilhosPaiInput = {
    id?: string
    rfid?: string | null
    brinco?: string | null
    nome_apelido?: string | null
    sexo: $Enums.Sexo
    data_nascimento?: Date | string | null
    peso_nascimento_kg?: number | null
    origem?: $Enums.AnimalOrigem
    status?: $Enums.AnimalStatus
    raca_id?: number | null
    lote_id?: number | null
    mae_id?: string | null
    pai_id?: string | null
    fazenda_origem_id?: number | null
    fazenda_origem_nome?: string | null
    data_aquisicao?: Date | string | null
    valor_compra?: number | null
    idade_entrada_meses?: number | null
    peso_atual_kg?: number | null
    createdAt?: Date | string
    updatedAt?: Date | string
    filhosMae?: AnimalUncheckedCreateNestedManyWithoutMaeInput
  }

  export type AnimalCreateOrConnectWithoutFilhosPaiInput = {
    where: AnimalWhereUniqueInput
    create: XOR<AnimalCreateWithoutFilhosPaiInput, AnimalUncheckedCreateWithoutFilhosPaiInput>
  }

  export type AnimalCreateWithoutPaiInput = {
    id?: string
    rfid?: string | null
    brinco?: string | null
    nome_apelido?: string | null
    sexo: $Enums.Sexo
    data_nascimento?: Date | string | null
    peso_nascimento_kg?: number | null
    origem?: $Enums.AnimalOrigem
    status?: $Enums.AnimalStatus
    fazenda_origem_nome?: string | null
    data_aquisicao?: Date | string | null
    valor_compra?: number | null
    idade_entrada_meses?: number | null
    peso_atual_kg?: number | null
    createdAt?: Date | string
    updatedAt?: Date | string
    raca?: RacaCreateNestedOneWithoutAnimaisInput
    lote?: LoteCreateNestedOneWithoutAnimaisInput
    mae?: AnimalCreateNestedOneWithoutFilhosMaeInput
    filhosMae?: AnimalCreateNestedManyWithoutMaeInput
    filhosPai?: AnimalCreateNestedManyWithoutPaiInput
    fazenda_origem?: FazendaCreateNestedOneWithoutAnimaisOrigemInput
  }

  export type AnimalUncheckedCreateWithoutPaiInput = {
    id?: string
    rfid?: string | null
    brinco?: string | null
    nome_apelido?: string | null
    sexo: $Enums.Sexo
    data_nascimento?: Date | string | null
    peso_nascimento_kg?: number | null
    origem?: $Enums.AnimalOrigem
    status?: $Enums.AnimalStatus
    raca_id?: number | null
    lote_id?: number | null
    mae_id?: string | null
    fazenda_origem_id?: number | null
    fazenda_origem_nome?: string | null
    data_aquisicao?: Date | string | null
    valor_compra?: number | null
    idade_entrada_meses?: number | null
    peso_atual_kg?: number | null
    createdAt?: Date | string
    updatedAt?: Date | string
    filhosMae?: AnimalUncheckedCreateNestedManyWithoutMaeInput
    filhosPai?: AnimalUncheckedCreateNestedManyWithoutPaiInput
  }

  export type AnimalCreateOrConnectWithoutPaiInput = {
    where: AnimalWhereUniqueInput
    create: XOR<AnimalCreateWithoutPaiInput, AnimalUncheckedCreateWithoutPaiInput>
  }

  export type AnimalCreateManyPaiInputEnvelope = {
    data: AnimalCreateManyPaiInput | AnimalCreateManyPaiInput[]
    skipDuplicates?: boolean
  }

  export type FazendaCreateWithoutAnimaisOrigemInput = {
    nome: string
  }

  export type FazendaUncheckedCreateWithoutAnimaisOrigemInput = {
    id?: number
    nome: string
  }

  export type FazendaCreateOrConnectWithoutAnimaisOrigemInput = {
    where: FazendaWhereUniqueInput
    create: XOR<FazendaCreateWithoutAnimaisOrigemInput, FazendaUncheckedCreateWithoutAnimaisOrigemInput>
  }

  export type RacaUpsertWithoutAnimaisInput = {
    update: XOR<RacaUpdateWithoutAnimaisInput, RacaUncheckedUpdateWithoutAnimaisInput>
    create: XOR<RacaCreateWithoutAnimaisInput, RacaUncheckedCreateWithoutAnimaisInput>
    where?: RacaWhereInput
  }

  export type RacaUpdateToOneWithWhereWithoutAnimaisInput = {
    where?: RacaWhereInput
    data: XOR<RacaUpdateWithoutAnimaisInput, RacaUncheckedUpdateWithoutAnimaisInput>
  }

  export type RacaUpdateWithoutAnimaisInput = {
    nome?: StringFieldUpdateOperationsInput | string
  }

  export type RacaUncheckedUpdateWithoutAnimaisInput = {
    id?: IntFieldUpdateOperationsInput | number
    nome?: StringFieldUpdateOperationsInput | string
  }

  export type LoteUpsertWithoutAnimaisInput = {
    update: XOR<LoteUpdateWithoutAnimaisInput, LoteUncheckedUpdateWithoutAnimaisInput>
    create: XOR<LoteCreateWithoutAnimaisInput, LoteUncheckedCreateWithoutAnimaisInput>
    where?: LoteWhereInput
  }

  export type LoteUpdateToOneWithWhereWithoutAnimaisInput = {
    where?: LoteWhereInput
    data: XOR<LoteUpdateWithoutAnimaisInput, LoteUncheckedUpdateWithoutAnimaisInput>
  }

  export type LoteUpdateWithoutAnimaisInput = {
    nome?: StringFieldUpdateOperationsInput | string
  }

  export type LoteUncheckedUpdateWithoutAnimaisInput = {
    id?: IntFieldUpdateOperationsInput | number
    nome?: StringFieldUpdateOperationsInput | string
  }

  export type AnimalUpsertWithoutFilhosMaeInput = {
    update: XOR<AnimalUpdateWithoutFilhosMaeInput, AnimalUncheckedUpdateWithoutFilhosMaeInput>
    create: XOR<AnimalCreateWithoutFilhosMaeInput, AnimalUncheckedCreateWithoutFilhosMaeInput>
    where?: AnimalWhereInput
  }

  export type AnimalUpdateToOneWithWhereWithoutFilhosMaeInput = {
    where?: AnimalWhereInput
    data: XOR<AnimalUpdateWithoutFilhosMaeInput, AnimalUncheckedUpdateWithoutFilhosMaeInput>
  }

  export type AnimalUpdateWithoutFilhosMaeInput = {
    id?: StringFieldUpdateOperationsInput | string
    rfid?: NullableStringFieldUpdateOperationsInput | string | null
    brinco?: NullableStringFieldUpdateOperationsInput | string | null
    nome_apelido?: NullableStringFieldUpdateOperationsInput | string | null
    sexo?: EnumSexoFieldUpdateOperationsInput | $Enums.Sexo
    data_nascimento?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    peso_nascimento_kg?: NullableFloatFieldUpdateOperationsInput | number | null
    origem?: EnumAnimalOrigemFieldUpdateOperationsInput | $Enums.AnimalOrigem
    status?: EnumAnimalStatusFieldUpdateOperationsInput | $Enums.AnimalStatus
    fazenda_origem_nome?: NullableStringFieldUpdateOperationsInput | string | null
    data_aquisicao?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    valor_compra?: NullableFloatFieldUpdateOperationsInput | number | null
    idade_entrada_meses?: NullableIntFieldUpdateOperationsInput | number | null
    peso_atual_kg?: NullableFloatFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    raca?: RacaUpdateOneWithoutAnimaisNestedInput
    lote?: LoteUpdateOneWithoutAnimaisNestedInput
    mae?: AnimalUpdateOneWithoutFilhosMaeNestedInput
    pai?: AnimalUpdateOneWithoutFilhosPaiNestedInput
    filhosPai?: AnimalUpdateManyWithoutPaiNestedInput
    fazenda_origem?: FazendaUpdateOneWithoutAnimaisOrigemNestedInput
  }

  export type AnimalUncheckedUpdateWithoutFilhosMaeInput = {
    id?: StringFieldUpdateOperationsInput | string
    rfid?: NullableStringFieldUpdateOperationsInput | string | null
    brinco?: NullableStringFieldUpdateOperationsInput | string | null
    nome_apelido?: NullableStringFieldUpdateOperationsInput | string | null
    sexo?: EnumSexoFieldUpdateOperationsInput | $Enums.Sexo
    data_nascimento?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    peso_nascimento_kg?: NullableFloatFieldUpdateOperationsInput | number | null
    origem?: EnumAnimalOrigemFieldUpdateOperationsInput | $Enums.AnimalOrigem
    status?: EnumAnimalStatusFieldUpdateOperationsInput | $Enums.AnimalStatus
    raca_id?: NullableIntFieldUpdateOperationsInput | number | null
    lote_id?: NullableIntFieldUpdateOperationsInput | number | null
    mae_id?: NullableStringFieldUpdateOperationsInput | string | null
    pai_id?: NullableStringFieldUpdateOperationsInput | string | null
    fazenda_origem_id?: NullableIntFieldUpdateOperationsInput | number | null
    fazenda_origem_nome?: NullableStringFieldUpdateOperationsInput | string | null
    data_aquisicao?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    valor_compra?: NullableFloatFieldUpdateOperationsInput | number | null
    idade_entrada_meses?: NullableIntFieldUpdateOperationsInput | number | null
    peso_atual_kg?: NullableFloatFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    filhosPai?: AnimalUncheckedUpdateManyWithoutPaiNestedInput
  }

  export type AnimalUpsertWithWhereUniqueWithoutMaeInput = {
    where: AnimalWhereUniqueInput
    update: XOR<AnimalUpdateWithoutMaeInput, AnimalUncheckedUpdateWithoutMaeInput>
    create: XOR<AnimalCreateWithoutMaeInput, AnimalUncheckedCreateWithoutMaeInput>
  }

  export type AnimalUpdateWithWhereUniqueWithoutMaeInput = {
    where: AnimalWhereUniqueInput
    data: XOR<AnimalUpdateWithoutMaeInput, AnimalUncheckedUpdateWithoutMaeInput>
  }

  export type AnimalUpdateManyWithWhereWithoutMaeInput = {
    where: AnimalScalarWhereInput
    data: XOR<AnimalUpdateManyMutationInput, AnimalUncheckedUpdateManyWithoutMaeInput>
  }

  export type AnimalUpsertWithoutFilhosPaiInput = {
    update: XOR<AnimalUpdateWithoutFilhosPaiInput, AnimalUncheckedUpdateWithoutFilhosPaiInput>
    create: XOR<AnimalCreateWithoutFilhosPaiInput, AnimalUncheckedCreateWithoutFilhosPaiInput>
    where?: AnimalWhereInput
  }

  export type AnimalUpdateToOneWithWhereWithoutFilhosPaiInput = {
    where?: AnimalWhereInput
    data: XOR<AnimalUpdateWithoutFilhosPaiInput, AnimalUncheckedUpdateWithoutFilhosPaiInput>
  }

  export type AnimalUpdateWithoutFilhosPaiInput = {
    id?: StringFieldUpdateOperationsInput | string
    rfid?: NullableStringFieldUpdateOperationsInput | string | null
    brinco?: NullableStringFieldUpdateOperationsInput | string | null
    nome_apelido?: NullableStringFieldUpdateOperationsInput | string | null
    sexo?: EnumSexoFieldUpdateOperationsInput | $Enums.Sexo
    data_nascimento?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    peso_nascimento_kg?: NullableFloatFieldUpdateOperationsInput | number | null
    origem?: EnumAnimalOrigemFieldUpdateOperationsInput | $Enums.AnimalOrigem
    status?: EnumAnimalStatusFieldUpdateOperationsInput | $Enums.AnimalStatus
    fazenda_origem_nome?: NullableStringFieldUpdateOperationsInput | string | null
    data_aquisicao?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    valor_compra?: NullableFloatFieldUpdateOperationsInput | number | null
    idade_entrada_meses?: NullableIntFieldUpdateOperationsInput | number | null
    peso_atual_kg?: NullableFloatFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    raca?: RacaUpdateOneWithoutAnimaisNestedInput
    lote?: LoteUpdateOneWithoutAnimaisNestedInput
    mae?: AnimalUpdateOneWithoutFilhosMaeNestedInput
    filhosMae?: AnimalUpdateManyWithoutMaeNestedInput
    pai?: AnimalUpdateOneWithoutFilhosPaiNestedInput
    fazenda_origem?: FazendaUpdateOneWithoutAnimaisOrigemNestedInput
  }

  export type AnimalUncheckedUpdateWithoutFilhosPaiInput = {
    id?: StringFieldUpdateOperationsInput | string
    rfid?: NullableStringFieldUpdateOperationsInput | string | null
    brinco?: NullableStringFieldUpdateOperationsInput | string | null
    nome_apelido?: NullableStringFieldUpdateOperationsInput | string | null
    sexo?: EnumSexoFieldUpdateOperationsInput | $Enums.Sexo
    data_nascimento?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    peso_nascimento_kg?: NullableFloatFieldUpdateOperationsInput | number | null
    origem?: EnumAnimalOrigemFieldUpdateOperationsInput | $Enums.AnimalOrigem
    status?: EnumAnimalStatusFieldUpdateOperationsInput | $Enums.AnimalStatus
    raca_id?: NullableIntFieldUpdateOperationsInput | number | null
    lote_id?: NullableIntFieldUpdateOperationsInput | number | null
    mae_id?: NullableStringFieldUpdateOperationsInput | string | null
    pai_id?: NullableStringFieldUpdateOperationsInput | string | null
    fazenda_origem_id?: NullableIntFieldUpdateOperationsInput | number | null
    fazenda_origem_nome?: NullableStringFieldUpdateOperationsInput | string | null
    data_aquisicao?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    valor_compra?: NullableFloatFieldUpdateOperationsInput | number | null
    idade_entrada_meses?: NullableIntFieldUpdateOperationsInput | number | null
    peso_atual_kg?: NullableFloatFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    filhosMae?: AnimalUncheckedUpdateManyWithoutMaeNestedInput
  }

  export type AnimalUpsertWithWhereUniqueWithoutPaiInput = {
    where: AnimalWhereUniqueInput
    update: XOR<AnimalUpdateWithoutPaiInput, AnimalUncheckedUpdateWithoutPaiInput>
    create: XOR<AnimalCreateWithoutPaiInput, AnimalUncheckedCreateWithoutPaiInput>
  }

  export type AnimalUpdateWithWhereUniqueWithoutPaiInput = {
    where: AnimalWhereUniqueInput
    data: XOR<AnimalUpdateWithoutPaiInput, AnimalUncheckedUpdateWithoutPaiInput>
  }

  export type AnimalUpdateManyWithWhereWithoutPaiInput = {
    where: AnimalScalarWhereInput
    data: XOR<AnimalUpdateManyMutationInput, AnimalUncheckedUpdateManyWithoutPaiInput>
  }

  export type FazendaUpsertWithoutAnimaisOrigemInput = {
    update: XOR<FazendaUpdateWithoutAnimaisOrigemInput, FazendaUncheckedUpdateWithoutAnimaisOrigemInput>
    create: XOR<FazendaCreateWithoutAnimaisOrigemInput, FazendaUncheckedCreateWithoutAnimaisOrigemInput>
    where?: FazendaWhereInput
  }

  export type FazendaUpdateToOneWithWhereWithoutAnimaisOrigemInput = {
    where?: FazendaWhereInput
    data: XOR<FazendaUpdateWithoutAnimaisOrigemInput, FazendaUncheckedUpdateWithoutAnimaisOrigemInput>
  }

  export type FazendaUpdateWithoutAnimaisOrigemInput = {
    nome?: StringFieldUpdateOperationsInput | string
  }

  export type FazendaUncheckedUpdateWithoutAnimaisOrigemInput = {
    id?: IntFieldUpdateOperationsInput | number
    nome?: StringFieldUpdateOperationsInput | string
  }

  export type PostCreateManyAuthorInput = {
    id?: number
    title: string
    content?: string | null
    published?: boolean
  }

  export type PostUpdateWithoutAuthorInput = {
    title?: StringFieldUpdateOperationsInput | string
    content?: NullableStringFieldUpdateOperationsInput | string | null
    published?: BoolFieldUpdateOperationsInput | boolean
  }

  export type PostUncheckedUpdateWithoutAuthorInput = {
    id?: IntFieldUpdateOperationsInput | number
    title?: StringFieldUpdateOperationsInput | string
    content?: NullableStringFieldUpdateOperationsInput | string | null
    published?: BoolFieldUpdateOperationsInput | boolean
  }

  export type PostUncheckedUpdateManyWithoutAuthorInput = {
    id?: IntFieldUpdateOperationsInput | number
    title?: StringFieldUpdateOperationsInput | string
    content?: NullableStringFieldUpdateOperationsInput | string | null
    published?: BoolFieldUpdateOperationsInput | boolean
  }

  export type AnimalCreateManyRacaInput = {
    id?: string
    rfid?: string | null
    brinco?: string | null
    nome_apelido?: string | null
    sexo: $Enums.Sexo
    data_nascimento?: Date | string | null
    peso_nascimento_kg?: number | null
    origem?: $Enums.AnimalOrigem
    status?: $Enums.AnimalStatus
    lote_id?: number | null
    mae_id?: string | null
    pai_id?: string | null
    fazenda_origem_id?: number | null
    fazenda_origem_nome?: string | null
    data_aquisicao?: Date | string | null
    valor_compra?: number | null
    idade_entrada_meses?: number | null
    peso_atual_kg?: number | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type AnimalUpdateWithoutRacaInput = {
    id?: StringFieldUpdateOperationsInput | string
    rfid?: NullableStringFieldUpdateOperationsInput | string | null
    brinco?: NullableStringFieldUpdateOperationsInput | string | null
    nome_apelido?: NullableStringFieldUpdateOperationsInput | string | null
    sexo?: EnumSexoFieldUpdateOperationsInput | $Enums.Sexo
    data_nascimento?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    peso_nascimento_kg?: NullableFloatFieldUpdateOperationsInput | number | null
    origem?: EnumAnimalOrigemFieldUpdateOperationsInput | $Enums.AnimalOrigem
    status?: EnumAnimalStatusFieldUpdateOperationsInput | $Enums.AnimalStatus
    fazenda_origem_nome?: NullableStringFieldUpdateOperationsInput | string | null
    data_aquisicao?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    valor_compra?: NullableFloatFieldUpdateOperationsInput | number | null
    idade_entrada_meses?: NullableIntFieldUpdateOperationsInput | number | null
    peso_atual_kg?: NullableFloatFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lote?: LoteUpdateOneWithoutAnimaisNestedInput
    mae?: AnimalUpdateOneWithoutFilhosMaeNestedInput
    filhosMae?: AnimalUpdateManyWithoutMaeNestedInput
    pai?: AnimalUpdateOneWithoutFilhosPaiNestedInput
    filhosPai?: AnimalUpdateManyWithoutPaiNestedInput
    fazenda_origem?: FazendaUpdateOneWithoutAnimaisOrigemNestedInput
  }

  export type AnimalUncheckedUpdateWithoutRacaInput = {
    id?: StringFieldUpdateOperationsInput | string
    rfid?: NullableStringFieldUpdateOperationsInput | string | null
    brinco?: NullableStringFieldUpdateOperationsInput | string | null
    nome_apelido?: NullableStringFieldUpdateOperationsInput | string | null
    sexo?: EnumSexoFieldUpdateOperationsInput | $Enums.Sexo
    data_nascimento?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    peso_nascimento_kg?: NullableFloatFieldUpdateOperationsInput | number | null
    origem?: EnumAnimalOrigemFieldUpdateOperationsInput | $Enums.AnimalOrigem
    status?: EnumAnimalStatusFieldUpdateOperationsInput | $Enums.AnimalStatus
    lote_id?: NullableIntFieldUpdateOperationsInput | number | null
    mae_id?: NullableStringFieldUpdateOperationsInput | string | null
    pai_id?: NullableStringFieldUpdateOperationsInput | string | null
    fazenda_origem_id?: NullableIntFieldUpdateOperationsInput | number | null
    fazenda_origem_nome?: NullableStringFieldUpdateOperationsInput | string | null
    data_aquisicao?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    valor_compra?: NullableFloatFieldUpdateOperationsInput | number | null
    idade_entrada_meses?: NullableIntFieldUpdateOperationsInput | number | null
    peso_atual_kg?: NullableFloatFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    filhosMae?: AnimalUncheckedUpdateManyWithoutMaeNestedInput
    filhosPai?: AnimalUncheckedUpdateManyWithoutPaiNestedInput
  }

  export type AnimalUncheckedUpdateManyWithoutRacaInput = {
    id?: StringFieldUpdateOperationsInput | string
    rfid?: NullableStringFieldUpdateOperationsInput | string | null
    brinco?: NullableStringFieldUpdateOperationsInput | string | null
    nome_apelido?: NullableStringFieldUpdateOperationsInput | string | null
    sexo?: EnumSexoFieldUpdateOperationsInput | $Enums.Sexo
    data_nascimento?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    peso_nascimento_kg?: NullableFloatFieldUpdateOperationsInput | number | null
    origem?: EnumAnimalOrigemFieldUpdateOperationsInput | $Enums.AnimalOrigem
    status?: EnumAnimalStatusFieldUpdateOperationsInput | $Enums.AnimalStatus
    lote_id?: NullableIntFieldUpdateOperationsInput | number | null
    mae_id?: NullableStringFieldUpdateOperationsInput | string | null
    pai_id?: NullableStringFieldUpdateOperationsInput | string | null
    fazenda_origem_id?: NullableIntFieldUpdateOperationsInput | number | null
    fazenda_origem_nome?: NullableStringFieldUpdateOperationsInput | string | null
    data_aquisicao?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    valor_compra?: NullableFloatFieldUpdateOperationsInput | number | null
    idade_entrada_meses?: NullableIntFieldUpdateOperationsInput | number | null
    peso_atual_kg?: NullableFloatFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AnimalCreateManyLoteInput = {
    id?: string
    rfid?: string | null
    brinco?: string | null
    nome_apelido?: string | null
    sexo: $Enums.Sexo
    data_nascimento?: Date | string | null
    peso_nascimento_kg?: number | null
    origem?: $Enums.AnimalOrigem
    status?: $Enums.AnimalStatus
    raca_id?: number | null
    mae_id?: string | null
    pai_id?: string | null
    fazenda_origem_id?: number | null
    fazenda_origem_nome?: string | null
    data_aquisicao?: Date | string | null
    valor_compra?: number | null
    idade_entrada_meses?: number | null
    peso_atual_kg?: number | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type AnimalUpdateWithoutLoteInput = {
    id?: StringFieldUpdateOperationsInput | string
    rfid?: NullableStringFieldUpdateOperationsInput | string | null
    brinco?: NullableStringFieldUpdateOperationsInput | string | null
    nome_apelido?: NullableStringFieldUpdateOperationsInput | string | null
    sexo?: EnumSexoFieldUpdateOperationsInput | $Enums.Sexo
    data_nascimento?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    peso_nascimento_kg?: NullableFloatFieldUpdateOperationsInput | number | null
    origem?: EnumAnimalOrigemFieldUpdateOperationsInput | $Enums.AnimalOrigem
    status?: EnumAnimalStatusFieldUpdateOperationsInput | $Enums.AnimalStatus
    fazenda_origem_nome?: NullableStringFieldUpdateOperationsInput | string | null
    data_aquisicao?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    valor_compra?: NullableFloatFieldUpdateOperationsInput | number | null
    idade_entrada_meses?: NullableIntFieldUpdateOperationsInput | number | null
    peso_atual_kg?: NullableFloatFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    raca?: RacaUpdateOneWithoutAnimaisNestedInput
    mae?: AnimalUpdateOneWithoutFilhosMaeNestedInput
    filhosMae?: AnimalUpdateManyWithoutMaeNestedInput
    pai?: AnimalUpdateOneWithoutFilhosPaiNestedInput
    filhosPai?: AnimalUpdateManyWithoutPaiNestedInput
    fazenda_origem?: FazendaUpdateOneWithoutAnimaisOrigemNestedInput
  }

  export type AnimalUncheckedUpdateWithoutLoteInput = {
    id?: StringFieldUpdateOperationsInput | string
    rfid?: NullableStringFieldUpdateOperationsInput | string | null
    brinco?: NullableStringFieldUpdateOperationsInput | string | null
    nome_apelido?: NullableStringFieldUpdateOperationsInput | string | null
    sexo?: EnumSexoFieldUpdateOperationsInput | $Enums.Sexo
    data_nascimento?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    peso_nascimento_kg?: NullableFloatFieldUpdateOperationsInput | number | null
    origem?: EnumAnimalOrigemFieldUpdateOperationsInput | $Enums.AnimalOrigem
    status?: EnumAnimalStatusFieldUpdateOperationsInput | $Enums.AnimalStatus
    raca_id?: NullableIntFieldUpdateOperationsInput | number | null
    mae_id?: NullableStringFieldUpdateOperationsInput | string | null
    pai_id?: NullableStringFieldUpdateOperationsInput | string | null
    fazenda_origem_id?: NullableIntFieldUpdateOperationsInput | number | null
    fazenda_origem_nome?: NullableStringFieldUpdateOperationsInput | string | null
    data_aquisicao?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    valor_compra?: NullableFloatFieldUpdateOperationsInput | number | null
    idade_entrada_meses?: NullableIntFieldUpdateOperationsInput | number | null
    peso_atual_kg?: NullableFloatFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    filhosMae?: AnimalUncheckedUpdateManyWithoutMaeNestedInput
    filhosPai?: AnimalUncheckedUpdateManyWithoutPaiNestedInput
  }

  export type AnimalUncheckedUpdateManyWithoutLoteInput = {
    id?: StringFieldUpdateOperationsInput | string
    rfid?: NullableStringFieldUpdateOperationsInput | string | null
    brinco?: NullableStringFieldUpdateOperationsInput | string | null
    nome_apelido?: NullableStringFieldUpdateOperationsInput | string | null
    sexo?: EnumSexoFieldUpdateOperationsInput | $Enums.Sexo
    data_nascimento?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    peso_nascimento_kg?: NullableFloatFieldUpdateOperationsInput | number | null
    origem?: EnumAnimalOrigemFieldUpdateOperationsInput | $Enums.AnimalOrigem
    status?: EnumAnimalStatusFieldUpdateOperationsInput | $Enums.AnimalStatus
    raca_id?: NullableIntFieldUpdateOperationsInput | number | null
    mae_id?: NullableStringFieldUpdateOperationsInput | string | null
    pai_id?: NullableStringFieldUpdateOperationsInput | string | null
    fazenda_origem_id?: NullableIntFieldUpdateOperationsInput | number | null
    fazenda_origem_nome?: NullableStringFieldUpdateOperationsInput | string | null
    data_aquisicao?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    valor_compra?: NullableFloatFieldUpdateOperationsInput | number | null
    idade_entrada_meses?: NullableIntFieldUpdateOperationsInput | number | null
    peso_atual_kg?: NullableFloatFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AnimalCreateManyFazenda_origemInput = {
    id?: string
    rfid?: string | null
    brinco?: string | null
    nome_apelido?: string | null
    sexo: $Enums.Sexo
    data_nascimento?: Date | string | null
    peso_nascimento_kg?: number | null
    origem?: $Enums.AnimalOrigem
    status?: $Enums.AnimalStatus
    raca_id?: number | null
    lote_id?: number | null
    mae_id?: string | null
    pai_id?: string | null
    fazenda_origem_nome?: string | null
    data_aquisicao?: Date | string | null
    valor_compra?: number | null
    idade_entrada_meses?: number | null
    peso_atual_kg?: number | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type AnimalUpdateWithoutFazenda_origemInput = {
    id?: StringFieldUpdateOperationsInput | string
    rfid?: NullableStringFieldUpdateOperationsInput | string | null
    brinco?: NullableStringFieldUpdateOperationsInput | string | null
    nome_apelido?: NullableStringFieldUpdateOperationsInput | string | null
    sexo?: EnumSexoFieldUpdateOperationsInput | $Enums.Sexo
    data_nascimento?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    peso_nascimento_kg?: NullableFloatFieldUpdateOperationsInput | number | null
    origem?: EnumAnimalOrigemFieldUpdateOperationsInput | $Enums.AnimalOrigem
    status?: EnumAnimalStatusFieldUpdateOperationsInput | $Enums.AnimalStatus
    fazenda_origem_nome?: NullableStringFieldUpdateOperationsInput | string | null
    data_aquisicao?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    valor_compra?: NullableFloatFieldUpdateOperationsInput | number | null
    idade_entrada_meses?: NullableIntFieldUpdateOperationsInput | number | null
    peso_atual_kg?: NullableFloatFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    raca?: RacaUpdateOneWithoutAnimaisNestedInput
    lote?: LoteUpdateOneWithoutAnimaisNestedInput
    mae?: AnimalUpdateOneWithoutFilhosMaeNestedInput
    filhosMae?: AnimalUpdateManyWithoutMaeNestedInput
    pai?: AnimalUpdateOneWithoutFilhosPaiNestedInput
    filhosPai?: AnimalUpdateManyWithoutPaiNestedInput
  }

  export type AnimalUncheckedUpdateWithoutFazenda_origemInput = {
    id?: StringFieldUpdateOperationsInput | string
    rfid?: NullableStringFieldUpdateOperationsInput | string | null
    brinco?: NullableStringFieldUpdateOperationsInput | string | null
    nome_apelido?: NullableStringFieldUpdateOperationsInput | string | null
    sexo?: EnumSexoFieldUpdateOperationsInput | $Enums.Sexo
    data_nascimento?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    peso_nascimento_kg?: NullableFloatFieldUpdateOperationsInput | number | null
    origem?: EnumAnimalOrigemFieldUpdateOperationsInput | $Enums.AnimalOrigem
    status?: EnumAnimalStatusFieldUpdateOperationsInput | $Enums.AnimalStatus
    raca_id?: NullableIntFieldUpdateOperationsInput | number | null
    lote_id?: NullableIntFieldUpdateOperationsInput | number | null
    mae_id?: NullableStringFieldUpdateOperationsInput | string | null
    pai_id?: NullableStringFieldUpdateOperationsInput | string | null
    fazenda_origem_nome?: NullableStringFieldUpdateOperationsInput | string | null
    data_aquisicao?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    valor_compra?: NullableFloatFieldUpdateOperationsInput | number | null
    idade_entrada_meses?: NullableIntFieldUpdateOperationsInput | number | null
    peso_atual_kg?: NullableFloatFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    filhosMae?: AnimalUncheckedUpdateManyWithoutMaeNestedInput
    filhosPai?: AnimalUncheckedUpdateManyWithoutPaiNestedInput
  }

  export type AnimalUncheckedUpdateManyWithoutFazenda_origemInput = {
    id?: StringFieldUpdateOperationsInput | string
    rfid?: NullableStringFieldUpdateOperationsInput | string | null
    brinco?: NullableStringFieldUpdateOperationsInput | string | null
    nome_apelido?: NullableStringFieldUpdateOperationsInput | string | null
    sexo?: EnumSexoFieldUpdateOperationsInput | $Enums.Sexo
    data_nascimento?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    peso_nascimento_kg?: NullableFloatFieldUpdateOperationsInput | number | null
    origem?: EnumAnimalOrigemFieldUpdateOperationsInput | $Enums.AnimalOrigem
    status?: EnumAnimalStatusFieldUpdateOperationsInput | $Enums.AnimalStatus
    raca_id?: NullableIntFieldUpdateOperationsInput | number | null
    lote_id?: NullableIntFieldUpdateOperationsInput | number | null
    mae_id?: NullableStringFieldUpdateOperationsInput | string | null
    pai_id?: NullableStringFieldUpdateOperationsInput | string | null
    fazenda_origem_nome?: NullableStringFieldUpdateOperationsInput | string | null
    data_aquisicao?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    valor_compra?: NullableFloatFieldUpdateOperationsInput | number | null
    idade_entrada_meses?: NullableIntFieldUpdateOperationsInput | number | null
    peso_atual_kg?: NullableFloatFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AnimalCreateManyMaeInput = {
    id?: string
    rfid?: string | null
    brinco?: string | null
    nome_apelido?: string | null
    sexo: $Enums.Sexo
    data_nascimento?: Date | string | null
    peso_nascimento_kg?: number | null
    origem?: $Enums.AnimalOrigem
    status?: $Enums.AnimalStatus
    raca_id?: number | null
    lote_id?: number | null
    pai_id?: string | null
    fazenda_origem_id?: number | null
    fazenda_origem_nome?: string | null
    data_aquisicao?: Date | string | null
    valor_compra?: number | null
    idade_entrada_meses?: number | null
    peso_atual_kg?: number | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type AnimalCreateManyPaiInput = {
    id?: string
    rfid?: string | null
    brinco?: string | null
    nome_apelido?: string | null
    sexo: $Enums.Sexo
    data_nascimento?: Date | string | null
    peso_nascimento_kg?: number | null
    origem?: $Enums.AnimalOrigem
    status?: $Enums.AnimalStatus
    raca_id?: number | null
    lote_id?: number | null
    mae_id?: string | null
    fazenda_origem_id?: number | null
    fazenda_origem_nome?: string | null
    data_aquisicao?: Date | string | null
    valor_compra?: number | null
    idade_entrada_meses?: number | null
    peso_atual_kg?: number | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type AnimalUpdateWithoutMaeInput = {
    id?: StringFieldUpdateOperationsInput | string
    rfid?: NullableStringFieldUpdateOperationsInput | string | null
    brinco?: NullableStringFieldUpdateOperationsInput | string | null
    nome_apelido?: NullableStringFieldUpdateOperationsInput | string | null
    sexo?: EnumSexoFieldUpdateOperationsInput | $Enums.Sexo
    data_nascimento?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    peso_nascimento_kg?: NullableFloatFieldUpdateOperationsInput | number | null
    origem?: EnumAnimalOrigemFieldUpdateOperationsInput | $Enums.AnimalOrigem
    status?: EnumAnimalStatusFieldUpdateOperationsInput | $Enums.AnimalStatus
    fazenda_origem_nome?: NullableStringFieldUpdateOperationsInput | string | null
    data_aquisicao?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    valor_compra?: NullableFloatFieldUpdateOperationsInput | number | null
    idade_entrada_meses?: NullableIntFieldUpdateOperationsInput | number | null
    peso_atual_kg?: NullableFloatFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    raca?: RacaUpdateOneWithoutAnimaisNestedInput
    lote?: LoteUpdateOneWithoutAnimaisNestedInput
    filhosMae?: AnimalUpdateManyWithoutMaeNestedInput
    pai?: AnimalUpdateOneWithoutFilhosPaiNestedInput
    filhosPai?: AnimalUpdateManyWithoutPaiNestedInput
    fazenda_origem?: FazendaUpdateOneWithoutAnimaisOrigemNestedInput
  }

  export type AnimalUncheckedUpdateWithoutMaeInput = {
    id?: StringFieldUpdateOperationsInput | string
    rfid?: NullableStringFieldUpdateOperationsInput | string | null
    brinco?: NullableStringFieldUpdateOperationsInput | string | null
    nome_apelido?: NullableStringFieldUpdateOperationsInput | string | null
    sexo?: EnumSexoFieldUpdateOperationsInput | $Enums.Sexo
    data_nascimento?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    peso_nascimento_kg?: NullableFloatFieldUpdateOperationsInput | number | null
    origem?: EnumAnimalOrigemFieldUpdateOperationsInput | $Enums.AnimalOrigem
    status?: EnumAnimalStatusFieldUpdateOperationsInput | $Enums.AnimalStatus
    raca_id?: NullableIntFieldUpdateOperationsInput | number | null
    lote_id?: NullableIntFieldUpdateOperationsInput | number | null
    pai_id?: NullableStringFieldUpdateOperationsInput | string | null
    fazenda_origem_id?: NullableIntFieldUpdateOperationsInput | number | null
    fazenda_origem_nome?: NullableStringFieldUpdateOperationsInput | string | null
    data_aquisicao?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    valor_compra?: NullableFloatFieldUpdateOperationsInput | number | null
    idade_entrada_meses?: NullableIntFieldUpdateOperationsInput | number | null
    peso_atual_kg?: NullableFloatFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    filhosMae?: AnimalUncheckedUpdateManyWithoutMaeNestedInput
    filhosPai?: AnimalUncheckedUpdateManyWithoutPaiNestedInput
  }

  export type AnimalUncheckedUpdateManyWithoutMaeInput = {
    id?: StringFieldUpdateOperationsInput | string
    rfid?: NullableStringFieldUpdateOperationsInput | string | null
    brinco?: NullableStringFieldUpdateOperationsInput | string | null
    nome_apelido?: NullableStringFieldUpdateOperationsInput | string | null
    sexo?: EnumSexoFieldUpdateOperationsInput | $Enums.Sexo
    data_nascimento?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    peso_nascimento_kg?: NullableFloatFieldUpdateOperationsInput | number | null
    origem?: EnumAnimalOrigemFieldUpdateOperationsInput | $Enums.AnimalOrigem
    status?: EnumAnimalStatusFieldUpdateOperationsInput | $Enums.AnimalStatus
    raca_id?: NullableIntFieldUpdateOperationsInput | number | null
    lote_id?: NullableIntFieldUpdateOperationsInput | number | null
    pai_id?: NullableStringFieldUpdateOperationsInput | string | null
    fazenda_origem_id?: NullableIntFieldUpdateOperationsInput | number | null
    fazenda_origem_nome?: NullableStringFieldUpdateOperationsInput | string | null
    data_aquisicao?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    valor_compra?: NullableFloatFieldUpdateOperationsInput | number | null
    idade_entrada_meses?: NullableIntFieldUpdateOperationsInput | number | null
    peso_atual_kg?: NullableFloatFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AnimalUpdateWithoutPaiInput = {
    id?: StringFieldUpdateOperationsInput | string
    rfid?: NullableStringFieldUpdateOperationsInput | string | null
    brinco?: NullableStringFieldUpdateOperationsInput | string | null
    nome_apelido?: NullableStringFieldUpdateOperationsInput | string | null
    sexo?: EnumSexoFieldUpdateOperationsInput | $Enums.Sexo
    data_nascimento?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    peso_nascimento_kg?: NullableFloatFieldUpdateOperationsInput | number | null
    origem?: EnumAnimalOrigemFieldUpdateOperationsInput | $Enums.AnimalOrigem
    status?: EnumAnimalStatusFieldUpdateOperationsInput | $Enums.AnimalStatus
    fazenda_origem_nome?: NullableStringFieldUpdateOperationsInput | string | null
    data_aquisicao?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    valor_compra?: NullableFloatFieldUpdateOperationsInput | number | null
    idade_entrada_meses?: NullableIntFieldUpdateOperationsInput | number | null
    peso_atual_kg?: NullableFloatFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    raca?: RacaUpdateOneWithoutAnimaisNestedInput
    lote?: LoteUpdateOneWithoutAnimaisNestedInput
    mae?: AnimalUpdateOneWithoutFilhosMaeNestedInput
    filhosMae?: AnimalUpdateManyWithoutMaeNestedInput
    filhosPai?: AnimalUpdateManyWithoutPaiNestedInput
    fazenda_origem?: FazendaUpdateOneWithoutAnimaisOrigemNestedInput
  }

  export type AnimalUncheckedUpdateWithoutPaiInput = {
    id?: StringFieldUpdateOperationsInput | string
    rfid?: NullableStringFieldUpdateOperationsInput | string | null
    brinco?: NullableStringFieldUpdateOperationsInput | string | null
    nome_apelido?: NullableStringFieldUpdateOperationsInput | string | null
    sexo?: EnumSexoFieldUpdateOperationsInput | $Enums.Sexo
    data_nascimento?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    peso_nascimento_kg?: NullableFloatFieldUpdateOperationsInput | number | null
    origem?: EnumAnimalOrigemFieldUpdateOperationsInput | $Enums.AnimalOrigem
    status?: EnumAnimalStatusFieldUpdateOperationsInput | $Enums.AnimalStatus
    raca_id?: NullableIntFieldUpdateOperationsInput | number | null
    lote_id?: NullableIntFieldUpdateOperationsInput | number | null
    mae_id?: NullableStringFieldUpdateOperationsInput | string | null
    fazenda_origem_id?: NullableIntFieldUpdateOperationsInput | number | null
    fazenda_origem_nome?: NullableStringFieldUpdateOperationsInput | string | null
    data_aquisicao?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    valor_compra?: NullableFloatFieldUpdateOperationsInput | number | null
    idade_entrada_meses?: NullableIntFieldUpdateOperationsInput | number | null
    peso_atual_kg?: NullableFloatFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    filhosMae?: AnimalUncheckedUpdateManyWithoutMaeNestedInput
    filhosPai?: AnimalUncheckedUpdateManyWithoutPaiNestedInput
  }

  export type AnimalUncheckedUpdateManyWithoutPaiInput = {
    id?: StringFieldUpdateOperationsInput | string
    rfid?: NullableStringFieldUpdateOperationsInput | string | null
    brinco?: NullableStringFieldUpdateOperationsInput | string | null
    nome_apelido?: NullableStringFieldUpdateOperationsInput | string | null
    sexo?: EnumSexoFieldUpdateOperationsInput | $Enums.Sexo
    data_nascimento?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    peso_nascimento_kg?: NullableFloatFieldUpdateOperationsInput | number | null
    origem?: EnumAnimalOrigemFieldUpdateOperationsInput | $Enums.AnimalOrigem
    status?: EnumAnimalStatusFieldUpdateOperationsInput | $Enums.AnimalStatus
    raca_id?: NullableIntFieldUpdateOperationsInput | number | null
    lote_id?: NullableIntFieldUpdateOperationsInput | number | null
    mae_id?: NullableStringFieldUpdateOperationsInput | string | null
    fazenda_origem_id?: NullableIntFieldUpdateOperationsInput | number | null
    fazenda_origem_nome?: NullableStringFieldUpdateOperationsInput | string | null
    data_aquisicao?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    valor_compra?: NullableFloatFieldUpdateOperationsInput | number | null
    idade_entrada_meses?: NullableIntFieldUpdateOperationsInput | number | null
    peso_atual_kg?: NullableFloatFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}