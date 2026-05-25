# 📧 Integração com Email, Newsletter e Avaliações

Guia completo para configurar as funcionalidades de email automático, newsletter e avaliações.

---

## **1️⃣ Email Automático - Google Apps Script**

### Passo 1: Acessar seu Google Apps Script

1. Vá para [script.google.com](https://script.google.com)
2. Encontre seu script vinculado à planilha de agendamentos
3. Clique para abrir

### Passo 2: Adicionar função de envio de email

Copie e cole este código no seu Apps Script (após suas funções existentes):

```javascript
/**
 * Envia email de confirmação de agendamento
 */
function enviarEmailConfirmacao(email, nome, servico, data, horario, linkAvaliacao) {
  const subject = "✨ Agendamento Confirmado - La Melanina Glow";
  
  const htmlBody = `
    <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #f5f0e8 0%, #faf7f3 100%); padding: 20px; border-radius: 15px;">
      
      <div style="background: linear-gradient(135deg, #8B4466 0%, #D4A574 100%); padding: 30px 20px; border-radius: 10px; color: white; text-align: center; margin-bottom: 20px;">
        <h1 style="margin: 0; font-size: 28px;">✨ Agendamento Confirmado!</h1>
        <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">La Melanina Glow</p>
      </div>
      
      <div style="background: white; padding: 25px; border-radius: 10px; border: 1px solid #e0d5ca; margin-bottom: 20px;">
        <h2 style="color: #8B4466; font-size: 18px; margin: 0 0 15px 0;">Seus Detalhes</h2>
        
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="border-bottom: 1px solid #e0d5ca;">
            <td style="padding: 12px 0; color: #666; font-size: 14px;"><strong>👤 Nome:</strong></td>
            <td style="padding: 12px 0; color: #333; font-size: 14px; text-align: right;">${nome}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e0d5ca;">
            <td style="padding: 12px 0; color: #666; font-size: 14px;"><strong>✨ Serviço:</strong></td>
            <td style="padding: 12px 0; color: #333; font-size: 14px; text-align: right;">${servico}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e0d5ca;">
            <td style="padding: 12px 0; color: #666; font-size: 14px;"><strong>📅 Data:</strong></td>
            <td style="padding: 12px 0; color: #333; font-size: 14px; text-align: right;">${data}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; color: #666; font-size: 14px;"><strong>🕐 Horário:</strong></td>
            <td style="padding: 12px 0; color: #333; font-size: 14px; text-align: right;">${horario}</td>
          </tr>
        </table>
      </div>

      <div style="background: #fff3e0; border-left: 4px solid #D4A574; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
        <p style="margin: 0; color: #e65100; font-size: 13px;">
          <strong>⏰ Importante:</strong> Tolerância máxima de 10 minutos de atraso. Após esse prazo, o horário poderá ser remarcado conforme disponibilidade.
        </p>
      </div>

      <div style="background: #f0f5fa; border: 1px solid #b3e5fc; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
        <p style="margin: 0; color: #01579b; font-size: 13px;"><strong>💳 Formas de Pagamento:</strong></p>
        <p style="margin: 8px 0 0 0; color: #01579b; font-size: 13px;">
          Cartão de Crédito | Débito | Pix
        </p>
      </div>

      <div style="text-align: center; margin-bottom: 20px;">
        <a href="https://wa.me/558896241621" style="background: #25D366; color: white; padding: 12px 30px; border-radius: 25px; text-decoration: none; font-weight: bold; display: inline-block; font-size: 14px;">
          💬 Confirmar via WhatsApp
        </a>
      </div>

      ${linkAvaliacao ? `
        <div style="background: #e8f5e9; border: 1px solid #c8e6c9; padding: 15px; border-radius: 5px; text-align: center; margin-bottom: 20px;">
          <p style="margin: 0; color: #2e7d32; font-size: 13px; font-weight: bold;">Sua avaliação é importante!</p>
          <a href="${linkAvaliacao}" style="color: #2e7d32; text-decoration: none; font-weight: bold; font-size: 13px;">
            ⭐ Deixe sua avaliação aqui
          </a>
        </div>
      ` : ''}

      <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e0d5ca; color: #999; font-size: 12px;">
        <p style="margin: 0;">La Melanina Glow | Seu Bronzeado Perfeito</p>
        <p style="margin: 5px 0 0 0;">
          <a href="https://www.instagram.com/lamelanina/" style="color: #D4A574; text-decoration: none;">Instagram</a> | 
          <a href="https://wa.me/558896241621" style="color: #D4A574; text-decoration: none;">WhatsApp</a>
        </p>
      </div>
    </div>
  `;
  
  try {
    MailApp.sendEmail(email, subject, "", { htmlBody: htmlBody });
    Logger.log("Email enviado para: " + email);
  } catch (error) {
    Logger.log("Erro ao enviar email: " + error);
  }
}

/**
 * Função para interceptar respostas do formulário (se usar Google Forms)
 * Descomente e adapte se estiver usando formulário
 */
// function onFormSubmit(e) {
//   const response = e.response;
//   const itemResponses = response.getItemResponses();
//   
//   const email = itemResponses[0].getResponse();
//   const nome = itemResponses[1].getResponse();
//   const servico = itemResponses[2].getResponse();
//   const data = itemResponses[3].getResponse();
//   const horario = itemResponses[4].getResponse();
//   
//   enviarEmailConfirmacao(email, nome, servico, data, horario, "");
// }
```

### Passo 3: Modificar sua função principal

Encontre sua função que recebe dados do formulário (provavelmente `doPost`) e adicione:

```javascript
function doPost(e) {
  const action = e.parameter.action;
  
  if (action === 'enviarEmail') {
    // Dados enviados do frontend
    const email = e.parameter.email;
    const nome = e.parameter.nome;
    const servico = e.parameter.servico;
    const data = e.parameter.data;
    const horario = e.parameter.horario;
    const linkAvaliacao = e.parameter.linkAvaliacao || '';
    
    enviarEmailConfirmacao(email, nome, servico, data, horario, linkAvaliacao);
    
    return ContentService.createTextOutput(
      JSON.stringify({ success: true })
    ).setMimeType(ContentService.MimeType.JSON);
  }
  
  // ... resto do seu código existente
}
```

---

## **2️⃣ Newsletter - Mailchimp Setup**

### Passo 1: Criar conta Mailchimp

1. Acesse [mailchimp.com](https://mailchimp.com)
2. Clique em **Sign Up** (é grátis)
3. Crie sua conta
4. Confirme seu email

### Passo 2: Criar uma Audience

1. No painel, clique em **Audience**
2. Clique em **Create Audience**
3. Preencha com informações da La Melanina:
   - **Name**: La Melanina Glow
   - **Email**: seu@email.com
   - **Company**: La Melanina
   - **City**: Sua cidade

### Passo 3: Obter API Key

1. Clique no seu **Avatar** (canto superior direito)
2. Vá para **Account & billing**
3. Clique em **Extras** → **API keys**
4. Clique em **Create a Key**
5. Copie a chave gerada

### Passo 4: Obter Audience ID

1. Volte para **Audience**
2. Clique no nome da sua audience
3. Clique em **Audience settings**
4. Procure por **Audience ID** (em negrito)
5. Copie (exemplo: `a1b2c3d4e5`)

### Passo 5: Configurar no projeto

Abra `.env.local` na raiz do projeto e preencha:

```env
MAILCHIMP_API_KEY=seu_api_key_aqui
MAILCHIMP_AUDIENCE_ID=seu_audience_id_aqui
MAILCHIMP_SERVER=us1
```

**⚠️ Nota**: O `MAILCHIMP_SERVER` aparece na sua API Key (ex: `us1-abc123def456`)

---

## **3️⃣ Avaliações - Google Forms Setup**

### Passo 1: Criar formulário

1. Acesse [forms.google.com](https://forms.google.com)
2. Clique em **+ Criar**
3. Nomeie: "Avaliação La Melanina Glow"

### Passo 2: Adicionar campos

Crie os seguintes campos:

1. **Nome completo** (Resposta curta)
   - Obrigatório ✓

2. **Serviço contratado** (Resposta curta)
   - Obrigatório ✓

3. **Data do agendamento** (Resposta curta)
   - Obrigatório ✓

4. **Email** (Email)
   - Obrigatório ✓

5. **Avaliação** (Escolha múltipla)
   - ⭐ 1 Estrela - Não recomendo
   - ⭐⭐ 2 Estrelas - Precisa melhorar
   - ⭐⭐⭐ 3 Estrelas - Bom
   - ⭐⭐⭐⭐ 4 Estrelas - Muito bom
   - ⭐⭐⭐⭐⭐ 5 Estrelas - Excelente
   - Obrigatório ✓

6. **Comentário** (Parágrafo)
   - Opcional

7. **Voltaria a contratar?** (Sim/Não)
   - Obrigatório ✓

### Passo 3: Obter ID do formulário

1. Clique em **Enviar** (envelope no canto superior)
2. Copie o link do formulário
3. A URL é assim: `https://docs.google.com/forms/d/AQUI_VEM_O_ID/edit`
4. O `ID` é a sequência de caracteres entre `/d/` e `/edit`

### Passo 4: Configurar entry IDs

Para popular automáticamente os campos:

1. Abra o formulário em modo visualizar
2. Inspecione a página (F12)
3. Procure por `entry.NÚMEROS` em cada campo
4. Anote os números

Exemplo: `<input name="entry.123456" ...>`

### Passo 5: Atualizar .env.local

```env
GOOGLE_FORM_ID=sua_sequencia_de_caracteres_aqui
```

### Passo 6: Editar mailchimp.ts (IMPORTANTE)

Abra `src/lib/mailchimp.ts` e encontre a função `gerarLinkAvaliacao`:

```typescript
export function gerarLinkAvaliacao(
  nome: string,
  servico: string,
  data: string,
  email: string
): string {
  const formId = import.meta.env.VITE_GOOGLE_FORM_ID || process.env.GOOGLE_FORM_ID;
  
  const params = new URLSearchParams({
    'entry.123456': nome,           // ← SUBSTITUA 123456 pelo seu ID
    'entry.234567': servico,        // ← SUBSTITUA 234567 pelo seu ID
    'entry.345678': data,           // ← SUBSTITUA 345678 pelo seu ID
    'entry.456789': email,          // ← SUBSTITUA 456789 pelo seu ID
    'usp': 'pp_url',
  });

  return `https://docs.google.com/forms/d/e/${formId}/viewform?${params.toString()}`;
}
```

**Substitua os números pelos entry IDs que você anotou!**

---

## **✅ Checklist de Configuração**

- [ ] Google Apps Script atualizado com função de email
- [ ] `.env.local` criado com variáveis
- [ ] Mailchimp: API Key e Audience ID copiados
- [ ] Google Forms criado com 7 campos
- [ ] Entry IDs do formulário anotados e colocados em `mailchimp.ts`
- [ ] Projeto reiniciado (`npm run dev`)

---

## **🧪 Testar a Integração**

1. Acesse o site em localhost
2. Preencha o formulário de agendamento com:
   - Nome: "Teste"
   - Email: seu@email.com
   - Serviço: Qualquer um
   - Data e horário: Qualquer um
   - Newsletter: Ativada

3. Clique em "AGENDAR PELO WHATSAPP"

4. Verifique:
   - ✅ Email recebido no seu inbox
   - ✅ Contato adicionado no Mailchimp
   - ✅ Link de avaliação presente no email

---

## **📞 Suporte**

Se algo não funcionar:

1. Verifique o console do navegador (F12) para erros
2. Verifique os logs do Google Apps Script
3. Confirme que as chaves estão corretas no `.env.local`
4. Reinicie o servidor com `npm run dev`

---

**Pronto! Seu sistema de agendamento agora tem email automático, newsletter e avaliações!** 🎉
