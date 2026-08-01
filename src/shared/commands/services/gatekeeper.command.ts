export interface GatekeeperCommand {
  enabled: boolean
  requireForSettings?: boolean
  passphraseHash?: string
  lastUpdated?: number
}
