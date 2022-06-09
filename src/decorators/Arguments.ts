import type {
  ICommandArgumentsDescriptor,
  ICommandCtor,
} from "../types/mod.ts";
import type { AbstractCommand } from "../AbstractCommand.ts";
import { _cmdMap, _detectAmbiquousMatches } from "../_utils/mod.ts";

export const Arguments = (descriptor: ICommandArgumentsDescriptor) => {
  return (
    target: AbstractCommand,
    key: string | symbol,
    _desc: PropertyDescriptor,
  ) => {
    const ctor = target.constructor as ICommandCtor;

    _cmdMap.arguments.add(ctor, {
      ...descriptor,
      target: key,
    });

    _detectAmbiquousMatches(ctor);
  };
};
