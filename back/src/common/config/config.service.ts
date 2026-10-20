const configServices = () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  limit:{

  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    refreshToken: process.env.JWT_REFRESH_TOKEN,
    accessToken: process.env.JWT_ACCESS_TOKEN,
    nameCookie: process.env.JWT_NAME_COOKIE || 'test'
  },
  allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(','),
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  },
  ftp: {
    host: process.env.FTP_HOST || '',
    user: process.env.FTP_USER || '',
    password: process.env.FTP_PASSWORD || '',
    port: parseInt(process.env.FTP_PORT || '21', 10),
    baseUrl: process.env.MEDIA_BASE_URL || '',
  },
  s3: {
    endpoint: process.env.S3_ENDPOINT,
    accessKey: process.env.S3_ACCESS_KEY,
    secretKey: process.env.S3_SECRET_KEY,
    bucket: process.env.S3_BUCKET_NAME,
    region: process.env.S3_REGION,
  },
});

export default configServices;
