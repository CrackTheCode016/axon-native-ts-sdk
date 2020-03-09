import { Owner } from "./Owner";

export interface Currency {
    amount: number;
    id: string;
}

export interface Command {
    owner: Owner;
    operation: string,
    currency: Currency,
    command: number,
    pin: number;
}