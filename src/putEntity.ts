import type { IEntityDTO } from 'dynamodb-toolbox'

import type { AWSConfig, FetchOpts } from './types.js'

interface Entity extends Omit<IEntityDTO, 'name' | 'table'> {
  entityName: IEntityDTO['name']
  icon: string
  description?: string
}

export const putEntity = async (
  { awsAccountId, awsRegion, tableName, ...entity }: AWSConfig & { tableName: string } & Entity,
  { apiUrl, fetch: _fetch = fetch, apiKey }: FetchOpts
): Promise<void> => {
  const response = await _fetch(
    [apiUrl, 'table', awsAccountId, awsRegion, tableName, 'entity'].join('/'),
    {
      method: 'PUT',
      headers: { Authorization: apiKey },
      body: JSON.stringify(entity),
      signal: AbortSignal.timeout(30_000)
    }
  )

  if (!response.ok) {
    const { message, Message } = (await response.json()) as
      | { message: string; Message?: undefined }
      | { message?: undefined; Message: string }
    throw new Error(message ?? Message)
  }
}
