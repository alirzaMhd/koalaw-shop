import { EventEmitter } from "events";
declare class EventBus extends EventEmitter {
    constructor();
    emit(eventName: string | symbol, ...args: any[]): boolean;
}
export declare const eventBus: EventBus;
export declare function logBinding(eventName: string, label?: string): void;
export default eventBus;
//# sourceMappingURL=eventBus.d.ts.map