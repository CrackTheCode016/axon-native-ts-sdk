import { SerialDataHandler, AxonBindings } from "./src/core/core";
import { Command, Record, State, Identity } from "./src/model/model";
import { PublicAccount, Account, NetworkType, TransferTransaction, SignedTransaction } from "nem2-sdk";
import { mergeMap, map, concatMap, mergeAll } from "rxjs/operators";
import { RecordHttp } from "./src/infrastructure/RecordHttp";
import { Observable, merge } from "rxjs";
import { CommandHttp } from "./src/infrastructure/CommandHttp";

export * from "./src/model/model";
export * from "./src/infrastructure/infrastructure";
export * from "./src/core/core";


const handler = new SerialDataHandler("/dev/cu.usbmodem62206501");
const binding = new AxonBindings("/dev/cu.usbmodem62206501");
var recordHttp: RecordHttp;
var commandHttp: CommandHttp;
var storedState: State = binding.loadState();
var identity: Identity = binding.getIdentity();
var axonAccount = Account.createFromPrivateKey(identity.key, NetworkType.TEST_NET);
console.log(axonAccount.address.plain())
var ownerAccount: Account;
var recordHttp: RecordHttp;

const recordListener = handler.recordListener(2000);
const watchRecord = handler.stateListener(2000)
    .pipe(
        map((state) => {
            storedState = state;
            recordHttp = new RecordHttp(state.node_ip);
            console.log("Checking for state")
            return state;
        }),
        mergeMap(() => recordListener),
        map((record) => {
            if (record instanceof Record) {
                console.log(record.toTransaction() as TransferTransaction);
                const signedTx = axonAccount.sign(
                    record.toTransaction() as TransferTransaction,
                    storedState.gen_hash);
                console.log(signedTx.hash)
                return signedTx;
            }
            return record as string;
        }),
        map((tx) => {
            if (tx instanceof SignedTransaction) {
                return recordHttp.send(tx);
            }
            return tx as string;
        }),
        mergeMap((response) => response)
    );


const watchCommand = handler.stateListener(2000)
    .pipe(
        map((state) => {
            console.log(storedState.node_ip);
            ownerAccount = Account.createFromPrivateKey(storedState.user_private_key, NetworkType.TEST_NET);
            commandHttp = new CommandHttp(storedState.node_ip, ownerAccount, binding);
            console.log("Command state fetched");
            return state;
        }),
        mergeMap(() => commandHttp.watch()),
        map((command) => {
            console.log("Command listening");
            if (command != undefined) {
                binding.processCommand(command);
                return "Command Processed: " + JSON.stringify(command);
            }
            return "Bad Command: " + JSON.stringify(command);
        })
    )

watchRecord.subscribe((response) => {
    console.log(response);
});

watchCommand.subscribe((response) => {
    console.log(response)
});