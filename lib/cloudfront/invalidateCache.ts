import { CloudFront, AWSError } from 'aws-sdk';
import { PromiseResult } from 'aws-sdk/lib/request'

import { logger } from '../logger'

interface CloudFrontTools {
  invalidateCache: (
    distributionId: string,
    quantity: number,
    paths: string[]
  ) => Promise<PromiseResult<CloudFront.CreateInvalidationResult, AWSError>>
}

function init(cloudfrontInstance: CloudFront): CloudFrontTools {
  return {
    invalidateCache: async function invalidateCache(
      distributionId: string,
      quantity: number,
      paths: string[]
    ): Promise<PromiseResult<CloudFront.CreateInvalidationResult, AWSError>> {
      console.log('starting.....')
      const currentTimestamp = new Date().getTime()
      const result = await cloudfrontInstance.createInvalidation({
        DistributionId: distributionId,
        InvalidationBatch: {
          CallerReference: currentTimestamp.toString(),
          Paths: {
            Quantity: quantity,
            Items: paths
          }
        }
      })
        .promise()
      console.log(`result________________`)
      console.log(JSON.stringify(result))
      console.log(`result.Invalidation________________`)
      console.log(JSON.stringify(result.Invalidation))
      logger.debug(`Successfully cleared cache for cloudfront distribution: ${distributionId} (paths: ${JSON.stringify(paths)})`)

      return result
    }
  }
}

const cloudfrontTools = { init }

export { cloudfrontTools }
