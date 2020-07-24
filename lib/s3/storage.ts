import { S3, AWSError } from 'aws-sdk'
import { PromiseResult } from 'aws-sdk/lib/request'

import { logger } from '../logger'

interface S3Tools {
  saveJSON: (
    bucket: string,
    key: string,
    json: Record<string, unknown> | string
  ) => Promise<PromiseResult<S3.PutObjectOutput, AWSError>>

  loadJSON: (bucket: string, key: string) => Promise<Record<string, unknown>>
}

function init(s3Instance: S3): S3Tools {
  return {
    saveJSON: async function saveJSON(
      bucket: string,
      key: string,
      json: Record<string, unknown> | string
    ): Promise<PromiseResult<S3.PutObjectOutput, AWSError>> {
      const result = await s3Instance
        .putObject({
          Bucket: bucket,
          Key: key,
          Body: JSON.stringify(json),
          ACL: 'public-read',
          ContentType: 'application/json',
        })
        .promise()

      logger.debug(`Successfully uploaded data to ${bucket}/${key}`)

      return result
    },
    loadJSON: async function loadJSON(
      bucket: string,
      key: string
    ): Promise<Record<string, unknown>> {
      const awsResult = await s3Instance
        .getObject({
          Bucket: bucket,
          Key: key,
        })
        .promise()

      const json = awsResult.Body.toString('utf-8')
      return JSON.parse(json)
    },
  }
}

const s3Tools = { init }

export { s3Tools }
