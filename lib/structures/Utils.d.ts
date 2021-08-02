import { Extendable } from "../Static/Interfaces";
export declare abstract class Structure {
    static get<K extends keyof Extendable>(name: K): Extendable[K];
}
