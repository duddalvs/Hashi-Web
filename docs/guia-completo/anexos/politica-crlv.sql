-- Somente no NOVO projeto, após criar hashi-crlv privado pela Storage API.
CREATE POLICY "hashi_crlv_apenas_servidor" ON storage.objects AS RESTRICTIVE FOR ALL TO "anon", "authenticated" USING ((bucket_id <> 'hashi-crlv'::text)) WITH CHECK ((bucket_id <> 'hashi-crlv'::text));
