import { Prisma } from '@prisma/client'

// Re-export Prisma enums for easier import
export const PPPoEStatus = Prisma.PPPoEStatus
export const UserRole = Prisma.UserRole
export const PlanType = Prisma.PlanType
export const RouterStatus = Prisma.RouterStatus

// Type exports
export type { PPPoEUser, Router, Plan, Customer, User, ISPOwner } from '@prisma/client'