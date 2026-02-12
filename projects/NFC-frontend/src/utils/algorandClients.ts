import algosdk from 'algosdk'
import { getAlgodConfigFromViteEnvironment, getIndexerConfigFromViteEnvironment } from './network/getAlgoClientConfigs'

function normalizePort(port: string | number): string | number | undefined {
  if (port === '') {
    return undefined
  }
  return port
}

export function getAlgodClient(): algosdk.Algodv2 {
  const config = getAlgodConfigFromViteEnvironment()
  const token = typeof config.token === 'string' ? config.token : ''
  return new algosdk.Algodv2(token, config.server, normalizePort(config.port))
}

export function getIndexerClient(): algosdk.Indexer {
  const config = getIndexerConfigFromViteEnvironment()
  const token = typeof config.token === 'string' ? config.token : ''
  return new algosdk.Indexer(token, config.server, normalizePort(config.port))
}
