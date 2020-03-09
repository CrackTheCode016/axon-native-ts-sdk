import { AxonBindings } from "./AxonBindings";
import { Observable, interval, of } from "rxjs";
import { map, retryWhen, tap } from "rxjs/operators";
import { State } from "../model/model";

export class StateListener {
    constructor(readonly bindings: AxonBindings) { }

    public listen(frequency: number): Observable<State> {
        return of(frequency).pipe(
            map(() => {
                try { console.log(this.bindings.watchState()); }
                catch (e) { console.log("caught! "+ e) }
                return this.bindings.loadState();
            }),
            retryWhen(errors =>
                errors.pipe(
                    tap(val => console.log("Error occured: ", val))
                )
            )
        );
    }
}