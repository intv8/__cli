import type { AbstractCommand } from "../AbstractCommand.ts";

export type PermissionCallback = (
  cmd: AbstractCommand,
) => Deno.PermissionDescriptor | Deno.PermissionDescriptor[];

export type Permission =
  | Deno.PermissionDescriptor
  | PermissionCallback;
