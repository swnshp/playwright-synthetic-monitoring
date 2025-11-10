#!/bin/bash
IMAGEPREFIX="ghcr.io/swnshp/arco-synthetic"
TAG=$(date +%s)
JOB_NAME=sxw-playwright-arco
RESOURCE_GROUP=sxw-playwright-arco
MODE=${1}

IMAGE="$IMAGEPREFIX:$TAG"

docker build -t $IMAGE .

if [[ "$MODE" == "production" ]]; then
    docker push $IMAGE

    az containerapp job update \
    --name $JOB_NAME \
    --resource-group $RESOURCE_GROUP \
    --image $IMAGE
else
    echo "Skipping deployment, not in production mode."
fi

echo "Image: $IMAGE"