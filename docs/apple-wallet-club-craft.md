# Club Craft Apple Wallet setup

Club Craft uses Apple Wallet passes as signed `.pkpass` files generated on demand from the current Supabase member record.

The QR payload is always:

```text
clubcraft:{member_code}
```

Example:

```text
clubcraft:CC-A1B2C3D4
```

The QR never includes phone, email, birth date, database UUID, purchase data, or point value in money.

## Runtime behavior

- `/club/{member_code}` shows the customer-safe Club Craft card and QR.
- `/club/{member_code}/pass` generates a fresh signed pass from the current DB balance.
- If Wallet credentials are missing, the public page keeps working and shows a safe unavailable message.
- Admin, member QR, scanner, and points actions do not depend on Wallet credentials.

## Apple Developer setup

You need access to an Apple Developer Program team.

1. Open Apple Developer: <https://developer.apple.com/account/>
2. Go to **Certificates, Identifiers & Profiles**.
3. Open **Identifiers**.
4. Press **+**.
5. Choose **Pass Type IDs**.
6. Choose **Register a Pass Type ID**.
7. Use a clear description, for example:

   ```text
   Club Craft Wallet Pass
   ```

8. Create an identifier, for example:

   ```text
   pass.com.craftcervezas.clubcraft
   ```

9. Save the Pass Type ID. This exact value becomes:

   ```text
   APPLE_WALLET_PASS_TYPE_IDENTIFIER
   ```

## Create the Pass Type ID certificate

1. In Apple Developer, open the Pass Type ID you created.
2. Create a certificate for that Pass Type ID.
3. Apple will ask for a CSR file.
4. On your Mac, open **Keychain Access**.
5. In the menu, choose **Certificate Assistant → Request a Certificate From a Certificate Authority**.
6. Enter your email and a common name like:

   ```text
   Club Craft Wallet Pass
   ```

7. Select **Saved to disk** and save the `.certSigningRequest` file.
8. Upload that CSR to Apple.
9. Download the generated `.cer` certificate.
10. Double click the `.cer` file to install it in Keychain.
11. In Keychain, find the certificate and confirm it has a disclosure arrow with a private key underneath it.
12. Select the certificate and private key together.
13. Export them as a `.p12` file.
14. Save the `.p12` somewhere outside the repo.
15. Use a strong export password. This password is only for conversion and should not be committed.

## Team ID

In Apple Developer:

1. Open **Membership details**.
2. Copy **Team ID**.

This becomes:

```text
APPLE_WALLET_TEAM_IDENTIFIER
```

## WWDR certificate

Apple Wallet pass signing also needs Apple's Worldwide Developer Relations certificate.

Download the current Apple WWDR certificate from Apple's certificate authority page:

<https://www.apple.com/certificateauthority/>

For modern Apple Wallet pass signing, use the current Apple Worldwide Developer Relations Certification Authority certificate available there.

## Convert certificates

Create a temporary local folder outside the repo, for example:

```sh
mkdir -p ~/Desktop/club-craft-wallet-certs
```

Put your exported `.p12` and downloaded WWDR `.cer` there.

From that folder, run:

```sh
openssl pkcs12 -in club-craft-pass.p12 -clcerts -nokeys -out signerCert.pem
openssl pkcs12 -in club-craft-pass.p12 -nocerts -nodes -out signerKey.pem
openssl x509 -inform DER -in AppleWWDRCAG4.cer -out wwdr.pem
```

If Apple's downloaded WWDR file has a different filename, replace `AppleWWDRCAG4.cer` with the real filename.

Then encode each PEM for environment variables:

```sh
base64 -i signerCert.pem | tr -d '\n'
base64 -i signerKey.pem | tr -d '\n'
base64 -i wwdr.pem | tr -d '\n'
```

Copy each output into the matching env var below.

## Environment variables

Required locally and in Vercel:

```text
APPLE_WALLET_PASS_TYPE_IDENTIFIER=pass.com.craftcervezas.clubcraft
APPLE_WALLET_TEAM_IDENTIFIER=YOUR_APPLE_TEAM_ID
APPLE_WALLET_ORGANIZATION_NAME=Craft Cervezas
APPLE_WALLET_SIGNER_CERT_BASE64=base64_of_signerCert.pem
APPLE_WALLET_SIGNER_KEY_BASE64=base64_of_signerKey.pem
APPLE_WALLET_WWDR_CERT_BASE64=base64_of_wwdr.pem
```

Optional, only if your private key remains encrypted:

```text
APPLE_WALLET_SIGNER_KEY_PASSPHRASE=your_private_key_passphrase
```

Do not prefix these with `NEXT_PUBLIC_`.

## Add to Apple Wallet badge

Apple requires using the Apple-provided badge artwork, not a recreated version.

Before production launch, download the localized SVG badge from:

<https://developer.apple.com/wallet/add-to-apple-wallet-guidelines/>

Accept Apple's Wallet Marketing Artwork License Agreement and replace this file with the official SVG:

```text
public/brand/apple-wallet/add-to-apple-wallet.svg
```

Do not commit:

- `.p12`
- `.pem`
- `.cer`
- `.key`
- certificate passwords
- private keys

## Local test URL

Open this on an iPhone after env vars are configured and the dev server is reachable from the phone:

```text
http://YOUR_LOCAL_NETWORK_IP:3000/club/CC-XXXXXXXX
```

For production:

```text
https://craft-cervezas.vercel.app/club/CC-XXXXXXXX
```

Replace `CC-XXXXXXXX` with a real active member code.

Expected behavior:

1. The public member page loads.
2. It shows only first name, current points, member code, and QR.
3. The Apple Wallet badge appears.
4. Tapping the badge downloads a `.pkpass`.
5. iPhone opens Apple Wallet and offers to add the Club Craft pass.
6. The QR in Wallet scans to the same `clubcraft:{member_code}` payload used by the admin scanner.

## Future live Wallet updates

Automatic updates to already-installed passes require more infrastructure:

- Add an Apple Wallet web service URL to each pass.
- Add an authentication token per pass/member.
- Store Wallet device registrations and push tokens.
- Implement Apple's pass registration, unregister, latest-version, and serial list endpoints.
- Send Apple Push Notification Service updates when points change.
- Regenerate the pass from `club_members.points_balance` when Wallet asks for the latest version.

Milestone 3B intentionally does not implement this push/update infrastructure.
