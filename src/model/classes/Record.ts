import { Address, Transaction, TransferTransaction, Deadline, PlainMessage, NetworkType, AggregateTransaction, EncryptedMessage, PublicAccount, Account, UInt64 } from "nem2-sdk";
import { RecordType } from "../enums/RecordType";
import { RecordInformation } from "../interfaces/RecordInformation";
import { sha3_256 } from 'js-sha3';
import { RecordSerialized } from "../interfaces/RecordSerialized";
import { EncryptedRecord } from "../interfaces/EncryptedRecord";

export class Record {


    private recipientAddress: Address
        ;
    constructor(
        readonly recipient: Address | PublicAccount,
        readonly data: string,
        readonly recordType: RecordType,
        readonly recordInformation: RecordInformation,
        readonly encrypted?: boolean
    ) {

        this.recipientAddress
            = this.recipient instanceof PublicAccount ? this.recipient.address : this.recipient;

    }

    // todo: for later, after multiple tx logic is figured out.
    // public static fromAggregateTransaction(aggregateTransaction: Transaction): Record {
    //     const recordTx: AggregateTransaction = aggregateTransaction as AggregateTransaction;
    //     //processing...

    // }

    public static fromSimple(transferTransaction: TransferTransaction): Record {
        const recordTx: TransferTransaction = transferTransaction as TransferTransaction;
        const message: RecordSerialized = JSON.parse(recordTx.message.payload);
        const recordInformation: RecordInformation = {
            node: message.node,
            timestamp: message.timestamp!,
            signer: message.signer,
            deviceId: message.deviceId,
            sensorName: message.sensorName,
        };
        return new Record(recordTx.recipientAddress as Address, message.data, message.recordType, recordInformation);
    }


    public static fromSimpleEncrypted(transferTransaction: TransferTransaction, account: Account): Record {
        const cipher: EncryptedRecord = JSON.parse(transferTransaction.message.payload);
        const decrypted = account.decryptMessage(
            EncryptedMessage.createFromPayload(cipher.cipher),
            account.publicAccount, NetworkType.TEST_NET);
        return JSON.parse(decrypted.payload);
    }

    public getHash(): string {
        const recipientAddr
            = this.recipient instanceof PublicAccount ? this.recipient.address : this.recipient;
        return sha3_256(
            this.data +
            this.recordType +
            this.recordInformation.deviceId +
            this.recordInformation.signer +
            this.recordInformation.timestamp +
            recipientAddr.plain()
        );
    }

    private serializeEncrypted(): EncryptedRecord {
        const message = EncryptedMessage.create(
            JSON.stringify(this.serialize()),
            this.recipient as PublicAccount,
            this.recordInformation.signer,
            NetworkType.TEST_NET);
        return { cipher: message.payload, encrypted: true };
    }

    private toEncryptedSimple(): Transaction {
        const recipient = this.recipient as PublicAccount;
        return TransferTransaction.create(
            Deadline.create(),
            recipient.address,
            [],
            PlainMessage.create(JSON.stringify(this.serializeEncrypted())),
            NetworkType.TEST_NET
        )
    }

    public toTransaction(): Transaction | Transaction[] {        
        if (this.recordType.toString() === RecordType.Simple.toString()) {
            if (this.encrypted && this.encrypted == true && this.recipient instanceof PublicAccount) {
                return this.toEncryptedSimple();
            }
            return this.toSimple();
        }
        return this.toMultiple();
    }

    private toSimple(): Transaction {
        return TransferTransaction.create(
            Deadline.create(),
            this.recipientAddress,
            [],
            PlainMessage.create(JSON.stringify(this.serialize())),
            NetworkType.TEST_NET,
            UInt64.fromUint(200000)
        );
    }

    private toMultiple(): Transaction[] {
        return [];
    }

    public serialize(): RecordSerialized {
        return {
            node: this.recordInformation.node,
            recipient: this.recipientAddress.plain(),
            data: this.data,
            sensorName: this.recordInformation.sensorName,
            deviceId: this.recordInformation.deviceId,
            signer: this.recordInformation.signer,
            timestamp: this.recordInformation.timestamp,
            recordType: this.recordType,
            hash: this.getHash()
        }
    }
}