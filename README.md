# La Melanina

Site de agendamento e painel administrativo em `/admin`, conectados ao Supabase.

## Desenvolvimento

Use Node.js 24. Execute `npm ci`, copie `.env.example` para `.env.local`, preencha as duas variáveis públicas e execute `npm run dev`.

## Vercel

Importe este repositório e configure `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` com a URL e a chave pública publishable/anon do Supabase. Nunca use uma chave service_role. O build é `npm run build` e a saída é `dist`.

O banco já configurado deve ser mantido. `supabase/001_admin.sql` é a instalação inicial para um banco novo; não execute novamente sobre o banco existente. O acesso administrativo depende de Authentication e da tabela `admin_members`.

## Agenda

Confirmar e concluir mantêm o horário reservado. Cancelar ou marcar falta libera a vaga; remarcar libera o horário anterior. Pagamentos são registrados separadamente e entram no mês da data do recebimento.

A importação dos agendamentos antigos da planilha ainda está pendente. Até a migração, confira a agenda anterior para evitar reservas duplicadas.

## Verificação

`npm test`, `npm run typecheck` e `npm run build`.

A configuração de produção incluída contém apenas a URL e a chave pública do Supabase; as permissões são protegidas no banco. Variáveis cadastradas na Vercel têm prioridade.
