import { DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getRuntimeEnv } from "@/server/env";

function client(endpoint: string) {
  const env=getRuntimeEnv();
  return new S3Client({ endpoint, region:env.S3_REGION, forcePathStyle:env.S3_FORCE_PATH_STYLE, credentials:{accessKeyId:env.S3_ACCESS_KEY_ID,secretAccessKey:env.S3_SECRET_ACCESS_KEY} });
}

export function getPrivateStorageClient(){return client(getRuntimeEnv().S3_ENDPOINT);}

export async function createPresignedUpload(input:{key:string;mimeType:string;sizeBytes:number}){const env=getRuntimeEnv();return getSignedUrl(client(env.S3_PUBLIC_ENDPOINT??env.S3_ENDPOINT),new PutObjectCommand({Bucket:env.S3_BUCKET,Key:input.key,ContentType:input.mimeType,ContentLength:input.sizeBytes}),{expiresIn:15*60});}

export async function headPrivateObject(key:string){const env=getRuntimeEnv();return getPrivateStorageClient().send(new HeadObjectCommand({Bucket:env.S3_BUCKET,Key:key}));}

export async function createPresignedDownload(key:string){const env=getRuntimeEnv();return getSignedUrl(client(env.S3_PUBLIC_ENDPOINT??env.S3_ENDPOINT),new GetObjectCommand({Bucket:env.S3_BUCKET,Key:key}),{expiresIn:5*60});}

export async function deletePrivateObject(key:string){const env=getRuntimeEnv();await getPrivateStorageClient().send(new DeleteObjectCommand({Bucket:env.S3_BUCKET,Key:key}));}
