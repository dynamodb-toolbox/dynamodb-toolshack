import type { ITableDTO } from 'dynamodb-toolbox'

import type { AWSConfig, FetchOpts } from './types.js'

interface Table extends AWSConfig, Omit<ITableDTO, 'name'> {
  awsAccountId: string
  awsRegion: string
  tableName: ITableDTO['name']
  icon: string
  title?: string
  description?: string
}

export const putTable = async (
  table: Table,
  { apiUrl, fetch: _fetch = fetch, apiKey }: FetchOpts
): Promise<void> => {
  const response = await _fetch([apiUrl, 'table'].join('/'), {
    method: 'PUT',
    headers: { Authorization: apiKey },
    body: JSON.stringify(table),
    signal: AbortSignal.timeout(30_000)
  })

  if (!response.ok) {
    const { message, Message } = (await response.json()) as
      | { message: string; Message?: undefined }
      | { message?: undefined; Message: string }
    throw new Error(message ?? Message)
  }
}
