#!/bin/bash

export AWS_DEFAULT_REGION=us-east-1
export AWS_ACCOUNT_ID=000000000000

# create s3 buckets
buckets=(
  "local-private"
  "local-public"
)

for bucket in "${buckets[@]}"
do
  awslocal s3api create-bucket --bucket $bucket --region ${AWS_DEFAULT_REGION}
  awslocal s3api put-bucket-cors --bucket $bucket --cors-configuration file://aws_cors.json
  awslocal s3api get-bucket-cors --bucket $bucket
  # awslocal s3 mb s3://$bucket --region ${AWS_DEFAULT_REGION} # aws-cli v1.25.9 for ubuntu
done
