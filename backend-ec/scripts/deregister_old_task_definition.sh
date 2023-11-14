#!/bin/bash

LATEST_TASK_DEFINITION=$(aws ecs describe-task-definition --task-definition "${TASK_DEFINTION_NAME}")
LATEST_REVISTION=$(echo $LATEST_TASK_DEFINITION | jq -r ".taskDefinition.revision")
echo "LATEST_REVISTION: ${LATEST_REVISTION}"

active_task_definitions=$(aws ecs list-task-definitions --family-prefix "${TASK_DEFINTION_NAME}" --status "ACTIVE" | jq -r ".taskDefinitionArns[]")

for active_td in ${active_task_definitions}; do
	revison=$(echo $active_td | awk -F: '{print $NF}')
    # Keep latest task definition
	if [ "$revison" -ne "$LATEST_REVISTION" ]
	then
		echo "deregister-task-definition: ${active_td}"
		ret=$(aws ecs deregister-task-definition --task-definition "${active_td}")
	fi
done
