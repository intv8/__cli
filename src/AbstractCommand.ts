import { colors } from "../deps.ts";
import { Option } from "./decorators/mod.ts";
import { _cmdMap, _showHelp } from "./_utils/mod.ts";
import { DEFAULT_COMMAND_OPTIONS } from "./_constants.ts";

import type {
  ICommandArgumentsResourceMap,
  ICommandCtor,
  ICommandOptionResourceMap,
  IRunData,
  Permission,
} from "./types/mod.ts";

export abstract class AbstractCommand {
  constructor(protected data: IRunData) {}

  @Option({
    name: "help",
    type: "boolean",
    shorthand: "h",
  })
  public showHelp = false;

  @Option({
    name: "verbose",
    type: "boolean",
    shorthand: "*",
  })
  public showVerboseMessages = false;

  @Option({
    name: "debug",
    type: "boolean",
    shorthand: "!",
  })
  public debugOnly = false;

  @Option({
    name: "version",
    type: "boolean",
    shorthand: "v",
  })
  public showVersion = false;

  @Option({
    name: "example",
    type: "boolean",
    shorthand: "#",
  })
  public showExamples = false;

  public optionsValid = false;

  protected log(...msg: (string | number | boolean)[]) {
    console.log(...msg);
  }

  protected logLabels(...items: [string, unknown][]) {
    const length = items.reduce((prev, curr) => {
      const [label] = curr;
      if (label.length > prev) {
        return label.length;
      }

      return prev;
    }, 0);

    items.forEach((item) => {
      const [label, text] = item;
      const pad = length - label.length + 2;
      console.log(`${label}${" ".repeat(pad)}${text}`);
    });
  }

  protected logVerbose(...msg: string[]) {
    if (this.showVerboseMessages) {
      console.log(colors.gray("[verbose]"), ...msg.map(colors.gray));
    }
  }

  protected debugAction(
    action: (...args: unknown[]) => void,
    ...msg: string[]
  ) {
    if (this.debugOnly) {
      console.log(colors.yellow("[debug]"), ...msg.map(colors.yellow));
    } else {
      action();
    }
  }

  public async run(): Promise<void> {
    const ctor = this.constructor as ICommandCtor;
    const descriptor = _cmdMap.descriptor.get(ctor);
    const argsLists = _cmdMap.arguments.get(ctor);
    const options = [..._cmdMap.options.get(ctor), ...DEFAULT_COMMAND_OPTIONS];

    const {
      props,
      restPath,
      permissions,
      execPath,
      positional,
      resolvedPath,
      cli,
    } = this.data;
    const [currentPath, ...remainingPath] = restPath;
    const { commands, permissions: cmdPermissions } = descriptor;

    this.optionsValid = await this._assignOptions(options, props);
    if (!this.optionsValid) {
      this.logVerbose("Options are invalid");
    }

    if (this.showHelp && !remainingPath.length) {
      _showHelp({
        cli: cli.config,
        cmd: ctor,
        path: [resolvedPath],
        commands: commands,
        arguments: argsLists,
        options: options,
      });

      return;
    }

    const next = this._getExecutable(remainingPath);

    if (!next) {
      _showHelp({
        cli: cli.config,
        cmd: ctor,
        path: [resolvedPath],
        commands: commands,
        arguments: argsLists,
        options: options,
        message: `No subcommand, argument overload, or handler matching "${
          remainingPath[0]
        }" was not provided.`,
      });

      return;
    }

    if (typeof next === "function") {
      const nextDesc = _cmdMap.descriptor.get(next);
      const cmd = new next({
        resolvedPath: `${resolvedPath} ${nextDesc.name}`,
        execPath: `${execPath} ${currentPath}`,
        permissions: [...permissions || [], ...cmdPermissions || []],
        restPath: remainingPath,
        cli,
        positional,
        props,
      });

      return await cmd.run();
    } else if ("arguments" in next) {
      if (this.showHelp) {
        return _showHelp({
          cli: cli.config,
          cmd: ctor,
          path: [resolvedPath],
          arguments: [next],
          options: options,
        });
      }

      const { target, permissions: argPermissions } = next;
      await this._checkPermissions([...permissions || [], ...cmdPermissions || [], ...argPermissions || []]);
      const call = this[target as keyof this];

      if (typeof call === "function") {
        return await call.apply(this, remainingPath);
      }
    } else {
      const { target, permissions: handlerPermissions } = next;
      const call = this[target as keyof this];
      await this._checkPermissions([...permissions || [], ...cmdPermissions || [], ...handlerPermissions || []]);
      if (this.showHelp) {
        _showHelp({
          cli: cli.config,
          cmd: ctor,
          path: [resolvedPath],
          arguments: argsLists,
          commands: commands,
          options: options,
        });
      }
      if (typeof call === "function") {
        return await call.apply(this);
      }
    }
  }

  protected _convertValue(
    value: string | number | boolean,
    type: "string" | "number" | "boolean",
  ) {
    // deno-lint-ignore valid-typeof
    return typeof value === type
      ? value
      : type === "string"
      ? `${value}`
      : type === "boolean"
      ? !!value
      : Number(value);
  }

  protected async _checkPermission(permission?: Permission, count = 0) {
    if (!permission) return;
    if (count > 2) {
      const { name: _name, ...rest} = permission;
      const label = Object.keys(rest)[0];

      this.logVerbose(`Exiting due to permission denial for "${permission.name}" to "${permission[label as keyof Permission]}".`);

      Deno.exit(5);
    }
    const perm = typeof permission === "function"
      ? permission(this)
      : permission;

    if (Array.isArray(perm)) {
      return await this._checkPermissions(perm);
    }

    const state = await Deno.permissions.query(perm);
    if (state.state === "granted") {
      return;
    }

    const newState = await Deno.permissions.request(perm);

    if (newState.state === "granted") {
      return;
    }

    this._checkPermission(perm, count + 1);
  }

  protected async _checkPermissions(permissions: Permission[]) {
    await permissions.forEach(this._checkPermission);
  }

  protected async _getValueFromEnv(env: string | string[]): Promise<string | undefined> {
    if (Array.isArray(env)) {
      return env.find((e) => this._getValueFromEnv(e));
    }

    await this._checkPermission({name: "env", variable: env});

    return Deno.env.get(env);
  }

  protected async _assignOptions(
    options: ICommandOptionResourceMap[],
    props: { [key: string]: string | number | boolean },
  ) {
    return await options.reduce(async (prev, option) => {
      const { target, type, delimiter, env, name, shorthand } = option;
      const shorthandValue = shorthand ? props[shorthand] : undefined;
      const namedValue = name ? props[name] : undefined;
      let value = shorthandValue === undefined || namedValue !== undefined
        ? namedValue
        : shorthandValue;

      if (value === undefined && env) {
        value = await this._getValueFromEnv(env);
      }

      if (value !== undefined) {
        const val = delimiter ? `${value}`.split(delimiter) : value;
        this[target as keyof this] = (Array.isArray(val)
          ? val.map((v) =>
            this._convertValue(v, type)
          )
          : this._convertValue(val, type)) as unknown as this[keyof this];

        return prev;
      }

      return false;
    }, Promise.resolve(true));
  }

  protected _checkArgs(
    argList: ICommandArgumentsResourceMap,
    path: (string | number)[],
  ) {
    return argList.arguments.reduce((prev, arg, i) => {
      if (!prev) return prev;

      const { default: defaultValue, match, required } = arg;
      const value = path[i] === undefined ? defaultValue : path[i];

      if (required && value === undefined) {
        return false;
      }

      if (match) {
        return match.test(`${value}`);
      }

      return prev;
    }, true);
  }

  protected _getExecutable(path: (string | number)[]) {
    const ctor = this.constructor as ICommandCtor;
    const { cli, resolvedPath } = this.data;
    const descriptor = _cmdMap.descriptor.get(ctor);
    const argsLists = _cmdMap.arguments.get(ctor);
    const handlers = _cmdMap.handlers.get(ctor);
    const options = [..._cmdMap.options.get(ctor), ...DEFAULT_COMMAND_OPTIONS];
    const { commands } = descriptor;
    const [nextPath] = path;
    const noFuzzySearch = arguments.length && commands?.length;
    
    const matchingArgs = argsLists.find((args) => this._checkArgs(args, path));

    if (matchingArgs) return matchingArgs;
    const matchingCommands = commands?.filter((cmd) => {
      const desc = _cmdMap.descriptor.get(cmd);
      if (noFuzzySearch) {
        return desc.name === `${nextPath}`.toLowerCase();
      } else {
        return !desc.name.indexOf(`${nextPath}`.toLowerCase());
      }
    });

    if (matchingCommands?.length === 1) {
      const [nextCommand] = matchingCommands;

      return nextCommand;
    }

    const matchingHandler = handlers.find((hand) => {
      if (hand.when) {
        return hand.when(this);
      }

      return true;
    });

    if (matchingHandler) {
      return matchingHandler;
    }

    if (!matchingCommands?.length && !matchingArgs && !matchingHandler) {
      _showHelp({
        cli: cli.config,
        cmd: ctor,
        path: [resolvedPath],
        commands: commands,
        arguments: argsLists,
        options: options,
        message:
          `No subcommand, argument overload, or handler matching "${nextPath}" was not provided.`,
      });
    }
  }
}
