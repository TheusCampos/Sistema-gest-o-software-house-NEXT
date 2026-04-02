import { z } from 'zod';

export const userSchema = z.object({
  name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres').or(z.literal('')),
  role: z.enum(['admin', 'vendedor', 'suporte', 'desenvolvedor', 'client', 'technician']),
  active: z.boolean(),
  permissions: z.any().optional(),
});

export type UserFormData = z.infer<typeof userSchema>;
