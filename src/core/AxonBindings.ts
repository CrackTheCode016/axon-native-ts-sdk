import { Command } from "../model/interfaces/Command";
import { CommandResponse } from "../model/interfaces/CommandResponse";
import { Identity } from "../model/interfaces/Identity";
import { State } from "../model/interfaces/State";
import { Record, RecordSerialized } from "../model/model";

var axonNative = require('../../../native');

export class AxonBindings {
    private serialPortPath: string;
    private parentDir = "/axon"
    private statePath = this.parentDir + "/axon-state.json"
    private identityPath = this.parentDir + "/axon-identity.json";

    constructor(serialPortPath: string) {
        this.serialPortPath = serialPortPath;
        axonNative.init(this.parentDir, this.statePath, this.identityPath);
    }

    public readSerialPort(): string {
        return axonNative.readSerial(this.serialPortPath);
    }

    public writeSerialPort(data: string): boolean {
        return axonNative.writeSerial(this.serialPortPath, data);
    }

    public watchRecord(): RecordSerialized {
        const r = axonNative.watchRecord(this.serialPortPath);
        return JSON.parse(r);
    }

    public processCommand(command: Command) {
        axonNative.sendCommand(this.serialPortPath, command.command, command.pin, command.operation, command.currency.amount);
    }

    public getIdentity(): Identity {
        const identity = axonNative.loadIdentity(this.identityPath);
        return JSON.parse(identity);
    }

    public saveState(state: State) {
        axonNative.saveState(this.statePath, state.ownerPublicKey, state.nodeIp, state.genHash);
    }

    public watchState(): boolean {
        return axonNative.watchState(this.serialPortPath);
    }

    public loadState(): State {
        const state = axonNative.loadState(this.statePath);
        return JSON.parse(state);
    }

}