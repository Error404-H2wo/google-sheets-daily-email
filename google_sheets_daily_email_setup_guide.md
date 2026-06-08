# Google Sheets Daily Email Automation Setup

## What this does

This automation sends a daily email using the latest data from a Google Sheet. It runs inside Google Apps Script, so you do not need Zapier or another third-party automation tool.

## Setup Steps

1. Open the Google Sheet.
2. Go to **Extensions > Apps Script**.
3. Delete any starter code in the editor.
4. Paste the contents of `google_sheets_daily_email_automation.gs`.
5. Update the `CONFIG` section at the top of the script.
6. Click **Save**.
7. Run `sendTestEmail` once to confirm the email looks right.
8. Approve the Google permissions prompt.
9. Run `installDailyTrigger` once to schedule the daily email.

## Configuration

Update these fields first:

```javascript
sheetName: 'Sheet1',
recipientEmails: ['recipient@example.com'],
emailSubject: 'Daily Spreadsheet Update',
dailySendHour: 8
```

## Choosing Which Data Gets Sent

The script supports three modes:

```javascript
dataMode: 'latestRows'
```

Sends the most recent rows from the sheet. Control the number of rows with:

```javascript
latestRowCount: 10
```

```javascript
dataMode: 'todayRows'
```

Sends rows where the date column matches today's date. Set the column header with:

```javascript
dateColumnHeader: 'Date'
```

```javascript
dataMode: 'allRows'
```

Sends every non-empty row in the sheet.

## Daily Timing

Apps Script does not run exactly on the minute. If you set:

```javascript
dailySendHour: 8
```

Google will send it sometime around 8 AM in the script's timezone.

To check or change timezone:

1. In Apps Script, click **Project Settings**.
2. Check the project timezone.
3. Update it if needed.

## Testing

Use `sendTestEmail` whenever you want to manually send a test email.

Use `installDailyTrigger` only once. If you run it again, the script removes the old daily trigger and creates a fresh one, so duplicate emails are avoided.

## Common Adjustments

To add CC recipients:

```javascript
ccEmails: ['manager@example.com']
```

To avoid sending an email when no rows match:

```javascript
skipEmailWhenNoRows: true
```

To change the email intro:

```javascript
introText: 'Here is today\'s sales update.'
```

## Notes

The sheet needs a header row in row 1. The email table uses that row as the column names.

If the spreadsheet has many columns or rows, use `latestRows` or `todayRows` instead of `allRows` so the email stays readable.
