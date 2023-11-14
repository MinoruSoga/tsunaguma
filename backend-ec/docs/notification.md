## Notification

eventName: name of event emmited by eventBusService
eventData: data emitted by eventBusService
result: data returned in sendNotification function (implemented by notification provider)

- resourceType: eventName.split('.')[0]
- resourceId: eventData.id
- customer_id: eventData.customer_id
- to: result.to
- data: result.data
- event_name: eventName
- provider_id
