import type { Access, FieldAccess } from 'payload'

type UserRole = 'admin' | 'editor' | 'compliance_reviewer' | 'publisher'

export const isAdmin: Access = ({ req }) => req.user?.role === 'admin'

export const isAdminOrEditor: Access = ({ req }) => {
  const role = req.user?.role as UserRole | undefined
  return role === 'admin' || role === 'editor'
}

export const isAdminOrPublisher: Access = ({ req }) => {
  const role = req.user?.role as UserRole | undefined
  return role === 'admin' || role === 'publisher'
}

export const isComplianceReviewer: Access = ({ req }) => {
  const role = req.user?.role as UserRole | undefined
  return role === 'admin' || role === 'compliance_reviewer'
}

export const isAuthenticated: Access = ({ req }) => Boolean(req.user)

export const isPublic: Access = () => true

// Published content only for public
export const isPublishedOrAdmin: Access = ({ req }) => {
  if (req.user?.role === 'admin') return true
  if (req.user) return true // authenticated users see all
  return { status: { equals: 'published' } } // public sees published only
}

// Field-level: readOnly for non-admin
export const adminOnly: FieldAccess = ({ req }) => req.user?.role === 'admin'
