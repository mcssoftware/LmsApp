import * as React from "react";
import styles from "./LmsTask.module.scss";
import { ILmsTaskProps } from "./ILmsTaskProps";
import { ILmsTaskState } from "./ILmsTaskState";
import { BillsService } from "../../../services/BillsService";
import { TasksServices } from "../../../services/TasksService";
import { WorkflowDefinitionService } from "../../../services/WorkflowDefinitionService";
import WebpartHeader from "../../../controls/WebpartHeader/WebpartHeader";
import { Loading, Error } from "../../../controls/Loading/Loading";
import TaskInformation from "../../../controls/TaskInformation/TaskInformation";
import ActionControl from "../../../controls/TaskAction/TaskAction";
import {
  autobind,
  PrimaryButton,
} from "office-ui-fabric-react";
import {
  McsUtil, config, EventEmitter, IBills, ITasks, IWorkflowDefinition,
  WorkflowLogic, TextTokenReplacement, Constants, tokenProvider,
} from "mcs-lms-core";
import { UrlQueryParameterCollection } from "@microsoft/sp-core-library";
import { clone } from "@microsoft/sp-lodash-subset";
import SpinnerControl from "../../../controls/Loading/SpinnerControl";

export default class LmsTask extends React.Component<ILmsTaskProps, ILmsTaskState> {
  private _billService: BillsService;
  private _taskService: TasksServices;
  private _workflowDefinitionService: WorkflowDefinitionService;
  private readonly _eventEmitter: EventEmitter = EventEmitter.getInstance();
  private _bill: IBills;
  private _spinner: SpinnerControl;

  constructor(props: ILmsTaskProps, context?: any) {
    super(props, context);
    this.state = {
      task: null,
      currentStep: null,
      nextSteps: [],
      showNextSteps: true,
      commentEnabled: false,
      loading: true,
      error: "",
      comment: "",
      signedIn: false,
    };
    this._bill = null;
    this._taskService = new TasksServices(props.isLocalEnvironment);
    this._billService = new BillsService(props.isLocalEnvironment);
    this._workflowDefinitionService = new WorkflowDefinitionService(props.isLocalEnvironment);
  }

  public componentDidMount(): void {
    tokenProvider.isSignedIn().then((isSignedIn) => {
      this.setState({ ...this.state, error: "", signedIn: isSignedIn });

    }, (err) => {
      this.setState({ ...this.state, error: err, signedIn: false });

    });
  }

  public render(): React.ReactElement<ILmsTaskProps> {
    const { title } = this.props;
    return (
      <div className={styles.lmsTask} >
        <div className={styles.container}>
          <WebpartHeader webpartTitle={title} />
          <div className={styles.content}>
            {this.state.loading && (<Loading />)}
            {!this.state.loading && (this.state.error !== "") && (<Error message={this.state.error} />)}
            {!this.state.loading && (this.state.error === "") && (this.state.currentStep !== null) && (
              <div>
                {this.getTaskInformationElement()}
                {this.props.showTaskSpecificSection && this.getTaskSpecificElement()}
                {this.props.showTaskAction && this.getTaskActionElement()}
              </div>
            )}
            <SpinnerControl onRef={(ref) => (this._spinner = ref)} />
          </div>
        </div>
      </div>
    );
  }

  public componentDidUpdate(prevProps: ILmsTaskProps, prevState: ILmsTaskState, prevContext: any): void {
    if (prevState.signedIn !== this.state.signedIn && !McsUtil.isDefined(this.state.hasToken)) {
      tokenProvider.getToken().then((token) => {
        this._getData();
        this.setState({ ...this.state, hasToken: true });
      }, (err) => {
        this.setState({ ...this.state, hasToken: false, loading: false, error: err });
      });
    } else {
      if (prevProps.showSpinner !== this.props.showSpinner) {
        this._spinner.setVisibility(this.props.showSpinner);
      }
    }
  }

  protected getTaskInformationElement(): JSX.Element {
    const { isLocalEnvironment, spHttpClient } = this.props;
    return (
      <div className={styles.row}>
        <div className={styles.column12}>
          <TaskInformation
            task={this.state.task}
            onCommentAdded={this._addComment}
            onCommentEnabled={this._onCommentEnabled} />
        </div>
      </div>);
  }

  protected getTaskActionElement(): JSX.Element {
    const { isLocalEnvironment, spHttpClient } = this.props;
    const isTaskCompleted: boolean = this.state.task && /^Complete/gi.test(this.state.task.Status);
    const isBillCheckedOut: boolean = this._bill && this._bill.CheckoutUser != null;
    return (<div className={styles.row}>
      <div className={styles.column12}>
        <div>
          {!isTaskCompleted &&
            <ActionControl isLocalEnvironment={isLocalEnvironment}
              spHttpClient={spHttpClient}
              disabled={this.state.commentEnabled || isBillCheckedOut}
              nextSteps={this.state.nextSteps}
              showNextSteps={this.state.showNextSteps}
              actionClicked={this._performTaskAction}
              bill={this._bill} />
          }
          {isTaskCompleted &&
            <div className={styles.column12}>
              <PrimaryButton disabled={this.state.commentEnabled} text="Ok" onClick={this._okButtonClicked} />
            </div>
          }
        </div>
      </div>
    </div>);
  }

  protected getTaskSpecificElement(): JSX.Element {
    if (McsUtil.isFunction(this.props.taskSpecificRender)) {
      return this.props.taskSpecificRender();
    } else {
      return <div></div>;
    }
  }

  protected getBill(): IBills {
    return this._bill;
  }

  private _getData(): void {
    const queryParameter: UrlQueryParameterCollection = new UrlQueryParameterCollection(window.location.href);
    if (queryParameter.getValue("taskId")) {
      const taskId: number = parseInt(queryParameter.getValue("taskId"), 10);
      this._taskService.getTaskById(taskId).then((task: ITasks) => {
        this._bill = task.BillLookup;
        this._eventEmitter.emit("Bill", { Items: task.BillLookup });
        if (McsUtil.isFunction(this.props.postComponentMount)) {
          this.props.postComponentMount(task.BillLookup, task, tokenProvider.getToken);
        }
        task.Body = this._performTokenReplacement(task, this._bill);
        if (this._workflowDefinitionService.hasNextSteps(task.WorkflowStep)) {
          this._workflowDefinitionService.getNextSteps(task.WorkflowStep)
            .then((nextSteps) => {
              const approvedSteps: IWorkflowDefinition[] = nextSteps.filter((v) => WorkflowLogic.IsNextStepApproved(task.WorkflowStep, v, this._bill));
              this.setState({
                ...this.state,
                loading: false,
                task,
                currentStep: task.WorkflowStep,
                nextSteps: approvedSteps,
                showNextSteps: true,
              });
            });
        } else {
          this.setState({
            ...this.state,
            loading: false,
            task,
            currentStep: task.WorkflowStep,
            nextSteps: [],
            showNextSteps: true,
          });
        }

      }, (error) => {
        this._setErrorState("Invalid task id.", false);
      });
    } else {
      this._setErrorState("Invalid task id.", false);
    }
  }

  private _performTokenReplacement(task: ITasks, bill: IBills): string {
    if (McsUtil.isString(task.Body)) {
      const tokenReplacement: TextTokenReplacement = new TextTokenReplacement();
      tokenReplacement.addToken("LsoNumber", bill.LSONumber);
      if (McsUtil.isString(bill.BillNumber)) {
        tokenReplacement.addToken("BillNumber", bill.BillNumber);
      }
      const webUrl: string[] = window.location.href.split("?");
      tokenReplacement.addToken("Path", webUrl[0]);
      tokenReplacement.addToken("UrlQuery", webUrl[1]);
      tokenReplacement.addToken("RawUrl", window.location.href);
      let sponsorTypeValue: string = "Legislator";
      if (!McsUtil.isString(bill.SponsorTitle)) {
        sponsorTypeValue = "Committee";
      }
      tokenReplacement.addToken("SponsorType", sponsorTypeValue);
      tokenReplacement.addToken("FileLeafRef", bill.File.ServerRelativeUrl);
      tokenReplacement.addToken("SiteCollection", config.getSiteUrl());
      tokenReplacement.addToken("Site", config.getLmsUrl());
      tokenReplacement.addToken("SiteServerRelative", config.getLmsUrl().replace(/^(?:\/\/|[^\/]+)*\//, "").replace(/\/$/, ""));
      return tokenReplacement.performTokenReplacement(McsUtil.parseHtmlEntities(decodeURIComponent(task.Body)));
    }
    return "";
  }

  @autobind
  private _commentChanged(value: string): void {
    this.setState({
      ...this.state,
      comment: value,
    });
  }

  @autobind
  private _addComment(comments: string): void {
    const task: ITasks = clone(this.state.task);
    const taskInstruction: string = task.Body;
    if (McsUtil.isString(comments)) {
      this._taskService.saveTaskComments(task, comments)
        .then((value) => {
          value.Body = taskInstruction;
          this.setState({
            ...this.state,
            task: value,
          });
        });
    }
  }

  @autobind
  private _performTaskAction(step: IWorkflowDefinition): void {
    const task: ITasks = clone(this.state.task);
    let assignedToId: number = null;
    if (McsUtil.isDefined(step) && step !== null) {
      assignedToId = step.AssignedTo.Id;
    }
    this._spinner.setVisibility(true);
    if (McsUtil.isDefined(step)) {
      this._taskService.performTaskAction(this._bill, task, step, assignedToId, task.Comments, task.HasChildren, McsUtil.isDefined(this.props.preTaskCompletionAction))
        .then((value) => {
          this._spinner.setVisibility(false);
          this._redirect();
        }, (err) => {
          this.setState({ ...this.state, error: err });
          this._spinner.setVisibility(false);
        });
    } else {
      this._taskService.completeTask(this._bill, task, null)
        .then((value) => {
          this._spinner.setVisibility(false);
          this._redirect();
        }, (err) => {
          this.setState({ ...this.state, error: err });
          this._spinner.setVisibility(false);
        });
    }
  }

  private _setErrorState(message: string, loading: boolean): void {
    this.setState({
      ...this.state,
      error: message,
      loading,
    });
  }

  @autobind
  private _onCommentEnabled(visible: boolean): void {
    this.setState({
      ...this.state,
      commentEnabled: visible,
    });
  }

  @autobind
  private _okButtonClicked(): void {
    this._redirect();
  }

  private _redirect(): void {
    const queryParameters: UrlQueryParameterCollection = new UrlQueryParameterCollection(window.location.href);
    if (queryParameters.getValue("source")) {
      window.location.href = decodeURIComponent(queryParameters.getValue("source"));
    } else {
      window.location.href = McsUtil.combinePaths(config.getLmsUrl(), Constants.Pages.DraftingDesktop);
    }
  }
}
