# La Melanina

## Direção

Preservar o estúdio em vinho, marrom e superfícies claras. O painel prioriza agenda, recebimentos e catálogo. A decoração de fim de ano acrescenta verde de pinheiro e dourado, sem substituir a marca.

## Sistema herdado e extensões

- Painel: Inter, Arial, sans-serif; títulos institucionais Georgia. Site: fontes já definidas em styles.css.
- Texto principal `--adm-ink: #3b302b`; secundário legível `--adm-readable: #65584f`; ação `--adm-brand: #653c35`; superfície `--adm-surface: #fffdfb`; borda `--adm-border: #eee8e2`.
- Novas listas: título 16px/600, valor 18px, corpo e metadados 14px/1.5. Indicadores móveis: valor 22px, rótulo 14px. Títulos de catálogo 18px.
- Espaço: 4, 8, 12, 16 (`--adm-space`), 20, 22px; controles com raio 7px (`--adm-radius`) e toque mínimo 44px (`--adm-touch`). Linhas com padding 16px e separador de 1px.
- Ícones Lucide 16, 18, 20px; alinhamento central em controles. Valores monetários tabulares e formato BRL, datas pt-BR.
- Natal: `--holiday-green: #234c3b`, `--holiday-gold: #f0d6a0`, texto #fffaf3; faixa com 14px/1.5. Neve decorativa branca, sem capturar eventos.
- Movimento: controles 150ms (`--adm-motion`), pressão .98; neve 12–18s linear, 24 partículas (12 no celular), desativada com preferência por movimento reduzido, ao ocultar a página ou pelo botão Pausar neve.

## Layout e comportamento

Enfeites natalinos: faixa compacta de 64px, limitada a 1200px; no celular 52px com tres enfeites. Lampadas CSS 6x10px, bolas acetinadas 26x28px (22x24px no celular), estrela vetorial 28px (24px no celular). Materiais dourados #a77b52/#c6984f/#926c36 e vinho #945a4b/#653c35/#3f211d. Gradientes de material preservam nitidez sem imagens raster. Faixa de texto em grid ate 600px: 20px/minmax(0,1fr)/auto, corpo e botao 14px, toque 44px. Ate 360px o botao passa para a segunda linha. Sem novas animacoes.

Financeiro vira uma coluna até 950px. Recebimentos em lista até 950px substituem a tabela. Valores a receber em lista com ação Receber. Até 700px os indicadores usam duas colunas e filtros/quebras não escondem conteúdo. Testar 320/390/768/1440/1920px e zoom 75/100/150%.

Cadastro de serviços preserva o identificador na edição; categoria é escolhida na criação e fica bloqueada depois, seguindo o banco. Serviços podem ser pausados. Adicionais são criados/editados sem apagar registros antigos. Salvar usa a conexão e autorização atuais. Não recriar ou popular tabelas existentes.

## Limites herdados

O CSS anterior usa vários textos entre 8 e 13px e cores secundárias claras. Melhorar as regiões afetadas, sem redesenhar telas alheias ao pedido. Nenhuma imagem ou fonte nova é necessária.
