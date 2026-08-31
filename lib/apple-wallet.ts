import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createClubCraftQrPayload } from '@/lib/club-craft-qr'
import type { ClubMemberPublicRow } from '@/lib/db-types'

export type AppleWalletConfigStatus = {
  configured: boolean
  missingKeys: string[]
}

const REQUIRED_WALLET_ENV = [
  'APPLE_WALLET_PASS_TYPE_IDENTIFIER',
  'APPLE_WALLET_TEAM_IDENTIFIER',
  'APPLE_WALLET_ORGANIZATION_NAME',
] as const

const CERTIFICATE_ENV_GROUPS = [
  {
    label: 'APPLE_WALLET_SIGNER_CERT_BASE64',
    keys: ['APPLE_WALLET_SIGNER_CERT_BASE64', 'APPLE_WALLET_SIGNING_CERTIFICATE_BASE64', 'APPLE_WALLET_SIGNING_CERTIFICATE'],
  },
  {
    label: 'APPLE_WALLET_SIGNER_KEY_BASE64',
    keys: ['APPLE_WALLET_SIGNER_KEY_BASE64', 'APPLE_WALLET_PRIVATE_KEY_BASE64', 'APPLE_WALLET_PRIVATE_KEY'],
  },
  {
    label: 'APPLE_WALLET_WWDR_CERT_BASE64',
    keys: ['APPLE_WALLET_WWDR_CERT_BASE64', 'APPLE_WALLET_WWDR_CERTIFICATE_BASE64', 'APPLE_WALLET_WWDR_CERTIFICATE'],
  },
] as const

const WALLET_ASSET_DIR = join(process.cwd(), 'public', 'brand', 'club-craft-wallet')

function getFirstEnvValue(keys: readonly string[]) {
  for (const key of keys) {
    const value = process.env[key]
    if (value && value.trim()) return value.trim()
  }
  return null
}

function readCertificateEnv(keys: readonly string[]) {
  const value = getFirstEnvValue(keys)
  if (!value) return null

  const normalized = value.replace(/\\n/g, '\n')
  if (normalized.includes('-----BEGIN')) {
    return Buffer.from(normalized, 'utf8')
  }

  return Buffer.from(normalized, 'base64')
}

function readWalletAsset(filename: string) {
  return readFileSync(join(WALLET_ASSET_DIR, filename))
}

export function getAppleWalletConfigStatus(): AppleWalletConfigStatus {
  const missingKeys = [
    ...REQUIRED_WALLET_ENV.filter((key) => !process.env[key]?.trim()),
    ...CERTIFICATE_ENV_GROUPS.filter((group) => !getFirstEnvValue(group.keys)).map((group) => group.label),
  ]

  return {
    configured: missingKeys.length === 0,
    missingKeys,
  }
}

export function getPublicWalletStatusMessage() {
  return 'Apple Wallet todavía no está configurado. Tu QR de Club Craft ya está listo; vuelve pronto para agregarlo a Wallet.'
}

function getWalletCertificates() {
  const signerCert = readCertificateEnv(CERTIFICATE_ENV_GROUPS[0].keys)
  const signerKey = readCertificateEnv(CERTIFICATE_ENV_GROUPS[1].keys)
  const wwdr = readCertificateEnv(CERTIFICATE_ENV_GROUPS[2].keys)

  if (!signerCert || !signerKey || !wwdr) {
    throw new Error('Apple Wallet certificates are not configured.')
  }

  return {
    signerCert,
    signerKey,
    signerKeyPassphrase: process.env.APPLE_WALLET_SIGNER_KEY_PASSPHRASE || undefined,
    wwdr,
  }
}

function createPassJson(member: ClubMemberPublicRow) {
  const qrPayload = createClubCraftQrPayload(member.member_code)

  return {
    formatVersion: 1,
    passTypeIdentifier: process.env.APPLE_WALLET_PASS_TYPE_IDENTIFIER,
    teamIdentifier: process.env.APPLE_WALLET_TEAM_IDENTIFIER,
    organizationName: process.env.APPLE_WALLET_ORGANIZATION_NAME,
    description: 'Club Craft loyalty card',
    serialNumber: `club-craft-${member.member_code}`,
    logoText: 'CLUB CRAFT',
    backgroundColor: 'rgb(0, 0, 0)',
    foregroundColor: 'rgb(245, 240, 232)',
    labelColor: 'rgb(160, 160, 160)',
    sharingProhibited: false,
    storeCard: {
      primaryFields: [
        {
          key: 'points',
          label: 'PUNTOS DISPONIBLES',
          value: `${member.points_balance} puntos`,
        },
      ],
      secondaryFields: [
        {
          key: 'memberCode',
          label: 'MIEMBRO',
          value: member.member_code,
        },
      ],
      auxiliaryFields: [
        {
          key: 'firstName',
          label: 'NOMBRE',
          value: member.first_name,
        },
      ],
      backFields: [
        {
          key: 'program',
          label: 'CLUB CRAFT',
          value: 'Presenta este QR en Craft para acumular o canjear puntos.',
        },
        {
          key: 'memberCodeBack',
          label: 'CÓDIGO DE MIEMBRO',
          value: member.member_code,
        },
      ],
    },
    barcodes: [
      {
        format: 'PKBarcodeFormatQR',
        message: qrPayload,
        messageEncoding: 'iso-8859-1',
        altText: member.member_code,
      },
    ],
  }
}

export async function generateClubCraftPass(member: ClubMemberPublicRow): Promise<Buffer> {
  const status = getAppleWalletConfigStatus()
  if (!status.configured) {
    throw new Error('Apple Wallet is not configured.')
  }

  const { PKPass } = await import('passkit-generator')
  const pass = new PKPass(
    {
      'pass.json': Buffer.from(JSON.stringify(createPassJson(member))),
      'icon.png': readWalletAsset('icon.png'),
      'icon@2x.png': readWalletAsset('icon@2x.png'),
      'icon@3x.png': readWalletAsset('icon@3x.png'),
      'logo.png': readWalletAsset('logo.png'),
      'logo@2x.png': readWalletAsset('logo@2x.png'),
      'logo@3x.png': readWalletAsset('logo@3x.png'),
    },
    getWalletCertificates(),
  )

  return pass.getAsBuffer()
}

export function buildClubCraftPassPreview(member: ClubMemberPublicRow) {
  return {
    logoText: 'CLUB CRAFT',
    firstName: member.first_name,
    points: `${member.points_balance} puntos`,
    memberCode: member.member_code,
    barcodeMessage: createClubCraftQrPayload(member.member_code),
  }
}
