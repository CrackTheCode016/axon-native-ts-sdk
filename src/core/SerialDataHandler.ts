import { Record } from "../model/classes/Record";
import { RecordInformation } from "../model/interfaces/RecordInformation";
import { Address } from "nem2-sdk";
import { RecordSerialized } from "../model/interfaces/RecordSerialized";
import { AxonBindings } from "./AxonBindings";
import { Observable, interval, of } from "rxjs";
import { map, retryWhen, tap } from "rxjs/operators";
import { State } from "../model/model";

export class SerialDataHandler {

    private bindings: AxonBindings;

    constructor(path: string) {
        this.bindings = new AxonBindings(path);
    }

    private static parse(serializedRecord: RecordSerialized): Record {
        const timestamp = Date.now().toString();
        const recordInformation: RecordInformation = {
            node: serializedRecord.node,
            timestamp: timestamp,
            signer: serializedRecord.signer,
            deviceId: serializedRecord.deviceId,
            sensorName: serializedRecord.sensorName
        };

        const recipient = Address.createFromRawAddress(serializedRecord.recipient);
        return new Record(recipient, serializedRecord.data, serializedRecord.recordType, recordInformation);
    }

    private isJSON(str: string): boolean {
        try {
            JSON.parse(str);
            return true;
        } catch (e) {
            return false;
        }
    }
}