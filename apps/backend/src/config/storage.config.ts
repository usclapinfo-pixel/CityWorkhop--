export const storageConfig = {
  type: process.env.STORAGE_TYPE || 'local', // 'local' | 's3' | 'minio'
  supabase: {
    url: process.env.SUPABASE_URL || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    kycBucket: process.env.SUPABASE_KYC_BUCKET || 'kyc-documents',
    signedUrlExpirySeconds: 300,
  },
  aws: {
    region: process.env.AWS_REGION || 'ap-south-1',
    bucket: process.env.AWS_S3_BUCKET || 'cityworkhop-local',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    folderPrefix: process.env.AWS_S3_FOLDER_PREFIX || 'development/',
  },
  minio: {
    endPoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: parseInt(process.env.MINIO_PORT || '9000'),
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY || '',
    secretKey: process.env.MINIO_SECRET_KEY || '',
    bucket: process.env.MINIO_BUCKET || 'cityworkhop',
  },
  local: {
    uploadDir: process.env.LOCAL_UPLOAD_DIR || './uploads',
  },
  // File size limits (in bytes)
  fileSizeLimits: {
    kyc: 10 * 1024 * 1024, // 10MB
    productImage: 5 * 1024 * 1024, // 5MB
    applianceImage: 5 * 1024 * 1024, // 5MB
    video: 100 * 1024 * 1024, // 100MB
  },
};
