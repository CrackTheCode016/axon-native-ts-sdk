import { RecordType } from "../enums/RecordType";
import { RecordInformation } from "./RecordInformation";

export interface RecordSerialized {
    node: string,
    recipient: string,
    data: string,
    recordType: RecordType,
    signer: string,
    deviceId: string,
    sensorName: string,
    hash?: string
    timestamp?: string,
}