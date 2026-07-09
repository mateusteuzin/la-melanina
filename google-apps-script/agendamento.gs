const SHEET_NAME = 'Agendamentos';

const SERVICES = {
  'Bronze Praiano': 'R$ 70,00',
  'Bronze Power': 'R$ 80,00',
  'Bronze Turbinado': 'R$ 85,00',
  'Bronze Sol Azul': 'R$ 120,00',
  'Bronze Sol Azul Turbo': 'R$ 130,00',
  'Bronze Duplo': 'R$ 140,00',
  'Banho de lua expresso': 'R$ 40,00',
  'Banho de lua clareador': 'R$ 60,00',
  'Banho de lua temático': 'R$ 80,00',
};

const ALLOWED_TIMES = [
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
];

const ALLOWED_PERIODS = [
  'Manhã (08h-11h)',
  'Tarde (15h-19h)',
];

function doGet() {
  const sheet = getScheduleSheet_();
  const rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return json_([]);

  const headers = rows[0].map(function(header) {
    return normalizeHeader_(header);
  });

  const data = rows.slice(1).map(function(row) {
    const item = {};
    headers.forEach(function(header, index) {
      item[header] = row[index];
    });
    return item;
  });

  return json_(data);
}

function doPost(e) {
  try {
    const payload = parsePayload_(e);
    const servico = String(payload.servico || '').trim();
    const nome = String(payload.nome || '').trim();
    const data = String(payload.data || '').trim();
    const horario = normalizeTime_(payload.horario);
    const observacoes = String(payload.observacoes || '').trim();

    validateBooking_(servico, nome, data, horario);

    const sheet = getScheduleSheet_();
    ensureHeaders_(sheet);
    sheet.appendRow([
      new Date(),
      nome,
      servico,
      SERVICES[servico],
      data,
      horario,
      observacoes,
    ]);

    return json_({
      success: true,
      servico: servico,
      valor: SERVICES[servico],
      nome: nome,
      data: data,
      horario: horario,
      observacoes: observacoes,
    });
  } catch (error) {
    return json_({
      success: false,
      error: error.message,
    });
  }
}

function validateBooking_(servico, nome, data, horario) {
  if (!SERVICES[servico]) {
    throw new Error('Servico nao permitido.');
  }
  if (!nome) {
    throw new Error('Nome obrigatorio.');
  }
  if (!data) {
    throw new Error('Data obrigatoria.');
  }
  if (!ALLOWED_TIMES.includes(horario) && !ALLOWED_PERIODS.includes(horario)) {
    throw new Error('Horario nao permitido.');
  }
}

function parsePayload_(e) {
  if (e && e.postData && e.postData.contents) {
    return JSON.parse(e.postData.contents);
  }
  return e && e.parameter ? e.parameter : {};
}

function getScheduleSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  return spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.insertSheet(SHEET_NAME);
}

function ensureHeaders_(sheet) {
  if (sheet.getLastRow() > 0) return;
  sheet.appendRow([
    'Criado em',
    'Nome',
    'Servico',
    'Valor',
    'Data',
    'Horario',
    'Observacoes',
  ]);
}

function normalizeHeader_(header) {
  return String(header || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_');
}

function normalizeTime_(value) {
  const time = String(value || '').trim();
  return /^\d:\d{2}$/.test(time) ? '0' + time : time;
}

function json_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
