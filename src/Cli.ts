import { parse } from "../deps.ts";
import { _cmdMap, _showHelp } from "./_utils/mod.ts";
import {
  DEFAULT_COMMAND_OPTIONS,
  DEFAULT_PARSE_OPTIONS,
} from "./_constants.ts";

import type { ICliConfig, ICommandCtor, IRunData } from "./types/mod.ts";

export class Cli {
  constructor(public readonly config: ICliConfig) {}

  public run(args: string[] = Deno.args) {
    const { name, commands } = this.config;
    const { _: parsedPath, "--": parsedPositionalArgs, ...parsedArgs } = parse(
      args,
      DEFAULT_PARSE_OPTIONS,
    );
    const [currentPath, nextPath, ...restPath] = parsedPath;

    this._checkPaths(name, `${currentPath}`, `${nextPath}`);

    const props = this._getCommonProps(parsedArgs);
    if (props.help && !nextPath) {
      _showHelp({
        cli: this.config,
        path: [name],
        commands: this.config.commands,
        options: DEFAULT_COMMAND_OPTIONS,
      });
    }
    const nextCommand = this._getNextCommand(name, `${nextPath}`, commands);
    const descriptor = _cmdMap.descriptor.get(nextCommand);

    const { name: cmdName, permissions } = descriptor;
    //  passed to matched command
    const resolvedPath = `${name} ${cmdName}`;
    const execPath = `${currentPath} ${nextPath}`;
    const runData: IRunData = {
      cli: this,
      execPath,
      resolvedPath,
      permissions: permissions || [],
      positional: parsedPositionalArgs,
      props,
      restPath: [nextPath, ...restPath],
    };

    const cmdInstance = new nextCommand(runData);

    cmdInstance.run();
  }

  protected _checkPaths(name: string, currentPath: string, nextPath: string) {
    const pathIndex = name.indexOf(`${currentPath}`);

    if (!currentPath) {
      _showHelp({
        cli: this.config,
        path: [name],
        commands: this.config.commands,
        options: DEFAULT_COMMAND_OPTIONS,
        message: `Entry command matching CLI "${name}" was not provided.`,
      });

      return Deno.exit(1);
    }

    if (!nextPath) {
      _showHelp({
        cli: this.config,
        path: [name],
        commands: this.config.commands,
        options: DEFAULT_COMMAND_OPTIONS,
        message: `No command for CLI "${name}" was provided.`,
      });

      return Deno.exit(1);
    }

    if (pathIndex < 0) {
      _showHelp({
        cli: this.config,
        path: [name],
        commands: this.config.commands,
        options: DEFAULT_COMMAND_OPTIONS,
        message: `Entry command "${currentPath}" doesn't match CLI "${name}".`,
      });

      return Deno.exit(1);
    }
  }

  protected _getNextCommand(
    name: string,
    nextPath: string,
    commands: ICommandCtor[],
  ) {
    const commandMatches = commands.filter((cmd) => {
      const descriptor = _cmdMap.descriptor.get(cmd);
      const { name } = descriptor;

      return name.indexOf(`${nextPath}`) === 0;
    });

    if (!commandMatches.length) {
      _showHelp({
        cli: this.config,
        path: [name],
        commands: this.config.commands,
        options: DEFAULT_COMMAND_OPTIONS,
        message: `No commands matching "${nextPath}" found in CLI "${name}".`,
      });

      return Deno.exit(1);
    }

    if (commandMatches.length > 1) {
      _showHelp({
        cli: this.config,
        path: [name],
        commands: this.config.commands,
        options: DEFAULT_COMMAND_OPTIONS,
        message: `Multiple command match "${nextPath}" in CLI "${name}": ${
          commandMatches.map((c) => c.name)
        }`,
      });

      return Deno.exit(1);
    }

    const [nextCommand] = commandMatches;

    return nextCommand;
  }

  protected _getCommonProps(
    args: { [key: string]: string | number | boolean },
  ): { [key: string]: string | number | boolean } {
    const { alias } = DEFAULT_PARSE_OPTIONS;
    const options: { [key: string]: string | number | boolean } = {};
    const removeKeys = Object.keys(alias!).reduce((removeKeys, key) => {
      const aliases = alias![key as keyof typeof alias];
      const value = args[key];

      if (value !== "undefined") {
        options[key] = value;
      } else {
        for (const a of aliases) {
          const aliasValue = args[a];
          const currentValue = options[key];
          if (
            aliasValue !== undefined &&
            currentValue === undefined
          ) {
            options[key] = aliasValue;
          }
        }
      }

      return [...removeKeys, key, ...aliases];
    }, [] as string[]);

    const restArgs: { [key: string]: string | number | boolean } = {};

    Object.keys(args).forEach((key) =>
      !removeKeys.includes(key) && (restArgs[key] = args[key])
    );

    return { ...restArgs, ...options };
  }
}
