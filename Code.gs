const APPS_SCRIPT_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbyzM3tcP1dZKfqjQvBqKvn_d0faxXVzMmAo2VTGGv3gBdQDwdcAhN1F3FwbQk2Gj1dI0w/exec";
const SHEET_TABS = ["APPROVED_WALLETS", "CLIENT_WALLETS", "CLIENT_TRANSACTIONS", "BROKERS"];

function getProp(key) {
  return PropertiesService.getScriptProperties().getProperty(key) || "";
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  const params = (e && e.parameter) || {};
  const action = String(params.action || "ping").toLowerCase();
  const query = String(params.query || "").trim();

  if (action === "ping" || action === "health") {
    return jsonResponse({
      ok: true,
      service: "Metro Wallet & Multi-Brokerage Backend",
      webAppUrl: APPS_SCRIPT_WEB_APP_URL,
      sheets: SHEET_TABS,
      hasApiKey: Boolean(getProp("NOWPAYMENTS_API_KEY")),
      hasIpnSecret: Boolean(getProp("NOWPAYMENTS_IPN_SECRET"))
    });
  }

  if (action === "status") {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const matches = [];
    if (ss && query) {
      SHEET_TABS.forEach((tabName) => {
        const sheet = ss.getSheetByName(tabName);
        if (!sheet) return;
        const data = sheet.getDataRange().getValues();
        for (let r = 1; r < data.length; r++) {
          const rowText = data[r].join(" | ").toLowerCase();
          if (rowText.indexOf(query.toLowerCase()) !== -1) {
            matches.push({ tab: tabName, row: r + 1, values: data[r] });
          }
        }
      });
    }
    return jsonResponse({
      ok: true,
      query: query,
      matchesCount: matches.length,
      matches: matches
    });
  }

  return jsonResponse({ ok: false, error: "Unsupported action: " + action });
}

function doPost(e) {
  const rawBody = (e && e.postData && e.postData.contents) ? e.postData.contents : "{}";
  let body = {};
  try {
    body = JSON.parse(rawBody);
  } catch (err) {
    return jsonResponse({ ok: false, error: "Invalid JSON body" });
  }

  const action = String(body.action || "").toLowerCase();

  if (action === "create_invoice") {
    const apiKey = getProp("NOWPAYMENTS_API_KEY");
    if (!apiKey) {
      return jsonResponse({ ok: false, error: "Missing NOWPAYMENTS_API_KEY in Script Properties" });
    }

    const payload = {
      price_amount: Number(body.price_amount || 0),
      price_currency: String(body.price_currency || "usd").toLowerCase(),
      pay_currency: String(body.pay_currency || "usdttrc20").toLowerCase(),
      order_id: String(body.order_id || ("METRO_" + Date.now())),
      order_description: "Broker: " + String(body.broker || "Metro Options") + " | Client: " + String(body.client_email || ""),
      ipn_callback_url: APPS_SCRIPT_WEB_APP_URL
    };

    const res = UrlFetchApp.fetch("https://api.nowpayments.io/v1/invoice", {
      method: "post",
      contentType: "application/json",
      headers: { "x-api-key": apiKey },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });

    const parsed = JSON.parse(res.getContentText() || "{}");
    logTransaction_(body, parsed);
    return jsonResponse(parsed);
  }

  // Default: log incoming IPN / webhook callback
  logIpn_(body, rawBody);
  return jsonResponse({ ok: true, received: true });
}

function logTransaction_(reqBody, apiRes) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) return;
  const sheet = ss.getSheetByName("CLIENT_TRANSACTIONS") || ss.insertSheet("CLIENT_TRANSACTIONS");
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["Timestamp", "Client", "Broker", "USD_Amount", "Pay_Currency", "Invoice_ID", "Invoice_URL", "Raw_Status"]);
  }
  sheet.appendRow([
    new Date().toISOString(),
    reqBody.client_email || "",
    reqBody.broker || "",
    reqBody.price_amount || "",
    reqBody.pay_currency || "",
    apiRes.id || "",
    apiRes.invoice_url || "",
    apiRes.status || "created"
  ]);
}

function logIpn_(parsedBody, rawText) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) return;
  const sheet = ss.getSheetByName("CLIENT_TRANSACTIONS") || ss.insertSheet("CLIENT_TRANSACTIONS");
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["Timestamp", "Event", "Payment_ID", "Order_ID", "Status", "Pay_Amount", "Pay_Currency", "Raw_Payload"]);
  }
  sheet.appendRow([
    new Date().toISOString(),
    "IPN_CALLBACK",
    parsedBody.payment_id || "",
    parsedBody.order_id || "",
    parsedBody.payment_status || parsedBody.status || "",
    parsedBody.pay_amount || "",
    parsedBody.pay_currency || "",
    rawText.slice(0, 1000)
  ]);
}
