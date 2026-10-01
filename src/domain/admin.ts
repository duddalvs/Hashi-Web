import { z } from 'zod';
import { profileSchema } from './models';

const text = (label: string, limit: number) =>
  z
    .string()
    .transform((v) => v.trim().replace(/\s+/gu, ' '))
    .refine(
      (v) => Array.from(v).length >= 1 && Array.from(v).length <= limit,
      `${label}: informe de 1 a ${limit} caracteres.`,
    );
export const passwordSchema = z
  .string()
  .refine((v) => Array.from(v).length >= 12, 'A senha deve ter pelo menos 12 caracteres.')
  .refine((v) => new TextEncoder().encode(v).length <= 72, 'A senha excede o limite de 72 bytes.');
export const catalogKindSchema = z.enum(['veiculos', 'funcionarios', 'contratos']);
export type CatalogKind = z.infer<typeof catalogKindSchema>;
export const catalogSchemas = {
  veiculos: z.object({
    placa: text('Placa / identificação', 30)
      .transform((v) => v.toUpperCase())
      .refine(
        (v) => /^[A-Z0-9][A-Z0-9 -]*$/.test(v),
        'Use letras, números, espaços ou hífen na identificação.',
      ),
    modelo: text('Modelo', 150),
    tipo: z.enum(['veiculo', 'equipamento']),
  }),
  funcionarios: z.object({ nome: text('Nome', 200) }),
  contratos: z.object({ nome: text('Nome', 200) }),
};
export const createUserSchema = z.object({
  nome: text('Nome', 100),
  sobrenome: text('Sobrenome', 100),
  login: z
    .string()
    .trim()
    .toLowerCase()
    .regex(
      /^[a-z][a-z0-9_]{2,39}$/,
      'Usuário: use de 3 a 40 letras, números ou _, começando por letra.',
    ),
  perfil: z.enum(['admin', 'funcionario']),
  password: passwordSchema,
});
export const adminUserSchema = profileSchema.extend({ created_at: z.string() });
export type AdminUser = z.infer<typeof adminUserSchema>;
