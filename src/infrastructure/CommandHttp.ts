import { Command, Identity } from "../model/model";
import { Listener, Address, Transaction, TransferTransaction, TransactionType, Account, NetworkType, PublicAccount } from "nem2-sdk";
import { Observable, from, merge, throwError } from "rxjs";
import { mergeMap, map, filter, concatAll, withLatestFrom, catchError, tap } from "rxjs/operators";
import { OwnershipHttp } from "./OwnershipHttp";
import { Owner } from "../model/interfaces/Owner";
import { BadCommand } from "../model/interfaces/BadCommand";
import { AxonBindings } from "../core/core";

export class CommandHttp {

    private listener: Listener;
    private account: PublicAccount;
    private identity: Account;
    private ownerHttp: OwnershipHttp;


    constructor(node: string, ownerAccount: PublicAccount, bindings: AxonBindings) {
        console.log(node);
        this.listener = new Listener(node);
        this.identity = Account.createFromPrivateKey(bindings.getIdentity().key, NetworkType.TEST_NET);
        this.account = ownerAccount;
        console.log(this.account.address.plain())
        this.ownerHttp = new OwnershipHttp(node, bindings);

    }

    private isTransfer(tx: Transaction): boolean { return tx.type === TransactionType.TRANSFER }

    public watch(): Observable<Command> {
        return from(this.listener.open()).pipe(
            mergeMap(() => this.listener.confirmed(this.account.address)),
            filter((tx) => this.isTransfer(tx)),
            map((tx) => this.fromTransaction(tx)),
            map((command: Command) => {
                if (command.owner.owner.publicKey == this.identity.publicKey) {
                    return command;
                } else {
                    return command as BadCommand;
                }
            }),
            catchError((err) => throwError(err))
        )
    }

    // todo-later: doesn't take into account access level
    private validate(command: Command): Observable<Command> {
        return this.ownerHttp.getOwners(this.account.address).pipe(
            mergeMap((owners: Owner[]) => owners),
            map((owner: Owner) => owner.owner.publicKey == command.owner.owner.publicKey ? command : command as BadCommand)
        );
    }

    private fromTransaction(tx: Transaction): Command {
        const transferTx: TransferTransaction = tx as TransferTransaction;
        return JSON.parse(transferTx.message.payload) as Command;
    }
}
