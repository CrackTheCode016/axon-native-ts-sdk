import { Command } from "../model/interfaces/Command";
import { CommandResponse } from "../model/interfaces/CommandResponse";
import { Identity } from "../model/interfaces/Identity";
import { State } from "../model/interfaces/State";

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

    public processCommand(command: Command) {
        const data = axonNative.sendCommand(this.serialPortPath, command.command, command.pin, command.operation);
        // const response: CommandResponse = {};
        // return response;
    }

    public getIdentity(): Identity {
        const identity = axonNative.loadIdentity(this.identityPath);
        return JSON.parse(identity);
    }

    public saveState(state: State) {
        axonNative.saveState(this.statePath, state.user_private_key, state.node_ip, state.gen_hash);
    }

    public watchState(): boolean {
        return axonNative.watchState(this.serialPortPath);
    }

    public loadState(): State {
        console.log(this.statePath);
        const state = axonNative.loadState(this.statePath);
        return JSON.parse(state);
    }

}