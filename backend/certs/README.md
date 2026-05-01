# Custom CA Certificates

Drop any PEM-encoded `.crt` files here that you want trusted inside the
backend Docker image. Useful when building behind a corporate TLS-intercept
proxy (ZScaler, Netskope, BlueCoat, …).

The `Dockerfile` builder stage copies every `*.crt` in this directory into
`/usr/local/share/ca-certificates/` and runs `update-ca-certificates`.

`*.crt` files are git-ignored — each developer provides their own.

## Quick recipe (macOS + ZScaler)

```bash
security find-certificate -a -c ZScaler -p /Library/Keychains/System.keychain \
  > backend/certs/zscaler-ca.crt
```

Then rebuild: `npm run docker:dev`.
