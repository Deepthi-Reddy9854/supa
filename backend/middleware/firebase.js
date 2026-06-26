import jwt from 'jsonwebtoken';

let cachedKeys = null;
let keysExpiry = 0;

async function getFirebasePublicKeys() {
  if (cachedKeys && Date.now() < keysExpiry) {
    return cachedKeys;
  }
  const res = await fetch('https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com');
  const cacheControl = res.headers.get('cache-control');
  const maxAgeMatch = cacheControl ? cacheControl.match(/max-age=(\d+)/) : null;
  const maxAge = maxAgeMatch ? parseInt(maxAgeMatch[1]) * 1000 : 3600000;
  
  cachedKeys = await res.json();
  keysExpiry = Date.now() + maxAge;
  return cachedKeys;
}

export async function verifyFirebaseToken(idToken, projectId) {
  const decodedHeader = jwt.decode(idToken, { complete: true });
  if (!decodedHeader || !decodedHeader.header || !decodedHeader.header.kid) {
    throw new Error('Invalid token format.');
  }

  const kid = decodedHeader.header.kid;
  const keys = await getFirebasePublicKeys();
  const cert = keys[kid];
  if (!cert) {
    throw new Error('Public key not found or expired.');
  }

  const decoded = jwt.verify(idToken, cert, {
    algorithms: ['RS256'],
    audience: projectId,
    issuer: `https://securetoken.google.com/${projectId}`
  });

  return decoded;
}
