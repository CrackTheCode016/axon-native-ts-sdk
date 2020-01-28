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


    public stateListener(frequency: number): Observable<State> {
        return of(frequency).pipe(
            map(() => {
                this.bindings.watchState();
                return this.bindings.loadState();
            }
            ));
    }

    public recordListener(frequency: number): Observable<Record | string> {
        return interval(frequency).pipe(
            map(() => {
                const serialData = this.bindings.readSerialPort();

                if (serialData == "I1") {
                    this.bindings.watchState();
                }

                else if (this.isJSON(serialData)) {
                    const data: RecordSerialized = JSON.parse(serialData);
                    return SerialDataHandler.parse(data);
                }
                const filtered = serialData.replace('\n', "");
                return filtered;
            }),
            retryWhen(errors =>
                errors.pipe(
                    tap(val => console.log("Error occured: ", val))
                )
            )
        );
    }
}