import { DeleteObjectCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import dotenv from 'dotenv'

dotenv.config()

const DEFAULT_UPLOAD_CACHE_CONTROL = 'public, max-age=31536000, immutable'

const getAccountId = () => (process.env.R2_ACCOUNT_ID || '').trim()
const getAccessKeyId = () => (process.env.R2_ACCESS_KEY_ID || '').trim()
const getSecretAccessKey = () => (process.env.R2_SECRET_ACCESS_KEY || '').trim()
const getBucketName = () => (process.env.R2_BUCKET_NAME || '').trim()

const encodeKeyPath = (key) => key.split('/').map(segment => encodeURIComponent(segment)).join('/')

const normalizePublicBaseUrl = () => {
  const configuredValue = (process.env.R2_PUBLIC_DOMAIN || '').trim()
  if (!configuredValue) return null

  const withProtocol = /^https?:\/\//i.test(configuredValue)
    ? configuredValue
    : `https://${configuredValue}`
  const url = new URL(withProtocol)
  const pathname = url.pathname.replace(/\/$/, '')

  return `${url.origin}${pathname}`
}

export const getUploadCacheControl = () => DEFAULT_UPLOAD_CACHE_CONTROL

export const getMissingR2Fields = () => {
  const missing = []

  if (!getAccountId()) missing.push('R2_ACCOUNT_ID')
  if (!getAccessKeyId()) missing.push('R2_ACCESS_KEY_ID')
  if (!getSecretAccessKey()) missing.push('R2_SECRET_ACCESS_KEY')
  if (!getBucketName()) missing.push('R2_BUCKET_NAME')

  return missing
}

export const isR2Configured = () => getMissingR2Fields().length === 0

export const buildPublicUrl = (key) => {
  if (!key) return null

  const publicBaseUrl = normalizePublicBaseUrl()
  if (publicBaseUrl) {
    return `${publicBaseUrl}/${encodeKeyPath(key)}`
  }

  if (!isR2Configured()) {
    return null
  }

  return `https://${getBucketName()}.${getAccountId()}.r2.cloudflarestorage.com/${encodeKeyPath(key)}`
}

export const extractR2KeyFromUrl = (value) => {
  if (!value || typeof value !== 'string') return null

  if (value.startsWith('blog/')) {
    return value
  }

  try {
    const parsed = new URL(value)
    const decodedPath = decodeURIComponent(parsed.pathname)
    const publicBaseUrl = normalizePublicBaseUrl()

    if (publicBaseUrl) {
      const publicUrl = new URL(publicBaseUrl)
      const publicBasePath = publicUrl.pathname.replace(/\/$/, '')

      if (parsed.host === publicUrl.host) {
        const hasMatchingPrefix = !publicBasePath || decodedPath === publicBasePath || decodedPath.startsWith(`${publicBasePath}/`)
        if (!hasMatchingPrefix) {
          return null
        }

        const relativePath = publicBasePath
          ? decodedPath.slice(publicBasePath.length)
          : decodedPath
        const normalizedKey = relativePath.replace(/^\/+/, '')
        return normalizedKey || null
      }
    }

    const bucketHost = `${getBucketName()}.${getAccountId()}.r2.cloudflarestorage.com`
    if (parsed.host === bucketHost) {
      return decodedPath.replace(/^\/+/, '') || null
    }

    const accountHost = `${getAccountId()}.r2.cloudflarestorage.com`
    if (parsed.host === accountHost) {
      const prefix = `/${getBucketName()}/`
      if (decodedPath.startsWith(prefix)) {
        return decodedPath.slice(prefix.length) || null
      }
    }
  } catch (error) {
    return null
  }

  return null
}

let s3Client = null

const getS3Client = () => {
  if (!isR2Configured()) {
    throw new Error(`Cloudflare R2 is not fully configured: ${getMissingR2Fields().join(', ')}`)
  }

  if (!s3Client) {
    s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${getAccountId()}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: getAccessKeyId(),
        secretAccessKey: getSecretAccessKey()
      },
      forcePathStyle: true
    })
  }

  return s3Client
}

export const uploadToR2 = async (fileBuffer, fileName, contentType) => {
  const timestamp = Date.now()
  const key = `blog/${timestamp}-${fileName}`
  const encodedFileName = encodeURIComponent(fileName)
  const command = new PutObjectCommand({
    Bucket: getBucketName(),
    Key: key,
    Body: fileBuffer,
    ContentType: contentType,
    ContentDisposition: `inline; filename="${encodedFileName}"; filename*=UTF-8''${encodedFileName}`,
    CacheControl: DEFAULT_UPLOAD_CACHE_CONTROL
  })

  try {
    await getS3Client().send(command)

    return {
      key,
      url: buildPublicUrl(key),
      cache_control: DEFAULT_UPLOAD_CACHE_CONTROL
    }
  } catch (error) {
    console.error('R2 upload error:', error)
    throw error
  }
}

export const listR2Objects = async ({ prefix = 'blog/' } = {}) => {
  const objects = []
  let continuationToken = undefined

  do {
    const response = await getS3Client().send(new ListObjectsV2Command({
      Bucket: getBucketName(),
      Prefix: prefix,
      ContinuationToken: continuationToken
    }))

    ;(response.Contents || []).forEach(item => {
      objects.push({
        key: item.Key,
        size_bytes: item.Size || 0,
        last_modified: item.LastModified ? new Date(item.LastModified).toISOString() : null,
        etag: item.ETag || null,
        url: buildPublicUrl(item.Key)
      })
    })

    continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined
  } while (continuationToken)

  return objects
}

export const deleteR2Object = async (key) => {
  await getS3Client().send(new DeleteObjectCommand({
    Bucket: getBucketName(),
    Key: key
  }))

  return {
    key,
    url: buildPublicUrl(key)
  }
}

export default getS3Client
