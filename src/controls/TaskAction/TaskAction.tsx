import * as React from "react";
import styles from "./TaskAction.module.scss";
import { ITaskActionProps } from "./ITaskActionProps";
import { ITaskActionState } from "./ITaskActionState";
import WebpartHeader from "../WebpartHeader/WebpartHeader";
import { escape, clone } from "@microsoft/sp-lodash-subset";
import { SiteUserProps } from "sp-pnp-js";
import {
    autobind,
    Label,
    PrimaryButton,
    DefaultButton,
    Dropdown,
    IDropdownOption,
    IBasePickerSuggestionsProps,
    IPersonaProps,
} from "office-ui-fabric-react";
import { IWorkflowDefinition, IUser, McsUtil } from "mcs-lms-core";
import { WorkflowDefinitionService } from "../../services/WorkflowDefinitionService";
import { Loading, Error } from "../Loading/Loading";
import LmsPeoplePicker from "../PeoplePicker/LmsPeoplePicker";
import { TasksServices } from "../../services/TasksService";

const suggestionProps: IBasePickerSuggestionsProps = {
    suggestionsHeaderText: "Suggested People",
    noResultsFoundText: "No results found",
    loadingText: "Loading",
};

interface IStepDefinition extends IWorkflowDefinition {
    AssignedToPersona?: IPersonaProps;
}

export default class ActionControl extends React.Component<ITaskActionProps, ITaskActionState> {

    private _workflowDefinitionService: WorkflowDefinitionService;
    private _steps: IStepDefinition[];

    constructor(props: ITaskActionProps, context?: any) {
        super(props, context);
        const currentStepAssignedTo: IPersonaProps[] = [];
        this._steps = clone(props.nextSteps);
        if (this._steps.length > 0) {
            this._steps.forEach((value) => {
                if (McsUtil.isDefined(value.AssignedTo)) {
                    const assignedUser: IUser = McsUtil.getAssignedUser(this.props.bill, value);
                    if (McsUtil.isDefined(assignedUser)) {
                        value.AssignedTo = assignedUser;
                        const persona: IPersonaProps = {};
                        persona.primaryText = assignedUser.Title;
                        persona.tertiaryText = assignedUser.EMail;
                        persona.imageUrl = `/_layouts/15/userphoto.aspx?size=S&accountname=${assignedUser.EMail}`;
                        persona.imageShouldFadeIn = true;
                        persona.secondaryText = assignedUser.Title;
                        value.AssignedToPersona = persona;
                    } else {
                        value.AssignedToPersona = null;
                    }
                } else {
                    value.AssignedToPersona = null;
                }
            });
            const assignedTo: IPersonaProps = this._steps[0].AssignedToPersona;
            if (McsUtil.isDefined(assignedTo)) {
                currentStepAssignedTo.push(assignedTo);
            }
            // this._onStepSelected(null, 0);
        }
        this.state = {
            selectedIndex: 0,
            currentStepAssignedTo,
        };
    }

    public render(): React.ReactElement<ITaskActionProps> {
        const { isLocalEnvironment, spHttpClient } = this.props;
        let actionControlIsRequired: boolean = this.props.required;
        if (!McsUtil.isDefined(actionControlIsRequired)) {
            actionControlIsRequired = true;
        }
        const dropdownOptions: IDropdownOption[] = this._steps.map((value) => {
            const option: IDropdownOption = {
                key: value.Step,
                text: value.StepTitle,
            };
            return option;
        });

        return (
            <div className={styles.actionControl}>
                {this.props.showNextSteps &&
                    <div className={styles.row}>
                        <div className={styles.column12}>
                            <Label>Complete this task by selecting next action from drop-down below and clicking the button to route the bill: </Label>
                        </div>
                        <div className={styles.column12}>
                            {this._steps.length > 1 &&
                                <Dropdown
                                    className={styles.actionSelector}
                                    disabled={this.props.disabled}
                                    selectedKey={dropdownOptions[this.state.selectedIndex].key}
                                    onChanged={this._onStepSelected}
                                    options={dropdownOptions} />
                            }
                            {this._steps.length > 0 && <div className={styles.bottonGroup}>
                                <PrimaryButton text={this._getButtonText()}
                                    disabled={(actionControlIsRequired && this.state.currentStepAssignedTo.length < 1) || (this.props.disabled)}
                                    onClick={this._executeAction} />
                                <div className={styles.peoplePicker}>
                                    <LmsPeoplePicker
                                        label=""
                                        disabled={this.props.disabled}
                                        selectedUser={this._getAssignedTo()}
                                        spHttpClient={spHttpClient}
                                        principalTypeUser={true}
                                        principalTypeSharePointGroup={false}
                                        principalTypeDistributionList={false}
                                        principalTypeSecurityGroup={false}
                                        isLocalEnvironment={isLocalEnvironment}
                                        onchange={this._onPeopleAssignedToStep} />
                                </div>
                            </div>
                            }
                            {this._steps.length === 0 &&
                                <div className={styles.bottonGroup}>
                                    <PrimaryButton text="Complete" onClick={this._completeAction} />
                                </div>
                            }
                        </div>
                    </div>
                }
            </div>
        );
    }

    @autobind
    private _onStepSelected(option: IDropdownOption, index?: number): void {
        let assignedTo: IPersonaProps[] = [];
        if (this._steps.length > 0) {
            if (!McsUtil.isDefined(index)) {
                index = this.state.selectedIndex;
            }
            if (McsUtil.isDefined(this._steps[index].AssignedToPersona)) {
                assignedTo = [this._steps[index].AssignedToPersona];
            }
        }
        this.setState({
            ...this.state,
            selectedIndex: index,
            currentStepAssignedTo: assignedTo,
        });
    }

    @autobind
    private _getButtonText(): string {
        if (this._steps.length > 0) {
            return this._steps[this.state.selectedIndex].StepTitle;
        }
        return "Complete";
    }

    @autobind
    private _getAssignedTo(): IPersonaProps[] {
        if (McsUtil.isArray(this._steps) && this._steps.length > 0 && McsUtil.isDefined(this._steps[this.state.selectedIndex].AssignedTo)) {
            return [this._steps[this.state.selectedIndex].AssignedToPersona];
        }
        return [];
    }

    @autobind
    private _onPeopleAssignedToStep(users: SiteUserProps[], items: IPersonaProps[]): void {
        let newUser: any = null;
        let newPersona: IPersonaProps = null;
        if (users.length > 0) {
            newUser = { Id: users[0].Id, EMail: users[0].Email, Title: users[0].Title };
            newPersona = items[0];
        }
        this._steps[this.state.selectedIndex].AssignedTo = newUser;
        this._steps[this.state.selectedIndex].AssignedToPersona = newPersona;
        this.setState({
            ...this.state,
            currentStepAssignedTo: items,
        });
    }

    @autobind
    private _completeAction(): void {
        this.props.actionClicked(null);
    }

    @autobind
    private _executeAction(): void {
        this.props.actionClicked(this._steps[this.state.selectedIndex]);
    }
}
