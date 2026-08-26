-- Reclassifica artigos existentes para a nova taxonomia de categorias do blog
-- (Para Autores / Mercado Literário / Para Leitores / Histórias).
UPDATE "Article" SET "categoria" = 'Histórias' WHERE "titulo" = 'COMO NASCEU O COLETIVO' AND "categoria" = 'Artigos';
