-- Habilita busca por posts sem diferenciar acento ("fotossintese" encontra
-- "fotossíntese"). unaccent é extensão nativa do PostgreSQL, sem dependência
-- externa.
CREATE EXTENSION IF NOT EXISTS unaccent;
