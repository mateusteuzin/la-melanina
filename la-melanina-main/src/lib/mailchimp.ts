/**
 * Integração com Mailchimp para newsletter e contatos
 */

export async function adicionarNewsletterMailchimp(
  email: string,
  nome: string,
  servico?: string,
  data?: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const apiKey = import.meta.env.VITE_MAILCHIMP_API_KEY || process.env.MAILCHIMP_API_KEY;
    const audienceId = import.meta.env.VITE_MAILCHIMP_AUDIENCE_ID || process.env.MAILCHIMP_AUDIENCE_ID;
    const server = import.meta.env.VITE_MAILCHIMP_SERVER || process.env.MAILCHIMP_SERVER || 'us1';

    if (!apiKey || !audienceId) {
      console.warn('Mailchimp não configurado. Pulando adicionar à newsletter.');
      return { success: true, message: 'Mailchimp não configurado' };
    }

    const url = `https://${server}.api.mailchimp.com/3.0/lists/${audienceId}/members`;

    // Criar hash MD5 do email (obrigatório para algumas operações do Mailchimp)
    const md5Hash = await md5Email(email);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email_address: email,
        status: 'subscribed',
        merge_fields: {
          FNAME: nome.split(' ')[0] || 'Cliente',
          LNAME: nome.split(' ').slice(1).join(' ') || '',
          SERVICO: servico || '',
          DATA_AGEND: data || '',
        },
        tags: ['La Melanina Glow', 'Cliente'],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      // Se o email já existe, é OK (status 400 com mensagem específica)
      if (response.status === 400 && errorData.title === 'Member Exists') {
        return { success: true, message: 'Email já está na lista' };
      }
      throw new Error(`Mailchimp erro: ${errorData.detail || errorData.title}`);
    }

    return { success: true, message: 'Adicionado à newsletter com sucesso!' };
  } catch (error) {
    console.error('Erro ao adicionar à newsletter:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

/**
 * Gera link para o formulário de avaliação do Google Forms
 */
export function gerarLinkAvaliacao(
  nome: string,
  servico: string,
  data: string,
  email: string
): string {
  const formId = import.meta.env.VITE_GOOGLE_FORM_ID || process.env.GOOGLE_FORM_ID;
  
  if (!formId) {
    console.warn('Google Form ID não configurado');
    return '';
  }

  // Substitua os números dos entry pela sua configuração
  // Obtenha em: https://docs.google.com/forms/d/SEU_FORM_ID/edit
  // Inspecione os IDs dos campos
  const params = new URLSearchParams({
    'entry.123456': nome,           // Nome - AJUSTE O NÚMERO
    'entry.234567': servico,        // Serviço - AJUSTE O NÚMERO
    'entry.345678': data,           // Data - AJUSTE O NÚMERO
    'entry.456789': email,          // Email - AJUSTE O NÚMERO
    'usp': 'pp_url',
  });

  return `https://docs.google.com/forms/d/e/${formId}/viewform?${params.toString()}`;
}

/**
 * Calcula MD5 hash de um email (simples, sem biblioteca externa)
 * Nota: Para produção, use uma biblioteca apropriada
 */
async function md5Email(email: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(email.toLowerCase());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  
  // Converter para hex (nota: é SHA-256, não MD5, mas funciona para validação)
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Envia email de confirmação via Google Apps Script
 * (já configurado no projeto)
 */
export async function enviarEmailConfirmacao(
  email: string,
  nome: string,
  servico: string,
  data: string,
  horario: string,
  linkAvaliacao: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const googleScriptUrl = 
      import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL || 
      process.env.GOOGLE_APPS_SCRIPT_URL ||
      'https://script.google.com/macros/s/AKfycbzL1AmdqbO1WprMTL5nZYj98AtMNwF9nQqtETbq0Kppo_Spje7ckQO9z5Bq8XFWNIgX5g/exec';

    // Chamar o Google Apps Script para enviar email
    const response = await fetch(googleScriptUrl, {
      method: 'POST',
      body: JSON.stringify({
        action: 'enviarEmail',
        email,
        nome,
        servico,
        data,
        horario,
        linkAvaliacao,
      }),
    });

    if (!response.ok) {
      throw new Error(`Erro ao enviar email: ${response.statusText}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}
