import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as sfn from '@aws-cdk/aws-stepfunctions';
import { ResilientLambdaTask } from './ResilientLambdaTask'

/**
 * Properties for defining a retry with backoff and jitter construct.
 */
export interface RetryWithJitterProps {
    /**
     * An optional description for this state
     *
     * @default No comment
     */
    readonly comment?: string;
    /**
     * JSONPath expression to select part of the state to be the input to this state.
     *
     * May also be the special value DISCARD, which will cause the effective
     * input to be the empty object {}.
     *
     * @default $
     */
    readonly inputPath?: string;
    /**
     * JSONPath expression to indicate where to inject the state's output
     *
     * May also be the special value DISCARD, which will cause the state's
     * input to become its output.
     *
     * @default $
     */
    readonly resultPath?: string;

    /**
     * Try chain to execute.
     */
    readonly tryProcess: sfn.IChainable;

    /**
     * Retry configuration.
     */
    readonly retryProps: sfn.RetryProps;
} 

/**
 * Define a construct that implements retry with backoff and jitter.
 */
export class RetryWithJitterTask extends sfn.Parallel {

  constructor(scope: cdk.Construct, id: string, props: RetryWithJitterProps) {
    const parallelProps = {
      comment: props.comment,
      inputPath: props.inputPath,
      outputPath: "$[0]",
      resultPath: props.resultPath,
      parameters: {
        "RetryCount.$": "$$.State.RetryCount",
        "Input.$": "$"
      }
    } 

    super(scope, id, parallelProps)

    const calculateJitterLambda = new lambda.Function(this, 'CalculateJitterLambda', {
      runtime: lambda.Runtime.PYTHON_3_8,
      code: lambda.Code.fromAsset(__dirname + '/../../lambda/jitter'),
      handler: "main.lambda_handler",
    });

    const calculateJitterTask = new ResilientLambdaTask(this, this.createStateName("CalculateJitter"), {

      lambdaFunction: calculateJitterLambda,
      payload: sfn.TaskInput.fromObject({
        "RetryCount.$": "$.RetryCount",
        "Backoff": 2
      }),
      resultPath: "$.WaitSeconds",    
    })

    const waitTask = new sfn.Wait(this, this.createStateName("WaitBetweenRetries"), {
      time: sfn.WaitTime.secondsPath("$.WaitSeconds"),
    }) 

    // Need this state to "unwrap" original input to the state.
    // Also, CDK does not support outputPath for Wait state, which I would use for retry path
    const unwrapArguments = new sfn.Pass(this, this.createStateName('Unwrap Input'), {
      outputPath: "$.Input"
    })

    const retryPath = calculateJitterTask.next(waitTask).next(unwrapArguments)
    
    const choiceState = new sfn.Choice(this, this.createStateName("CheckRetryCount"))
      .when(sfn.Condition.numberGreaterThan("$.RetryCount", 0), retryPath)
      .otherwise(unwrapArguments)
      .afterwards()
      .next(props.tryProcess)

    this.branch(choiceState)

    this.addRetry({
      interval: cdk.Duration.seconds(0),
      maxAttempts: props.retryProps.maxAttempts,
      errors: props.retryProps.errors 
    })
  }

  private createStateName(name: string): string {
    return `${name}_${this.node.uniqueId}`;
  }
}