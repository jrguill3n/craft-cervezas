export const CLUB_CRAFT_QR_PREFIX = 'clubcraft:'
export const CLUB_MEMBER_CODE_PATTERN = /^CC-[A-F0-9]{8}$/
export const CLUB_CRAFT_QR_PATTERN = /^clubcraft:(CC-[A-F0-9]{8})$/i

export function normalizeClubMemberCode(value: string) {
  return value.trim().toUpperCase()
}

export function createClubCraftQrPayload(memberCode: string) {
  const normalized = normalizeClubMemberCode(memberCode)
  if (!CLUB_MEMBER_CODE_PATTERN.test(normalized)) {
    throw new Error('Código de miembro inválido.')
  }
  return `${CLUB_CRAFT_QR_PREFIX}${normalized}`
}

export function parseClubCraftQrPayload(payload: string) {
  const normalized = payload.trim()
  const payloadMatch = normalized.match(CLUB_CRAFT_QR_PATTERN)
  if (payloadMatch?.[1]) return payloadMatch[1].toUpperCase()

  const code = normalizeClubMemberCode(normalized)
  if (CLUB_MEMBER_CODE_PATTERN.test(code)) return code
  return null
}

const QR_VERSION = 2
const QR_SIZE = 25
const DATA_CODEWORDS = 34
const ECC_CODEWORDS = 10
const FORMAT_MASK = 0x5412

function gfMultiply(a: number, b: number) {
  let result = 0
  for (let i = 0; i < 8; i += 1) {
    if ((b & 1) !== 0) result ^= a
    const carry = (a & 0x80) !== 0
    a = (a << 1) & 0xff
    if (carry) a ^= 0x1d
    b >>>= 1
  }
  return result
}

function gfPow(a: number, power: number) {
  let result = 1
  for (let i = 0; i < power; i += 1) result = gfMultiply(result, a)
  return result
}

function reedSolomonGenerator(degree: number) {
  let coefficients = [1]
  for (let i = 0; i < degree; i += 1) {
    const next = new Array(coefficients.length + 1).fill(0)
    const root = gfPow(2, i)
    coefficients.forEach((coefficient, index) => {
      next[index] ^= gfMultiply(coefficient, root)
      next[index + 1] ^= coefficient
    })
    coefficients = next
  }
  return coefficients
}

function reedSolomonRemainder(data: number[], degree: number) {
  const generator = reedSolomonGenerator(degree)
  const result = [...data, ...new Array(degree).fill(0)]

  for (let i = 0; i < data.length; i += 1) {
    const factor = result[i]
    if (factor === 0) continue
    for (let j = 0; j < generator.length; j += 1) {
      result[i + j] ^= gfMultiply(generator[j], factor)
    }
  }

  return result.slice(result.length - degree)
}

function appendBits(bits: number[], value: number, length: number) {
  for (let i = length - 1; i >= 0; i -= 1) {
    bits.push((value >>> i) & 1)
  }
}

function payloadToCodewords(payload: string) {
  const bytes = Array.from(new TextEncoder().encode(payload))
  if (bytes.length > 32) throw new Error('El payload QR es demasiado largo.')

  const bits: number[] = []
  appendBits(bits, 0b0100, 4)
  appendBits(bits, bytes.length, 8)
  bytes.forEach((byte) => appendBits(bits, byte, 8))
  appendBits(bits, 0, Math.min(4, DATA_CODEWORDS * 8 - bits.length))
  while (bits.length % 8 !== 0) bits.push(0)

  const codewords: number[] = []
  for (let i = 0; i < bits.length; i += 8) {
    codewords.push(bits.slice(i, i + 8).reduce((value, bit) => (value << 1) | bit, 0))
  }

  const pads = [0xec, 0x11]
  for (let i = 0; codewords.length < DATA_CODEWORDS; i += 1) {
    codewords.push(pads[i % 2])
  }

  return codewords
}

function createMatrix() {
  return {
    modules: Array.from({ length: QR_SIZE }, () => new Array<boolean>(QR_SIZE).fill(false)),
    reserved: Array.from({ length: QR_SIZE }, () => new Array<boolean>(QR_SIZE).fill(false)),
  }
}

function setModule(matrix: ReturnType<typeof createMatrix>, row: number, col: number, value: boolean, reserve = true) {
  if (row < 0 || col < 0 || row >= QR_SIZE || col >= QR_SIZE) return
  matrix.modules[row][col] = value
  if (reserve) matrix.reserved[row][col] = true
}

function addFinder(matrix: ReturnType<typeof createMatrix>, top: number, left: number) {
  for (let row = -1; row <= 7; row += 1) {
    for (let col = -1; col <= 7; col += 1) {
      const r = top + row
      const c = left + col
      if (r < 0 || c < 0 || r >= QR_SIZE || c >= QR_SIZE) continue
      const dark = row >= 0 && row <= 6 && col >= 0 && col <= 6
        && (row === 0 || row === 6 || col === 0 || col === 6 || (row >= 2 && row <= 4 && col >= 2 && col <= 4))
      setModule(matrix, r, c, dark)
    }
  }
}

function addAlignment(matrix: ReturnType<typeof createMatrix>, centerRow: number, centerCol: number) {
  for (let row = -2; row <= 2; row += 1) {
    for (let col = -2; col <= 2; col += 1) {
      const dark = Math.max(Math.abs(row), Math.abs(col)) !== 1
      setModule(matrix, centerRow + row, centerCol + col, dark)
    }
  }
}

function addFunctionPatterns(matrix: ReturnType<typeof createMatrix>) {
  addFinder(matrix, 0, 0)
  addFinder(matrix, 0, QR_SIZE - 7)
  addFinder(matrix, QR_SIZE - 7, 0)
  addAlignment(matrix, 18, 18)

  for (let i = 8; i < QR_SIZE - 8; i += 1) {
    setModule(matrix, 6, i, i % 2 === 0)
    setModule(matrix, i, 6, i % 2 === 0)
  }

  setModule(matrix, QR_SIZE - 8, 8, true)

  for (let i = 0; i < 9; i += 1) {
    if (i !== 6) {
      matrix.reserved[8][i] = true
      matrix.reserved[i][8] = true
    }
  }
  for (let i = 0; i < 8; i += 1) {
    matrix.reserved[8][QR_SIZE - 1 - i] = true
    matrix.reserved[QR_SIZE - 1 - i][8] = true
  }
}

function maskBit(row: number, col: number) {
  return (row + col) % 2 === 0
}

function addData(matrix: ReturnType<typeof createMatrix>, codewords: number[]) {
  const bits: number[] = []
  codewords.forEach((codeword) => appendBits(bits, codeword, 8))

  let bitIndex = 0
  let upward = true

  for (let col = QR_SIZE - 1; col > 0; col -= 2) {
    if (col === 6) col -= 1
    for (let step = 0; step < QR_SIZE; step += 1) {
      const row = upward ? QR_SIZE - 1 - step : step
      for (let offset = 0; offset < 2; offset += 1) {
        const c = col - offset
        if (matrix.reserved[row][c]) continue
        const bit = bits[bitIndex] === 1
        setModule(matrix, row, c, bit !== maskBit(row, c), false)
        bitIndex += 1
      }
    }
    upward = !upward
  }
}

function bchFormatBits(formatData: number) {
  let value = formatData << 10
  const generator = 0b10100110111
  for (let i = 14; i >= 10; i -= 1) {
    if (((value >>> i) & 1) !== 0) value ^= generator << (i - 10)
  }
  return ((formatData << 10) | value) ^ FORMAT_MASK
}

function addFormatInfo(matrix: ReturnType<typeof createMatrix>) {
  const bits = bchFormatBits(0b01000)
  const positionsA = [
    [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 7], [8, 8],
    [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8],
  ]
  const positionsB = [
    [QR_SIZE - 1, 8], [QR_SIZE - 2, 8], [QR_SIZE - 3, 8], [QR_SIZE - 4, 8],
    [QR_SIZE - 5, 8], [QR_SIZE - 6, 8], [QR_SIZE - 7, 8], [8, QR_SIZE - 8],
    [8, QR_SIZE - 7], [8, QR_SIZE - 6], [8, QR_SIZE - 5], [8, QR_SIZE - 4],
    [8, QR_SIZE - 3], [8, QR_SIZE - 2], [8, QR_SIZE - 1],
  ]

  for (let i = 0; i < 15; i += 1) {
    const bit = ((bits >>> i) & 1) !== 0
    setModule(matrix, positionsA[i][0], positionsA[i][1], bit)
    setModule(matrix, positionsB[i][0], positionsB[i][1], bit)
  }
}

export function createClubCraftQrSvg(memberCode: string, options: { size?: number; dark?: string; light?: string } = {}) {
  const payload = createClubCraftQrPayload(memberCode)
  const data = payloadToCodewords(payload)
  const ecc = reedSolomonRemainder(data, ECC_CODEWORDS)
  const matrix = createMatrix()
  addFunctionPatterns(matrix)
  addData(matrix, [...data, ...ecc])
  addFormatInfo(matrix)

  const quietZone = 4
  const moduleCount = QR_SIZE + quietZone * 2
  const size = options.size ?? 240
  const dark = options.dark ?? '#000'
  const light = options.light ?? '#fff'
  const rects: string[] = []

  matrix.modules.forEach((row, rowIndex) => {
    row.forEach((darkModule, colIndex) => {
      if (!darkModule) return
      rects.push(`<rect x="${colIndex + quietZone}" y="${rowIndex + quietZone}" width="1" height="1"/>`)
    })
  })

  return {
    payload,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${moduleCount} ${moduleCount}" role="img" aria-label="Club Craft QR ${memberCode}"><rect width="100%" height="100%" fill="${light}"/><g fill="${dark}">${rects.join('')}</g></svg>`,
  }
}
