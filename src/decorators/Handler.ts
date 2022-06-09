import type {
  ICommandCtor,
  ICommandHandlerDescriptor,
  ICommandHandlerResourceMap,
} from "../types/mod.ts";
import type { AbstractCommand } from "../AbstractCommand.ts";
import {
  _cmdMap,
  _detectAmbiquousMatches,
  _resolveName,
} from "../_utils/mod.ts";

export function Handler<T extends AbstractCommand>(
  desc?: ICommandHandlerDescriptor<T>,
) {
  return (
    target: T,
    key: string | symbol,
    _descriptor: PropertyDescriptor,
  ) => {
    const ctor = target.constructor as ICommandCtor;
    _cmdMap.handlers.add(ctor, {
      ...desc || {},
      target: key,
    } as ICommandHandlerResourceMap<AbstractCommand>);
  };
}
