import { Command } from "./Command";

export interface BadCommand extends Command {
    valid: false;
}