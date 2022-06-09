import type { Permission } from "./types.ts";
import type { AbstractCommand } from "../AbstractCommand.ts";
import type { Cli } from "../Cli.ts";

export interface ICommandCtor {
  new (data: IRunData): AbstractCommand;
}

export interface ICommandDescriptor {
  name: string;

  version?: string;
  description?: string;
  commands?: ICommandCtor[];
  example?: string;
  permissions?: Permission[];
  disambiguous?: boolean;
}
export interface ICommandHandlerDescriptor<
  T extends AbstractCommand = AbstractCommand,
> {
  when?: (command: T) => boolean;
  permissions?: Permission[];
}

export interface ICommandHandlerResourceMap<
  T extends AbstractCommand = AbstractCommand,
> extends ICommandHandlerDescriptor<T> {
  target: string | symbol;
}

export interface ICommandArgumentDescriptor {
  name: string;
  match?: RegExp;
  description?: string;
  type: "string" | "boolean" | "number";
  delimiter?: string;
  example?: string;
  required?: boolean;
  default?: string | number | boolean;
}

export interface ICommandArgumentsDescriptor {
  description?: string;
  permissions?: Permission[];
  arguments: ICommandArgumentDescriptor[];
}

export interface ICommandArgumentsResourceMap {
  description?: string;
  target: string | symbol;
  permissions?: Permission[];
  arguments: ICommandArgumentDescriptor[];
}

export interface ICommandOptionDescriptor {
  name?: string;
  description?: string;
  shorthand?: string;
  type: "string" | "boolean" | "number";
  delimiter?: string;
  env?: string | string[];
}

export interface ICommandOptionResourceMap extends ICommandOptionDescriptor {
  target: string | symbol;
}

export interface ICliConfig {
  title: string;
  name: string;
  description?: string;
  version?: string;
  commands: ICommandCtor[];
  permissions?: Deno.PermissionDescriptor[];
  aliases?: { [key: string]: string[] };
}

export interface IHelpData {
  cli: ICliConfig;
  cmd?: ICommandCtor;
  path: string[];
  arguments?: ICommandArgumentsResourceMap[];
  options?: ICommandOptionResourceMap[];
  commands?: ICommandCtor[];
  message?: string;
}

export interface IRunData {
  cli: Cli;
  resolvedPath: string;
  execPath: string;
  restPath: (string | number)[];
  props: { [key: string]: string | number | boolean };
  positional: string[];
  permissions: Permission[];
}
