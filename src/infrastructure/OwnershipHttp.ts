import { Owner } from "../model/interfaces/Owner";
import { Observable } from "rxjs";
import { MetadataTransactionService, PublicAccount, MetadataHttp, Metadata, Address } from "nem2-sdk";
import { mergeAll, mergeMap, map, filter, concatMap, toArray } from "rxjs/operators";
import { Identity } from "../model/model";
import { AxonBindings } from "../core/core";

export class OwnershipHttp {

    private metadataHttp: MetadataHttp;
    private identity: Identity;

    constructor(node: string, bindings: AxonBindings) {
        this.metadataHttp = new MetadataHttp(node);
        this.identity = bindings.getIdentity();
    }

    // return if owned or not
    public ifOwned(address: Address): Observable<boolean> {
        return this.metadataHttp.getAccountMetadata(address).pipe(
            map((metadata: Metadata[]) => metadata.length == 0 ? false : true)
        )
    }

    // return list of owners
    public getOwners(address: Address): Observable<Owner[]> {
        return this.metadataHttp.getAccountMetadata(address).pipe(
            mergeMap((metadata: Metadata[]) => metadata),
            filter((metadata: Metadata) => metadata.metadataEntry.scopedMetadataKey.toString() == "axon"), // todo: proper axon key handling
            map((metadata: Metadata) => this.fromMetadata(metadata)),
            toArray()
        )
    }


    private fromMetadata(metadata: Metadata): Owner {
        return JSON.parse(metadata.metadataEntry.value) as Owner;
    }

    // if there is an incoming request to become an owner, and there are no other owners, accept it.
    public acceptOwnershipRequest() {


    }
}
