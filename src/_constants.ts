import type { ParseOptions } from "../deps.ts";
import type {
  ICommandArgumentsResourceMap,
  ICommandCtor,
  ICommandDescriptor,
  ICommandHandlerResourceMap,
  ICommandOptionResourceMap,
} from "./types/mod.ts";

export const DEFAULT_PARSE_OPTIONS: ParseOptions = {
  alias: {
    help: ["h"],
    debug: ["!"],
    verbose: ["*"],
    version: ["v"],
  },
  boolean: ["help", "debug", "verbose", "version"],
  default: {
    help: false,
    debug: false,
    verbose: false,
    version: false,
  },
  "--": true,
};

export const DEFAULT_COMMAND_OPTIONS: ICommandOptionResourceMap[] = [
  {
    name: "help",
    type: "boolean",
    shorthand: "h",
    description: "Show this help menu.",
    target: "showHelp",
  },
  {
    name: "debug",
    type: "boolean",
    shorthand: "!",
    description:
      "Display messages about side-effects of actions, but does not perform the actions.",
    target: "debugOnly",
  },
  {
    name: "verbose",
    type: "boolean",
    shorthand: "*",
    description: "Display verbose logging messages.",
    target: "showVerboseMessages",
  },
  {
    name: "version",
    type: "boolean",
    shorthand: "v",
    description: "Show the version of a CLI, command, or subcommand.",
    target: "showVersion",
  },
  {
    name: "example",
    type: "boolean",
    shorthand: "#",
    description: "List examples of a CLI, command, or subcommand.",
    target: "showExamples",
  },
];

export const ARGUMENTS_MAP = new WeakMap<
  ICommandCtor,
  ICommandArgumentsResourceMap[]
>();
export const HANDLERS_MAP = new WeakMap<
  ICommandCtor,
  ICommandHandlerResourceMap[]
>();
export const OPTIONS_MAP = new WeakMap<
  ICommandCtor,
  ICommandOptionResourceMap[]
>();
export const DESCRIPTOR_MAP = new WeakMap<ICommandCtor, ICommandDescriptor>();

export const HELP_PADDING = 4;
