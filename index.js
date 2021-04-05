const fs = require("fs");
const yaml = require("js-yaml");
const core = require("@actions/core");
const github = require("@actions/github");
const {
  CodeBuildClient,
  BatchGetProjectsCommand,
} = require("@aws-sdk/client-codebuild");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

async function main() {
  if ("AWS_DEFAULT_REGION" in process.env && !("AWS_REGION" in process.env)) {
    process.env.AWS_REGION = process.env.AWS_DEFAULT_REGION;
  }
  const codebuild = new CodeBuildClient();
  let command = new BatchGetProjectsCommand({
    names: [core.getInput("appname", { required: true })],
  });
  const data = await codebuild.send(command);
  core.info("Uploading artifacts");
  const artifactsBucket = data.projects[0].artifacts.location;
  const files = yaml.load(data.projects[0].source.buildspec).artifacts.files;
  const prefix = `external-${github.context.runNumber}/`;
  core.setOutput("artifacts_bucket", artifactsBucket);
  core.setOutput("artifacts_prefix", prefix);
  const s3 = new S3Client();
  files.forEach((file) => {
    fs.readFile(`./${file}`, "utf8", function (err, contents) {
      if (err) {
        if (err.code === "ENOENT") {
          core.warning(
            `${file} does not exist. It must be uploaded to S3 for a deploy to succeed.`
          );
        } else {
          raise(err);
        }
      } else {
        command = new PutObjectCommand({
          Bucket: artifactsBucket,
          Key: `${prefix}${file}`,
          Body: contents,
        });
        core.info(`  * ${file}`);
        s3.send(command).catch((error) => {
          core.setFailed(error.message);
        });
      }
    });
  });
  core.endGroup();
}

if (require.main === module) {
  main().catch((error) => {
    core.setFailed(error.message);
  });
}
