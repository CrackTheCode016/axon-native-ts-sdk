import { AxonBindings } from "./AxonBindings";
import { Observable, interval, of } from "rxjs";
import { map, retryWhen, tap } from "rxjs/operators";
import { Record } from "../model/model";


export class RecordListener {

    constructor(readonly bindings: AxonBindings) { }

    public listen(frequency: number): Observable<Record> {
        return of(frequency).pipe(
            map(() => this.bindings.watchRecord()),
            retryWhen(errors =>
                errors.pipe(
                    tap(val => console.log("Error occured: ", val))
                )
            )
        );
    }
}
