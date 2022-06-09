import { colors } from "../../deps.ts";
import { HELP_PADDING } from "../_constants.ts";
import { _cmdMap } from "./_cmdMap.ts";

import type { IHelpData } from "../types/mod.ts";

const pad = " ".repeat(HELP_PADDING);

export const _showHelp = (data: IHelpData) => {
  const { cli, arguments: args, commands, options, path, message, cmd } = data;
  console.log(
    colors.cyan(
      `${cli.title}${cli.description ? ` - ${cli.description}` : ""}`,
    ),
  );

  if (cmd) {
    const { name: cmdName, description: cmdDesc } = _cmdMap.descriptor.get(cmd);
    console.log(
      colors.cyan(` -> ... ${cmdName}${cmdDesc ? ` - ${cmdDesc}` : ""}`),
    );
  }

  console.log("");

  if (message) {
    console.log(
      colors.yellow(`${_resolveDescription(message, "* ").join("\n")}\n`),
    );
  }

  console.log(`USAGE\n`);

  if (commands && commands.length) {
    console.log(`${pad}${path.join(" ")} <subcommand>`);
  }

  if (args && args.length) {
    console.log(`${pad}${path.join(" ")} <args...>`);
  }

  if (options && options.length) {
    console.log(`${pad}${path.join(" ")} <options...>`);
  }

  if (commands && commands.length) {
    console.log(`\nSUBCOMMANDS\n`);
    commands.forEach((cmd) => {
      const { name, description } = _cmdMap.descriptor.get(cmd);
      console.log(`${pad}${name}`);
      const lines = _resolveDescription(
        description || "(no description provided)",
      );
      lines.forEach((line) => console.log(line));
    });
  }

  if (args && args.length) {
    console.log(`\nARGUMENTS`);
    args.forEach((arg) => {
      console.log(
        `\n${pad}${
          arg.arguments.map((a) => a.required ? `<${a.name}>` : `[${a.name}]`)
            .join(" ")
        }`,
      );
      arg.arguments.forEach((a) => {
        console.log(`${pad}${pad}${a.name}`);
        console.log(
          _resolveDescription(
            a.description || "(no description provided)",
            `${pad}${pad}${pad}`,
          ).join("\n"),
        );
      });
    });
  }

  if (options && options.length) {
    console.log(`\nOPTIONS\n`);
    options.forEach((option) => {
      const { shorthand, name, description } = option;
      console.log(`${pad}${shorthand ? `-${shorthand}, ` : ""}--${name}`);
      const lines = _resolveDescription(
        description || "(no description provided)",
      );
      lines.forEach((line) => console.log(line));
    });
  }
};

const _resolveDescription = (desc: string, padding = `${pad}${pad}`) => {
  desc = desc.replace(`\n`, " ");
  const words = desc.split(" ");
  return words.reduce((prev, curr) => {
    const line = prev[prev.length - 1];
    const newLine = `${line}${
      line.length === padding.length ? "" : " "
    }${curr}`;
    if (newLine.length > 80) {
      prev.push(`${padding}${curr}`);
    } else {
      prev[prev.length - 1] = newLine;
    }

    return prev;
  }, [padding]);
};
