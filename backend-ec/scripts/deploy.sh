#!/bin/bash
set -e
set -x

SERVICE_NAME=api
ECR_URI_DEV=355758008422.dkr.ecr.ap-northeast-1.amazonaws.com/tunaguma-dev/api/api
TASK_DEFINTION_NAME_DEV=tunaguma-dev-api
CLUSTER_NAME_DEV=tunaguma-dev-api
# ECR_URI_DEV=355758008422.dkr.ecr.ap-northeast-1.amazonaws.com/tng-prod/api/api
# TASK_DEFINTION_NAME_DEV=tunaguma-prod-api
# CLUSTER_NAME_DEV=tunaguma-prod-api

IMAGE_LATEST=${ECR_URI_DEV}:latest
IMAGE_TAG="${ECR_URI_DEV}:v-$(git rev-parse HEAD | head -c 8)"
echo $IMAGE_TAG
echo $IMAGE_LATEST

# build docker
aws ecr get-login-password | docker login --username AWS --password-stdin $ECR_URI_DEV
docker buildx build --platform linux/amd64 -t $IMAGE_LATEST .
echo "Tagging image..."
docker tag $IMAGE_LATEST $IMAGE_TAG
echo "Pushing image..."
docker push $IMAGE_LATEST
docker push $IMAGE_TAG

# update task
export TASK_DEFINTION_NAME=$TASK_DEFINTION_NAME_DEV
echo $TASK_DEFINTION_NAME
TASK_DEFINITION=$(aws ecs describe-task-definition --task-definition "$TASK_DEFINTION_NAME")
NEW_CONTAINER_DEFINTIION=$(echo $TASK_DEFINITION | jq --arg IMAGE "$IMAGE_TAG" '.taskDefinition | .containerDefinitions[0].image = $IMAGE | del(.taskDefinitionArn) | del(.revision) | del(.status) | del(.requiresAttributes) | del(.compatibilities) | del(.registeredAt) | del(.registeredBy)')
echo $NEW_CONTAINER_DEFINTIION
aws ecs register-task-definition --cli-input-json "$NEW_CONTAINER_DEFINTIION"
aws ecs update-service --cluster "${CLUSTER_NAME_DEV}" --service "${SERVICE_NAME}" --task-definition "${TASK_DEFINTION_NAME}"
sh -x ./deregister_old_task_definition.sh