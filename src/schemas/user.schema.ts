import { z } from 'zod';

export const crudPermissionsSchema = z.object({
  view: z.boolean().default(false),
  create: z.boolean().default(false),
  edit: z.boolean().default(false),
  delete: z.boolean().default(false),
});

export const userPermissionsSchema = z.object({
  clients: crudPermissionsSchema,
  contracts: crudPermissionsSchema,
  tickets: crudPermissionsSchema,
  settings: crudPermissionsSchema,
  equipment: crudPermissionsSchema,
  sellers: crudPermissionsSchema,
  appointments: crudPermissionsSchema,
  performance: crudPermissionsSchema,
});

export const userRoleEnum = z.enum([
  'admin',
  'technician',
  'client',
  'vendedor',
  'suporte',
  'desenvolvedor',
]);

export const userCreationSchema = z.object({
  id: z.string().uuid().optional().nullable(),
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").trim(),
  email: z.string().email("E-mail inválido").toLowerCase().trim(),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  role: userRoleEnum,
  avatar: z.string().nullable().optional(),
  active: z.boolean().default(true),
  permissions: userPermissionsSchema.optional(),
});

export const userUpdateSchema = z.object({
  id: z.string().uuid("ID inválido"),
  name: z.string().min(2).optional(),
  email: z.string().email().toLowerCase().optional(),
  password: z.string().min(6).optional().nullable().or(z.literal("")),
  role: userRoleEnum.optional(),
  avatar: z.string().nullable().optional(),
  active: z.boolean().optional(),
  permissions: userPermissionsSchema.optional(),
});

export type UserCreationInput = z.infer<typeof userCreationSchema>;
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;
