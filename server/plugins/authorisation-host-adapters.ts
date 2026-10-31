import type {
  AuthorisationDirectory,
  AuthorisationGovernance,
  AuthorisationSubjectResolver,
  AuthorisationPermissionDefinitionInput,
} from '@nuxt4-layers/authorisation/contracts'

/**
 * Clean-room Stage 4 adapters. These fixtures deliberately do not grant
 * membership or ownership. No external IAM layer or provider internals.
 */
const directory: AuthorisationDirectory = {
  async resolveActor() {
    return null
  },
  async describeGroup() {
    return null
  },
}

const governance: AuthorisationGovernance = {
  async describeGroup() {
    return null
  },
  async isOwner() {
    return false
  },
  async countOwners() {
    return 0
  },
}

const subjectResolver: AuthorisationSubjectResolver = {
  async resolve() {
    // No trusted authentication integration exists in this isolated harness.
    return null
  },
}

const domainPermissions: AuthorisationPermissionDefinitionInput[] = [
  { name: 'orders:view', description: 'View orders', risk: 'low', effect: 'view' },
  { name: 'orders:process_refund', description: 'Refund an order', risk: 'high', effect: 'change' },
]

export default defineNitroPlugin(() => {
  if (process.env.PGDATABASE !== 'authorisation_contract_test') {
    throw new Error('Refusing Authorisation fixture adapters outside isolated test database')
  }

  provideAuthorisationDirectory(directory)
  provideAuthorisationGovernance(governance)
  provideAuthorisationSubjectResolver(subjectResolver)
  provideAuthorisationPermissions(domainPermissions)
})
