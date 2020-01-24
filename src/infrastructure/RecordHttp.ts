import { AccountHttp, TransactionHttp, SignedTransaction, TransactionAnnounceResponse, PublicAccount, Transaction, TransactionType, AggregateTransaction, TransferTransaction } from 'nem2-sdk';
import { Observable } from 'rxjs';
import { Record } from '../model/classes/Record';
import { map } from 'rxjs/operators';

export class RecordHttp {

    private accountHttp: AccountHttp;
    private transactionHttp: TransactionHttp;
    constructor(url: string) {
        this.accountHttp = new AccountHttp(url);
        this.transactionHttp = new TransactionHttp(url);
    }

    public send(signedRecord: SignedTransaction): Observable<TransactionAnnounceResponse> {
        return this.transactionHttp.announce(signedRecord);
    }

    public getRecordsPerAddress(publicAccount: PublicAccount): Observable<Record[]> {
        return this.accountHttp.getAccountTransactions(publicAccount.address).pipe(
            map((txes: Transaction[]) => {
                const transferTxes: Transaction[] = txes
                    .filter((tx) =>
                        tx.type === TransactionType.AGGREGATE_COMPLETE || TransactionType.TRANSFER);
                return transferTxes;
            }),
            map((txes: Transaction[]) => {
                const records: Record[] = [];
                txes.forEach((tx) => {
                    if (tx.type === TransactionType.AGGREGATE_COMPLETE) {
                        const multi: AggregateTransaction = tx as AggregateTransaction;
                    }
                    const simple: TransferTransaction = tx as TransferTransaction;
                    records.push(Record.fromSimple(simple));
                })
                return records;
            })
        )
    }
}