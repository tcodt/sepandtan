import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

const hashRefreshToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

const comparePassword = async (providedPassword: string, storedHashedPassword: string): Promise<boolean> => {
  return await bcrypt.compare(providedPassword, storedHashedPassword);
};

const compareHashRefreshToken = (providedToken: string, storedTokenHash: string): boolean => {
  const providedTokenHash = hashRefreshToken(providedToken);
  return providedTokenHash === storedTokenHash;
};

export {
  hashRefreshToken,
  hashPassword,
  comparePassword,
  compareHashRefreshToken
};