import { PublicAccount } from "nem2-sdk";
import { OwnershipLevel } from "../enums/OwnershipLevel";

export interface Owner {
    owner: PublicAccount,
    level: OwnershipLevel,
    claimant: number
}