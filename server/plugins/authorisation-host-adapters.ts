import type {
  AuthorisationDirectory,
  AuthorisationGovernance,
  AuthorisationSubjectResolver,
  AuthorisationPermissionDefinitionInput,
  AuthorisationGroup,
  AuthorisationActorContext,
  AuthorisationGovernedGroup,
  AuthorisationRequiredApprovers,
} from '@nuxt4-layers/authorisation/contracts'

/** Fixed, synthetic identity directory for a development-only consumer test. */
const group: AuthorisationGroup = {
  groupId: '10000000-0000-4000-8000-000000000001',
  // Public decision engine requires lineage to end with the group itself.
  lineage: ['10000000-0000-4000-8000-000000000001'],
  tenantId: '20000000-0000-4000-8000-000000000001',
}

const actors: Record<string, AuthorisationActorContext> = {
  '30000000-0000-4000-8000-000000000001': {
    principalId: '30000000-0000-4000-8000-000000000001',
    status: 'active',
    personalGroup: null,
    memberships: [{ group, status: 'active' }],
  },
  '30000000-0000-4000-8000-000000000002': {
    principalId: '30000000-0000-4000-8000-000000000002',
    status: 'suspended',
    personalGroup: null,
    memberships: [{ group, status: 'suspended' }],
  },
}

const requiredApprovers: AuthorisationRequiredApprovers = {
  low: 0,
  medium: 0,
  high: 1,
  critical: 2,
}

/** A synthetic, active governed group; no owner or roles are granted. */
const governedGroup: AuthorisationGovernedGroup = {
  groupId: group.groupId,
  tenantId: group.tenantId,
  kind: 'standard',
  state: 'active',
  parentGroupId: null,
  rootGroupId: group.groupId,
  personalOfPrincipalId: null,
  approvals: { required: requiredApprovers, referenceRequired: false },
  safetyPeriods: {
    publishedDelayHighHours: 24,
    publishedDelayCriticalHours: 48,
    approvalExpiryDays: 7,
    recoveryHoldHours: 24,
  },
  requester: { recoveryHoldUntil: null, controls: [] },
}

const directory: AuthorisationDirectory = {
  async resolveActor(principalId) {
    return actors[principalId] ?? null
  },
  async describeGroup(groupId) {
    return groupId === group.groupId ? group : null
  },
}

const governance: AuthorisationGovernance = {
  async describeGroup({ groupId }) {
    return groupId === group.groupId ? governedGroup : null
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
    // An HTTP caller can never claim one of these synthetic principals.
    return null
  },
}

const domainPermissions: AuthorisationPermissionDefinitionInput[] = [
  { name: 'orders:view', description: 'View orders', risk: 'low', effect: 'view' },
  { name: 'orders:process_refund', description: 'Refund an order', risk: 'high', effect: 'change' },
]

export default defineNitroPlugin(() => {
  if (process.env.PGDATABASE !== 'authorisation_contract_test') {
    throw new Error('Refusing Authorisation fixtures outside isolated test database')
  }
  provideAuthorisationDirectory(directory)
  provideAuthorisationGovernance(governance)
  provideAuthorisationSubjectResolver(subjectResolver)
  provideAuthorisationPermissions(domainPermissions)
})
