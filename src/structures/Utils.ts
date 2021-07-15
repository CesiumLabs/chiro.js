import { Extendable } from "../Static/Interfaces";

export abstract class Structure {
    public static get<K extends keyof Extendable>(name: K): Extendable[K] {
        const structure = structures[name];
        if (!structure) throw new TypeError('"structure" must be provided.');
        return structure;
    }
}

const structures = {
    Player: require("./Player").Player,
    Queue: require("./Queue").Queue,
    Node: require("./Node").Node,
};
