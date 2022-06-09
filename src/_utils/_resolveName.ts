import { _cmdMap } from "./_cmdMap.ts";

import type { ICommandCtor } from "../types/mod.ts";

export const _resolveName = (key: string, name?: string) => {
  if (name) {
    key = name;
  }

  const replaceChar = (char: string) => `-${char.toLocaleLowerCase()}`;
  const char1 = key[0].toLocaleLowerCase();
  const restChars = key.slice(1, key.length);
  const chars = restChars.replace(/[A-Z]/g, replaceChar);

  return `${char1}${chars}`;
};

export const _detectAmbiquousMatches = (ctor: ICommandCtor) => {
  const args = _cmdMap.arguments.get(ctor);
  const descriptor = _cmdMap.descriptor.get(ctor);
  const cmdList: string[] = [];

  args?.forEach((aarg, i) => {
    args.forEach((barg, o) => {
      if (i === o) return;

      const { arguments: aargs } = aarg;
      const { arguments: bargs } = barg;

      if (aargs.length !== bargs.length) return;

      const result = aargs.map((a, i) => {
        const b = bargs[i];
        const amatch = a.match ? a.match.source : "";
        const bmatch = b.match ? b.match.source : "";

        if (amatch === bmatch) {
          if (bmatch) {
            return `Duplicate arguments at position ${i} and ${o} with overlapping expression "/${bmatch}/${b
              .match?.flags}".`;
          }

          return `Duplicate arguments at position ${i} with fallthrough expressions.`;
        }

        return false;
      });

      if (result.every((r) => r)) {
        throw new Error(result.find((r) => r)?.toString());
      }
    });
    const [arg] = aarg.arguments;

    if (arg.match && descriptor.commands) {
      descriptor.commands?.forEach((command) => {
        const desc = _cmdMap.descriptor.get(command);
        const name = desc.name;

        if (name && arg.match?.test(name)) {
          throw new Error(
            `Overlap of argument at position 0 and command "${name}" matching "/${arg.match.source}/${arg.match.flags}".`,
          );
        }
      });
    }
  });

  descriptor?.commands?.forEach((command) => {
    const { name } = _cmdMap.descriptor.get(command);

    if (cmdList.includes(name)) {
      throw new Error(
        `Duplicate command "${name}" found in ${descriptor.name}.`,
      );
    }

    cmdList.push(name);
  });
};
