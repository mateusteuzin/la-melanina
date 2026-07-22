const SHEET_NAME = 'Página1';

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
  '08:00', '09:00', '10:00', '11:00',
  '15:00', '16:00', '17:00', '18:00', '19:00',
];

const ALLOWED_PERIODS = [
  'Manhã (08h-11h)',
  'Tarde (15h-19h)',
];

const STATUS_OPTIONS = ['Pendente', 'Confirmado', 'Cancelado'];

function doGet() {
  const sheet = getScheduleSheet_();
  ensureHeaders_(sheet);
  const rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return json_([]);

  const headers = rows[0].map(function(header) {
    return normalizeHeader_(header);
  });

  const data = rows.slice(1).map(function(row) {
    const item = {};
    headers.forEach(function(header, index) {
      let value = row[index];
      if (header === 'data') value = formatSheetDate_(value, sheet);
      if (header === 'horario') value = formatSheetTime_(value, sheet);
      item[header] = value;
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
    assertSlotAvailable_(sheet, data, horario);
    const id = Utilities.getUuid();
    const row = buildBookingRow_(sheet, {
      servico: servico,
      data: data,
      horario: horario,
      nome: nome,
      email: String(payload.email || '').trim(),
      telefone: String(payload.telefone || '').trim(),
      criado_em: new Date(),
      chave: id,
      valor: SERVICES[servico],
      observacoes: observacoes,
      status: 'Pendente',
      id: id,
    });

    sheet.appendRow(row);
    formatScheduleSheet_(sheet);

    return json_({
      success: true,
      id: id,
      status: 'Pendente',
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

function assertSlotAvailable_(sheet, data, horario) {
  const rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return;

  const headers = rows[0].map(normalizeHeader_);
  const dataColumn = headers.indexOf('data');
  const horarioColumn = headers.indexOf('horario');
  const statusColumn = headers.indexOf('status');

  const ocupado = rows.slice(1).some(function(row) {
    const rowData = formatSheetDate_(row[dataColumn], sheet);
    const rowHorario = formatSheetTime_(row[horarioColumn], sheet);
    const rowStatus = statusColumn >= 0
      ? String(row[statusColumn] || 'Pendente').trim().toLowerCase()
      : 'pendente';

    return rowData === data &&
      rowHorario === horario &&
      rowStatus !== 'cancelado';
  });

  if (ocupado) {
    throw new Error('Este horario ja esta ocupado.');
  }
}

function formatSheetDate_(value, sheet) {
  if (value instanceof Date) {
    return Utilities.formatDate(
      value,
      sheet.getParent().getSpreadsheetTimeZone(),
      'dd/MM/yyyy'
    );
  }

  const raw = String(value || '').trim();
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return iso ? iso[3] + '/' + iso[2] + '/' + iso[1] : raw.slice(0, 10);
}

function formatSheetTime_(value, sheet) {
  if (value instanceof Date) {
    return Utilities.formatDate(
      value,
      sheet.getParent().getSpreadsheetTimeZone(),
      'HH:mm'
    );
  }

  return normalizeTime_(value);
}

function buildBookingRow_(sheet, values) {
  const headers = sheet
    .getRange(1, 1, 1, sheet.getLastColumn())
    .getValues()[0];

  return headers.map(function(header) {
    const key = normalizeHeader_(header);
    return Object.prototype.hasOwnProperty.call(values, key)
      ? values[key]
      : '';
  });
}

function validateBooking_(servico, nome, data, horario) {
  if (!SERVICES[servico]) throw new Error('Servico nao permitido.');
  if (!nome) throw new Error('Nome obrigatorio.');
  if (!data) throw new Error('Data obrigatoria.');
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
  const requiredHeaders = [
    'Servico', 'Data', 'Horario', 'Nome', 'Email', 'Telefone',
    'Criado em', 'Chave', 'Valor', 'Observacoes', 'Status', 'ID',
  ];

  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, requiredHeaders.length).setValues([requiredHeaders]);
  } else {
    const currentHeaders = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0];
    const normalized = currentHeaders.map(normalizeHeader_);
    requiredHeaders.forEach(function(header) {
      if (normalized.indexOf(normalizeHeader_(header)) === -1) {
        sheet.getRange(1, sheet.getLastColumn() + 1).setValue(header);
        normalized.push(normalizeHeader_(header));
      }
    });

    const statusColumn = normalized.indexOf('status') + 1;
    const idColumn = normalized.indexOf('id') + 1;
    const valorColumn = normalized.indexOf('valor') + 1;
    const servicoColumn = normalized.indexOf('servico') + 1;
    const firstDataRow = 2;
    const rowCount = sheet.getLastRow() - 1;

    if (rowCount > 0) {
      const statusValues = sheet.getRange(firstDataRow, statusColumn, rowCount, 1).getValues();
      const idValues = sheet.getRange(firstDataRow, idColumn, rowCount, 1).getValues();
      const valorValues = sheet.getRange(firstDataRow, valorColumn, rowCount, 1).getValues();
      const servicoValues = sheet.getRange(firstDataRow, servicoColumn, rowCount, 1).getValues();
      let statusChanged = false;
      let idChanged = false;
      let valorChanged = false;

      statusValues.forEach(function(row) {
        if (!row[0]) {
          row[0] = 'Pendente';
          statusChanged = true;
        }
      });
      idValues.forEach(function(row) {
        if (!row[0]) {
          row[0] = Utilities.getUuid();
          idChanged = true;
        }
      });

      valorValues.forEach(function(row, index) {
        const servico = String(servicoValues[index][0] || '').trim();
        if (!row[0] && SERVICES[servico]) {
          row[0] = SERVICES[servico];
          valorChanged = true;
        }
      });

      if (statusChanged) sheet.getRange(firstDataRow, statusColumn, rowCount, 1).setValues(statusValues);
      if (idChanged) sheet.getRange(firstDataRow, idColumn, rowCount, 1).setValues(idValues);
      if (valorChanged) sheet.getRange(firstDataRow, valorColumn, rowCount, 1).setValues(valorValues);
    }
  }

  formatScheduleSheet_(sheet);
}

function formatScheduleSheet_(sheet) {
  const lastColumn = Math.max(sheet.getLastColumn(), 12);
  const lastRow = Math.max(sheet.getLastRow(), 1);
  const header = sheet.getRange(1, 1, 1, lastColumn);

  header
    .setBackground('#5b1830')
    .setFontColor('#ffffff')
    .setFontWeight('bold')
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle')
    .setWrap(true);

  sheet.setFrozenRows(1);
  sheet.setRowHeight(1, 38);

  const widths = [190, 110, 110, 180, 190, 135, 155, 170, 105, 220, 120, 170];
  widths.forEach(function(width, index) {
    sheet.setColumnWidth(index + 1, width);
  });

  if (lastRow > 1) {
    const rowCount = lastRow - 1;
    const body = sheet.getRange(2, 1, rowCount, lastColumn);

    body
      .setVerticalAlignment('middle')
      .setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP);

    sheet.setRowHeights(2, rowCount, 42);

    const dataColumn = findHeaderColumn_(sheet, 'data');
    const horarioColumn = findHeaderColumn_(sheet, 'horario');
    const criadoColumn = findHeaderColumn_(sheet, 'criado_em');
    const nomeColumn = findHeaderColumn_(sheet, 'nome');
    const observacoesColumn = findHeaderColumn_(sheet, 'observacoes');
    const valorColumn = findHeaderColumn_(sheet, 'valor');
    const statusColumn = findHeaderColumn_(sheet, 'status');

    if (dataColumn) {
      sheet.getRange(2, dataColumn, rowCount, 1)
        .setNumberFormat('dd/MM/yyyy')
        .setHorizontalAlignment('center');
    }

    if (horarioColumn) {
      sheet.getRange(2, horarioColumn, rowCount, 1)
        .setNumberFormat('HH:mm')
        .setHorizontalAlignment('center');
    }

    if (criadoColumn) {
      sheet.getRange(2, criadoColumn, rowCount, 1)
        .setNumberFormat('dd/MM/yyyy HH:mm')
        .setHorizontalAlignment('center');
    }

    if (nomeColumn) {
      sheet.getRange(2, nomeColumn, rowCount, 1)
        .setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP);
    }

    if (observacoesColumn) {
      sheet.getRange(2, observacoesColumn, rowCount, 1)
        .setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP);
    }

    if (valorColumn) {
      sheet.getRange(2, valorColumn, rowCount, 1)
        .setHorizontalAlignment('center')
        .setFontWeight('bold');
    }

    if (statusColumn) {
      const statusRange = sheet.getRange(2, statusColumn, rowCount, 1);
      const validation = SpreadsheetApp.newDataValidation()
        .requireValueInList(STATUS_OPTIONS, true)
        .setAllowInvalid(false)
        .build();

      statusRange
        .setDataValidation(validation)
        .setHorizontalAlignment('center')
        .setFontWeight('bold');

      const rules = [
        SpreadsheetApp.newConditionalFormatRule()
          .whenTextEqualTo('Pendente')
          .setBackground('#fff2cc')
          .setFontColor('#7f6000')
          .setRanges([statusRange])
          .build(),
        SpreadsheetApp.newConditionalFormatRule()
          .whenTextEqualTo('Confirmado')
          .setBackground('#d9ead3')
          .setFontColor('#274e13')
          .setRanges([statusRange])
          .build(),
        SpreadsheetApp.newConditionalFormatRule()
          .whenTextEqualTo('Cancelado')
          .setBackground('#f4cccc')
          .setFontColor('#990000')
          .setRanges([statusRange])
          .build(),
      ];

      sheet.setConditionalFormatRules(rules);
    }

    if (!sheet.getFilter()) {
      sheet.getRange(1, 1, lastRow, lastColumn).createFilter();
    }
  }

  const chaveColumn = findHeaderColumn_(sheet, 'chave');
  const idColumn = findHeaderColumn_(sheet, 'id');
  if (chaveColumn) sheet.hideColumns(chaveColumn);
  if (idColumn) sheet.hideColumns(idColumn);
}

function findHeaderColumn_(sheet, headerName) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const target = normalizeHeader_(headerName);
  for (let index = 0; index < headers.length; index += 1) {
    if (normalizeHeader_(headers[index]) === target) return index + 1;
  }
  return 0;
}

function configurarAgendamentos() {
  const sheet = getScheduleSheet_();
  ensureHeaders_(sheet);
  SpreadsheetApp.getActive().toast('Planilha de agendamentos configurada.');
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Agendamentos')
    .addItem('Organizar planilha', 'configurarAgendamentos')
    .addToUi();
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
