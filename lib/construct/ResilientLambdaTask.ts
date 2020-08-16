import * as cdk from '@aws-cdk/core';
import * as tasks from '@aws-cdk/aws-stepfunctions-tasks';

export class ResilientLambdaTask extends tasks.LambdaInvoke {

  public static readonly TransientErrors: string[] = [
    "Lambda.ServiceException",
    "Lambda.AWSLambdaException",
    "Lambda.SdkClientException",
    "Lambda.TooManyRequestsException"
  ]

  constructor(scope: cdk.Construct, id: string, props: tasks.LambdaInvokeProps) {
    super(scope, id, props)
    ResilientLambdaTask.addDefaultRetry(this);
  }

  public static addDefaultRetry(task: tasks.LambdaInvoke): void {
    // https://docs.aws.amazon.com/step-functions/latest/dg/bp-lambda-serviceexception.html
    task.addRetry({
      errors: ResilientLambdaTask.TransientErrors,
      backoffRate: 2,
      maxAttempts: 6,
      interval: cdk.Duration.seconds(2)
    });
  }
}