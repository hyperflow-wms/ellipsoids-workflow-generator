# Ellipsoids Workflow
Generator for ellipsoids.

https://github.com/malawski/ellipsoids

## Generating example workflow

git clone https://github.com/burkat/ellipsoids-workflow-generator.git

cd ellipsoids-workflow-generator/

npm install

node generator.js 2

The parameter is the number of base executions, it determines the amount of intermediate nodes in the workflow.
A workflow.json file will be saved in current folder.

## Running workflow
Generated workflow can be runned on AWS lambda using Hyperflow (https://github.com/hyperflow-wms/hyperflow) and REST handler (https://github.com/burkat/hyperflow-awslambda-executor).

Input files can be found in this repository; ellipsoids-openmp and mean-pack-ell binaries, createDat.js, generateData.js and summary.js. They should be uploaded to S3 before running workflow and also the prefix and bucket should be set in hyperflow executor's config.
