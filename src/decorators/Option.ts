import { ICommandCtor, ICommandOptionDescriptor } from "../types/mod.ts";
import { AbstractCommand } from "../AbstractCommand.ts";
import {
  _cmdMap,
  _detectAmbiquousMatches,
  _resolveName,
} from "../_utils/mod.ts";

export const Option = (desc: ICommandOptionDescriptor) => {
  return (target: AbstractCommand, key: string | symbol) => {
    const ctor = target.constructor as ICommandCtor;
    const name = _resolveName(key.toString(), desc.name);

    _cmdMap.options.add(ctor, {
      ...desc,
      name,
      target: key,
    });

    _detectAmbiquousMatches(ctor);
  };
};
