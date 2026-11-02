# Server setup (Baku / any country)

`install.sh` turns a fresh **Ubuntu 22.04 or 24.04** VPS into a private HTTPS proxy:

- Squid (OpenSSL build) listening with TLS on port 443 — the link from your browser to the server is encrypted
- Free Let's Encrypt certificate (uses `<ip>.sslip.io` if you have no domain), auto-renewed
- Random 24-character password, Basic auth required for every request
- No access log, no cache, `X-Forwarded-For`/`Via` stripped, private networks blocked
- UFW firewall: SSH, 80 (certificate renewal), 443
- Self-test at the end, then prints the `aenv-shield:…` connection code

## 1. Rent a VPS in Baku

You need a provider whose IP addresses are registered in Azerbaijan. Requirements: Ubuntu 22.04/24.04,
1 vCPU / 1 GB RAM is plenty, public IPv4, ports 80 and 443 open.
Search for "VPS Baku" — local data-center providers (e.g. in the Delta Telecom DC) and some international
hosts with a Baku location offer this. Before paying, ask the provider to confirm that the IP geolocates
to Azerbaijan.

## 2. Run the script

```bash
ssh root@YOUR_SERVER_IP
curl -fsSL https://raw.githubusercontent.com/aliyev-vusal/aenv-shield/main/server/install.sh -o install.sh
sudo bash install.sh --country AZ --name "Baku"
```

Options: `--domain vpn.example.az` (own domain instead of sslip.io), `--port 8443`,
`--email you@example.com` (Let's Encrypt notices), `--user name`.

## 3. Import the code

Extension → Settings → **Import connection code** → paste → Import → power button.
The code is also stored in `/root/aenv-shield-token.txt`. It contains the password — keep it private.

## Maintenance

| Task | Command |
|---|---|
| New password | `htpasswd -bm /etc/squid/aenv/passwd aenv NEWPASS && systemctl reload squid` (then edit the server in the extension) |
| Status | `systemctl status squid` |
| Certificate renewal test | `certbot renew --dry-run` |
| Uninstall | `apt purge squid-openssl && rm -rf /etc/squid/aenv` |

## Troubleshooting

- **Self-test warning**: the provider has its own firewall/security group — open TCP 443 and 80 there too.
- **Certificate failed**: port 80 must be reachable from the internet during setup.
- **Popup shows "Server unreachable"**: check `systemctl status squid` and that the host/port in the extension match.
