# AppPack Upload Artifacts GitHub Action

This action uploads build artifacts (created by `apppackio/build-action`) to S3 where they are picked up when `apppackio/deploy-action` is triggered. It assumes a set of files exists in the working directory:

* `app.json` if your app defines an `app.json` this is used, otherwise a file containing an empty JSON object (`{}`)
* `build.log` the output from the build process
* `commit.txt` contains information about the current git commit
* `metadata.toml` generated during the buildpack image creation process
* `test.log` output of tests or an empty file

`apppackio/build-action` will create all the files _except_ `test.log`. You are responsible for generating this file prior to running this action. You could do so by running a step such as:

```yaml
- name: Test
  run: |
    set -euf -o pipefail
    docker run --rm \
               --entrypoint /cnb/lifecycle/launcher \
               ${{ steps.build.outputs.docker_image }} \
               your-test-script | tee test.log
```

AWS credentials are required to make the necessary API calls.

The action is designed to be used with `apppackio/build-action` and `apppackio/deploy-action`. The former will upload a container image in the correct format and the latter will trigger a deploy based on the files uploaded by this action.

## Inputs

### `appname`

**Required** Name of the AppPack app

## Outputs

### `artifacts_bucket`

The S3 Bucket the artifacts were uploaded to

### `artifacts_prefix`

The S3 prefix of the uploaded artifacts 

## Example usage

```yaml
- name: AppPack Upload Artifacts
  uses: apppackio/upload-artifacts-action@v1
  with:
    appname: my-app
  env:
    AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
    AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
    AWS_REGION: us-east-1
```
