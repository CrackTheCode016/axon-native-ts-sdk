import { AxonBindings } from "./AxonBindings";
import { Observable, interval, of } from "rxjs";
import { map, retryWhen, tap } from "rxjs/operators";
import { Record, RecordInformation } from "../model/model";
import { Address, NetworkType } from 'nem2-sdk';


export class RecordListener {

    constructor(readonly bindings: AxonBindings) { }

    public listen(freq: number): Observable<Record> {
        return interval(freq).pipe(
            map(() => {
                console.log('Trying record')
                let serializedRecord: any
                try { serializedRecord = this.bindings.watchRecord() }
                catch (e) { console.log("caught! " + e) }
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
            }),
            retryWhen(errors =>
                errors.pipe(
                    tap(val => console.log("Error occured: ", val))
                )
            )
        );
    }
}
