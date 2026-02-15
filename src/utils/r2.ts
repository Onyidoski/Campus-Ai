import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const R2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

export async function uploadToR2(file: File, folder: string) {
  const buffer = Buffer.from(await file.arrayBuffer())
  const fileName = `${folder}/${Date.now()}-${file.name.replace(/\s/g, '-')}`

  try {
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: fileName,
      Body: buffer,
      ContentType: file.type,
    })

    await R2.send(command)

    // Return the public URL so we can save it to the database
    return `${process.env.R2_PUBLIC_URL}/${fileName}`
  } catch (error) {
    console.error('R2 Upload Error:', error)
    throw new Error('Failed to upload file to storage')
  }
}