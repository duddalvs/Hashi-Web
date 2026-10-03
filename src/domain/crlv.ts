import { z } from 'zod';

export const crlvSchema = z.object({
  id: z.uuid(),
  veiculo_id: z.number().int().positive(),
  placa: z.string(),
  ano_documento: z.number().int(),
});
export const crlvListSchema = z.array(crlvSchema);
export const crlvFileSchema = crlvSchema
  .extend({
    arquivo: z.string().regex(/^CRLVDigital_[A-Z]{3}\d[A-Z\d]\d{2}_\d{4}\.pdf$/),
    sha256: z.string().regex(/^[a-f0-9]{64}$/),
    tamanho_bytes: z
      .number()
      .int()
      .positive()
      .max(20 * 1024 * 1024),
    storage_bucket: z.literal('hashi-crlv'),
    storage_path: z.string(),
  })
  .refine(
    (doc) => doc.storage_path === `crlv/${doc.sha256}/${doc.arquivo}`,
    'Caminho de CRLV inválido.',
  );
export type Crlv = z.infer<typeof crlvSchema>;
export type CrlvFile = z.infer<typeof crlvFileSchema>;
