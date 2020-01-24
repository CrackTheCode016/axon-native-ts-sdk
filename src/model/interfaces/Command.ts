import { Owner } from "./Owner";

export interface Command {
    owner: Owner;
    operation: string,
    command: number,
    pin: number;
}