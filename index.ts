import { SerialDataHandler, AxonBindings, RecordListener, StateListener } from "./src/core/core";
import { Command, Record, State, Identity } from "./src/model/model";
import { PublicAccount, Account, NetworkType, TransferTransaction, SignedTransaction } from "nem2-sdk";
import { mergeMap, map, concatMap, mergeAll } from "rxjs/operators";
import { RecordHttp } from "./src/infrastructure/RecordHttp";
import { CommandHttp } from "./src/infrastructure/CommandHttp";
import { interval, merge, concat, of } from "rxjs";

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

const watchRecordState = merge(
    stateListener.listen(1000),
    recordListener.listen(1000)
        .pipe(
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
        ),
)

watchRecordState.subscribe((r) => console.log(r))

commandHttp = new CommandHttp(binding.loadState(), binding)

commandHttp.watch().subscribe((c) => {
    console.log('Command listener opened')
    if (c) {
        binding.processCommand(c)
    }
})