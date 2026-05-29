// ── Playhaus Secure Score Cryptographic Hashing Module ──
// Helps prevent leaderboard score tampering via browser console injection.

const CLIENT_SALT = "playhaus_beta_arcade_secure_salt_2026_xYz987";

// Lightweight, pure JavaScript SHA-256 implementation
function sha256(ascii) {
  function rightRotate(value, amount) {
    return (value >>> amount) | (value << (32 - amount));
  }
  
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  const lengthProperty = 'length';
  let i, j; // Used as a temporary index
  let result = '';

  const words = [];
  const asciiLength = ascii[lengthProperty] * 8;
  
  let hash = sha256.h = sha256.h || [];
  let k = sha256.k = sha256.k || [];
  let primeCounter = k[lengthProperty];

  const isPrime = {};
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isPrime[candidate]) {
      for (i = 0; i < 313; i += candidate) {
        isPrime[i] = 1;
      }
      hash[primeCounter] = (mathPow(candidate, .5) * maxWord) | 0;
      k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
    }
  }
  
  ascii += '\x80';
  while (ascii[lengthProperty] % 64 - 56) ascii += '\x00';
  for (i = 0; i < ascii[lengthProperty]; i++) {
    j = ascii.charCodeAt(i);
    if (j >> 8) return; // Only accept ASCII chars
    words[i >> 2] |= j << ((3 - i % 4) * 8);
  }
  words[words[lengthProperty]] = ((asciiLength / maxWord) | 0);
  words[words[lengthProperty]] = (asciiLength);
  
  for (j = 0; j < words[lengthProperty]; j += 16) {
    const w = words.slice(j, j + 16);
    const oldHash = hash.slice(0);
    hash = hash.slice(0, 8);
    
    for (i = 0; i < 64; i++) {
      const w15 = w[i - 15], w2 = w[i - 2];
      
      const a = hash[0], e = hash[4];
      const temp1 = hash[7]
        + (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) // S1
        + ((e & hash[5]) ^ (~e & hash[6])) // ch
        + k[i]
        + (w[i] = (i < 16 ? w[i] : (
            w[i - 16]
            + (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) // s0
            + w[i - 7]
            + (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10)) // s1
          ) | 0
        ));
      const temp2 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) // S0
        + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2])); // maj
      
      hash = [(temp1 + temp2) | 0].concat(hash);
      hash[4] = (hash[4] + temp1) | 0;
    }
    
    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }
  
  for (i = 0; i < 8; i++) {
    for (j = 31; j >= 0; j -= 4) {
      result += ((hash[i] >>> j) & 0xf).toString(16);
    }
  }
  return result;
}

/**
 * Generates a verification signature for a game score.
 * @param {string} uid - User's Firebase UID.
 * @param {string} gameName - Exact name of the game.
 * @param {number} score - Achieved raw score.
 * @param {number} timestamp - Epoch timestamp in milliseconds.
 * @returns {string} - Verification signature.
 */
export function generateScoreSignature(uid, gameName, score, timestamp) {
  const rawPayload = `${uid}:${gameName}:${score}:${timestamp}:${CLIENT_SALT}`;
  return sha256(rawPayload);
}

/**
 * Verifies if a given signature matches the recalculated payload.
 * @param {string} uid - User's Firebase UID.
 * @param {string} gameName - Exact name of the game.
 * @param {number} score - Achieved raw score.
 * @param {number} timestamp - Score submission timestamp.
 * @param {string} signature - The signature to check.
 * @returns {boolean} - True if valid, false if tampered.
 */
export function verifyScoreSignature(uid, gameName, score, timestamp, signature) {
  if (!uid || !gameName || typeof score !== 'number' || !timestamp || !signature) {
    return false;
  }
  
  // Re-hash and compare
  const expectedSignature = generateScoreSignature(uid, gameName, score, timestamp);
  return expectedSignature === signature;
}
