import { SerialDataHandler, AxonBindings, RecordListener, StateListener } from "./src/core/core";
import { Command, Record, State, Identity } from "./src/model/model";
import { PublicAccount, Account, NetworkType, TransferTransaction, SignedTransaction } from "nem2-sdk";
import { mergeMap, map, concatMap, mergeAll } from "rxjs/operators";
import { RecordHttp } from "./src/infrastructure/RecordHttp";
import { CommandHttp } from "./src/infrastructure/CommandHttp";
import { interval } from "rxjs";

export * from "./src/model/model";
export * from "./src/infrastructure/infrastructure";
export * from "./src/core/core";


const binding = new AxonBindings("/dev/cu.usbmodem64742701");
const recordListener = new RecordListener(binding);
const stateListener = new StateListener(binding);

var recordHttp: RecordHttp;
var commandHttp: CommandHttp;
var storedState: State = binding.loadState();
var identity: Identity = binding.getIdentity();
var axonAccount = Account.createFromPrivateKey(identity.key, NetworkType.TEST_NET);
console.log(axonAccount.address.plain())
var ownerAccount: PublicAccount;
var recordHttp: RecordHttp;

const watchRecord = recordListener.listen(2000).pipe(
    map((record) => {
        ownerAccount = PublicAccount.createFromPublicKey(storedState.ownerPublicKey, NetworkType.TEST_NET);
        console.log(record.toTransaction() as TransferTransaction);
        const signedTx = axonAccount.sign(
            record.toTransaction() as TransferTransaction,
            storedState.genHash);
        console.log(signedTx.hash)
        return signedTx;
    }),
    map((tx) => {
        const state = binding.loadState();
        recordHttp = new RecordHttp(state.nodeIp);
        return recordHttp.send(tx);
    }),
    mergeMap((response) => response)
);

const watchRecordState = interval(1000).pipe(
    mergeMap(() => stateListener.listen(1000)),
    mergeMap((state) => {
        storedState = state;
        return recordListener.listen(1000);
    }),
);

// const watchCommand = handler.stateListener(2000)
//     .pipe(
//         map((state) => {
//             commandHttp = new CommandHttp(storedState.nodeIp, ownerAccount, binding)
//             console.log(storedState.nodeIp);
//             ownerAccount = PublicAccount.createFromPublicKey(storedState.ownerPublicKey, NetworkType.TEST_NET);
//             console.log("Command state fetched");
//             return state;
//         }),
//         mergeMap(() => commandHttp.watch()),
//         map((command) => {
//             console.log("Command listening");
//             if (command != undefined) {
//                 binding.processCommand(command);
//                 return "Command Processed: " + JSON.stringify(command);
//             }
//             return "Bad Command: " + JSON.stringify(command);
//         })
//     );


watchRecordState.subscribe((record) => {
    console.log(record);
});

const ob = interval(1000).pipe(
    mergeMap((_) => { 
        console.log("something")
        return recordListener.listen(0)
    })
);

// ob.subscribe((rec) => { 
//     console.log(rec)
// })

// watchRecord.subscribe((response) => {
//     console.log(response);
// });

// watchCommand.subscribe((response) => {
//     console.log(response);
// });