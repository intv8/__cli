import {
  ARGUMENTS_MAP,
  DESCRIPTOR_MAP,
  HANDLERS_MAP,
  OPTIONS_MAP,
} from "../_constants.ts";

import type {
  ICommandArgumentsResourceMap,
  ICommandCtor,
  ICommandDescriptor,
  ICommandHandlerResourceMap,
  ICommandOptionResourceMap,
} from "../types/mod.ts";

const _addArgument = (
  cmdCtor: ICommandCtor,
  argMap: ICommandArgumentsResourceMap,
) => {
  const found = ARGUMENTS_MAP.get(cmdCtor);
  const args = found ? found : [];

  ARGUMENTS_MAP.set(cmdCtor, [...args, argMap]);
};

const _getArguments = (cmdCtor: ICommandCtor) =>
  ARGUMENTS_MAP.get(cmdCtor) || [];

const _addHandler = (
  cmdCtor: ICommandCtor,
  handlerMap: ICommandHandlerResourceMap,
) => {
  const found = HANDLERS_MAP.get(cmdCtor);
  const handlers = found ? found : [];

  HANDLERS_MAP.set(cmdCtor, [...handlers, handlerMap]);
};

const _getHandlers = (cmdCtor: ICommandCtor) => HANDLERS_MAP.get(cmdCtor) || [];

const _addOption = (
  cmdCtor: ICommandCtor,
  optionMap: ICommandOptionResourceMap,
) => {
  const found = OPTIONS_MAP.get(cmdCtor);
  const options = found ? found : [];

  OPTIONS_MAP.set(cmdCtor, [...options, optionMap]);
};

const _getOptions = (cmdCtor: ICommandCtor) => OPTIONS_MAP.get(cmdCtor) || [];

const _setDescriptor = (cmdCtor: ICommandCtor, desc: ICommandDescriptor) => {
  const found = DESCRIPTOR_MAP.get(cmdCtor) || {};

  DESCRIPTOR_MAP.set(cmdCtor, { ...found, ...desc });
};

const _getDescriptor = (ctor: ICommandCtor) => {
  return DESCRIPTOR_MAP.get(ctor) || {
    name: "",
    commands: [],
  };
};

export const _cmdMap = {
  arguments: {
    get: _getArguments,
    add: _addArgument,
  },
  descriptor: {
    get: _getDescriptor,
    set: _setDescriptor,
  },
  options: {
    get: _getOptions,
    add: _addOption,
  },
  handlers: {
    get: _getHandlers,
    add: _addHandler,
  },
};
