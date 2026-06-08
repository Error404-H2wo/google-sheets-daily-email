/**
 * Compact Google Sheets daily email automation.
 * Paste all of this into Apps Script Code.gs.
 */

const CONFIG = {
  sheetName: 'Daily Update Data',
  recipientEmails: ['your-email@example.com'],
  ccEmails: [],
  emailSubject: 'Daily Spreadsheet Update',
  senderName: 'Daily Sheet Update',
  dataMode: 'latestRows',
  latestRowCount: 10,
  dateColumnHeader: 'Date',
  dailySendHour: 8,
  skipEmailWhenNoRows: false,
  introText: 'Here is the latest update from the spreadsheet.'
};

function testDailyEmail() {
  sendDailySpreadsheetEmail();
}

function sendTestEmail() {
  testDailyEmail();
}

function sendDailySpreadsheetEmail() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName(CONFIG.sheetName);

  if (!sheet) {
    throw new Error('Sheet tab not found: ' + CONFIG.sheetName);
  }

  const values = sheet.getDataRange().getDisplayValues();
  const headers = values.length ? values[0] : [];
  const allRows = values.slice(1).filter(function(row) {
    return row.some(function(cell) {
      return cell !== '';
    });
  });

  const rows = getRowsToSend(headers, allRows);

  if (CONFIG.skipEmailWhenNoRows && rows.length === 0) {
    return;
  }

  sendEmail(spreadsheet.getUrl(), headers, rows);
}

function getRowsToSend(headers, rows) {
  if (CONFIG.dataMode === 'allRows') {
    return rows;
  }

  if (CONFIG.dataMode === 'todayRows') {
    const dateColumnIndex = headers.indexOf(CONFIG.dateColumnHeader);

    if (dateColumnIndex === -1) {
      throw new Error('Date column header not found: ' + CONFIG.dateColumnHeader);
    }

    const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');

    return rows.filter(function(row) {
      return normalizeDate(row[dateColumnIndex]) === today;
    });
  }

  return rows.slice(-CONFIG.latestRowCount);
}

function sendEmail(spreadsheetUrl, headers, rows) {
  const htmlBody = makeHtmlBody(spreadsheetUrl, headers, rows);
  const plainBody = makePlainBody(spreadsheetUrl, headers, rows);

  GmailApp.sendEmail(CONFIG.recipientEmails.join(','), CONFIG.emailSubject, plainBody, {
    cc: CONFIG.ccEmails.join(','),
    htmlBody: htmlBody,
    name: CONFIG.senderName
  });
}

function makeHtmlBody(spreadsheetUrl, headers, rows) {
  let html = '<div style="font-family:Arial,sans-serif;color:#202124;">';
  html += '<p>' + escapeHtml(CONFIG.introText) + '</p>';
  html += '<p><strong>' + rows.length + ' row(s)</strong> included in this update.</p>';

  if (rows.length === 0) {
    html += '<p>No matching rows were found.</p>';
  } else {
    html += '<table style="border-collapse:collapse;width:100%;max-width:960px;">';
    html += '<tr>';
    headers.forEach(function(header) {
      html += '<th style="border:1px solid #dadce0;background:#f8f9fa;padding:8px;text-align:left;">' + escapeHtml(header) + '</th>';
    });
    html += '</tr>';

    rows.forEach(function(row) {
      html += '<tr>';
      headers.forEach(function(_, index) {
        html += '<td style="border:1px solid #dadce0;padding:8px;">' + escapeHtml(row[index] || '') + '</td>';
      });
      html += '</tr>';
    });

    html += '</table>';
  }

  html += '<p style="margin-top:18px;"><a href="' + spreadsheetUrl + '">Open the spreadsheet</a></p>';
  html += '</div>';
  return html;
}

function makePlainBody(spreadsheetUrl, headers, rows) {
  if (rows.length === 0) {
    return CONFIG.introText + '\n\nNo matching rows were found.\n\n' + spreadsheetUrl;
  }

  const lines = rows.map(function(row) {
    return headers.map(function(header, index) {
      return header + ': ' + (row[index] || '');
    }).join(' | ');
  });

  return CONFIG.introText + '\n\n' + lines.join('\n') + '\n\n' + spreadsheetUrl;
}

function installDailyTrigger() {
  removeDailyTriggers();
  ScriptApp.newTrigger('sendDailySpreadsheetEmail')
    .timeBased()
    .everyDays(1)
    .atHour(CONFIG.dailySendHour)
    .create();
}

function removeDailyTriggers() {
  ScriptApp.getProjectTriggers().forEach(function(trigger) {
    if (trigger.getHandlerFunction() === 'sendDailySpreadsheetEmail') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
}

function normalizeDate(value) {
  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return String(value).trim();
  }

  return Utilities.formatDate(parsedDate, Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
