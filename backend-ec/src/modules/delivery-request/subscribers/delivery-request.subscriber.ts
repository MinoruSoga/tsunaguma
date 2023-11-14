/* eslint-disable @typescript-eslint/ban-ts-comment */
import { EventBusService } from '@medusajs/medusa/dist/services'
import { Logger } from '@medusajs/medusa/dist/types/global'
import { Subscriber } from 'medusa-extender'
import { EntityManager, IsNull, Not } from 'typeorm'

import {
  DeliveryRequest,
  DeliveryRequestAdminStatus,
  DeliveryRequestStatus,
} from '../entities/delivery-request.entity'
import { DeliveryRequestRepository } from '../repository/delivery-request.repository'
import DeliveryRequestService from '../services/delivery-request.service'

type InjectedDependencies = {
  eventBusService: EventBusService
  logger: Logger
  manager: EntityManager
  deliveryRequestRepository: typeof DeliveryRequestRepository
}

@Subscriber()
export class DeliveryRequestSubscriber {
  private logger_: Logger
  private manager: EntityManager
  private deliveryRequestRepo_: typeof DeliveryRequestRepository
  private eventBus_: EventBusService

  constructor(container: InjectedDependencies) {
    this.logger_ = container.logger
    this.deliveryRequestRepo_ = container.deliveryRequestRepository
    this.manager = container.manager
    this.eventBus_ = container.eventBusService

    container.eventBusService.subscribe(
      DeliveryRequestService.Events.CANCELED,
      this.handleCancelDeliveryRequest.bind(this),
    )

    container.eventBusService.subscribe(
      DeliveryRequestService.Events.CREATE,
      this.handleCreateDeliveryRequest.bind(this),
    )

    container.eventBusService.subscribe(
      DeliveryRequestService.Events.UPDATE,
      this.handleUpdateDeliveryRequest.bind(this),
    )

    container.eventBusService.subscribe(
      DeliveryRequestService.Events.DELETE,
      this.handleDeleteDeliveryRequest.bind(this),
    )
  }

  private getStatusFromChildren(
    status: DeliveryRequestStatus,
    children: DeliveryRequest[],
  ): DeliveryRequestStatus {
    const statusSet = new Set(children?.map((d) => d.status))
    if (statusSet.size === 1) {
      return Array.from(statusSet).at(0)
    } else {
      return status
    }
  }

  private getAdminStatusFromChildren(
    admin_status: DeliveryRequestAdminStatus,
    children: DeliveryRequest[],
  ): DeliveryRequestAdminStatus {
    const statusSet = new Set(children?.map((d) => d.admin_status))
    if (statusSet.size === 1) {
      return Array.from(statusSet).at(0)
    } else {
      return admin_status
    }
  }

  async handleStatusChangeParent(id: string) {
    const deliveryRequestRepo = this.manager.getCustomRepository(
      this.deliveryRequestRepo_,
    )
    const deliveryReq = await deliveryRequestRepo.findOne(
      {
        id,
        parent_id: IsNull(),
      },
      { relations: ['children'] },
    )

    if (!deliveryReq?.children) return

    if (!deliveryReq.status) {
      deliveryReq.status = DeliveryRequestStatus.DRAFT
    }
    const parentStatus = this.getStatusFromChildren(
      deliveryReq.status,
      deliveryReq.children,
    )

    const parentAdminStatus = this.getAdminStatusFromChildren(
      deliveryReq.admin_status,
      deliveryReq.children,
    )

    // all children belongs to all status
    if (
      deliveryReq.status === parentStatus &&
      deliveryReq.admin_status === parentAdminStatus
    )
      return

    const toUpdate: Partial<DeliveryRequest> = {
      status: parentStatus,
      admin_status: parentAdminStatus,
    }

    // update admin_status
    switch (parentStatus) {
      case DeliveryRequestStatus.PENDING:
        if (deliveryReq.admin_status === DeliveryRequestAdminStatus.DRAFT) {
          toUpdate.admin_status = DeliveryRequestAdminStatus.NEW_REQUEST
        }
        break
      case DeliveryRequestStatus.CANCELLED:
        toUpdate.admin_status = DeliveryRequestAdminStatus.CANCELLED
        break
      default:
        break
    }

    if (parentStatus === DeliveryRequestStatus.CANCELLED) {
      toUpdate.canceled_at = new Date()
    }

    if (parentStatus === DeliveryRequestStatus.DELIVERED) {
      toUpdate.delivered_at = new Date()
    }

    if (parentStatus === DeliveryRequestStatus.DELETED) {
      toUpdate.deleted_at = new Date()
    }

    if (
      parentStatus === DeliveryRequestStatus.PENDING &&
      !deliveryReq.released_at
    ) {
      toUpdate.released_at = new Date()
    }

    if (toUpdate.admin_status === DeliveryRequestAdminStatus.PUBLISHED) {
      await this.eventBus_.emit(DeliveryRequestService.Events.PUBLISHED, {
        id: id,
        format: 'delivery-request-published',
        is_parent: true,
      })
    }

    await deliveryRequestRepo.update({ id }, toUpdate)
    return
  }

  async handleStatusDeleteChild(id: string) {
    const deliveryRequestRepo = this.manager.getCustomRepository(
      this.deliveryRequestRepo_,
    )

    const deliveryReq = await deliveryRequestRepo.findOne(
      {
        id,
        parent_id: IsNull(),
      },
      { relations: ['children'] },
    )
    let parentStatus = deliveryReq.status

    if (deliveryReq?.children?.length === 0) {
      parentStatus = DeliveryRequestStatus.DELETED
    }

    const toUpdate: Partial<DeliveryRequest> = {
      status: parentStatus,
    }
    if (parentStatus === DeliveryRequestStatus.DELETED) {
      toUpdate.deleted_at = new Date()
    }

    await deliveryRequestRepo.update({ id }, toUpdate)
    return
  }

  async handleStatusChange(id: string) {
    const deliveryRequestRepo = this.manager.getCustomRepository(
      this.deliveryRequestRepo_,
    )
    const deliveryReq = await deliveryRequestRepo.findOne(
      {
        id,
        parent_id: Not(IsNull()),
      },
      { relations: ['parent', 'parent.children'] },
    )

    if (!deliveryReq?.parent?.children) return

    if (!deliveryReq.parent.status) {
      deliveryReq.parent.status = DeliveryRequestStatus.DRAFT
    }
    const parentStatus = this.getStatusFromChildren(
      deliveryReq.parent.status,
      deliveryReq.parent.children,
    )

    const parentAdminStatus = this.getAdminStatusFromChildren(
      deliveryReq.parent.admin_status,
      deliveryReq.parent.children,
    )

    // all children belongs to all status
    if (
      deliveryReq.parent.status === parentStatus &&
      deliveryReq.parent.admin_status === parentAdminStatus
    )
      return

    const toUpdate: Partial<DeliveryRequest> = {
      status: parentStatus,
      admin_status: parentAdminStatus,
    }

    if (parentStatus === DeliveryRequestStatus.CANCELLED) {
      toUpdate.canceled_at = new Date()
    }

    if (parentStatus === DeliveryRequestStatus.DELIVERED) {
      toUpdate.delivered_at = new Date()
    }

    if (parentStatus === DeliveryRequestStatus.DELETED) {
      toUpdate.deleted_at = new Date()
    }

    if (
      parentStatus === DeliveryRequestStatus.PENDING &&
      !deliveryReq.released_at
    ) {
      toUpdate.released_at = new Date()
      if (deliveryReq.admin_status === DeliveryRequestAdminStatus.DRAFT) {
        toUpdate.admin_status = DeliveryRequestAdminStatus.NEW_REQUEST
      }
    }

    await deliveryRequestRepo.update({ id: deliveryReq.parent_id }, toUpdate)
    return
  }

  async handleCancelDeliveryRequest({ id }: { id: string }) {
    await this.handleStatusChange(id)
  }

  async handleCreateDeliveryRequest({ id }: { id: string }) {
    await this.handleStatusChange(id)
  }

  async handleUpdateDeliveryRequest({ id }: { id: string }) {
    await this.handleStatusChangeParent(id)
  }

  async handleDeleteDeliveryRequest({ id }: { id: string }) {
    await this.handleStatusDeleteChild(id)
  }
}
