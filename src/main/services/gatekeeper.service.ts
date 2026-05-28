import { GatekeeperOptions } from './options/gatekeeper.option'
import Store from 'electron-store'
import bcrypt from 'bcrypt'
import { mainLog } from './logging/main-logging.service'
import { app } from 'electron'
import crypto from 'node:crypto'

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
      encryptionKey: this.generateRandomKey() //I mean, we already hashing the passphrase, so this is just to prevent casual snooping
    })
  }

  isEnabled(): boolean {
    return this.store.get('enabled', false)
  }

  getRequireForSettings(): boolean {
    return this.store.get('requireForSettings', false)
  }

  toggleRequiredForSettings(required: boolean): void {
    if (!this.isEnabled()) {
      mainLog.warn(
        '[Gatekeeper] Attempt to toggle requireForSettings when gatekeeper is not enabled'
      )
      throw new Error(
        'Gatekeeper is not enabled, are you trying to toggle a setting for something that is not enabled?'
      )
    }
    this.store.set('requireForSettings', required)
    mainLog.info(`[Gatekeeper] Toggled requireForSettings to ${required}`)
  }

  async enable(passphrase: string): Promise<boolean> {
    // If the phrase is empty, too little characters, or too many characters, reject it
    if (!passphrase || passphrase.length < 4 || passphrase.length > 128) {
      mainLog.warn('[Gatekeeper] Attempt to enable gatekeeper with invalid passphrase length')
      throw new Error('Passphrase must be between 4 and 128 characters long')
    }

    // If we already have a passphrase, reject the request, if they mean to change it, have them request an update instead of going here
    if (this.store.get('enabled') && this.store.get('passphraseHash')) {
      mainLog.warn(
        '[Gatekeeper] Attempt to enable gatekeeper when it is already enabled, are they trying to change the passphrase instead?'
      )
      throw new Error(
        'Gatekeeper is already enabled, did you mean to change the passphrase instead of enabling it again?'
      )
    }

    // All good, hash the phrase and store it
    const hash = await this.hashPassphrase(passphrase)
    this.store.set({
      enabled: true,
      passphraseHash: hash,
      lastUpdated: Date.now()
    })

    mainLog.info('[Gatekeeper] Gatekeeper enabled')
    return true
  }

  async verify(passphrase: string): Promise<boolean> {
    const hash = this.store.get('passphraseHash')
    if (!hash || !this.store.get('enabled')) {
      // No hash, or most likely Gatekeeper isn't enabled, throw
      mainLog.warn(
        '[Gatekeeper] Attempt to verify passphrase when gatekeeper is not enabled or in an invalid state'
      )
      return false
    }
    const isValid = await bcrypt.compare(passphrase, hash)
    if (isValid) {
      mainLog.info('[Gatekeeper] Passphrase verification attempt completed with a success')
    } else {
      mainLog.warn('[Gatekeeper] Failed attempt to verify passphrase with incorrect passphrase')
    }
    return isValid
  }

  async changePassphrase(oldPassphrase: string, newPassphrase: string): Promise<boolean> {
    if (!this.store.get('enabled')) {
      mainLog.warn('[Gatekeeper] Attempt to change passphrase when gatekeeper is not enabled')
      throw new Error(
        'Gatekeeper is not enabled, are you trying to enable the feature, but lost your way?'
      )
    }

    if (!this.store.get('passphraseHash')) {
      mainLog.warn(
        '[Gatekeeper] Attempt to change passphrase when gatekeeper is in an invalid state'
      )
      throw new Error('Gatekeeper is in an invalid state, did someone mess with the store?')
    }

    if (newPassphrase.length < 4 || newPassphrase.length > 128) {
      mainLog.warn('[Gatekeeper] Attempt to change passphrase with invalid new passphrase length')
      throw new Error('New passphrase must be between 4 and 128 characters long')
    }

    // Is this the correct current passphrase?
    if (!(await this.verify(oldPassphrase))) {
      mainLog.warn('[Gatekeeper] Attempt to change passphrase with incorrect current passphrase')
      return false
    }

    // Is the new one the same as the old one? If so, reject the request, because let's be real, they should't be doing this
    if (oldPassphrase === newPassphrase) {
      mainLog.warn('[Gatekeeper] Attempt to change passphrase with the same passphrase')
      throw new Error('New passphrase must be different from the old passphrase')
    }

    // All good, hash the new phrase and store it
    const hash = await this.hashPassphrase(newPassphrase)
    this.store.set({
      enabled: true,
      passphraseHash: hash,
      lastUpdated: Date.now()
    })

    mainLog.info('[Gatekeeper] Passphrase changed successfully')
    return true
  }

  async disable(passphrase: string): Promise<boolean> {
    if (!this.store.get('enabled')) {
      mainLog.warn('[Gatekeeper] Attempt to disable gatekeeper when it is not enabled')
      throw new Error(
        'Gatekeeper is not enabled, are you trying to disable something that is already disabled?'
      )
    }

    if (!this.store.get('passphraseHash')) {
      mainLog.warn('[Gatekeeper] Attempt to disable gatekeeper when it is in an invalid state')
      throw new Error('Gatekeeper is in an invalid state, did someone mess with the store?')
    }

    if (await this.verify(passphrase)) {
      this.reset()
      mainLog.info('[Gatekeeper] Gatekeeper disabled')
      return true
    }
    // If we landed here, it means the passphrase was incorrect, so we reject the request
    mainLog.warn('[Gatekeeper] Failed attempt to disable gatekeeper with incorrect passphrase')
    return false
  }

  reset(): void {
    this.store.clear()
    mainLog.info('[Gatekeeper] Gatekeeper has been reset')
  }

  private async hashPassphrase(passphrase: string): Promise<string> {
    // Bcrypt the phrases, with a salt rounds of 10, and return the hash
    return await bcrypt.hash(passphrase, this.SALT_ROUNDS)
  }

  private generateRandomKey(): string {
    // Generate a unique key per installation, this is used to encrypt the store, and is not meant to be secret, just to prevent casual snooping, uses the current user path and their platform as part of the key generation to ensure uniqueness across installations
    const machineId = app.getPath('userData') + process.platform
    return crypto.createHash('sha256').update(machineId).digest('hex')
  }
}
export const gatekeeperService = new GatekeeperService()
