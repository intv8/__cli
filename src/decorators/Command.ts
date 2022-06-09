import { ICommandCtor, ICommandDescriptor } from "../types/mod.ts";
import {
  _cmdMap,
  _detectAmbiquousMatches,
  _resolveName,
} from "../_utils/mod.ts";

export const Command = (desc: ICommandDescriptor) => {
  return (ctor: ICommandCtor) => {
    const name = _resolveName(ctor.name, desc.name);

    _cmdMap.descriptor.set(ctor, { ...desc, name });

    _detectAmbiquousMatches(ctor);
  };
};
