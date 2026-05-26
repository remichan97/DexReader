import { GatekeeperOptions } from './options/gatekeeper.option'
import Store from 'electron-store'
import bcrypt from 'bcrypt'

class GatekeeperService {
  private readonly store: Store<GatekeeperOptions>
  private readonly SALT_ROUNDS = 10

  constructor() {
    this.store = new Store<GatekeeperOptions>({
      name: 'gatekeeper',
      defaults: {
        enabled: false
      },
      clearInvalidConfig: true,
      fileExtension: 'lock',
      encryptionKey: 'a-not-so-secrective-key' //I mean, we already hashing the passphrase, so this is just to prevent casual snooping
    })
  }

  isEnabled(): boolean {
    return this.store.get('enabled', false)
  }

  async enable(passphrase: string): Promise<boolean> {
    // If the phrase is empty, or too little characters, reject it
    if (!passphrase || passphrase.length < 4) {
      throw new Error('Passphrase must be at least 4 characters long')
    }

    // If we already have a passphrase, reject the request, if they mean to change it, have them request an update instead of going here
    if (this.store.get('enabled') && this.store.get('passphraseHash')) {
      throw new Error(
        'Gatekeeper is already enabled, if you want to change the passphrase, please request an update instead'
      )
    }

    // All good, hash the phrase and store it
    const hash = await this.hashPassphrase(passphrase)
    this.store.set({
      enabled: true,
      passphraseHash: hash,
      lastUpdated: Date.now()
    })

    return true
  }

  async verify(passphrase: string): Promise<boolean> {
    const hash = this.store.get('passphraseHash')
    if (!hash) {
      return false
    }
    return await bcrypt.compare(passphrase, hash)
  }

  async update(passphrase: string): Promise<boolean> {
    // If the phrase is empty, or too little characters, reject it
    if (!passphrase || passphrase.length < 4) {
      throw new Error('Passphrase must be at least 4 characters long')
    }

    // Does this thing even enabled? If not, reject the request, they should be enabling it instead of updating it
    if (!this.store.get('enabled')) {
      throw new Error(
        'Gatekeeper is not enabled, if you want to set a passphrase, please enable it first'
      )
    }

    // If we don't have a passphrase, reject the request, they should be enabling it instead of updating it, I mean, how can you update something that doesn't exist?
    if (!this.store.get('enabled') || !this.store.get('passphraseHash')) {
      throw new Error(
        'Gatekeeper is not enabled, if you want to set a passphrase, please enable it first'
      )
    }

    // Does this new passphrase match the old one? If so, reject the request, I mean, what's the point of updating if it's the same passphrase?
    if (await this.verify(passphrase)) {
      throw new Error('New passphrase cannot be the same as the old one')
    }

    // All good, hash the new phrase and store it
    const hash = await this.hashPassphrase(passphrase)
    this.store.set({
      enabled: true,
      passphraseHash: hash,
      lastUpdated: Date.now()
    })

    return true
  }

  reset(): void {
    this.store.clear()
  }

  private async hashPassphrase(passphrase: string): Promise<string> {
    // Bcrypt the phrases, with a salt rounds of 10, and return the hash
    return await bcrypt.hash(passphrase, this.SALT_ROUNDS)
  }
}
export const gatekeeperService = new GatekeeperService()
