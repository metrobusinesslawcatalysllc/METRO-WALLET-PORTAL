# Metro White-Label Bundle & Crypto Deposit Portal

## Included Files
- `metro_wallet_crypto_deposit_portal-v2.html` — Standalone crypto deposit & status lookup frontend wired to your `/exec` endpoint.
- `Code.gs` — Reference Google Apps Script backend wired to `https://script.google.com/macros/s/AKfycbyzM3tcP1dZKfqjQvBqKvn_d0faxXVzMmAo2VTGGv3gBdQDwdcAhN1F3FwbQk2Gj1dI0w/exec` and Google Sheets tabs (`APPROVED_WALLETS`, `CLIENT_WALLETS`, `CLIENT_TRANSACTIONS`, `BROKERS`).
- `config.json` — Configuration summary with your `/exec` Web App URL, sheet tabs, and NOWPayments IPN format (`Classic way`).

## How to Use
1. Extract this `.zip` archive into a folder on your computer.
2. Upload `metro_wallet_crypto_deposit_portal-v2.html` (and your extracted 6-page bundle files such as `index.html`, `super-master.html`, `broker-owner.html`, `admin-manager.html`, `sub-admin.html`, `client.html`) to your GitHub repository / Cloudflare Pages project.
3. Keep `NOWPAYMENTS_API_KEY` and `NOWPAYMENTS_IPN_SECRET` stored in Google Apps Script **Script Properties**, and keep NOWPayments **Webhook URL** set to `https://script.google.com/macros/s/AKfycbyzM3tcP1dZKfqjQvBqKvn_d0faxXVzMmAo2VTGGv3gBdQDwdcAhN1F3FwbQk2Gj1dI0w/exec` with **Classic way** selected.
