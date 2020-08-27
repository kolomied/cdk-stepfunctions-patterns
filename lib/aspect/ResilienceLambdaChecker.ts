import * as cdk from '@aws-cdk/core';
import * as tasks from '@aws-cdk/aws-stepfunctions-tasks';
import { RetryProps } from '@aws-cdk/aws-stepfunctions'
import { ResilientLambdaTask } from '../construct/ResilientLambdaTask'

/**
 * Properties for defining resilience lambda checker aspect.
 */
export interface ResilienceLambdaCheckerProps {
    readonly fail?: boolean;
}

/**
 * Define an aspect that validates all Lambda Invoke tasks and warns if AWS Lambda transient errors are not handled properly.
 */
export class ResilienceLambdaChecker implements cdk.IAspect {

  private readonly _fail?: boolean;

  constructor(props?: ResilienceLambdaCheckerProps) {
    this._fail = props?.fail
  }

  public visit(construct: cdk.IConstruct): void {

    if (construct instanceof tasks.LambdaInvoke) {
      const reporter = this._fail ? construct.node.addError : construct.node.addWarning;

      const retries = this.getRetryConfiguration(construct);
      if (retries.length > 0) {
        const unhandledErrors = this.getUnhandledTransientErrors(retries);

        if (unhandledErrors.length > 0) {
          reporter.apply(construct.node, [`Missing retry for transient errors: ${unhandledErrors}.`]);
        }
      } else {
        reporter.apply(construct.node, ['No retry for AWS Lambda transient errors defined - consider using ResilientLambdaTask construct.']);
        //ResilientLambdaTask.addDefaultRetry(construct);
      }
    }
  }

  private getUnhandledTransientErrors(retries: Array<RetryProps>): Array<string> {
    return ResilientLambdaTask.TransientErrors.filter(transientError => 
      retries.every(config => !config.errors?.includes(transientError)));
  }

  private getRetryConfiguration(construct: cdk.IConstruct): Array<RetryProps> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (construct as any).retries as Array<RetryProps> || []
  }
}
