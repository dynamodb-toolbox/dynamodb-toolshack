import type { Entity, Table } from 'dynamodb-toolbox'
import { $entities, EntityDTO, TableAction, TableDTO } from 'dynamodb-toolbox'

import { $accessRole, $awsConfig, $metadata } from './constants.js'
import { deleteEntity } from './deleteEntity.js'
import { getTableEntityNames } from './getTableEntityNames.js'
import { assignAccessRole, putAccessRole } from './putAccessRole.js'
import type { AccessRole } from './putAccessRole.js'
import { putAWSAccount } from './putAwsAccount.js'
import { putEntity } from './putEntity.js'
import { putTable } from './putTable.js'
import type { AWSConfig, FetchOpts } from './types.js'

interface EntityMetadata {
  entityIcon?: string
  entityTitle?: string
  entityDescription?: string
}

interface Metadata<ENTITIES extends Entity[]> {
  awsAccountTitle?: string
  awsAccountColor?: string
  awsAccountDescription?: string
  tableIcon?: string
  tableTitle?: string
  tableDescription?: string
  entities?: Entity[] extends ENTITIES
    ? Record<string, EntityMetadata>
    : { [ENTITY in ENTITIES[number] as ENTITY['name']]?: EntityMetadata }
}

export class Synchronizer<TABLE extends Table, ENTITIES extends Entity[]> extends TableAction<
  TABLE,
  ENTITIES
> {
  static override actionName = 'ddb-toolshack-sync' as const

  apiUrl: string;
  [$awsConfig]?: AWSConfig;
  [$accessRole]?: AccessRole;
  [$metadata]: Metadata<ENTITIES>

  constructor(table: TABLE, entities = [] as unknown as ENTITIES) {
    super(table, entities)

    this.apiUrl = 'https://api.dynamodb-toolshack.com'
    this[$metadata] = {}
  }

  entities<NEXT_ENTITIES extends Entity[]>(
    ...nextEntities: NEXT_ENTITIES
  ): Synchronizer<TABLE, NEXT_ENTITIES> {
    return new Synchronizer(this.table, nextEntities)
  }

  awsConfig(awsConfig: AWSConfig): Synchronizer<TABLE, ENTITIES> {
    this[$awsConfig] = awsConfig
    return this
  }

  accessRole(accessRole: AccessRole): Synchronizer<TABLE, ENTITIES> {
    this[$accessRole] = accessRole
    return this
  }

  metadata(metadata: Metadata<ENTITIES>): Synchronizer<TABLE, ENTITIES> {
    this[$metadata] = metadata
    return this
  }

  async sync({
    apiKey,
    tableName: optionsTableName,
    deleteUnknownEntities = false,
    fetch: _fetch = fetch
  }: {
    apiKey: string
    tableName?: string
    deleteUnknownEntities?: boolean
    fetch?: typeof fetch
  }): Promise<void> {
    const fetchOpts: FetchOpts = { apiUrl: this.apiUrl, fetch: _fetch, apiKey }
    const awsConfig = this[$awsConfig]

    if (awsConfig === undefined) {
      throw new Error('Synchronizer incomplete: Missing "awsConfig" property')
    }
    const { awsAccountId, awsRegion } = awsConfig

    const {
      awsAccountTitle = String(awsAccountId),
      awsAccountColor = 'blue',
      awsAccountDescription
    } = this[$metadata]
    await putAWSAccount(
      {
        awsAccountId,
        title: awsAccountTitle,
        color: awsAccountColor,
        description: awsAccountDescription
      },
      fetchOpts
    )

    const { tableName = optionsTableName, ...tableDTO } = this.table.build(TableDTO).toJSON()
    if (tableName === undefined) {
      throw new Error('tableName should be provided')
    }

    const { tableIcon = 'database-zap', tableTitle, tableDescription } = this[$metadata]
    await putTable(
      {
        tableName,
        ...awsConfig,
        ...tableDTO,
        icon: tableIcon,
        title: tableTitle,
        description: tableDescription
      },
      fetchOpts
    )

    const accessRole = this[$accessRole]
    if (accessRole !== undefined) {
      const { roleName } = accessRole

      await putAccessRole({ awsAccountId, ...accessRole }, fetchOpts)
      await assignAccessRole({ awsAccountId, awsRegion, tableName, roleName }, fetchOpts)
    }

    let unknownEntityNames: Set<string> | undefined = undefined
    if (deleteUnknownEntities) {
      const tableEntityNames = await getTableEntityNames(
        { awsAccountId, awsRegion, tableName },
        fetchOpts
      )

      unknownEntityNames = new Set(tableEntityNames)
    }

    for (const entity of this[$entities]) {
      const { entityName, ...entityDTO } = entity.build(EntityDTO).toJSON()
      const {
        entityIcon: icon = 'database-zap',
        entityDescription: description,
        entityTitle: title
      } = (this[$metadata].entities as Record<string, EntityMetadata>)?.[entityName] ?? {}

      await putEntity(
        {
          awsAccountId,
          awsRegion,
          tableName,
          ...entityDTO,
          entityName,
          icon,
          ...(description !== undefined ? { description } : {}),
          ...(title !== undefined ? { title } : {})
        },
        fetchOpts
      )

      unknownEntityNames?.delete(entityName)
    }

    if (deleteUnknownEntities && unknownEntityNames !== undefined) {
      for (const entityName of unknownEntityNames) {
        await deleteEntity({ awsAccountId, awsRegion, tableName, entityName }, fetchOpts)
      }
    }
  }
}
