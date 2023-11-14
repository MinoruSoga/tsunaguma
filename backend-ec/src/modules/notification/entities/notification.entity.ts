import { Notification as MedusaNotification } from '@medusajs/medusa/dist'
import { DbAwareColumn } from '@medusajs/medusa/dist/utils/db-aware-column'
import { Entity as MedusaEntity } from 'medusa-extender'
import {
  Column,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm'

import { User } from './../../user/entity/user.entity'

export enum NotificationType {
  NOTIFICATION = 'notification',
  REACTION = 'reaction',
  ALL = 'all',
}

export type NotificationData = {
  message: string
  id: string
  customer_id: string
  link?: string
  avatar?: string
}

@MedusaEntity({ override: MedusaNotification })
@Entity()
export class Notification extends MedusaNotification {
  @Column({ type: 'boolean', nullable: false })
  user_read: boolean

  @DeleteDateColumn()
  deleted_at: Date | null

  @DbAwareColumn({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown>

  @ManyToOne(() => Notification, (notification) => notification.parent_id)
  parent_notification: Notification

  @OneToMany(() => Notification, (notification) => notification.parent_id)
  resends: Notification[]

  @Column({
    type: 'enum',
    enum: NotificationType,
    default: NotificationType.NOTIFICATION,
  })
  noti_type: string

  @DbAwareColumn({ type: 'jsonb' })
  data: NotificationData

  @Column({ nullable: true, type: 'varchar' })
  from_id: string | null

  @ManyToOne(() => User)
  @JoinColumn({ name: 'from_id', referencedColumnName: 'id' })
  from: User | null
}

/**
 * @schema notification
 * title: "Notification"
 * description: "Notifications a communications sent via Notification Providers as a reaction to internal events such as `order.placed`. Notifications can be used to show a chronological timeline for communications sent to a Customer regarding an Order, and enables resends."
 * x-resourceId: notification
 * required:
 *   - resource_type
 *   - resource_id
 *   - to
 * properties:
 *   id:
 *     type: string
 *     description: The notification's ID
 *     example: noti_01G53V9Y6CKMCGBM1P0X7C28RX
 *   event_name:
 *     description: "The name of the event that the notification was sent for."
 *     type: string
 *     example: order.placed
 *   resource_type:
 *     description: "The type of resource that the Notification refers to."
 *     type: string
 *     example: order
 *   resource_id:
 *     description: "The ID of the resource that the Notification refers to."
 *     type: string
 *     example: order_01G8TJSYT9M6AVS5N4EMNFS1EK
 *   customer_id:
 *     description: "The ID of the Customer that the Notification was sent to."
 *     type: string
 *     example: cus_01G2SG30J8C85S4A5CHM2S1NS2
 *   customer:
 *     description: A customer object. Available if the relation `customer` is expanded.
 *     type: object
 *   to:
 *     description: "The address that the Notification was sent to. This will usually be an email address, but represent other addresses such as a chat bot user id"
 *     type: string
 *     example: "user@example.com"
 *   data:
 *     description: "The data that the Notification was sent with. This contains all the data necessary for the Notification Provider to initiate a resend."
 *     type: object
 *     properties:
 *          message:
 *           type: string
 *          id:
 *           type: string
 *          customer_id:
 *           type: string
 *          link:
 *           type: string
 *          avatar:
 *           type: string
 *     example: {}
 *   resends:
 *     description: "The resends that have been completed after the original Notification."
 *     type: array
 *     items:
 *       $ref: "#/components/schemas/notification_resend"
 *   provider_id:
 *     description: "The id of the Notification Provider that handles the Notification."
 *     type: string
 *     example: sengrid
 *   provider:
 *     description: Available if the relation `provider` is expanded.
 *     $ref: "#/components/schemas/notification_provider"
 *   created_at:
 *     type: string
 *     description: "The date with timezone at which the resource was created."
 *     format: date-time
 *   updated_at:
 *     type: string
 *     description: "The date with timezone at which the resource was updated."
 *     format: date-time
 *   user_read:
 *     type: boolean
 *     description: "User notification"
 *   deleted_at:
 *     type: string
 *     description: "The date with timezone at which the resource was updated."
 *     format: date-time
 *   noti_type:
 *     type: string
 *     description: The notification's type
 *     enum:
 *       - all
 *       - notification
 *       - reaction
 *   from_id:
 *     type: string
 *     description: User trigger this notification
 *   from:
 *     $ref: "#/components/schemas/user"
 */
