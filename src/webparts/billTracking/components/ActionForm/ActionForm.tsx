import * as React from "react";
import styles from "./ActionForm.module.scss";
import { Log } from "@microsoft/sp-core-library";
import { escape, clone, random } from "@microsoft/sp-lodash-subset";
import { UrlQueryParameterCollection } from "@microsoft/sp-core-library";
import {
    autobind,
    Label,
    Dropdown, IDropdownOption,
    TextField,
    PrimaryButton, DefaultButton,
    DetailsList, DetailsListLayoutMode, Selection, IColumn, SelectionMode, ConstrainMode,
} from "office-ui-fabric-react";

import { IActionFormProps } from "./IActionFormProps";
import { IActionFormState, IFormSelectedData } from "./IActionFormState";
import { TasksServices } from "../../../../services/TasksService";
import { TaskActionService } from "../../../../services/TaskActionService";
import { BillsService } from "../../../../services/BillsService";
import { BillDigestService } from "../../../../services/BillDigestService";
import { WorkflowDefinitionService } from "../../../../services/WorkflowDefinitionService";
import { IBills, ITasks, IAmendments, IRollCall, IActionDefinition, IBillDigest, ITaskAction, McsUtil } from "mcs-lms-core";
import { IDocument } from "./IDocument";
import WebpartHeader from "../../../../controls/WebpartHeader/WebpartHeader";
import { TaskActionBusiness } from "./TaskActionBusiness";
import { Dictionary } from "sp-pnp-js";
import { Loading, Error } from "../../../../controls/Loading/Loading";
import SpinnerControl from "../../../../controls/Loading/SpinnerControl";

interface IFormControl {
    disableDeleteButton: boolean;
    isVoteIdRequired: boolean;
    documentDdlOptions: IDropdownOption[];
    actionTypeDdlOptions: IDropdownOption[];
    voteIdDdlOptions: IDropdownOption[];
    GridDisplayColumns: IColumn[];
    Selection: Selection;
    selectedTaskAction?: ITaskAction;
}

export class ActionForm extends React.Component<IActionFormProps, IActionFormState> {
    private _logic: TaskActionBusiness;
    private _formControl: IFormControl;
    private _items: IDocument[];
    private _spinner: SpinnerControl;

    constructor(props: IActionFormProps, context: any) {
        super(props, context);
        this._formControl = {
            disableDeleteButton: true,
            documentDdlOptions: [],
            actionTypeDdlOptions: [],
            voteIdDdlOptions: [],
            isVoteIdRequired: false,
            GridDisplayColumns: [
                {
                    key: "Document", name: "Document", fieldName: "Document", minWidth: 75, maxWidth: 110,
                    onRender: (item: IDocument) => {
                        return (
                            <span>{item.document}</span>
                        );
                    },
                },
                {
                    key: "ActionType", name: "Action Type", fieldName: "Action Type", minWidth: 75, maxWidth: 320,
                    onRender: (item: IDocument) => {
                        return (
                            <span>{item.actionType}</span>
                        );
                    },
                },
                {
                    key: "VoteId", name: "Vote Id", fieldName: "Action Type", minWidth: 75, maxWidth: 75,
                    onRender: (item: IDocument) => {
                        return (
                            <span>{item.voteId}</span>
                        );
                    },
                },
            ],
            Selection: new Selection({
                onSelectionChanged: () => {
                    this._selectionDetails();
                },
            }),
        };
        this.state = {
            ...this.state,
            Task: null,
            commentEnabled: false,
            loading: true,
            error: "",
            SelectedData: {} as IFormSelectedData,
        };
    }

    public componentDidUpdate(prevProp: IActionFormProps, prevState: IActionFormState): void {
        if (!McsUtil.isDefined(this._logic) && McsUtil.isDefined(this.props.task)) {
            const { isLocalEnvironment, task, httpClient, token } = clone(this.props);
            this._logic = new TaskActionBusiness(isLocalEnvironment, task.BillLookup, task, task.WorkflowStep, httpClient, token);
            this._logic.LoadData().then(() => {
                this._loadData();
            }, (error) => {
                this._setErrorState(error, false);
            });
        }
    }

    public render(): React.ReactElement<IActionFormProps> {
        const { SelectedData, loading, error } = this.state;
        return (
            <div className={styles.actionForm} >
                <div className={styles.container}>
                    <WebpartHeader webpartTitle="Action Form" />
                    {loading && <Loading />}
                    {!loading && error !== "" && <Error message={error} />}
                    {!loading && error === "" &&
                        <div className={styles.content}>
                            <div className={styles.row}>
                                <div className={styles.column3}>
                                    <Dropdown
                                        label="Document"
                                        selectedKey={SelectedData.SelectedDocument}
                                        options={this._formControl.documentDdlOptions}
                                        onChanged={this._documentSelected}
                                    />
                                </div>
                                <div className={styles.column6}>
                                    <Dropdown
                                        label="Action Type"
                                        selectedKey={SelectedData.SelectedAction}
                                        options={this._formControl.actionTypeDdlOptions}
                                        onChanged={this._actionSelected}
                                    />
                                </div>
                                {this._formControl.isVoteIdRequired && <div className={styles.column3}>
                                    <Dropdown
                                        label="Vote Id"
                                        selectedKey={SelectedData.SelectedVote}
                                        options={this._formControl.voteIdDdlOptions}
                                        onChanged={this._voteSelected}
                                    />
                                </div>}
                            </div>
                            <div className={styles.row}>
                                <div className={styles.columnMessage}>
                                    <TextField
                                        value={SelectedData.Message}
                                        readOnly={this._formControl.actionTypeDdlOptions.length < 1}
                                        onChanged={this._messageChanged}
                                        required={true} />
                                </div>
                            </div>
                            <div className={styles.row}>
                                <div className={styles.column12}>
                                    <PrimaryButton
                                        onClick={this._saveAction}
                                        text="Save"
                                        disabled={!this._canInsertAction()} />
                                    &ensp;
                                <DefaultButton
                                        iconProps={{ iconName: "Delete" }}
                                        text="Delete Selected Action"
                                        disabled={this._formControl.disableDeleteButton}
                                        onClick={this._removeAction}
                                    />
                                </div>
                            </div>
                            <div className={styles.row}>
                                <div className={styles.column12}>
                                    <DetailsList
                                        items={this._items}
                                        compact={true}
                                        columns={this._formControl.GridDisplayColumns}
                                        setKey="set"
                                        selection={this._formControl.Selection}
                                        selectionMode={SelectionMode.single}
                                        layoutMode={DetailsListLayoutMode.justified}
                                        isHeaderVisible={true}
                                        selectionPreservedOnEmptyClick={true}
                                        enterModalSelectionOnTouch={true}
                                        constrainMode={ConstrainMode.unconstrained}
                                    />
                                </div>
                                <SpinnerControl onRef={(ref) => (this._spinner = ref)} />
                            </div>
                        </div>}
                </div>
                <br />
            </div>
        );
    }

    @autobind
    private _documentSelected(option: IDropdownOption, index?: number): void {
        const defaultSelectedAction: number = this._setActionOptions(option.key as string);
        const defaultSelectedVote: number = this._setVoteOptions(option.key as string, option.text);
        const selectedOptions: IFormSelectedData = {} as IFormSelectedData;
        if (defaultSelectedAction > 0) {
            selectedOptions.SelectedAction = defaultSelectedAction;
        }
        if (defaultSelectedVote > 0) {
            selectedOptions.SelectedVote = defaultSelectedVote;
        }
        selectedOptions.SelectedDocument = option.key.toString();
        this._setActionMessage(selectedOptions);
    }

    @autobind
    private _actionSelected(option: IDropdownOption, index?: number): void {
        const selectedOptions: IFormSelectedData = {} as IFormSelectedData;
        selectedOptions.SelectedDocument = this.state.SelectedData.SelectedDocument;
        selectedOptions.SelectedAction = option.key as number;
        selectedOptions.SelectedVote = this.state.SelectedData.SelectedVote;
        const action: IActionDefinition = this._logic.getActionsById(selectedOptions.SelectedAction);
        this._formControl.isVoteIdRequired = this._logic.isVoteRequired(action);
        this._setActionMessage(selectedOptions);
    }

    @autobind
    private _voteSelected(option: IDropdownOption, index?: number): void {
        const selectedOptions: IFormSelectedData = {} as IFormSelectedData;
        selectedOptions.SelectedDocument = this.state.SelectedData.SelectedDocument;
        selectedOptions.SelectedAction = this.state.SelectedData.SelectedAction;
        selectedOptions.SelectedVote = option.key as number;
        this._setActionMessage(selectedOptions);
    }

    @autobind
    private _messageChanged(newvalue: string): void {
        const selectedOptions: IFormSelectedData = clone(this.state.SelectedData);
        selectedOptions.Message = newvalue;
        this.setState({ ...this.state, SelectedData: selectedOptions });
    }

    @autobind
    private _saveAction(): void {
        this._spinner.setVisibility(true);
        const selectedOptions: IFormSelectedData = clone(this.state.SelectedData);
        this._logic.addTaskAction(parseInt(selectedOptions.SelectedDocument, 10), selectedOptions.SelectedAction, selectedOptions.Message,
            this._formControl.isVoteIdRequired ? selectedOptions.SelectedVote : 0).then(() => {
                this._spinner.setVisibility(false);
                this._loadData();
            }, (error) => { this._setErrorState(error, false); });
    }

    @autobind
    private _removeAction(): void {
        this._spinner.setVisibility(true);
        this._logic.removeTaskAction(this._formControl.selectedTaskAction).then(() => {
            this._spinner.setVisibility(false);
            this._loadData();
        });
    }

    private _canInsertAction(): boolean {
        const { SelectedData } = this.state;
        if (McsUtil.isDefined(SelectedData) && McsUtil.isString(SelectedData.Message)) {
            if (this._formControl.isVoteIdRequired) {
                return SelectedData.SelectedVote !== 0;
            } else {
                return true;
            }
        }
        return false;
    }

    /**
     * @summary: when a row is selected, fill the form and let user delete the task action
     * @private
     * @memberof ActionForm
     */
    private _selectionDetails(): void {
        if (McsUtil.isDefined(this._formControl.Selection)) {
            const selectedIndices: any = this._formControl.Selection.getSelectedIndices();
            this._formControl.disableDeleteButton = true;
            if (McsUtil.isArray(selectedIndices) && selectedIndices.length > 0) {
                const selectedIndex: number = this._formControl.Selection.getSelectedIndices()[0];
                const selectedRow: IDocument = this._formControl.Selection.getItems()[selectedIndex];
                if (McsUtil.isDefined(selectedRow.data)) {
                    this._formControl.disableDeleteButton = false;
                    this._formControl.selectedTaskAction = selectedRow.data;
                    this.setState({ ...this.state });
                }
            }
        }
    }

    /**
     * When document is changd set action options and
     * return default selected action.
     * @private
     * @param {string} documentKey : selected document KEY
     * @returns {number}: default selected action
     * @memberof ActionForm
     */
    private _setActionOptions(documentKey: string): number {
        const actions: IActionDefinition[] = this._logic.getActions(documentKey);
        let defaultSelectedAction: IActionDefinition = null;
        this._formControl.actionTypeDdlOptions = actions.map((action) => {
            if (!!defaultSelectedAction && action.ActionDisposition === "Passed") {
                defaultSelectedAction = action;
                this._formControl.isVoteIdRequired = this._logic.isVoteRequired(action);
                return { key: action.Id, text: action.ActionName, selected: true } as IDropdownOption;
            } else {
                return { key: action.Id, text: action.ActionName };
            }
        });
        if (defaultSelectedAction === null && actions.length > 0) {
            defaultSelectedAction = actions[0];
        }
        if (defaultSelectedAction !== null) {
            this._formControl.isVoteIdRequired = this._logic.isVoteRequired(defaultSelectedAction);
            return defaultSelectedAction.Id;
        }
        this._formControl.isVoteIdRequired = false;
        return 0;
    }

    /**
     * when documet is changed set vote options
     * and return default selected vote.
     * @private
     * @param {string} documentKey : document dropdown KEY
     * @param {string} documentValue : document dropdown VALUE
     * @returns {number} :default selected vote.
     * @memberof ActionForm
     */
    private _setVoteOptions(documentKey: string, documentValue: string): number {
        if (this._formControl.isVoteIdRequired) {
            const votes: IRollCall[] = this._logic.getRollCall(documentKey, documentValue);
            this._formControl.voteIdDdlOptions = votes.map((vote) => {
                return { key: vote.Id, text: vote.VoteId.toString() };
            });
            if (this._formControl.voteIdDdlOptions.length > 0) {
                return this._formControl.voteIdDdlOptions[0].key as number;
            }
        }
        return 0;
    }

    private _getActionMessage(selectedActionKey: number, selectedRollCallKey: number): string {
        const selectedActionType: IActionDefinition = this._logic.getActionsById(selectedActionKey);
        const selectedRollCall: IRollCall = this._logic.getRollCallById(selectedRollCallKey);
        let actionMessage: string = "";
        if (McsUtil.isDefined(selectedActionType)) {
            const tempactionMessage: string = (McsUtil.isString(selectedActionType.ActionShortDescription) ?
                selectedActionType.ActionShortDescription : selectedActionType.ActionName).trim();
            if (selectedActionType.AmendmentRequired) {
                actionMessage = tempactionMessage;
            } else {
                const stepTitle: string = this._logic.getWorkflowStepTitle();
                if (/{Action}/gi.test(stepTitle)) {
                    actionMessage = stepTitle.replace(/{Action}/gi, tempactionMessage);
                } else {
                    actionMessage = `${stepTitle}:${tempactionMessage}`;
                }
            }
            const chamber: string = this._logic.getChamber();
            if (McsUtil.isString(chamber)) {
                const shortChamber: string = chamber.toUpperCase().trim()[0];
                actionMessage = actionMessage.replace(/{TaskChamber}/gi, shortChamber)
                    .replace(/{Chamber}/gi, shortChamber)
                    .replace(/{ChamberFull}/gi, chamber);
            }
            actionMessage = actionMessage.replace(/{JccNumber}/gi, this._logic.getJccNumber());
            if (McsUtil.isDefined(selectedRollCall)) {
                if (McsUtil.isString(selectedRollCall.CommitteeId)) {
                    actionMessage = actionMessage.replace(/{CommitteeID}/gi, selectedRollCall.CommitteeId);
                } else {
                    actionMessage = actionMessage.replace(/{CommitteeID}/gi, "");
                }
                if (McsUtil.isString(selectedRollCall.CommitteeName)) {
                    actionMessage = actionMessage.replace(/{CommitteeName}/gi, selectedRollCall.CommitteeName);
                } else {
                    actionMessage = actionMessage.replace(/{CommitteeName}/gi, "");
                }
                if (selectedActionType.VoteIdRequired || selectedActionType.CommitteeVoteIDRequired) {
                    // tslint:disable-next-line:max-line-length
                    actionMessage = `${actionMessage} ${selectedRollCall.YesVotes}-${selectedRollCall.NoVotes}-${selectedRollCall.ExcusedVotes}-${selectedRollCall.AbsentVotes}-${selectedRollCall.ConflictVotes}`;
                }
            }
        }
        return actionMessage;
    }

    private _loadData(): void {
        this._formControl.disableDeleteButton = true;
        const documents: Dictionary<string> = this._logic.getDocuments();
        const taskActions: ITaskAction[] = this._logic.getTaskActions();
        this._items = taskActions.length > 0 ? taskActions.map((taskAction) => {
            return {
                Id: taskAction.Id,
                data: taskAction,
                document: taskAction.AmendmentLookupId > 0 ?
                    taskAction.AmendmentLookup.AmendmentNumber : taskAction.BillLookup.BillNumber,
                actionType: taskAction.BillStatusMessage,
                voteId: taskAction.VoteID === null ? "-" : taskAction.VoteID,
            };
        }) : [];
        this.props.taskActions(taskActions);
        if (McsUtil.isDefined(documents) && documents !== null) {
            this._formControl.documentDdlOptions = documents.getKeys().map((key) => {
                return { key, text: documents.get(key) };
            });

            if (this._formControl.documentDdlOptions.length > 0) {
                const firstOption: IDropdownOption = this._formControl.documentDdlOptions[0];
                const defaultSelectedAction: number = this._setActionOptions(firstOption.key.toString());
                const defaultSelectedVote: number = this._setVoteOptions(firstOption.key.toString(), firstOption.text);

                const selectedOptions: IFormSelectedData = clone(this.state.SelectedData);
                selectedOptions.SelectedDocument = firstOption.key.toString();
                selectedOptions.SelectedAction = defaultSelectedAction;
                selectedOptions.SelectedVote = defaultSelectedVote;
                this._setActionMessage(selectedOptions);
            } else {
                this._setErrorState("No Document found", false);
            }
        }
    }

    /**
     * @summary: for changing state for dropdowns in form,
     * if value of document dropdown changes, others get changed accordingly
     * initially, document of index 0 is selected by default
     * @private
     * @param {IFormSelectedData} [selections]
     * @memberof ActionForm
     */
    private _setActionMessage(selections: IFormSelectedData): void {
        selections.Message = this._getActionMessage(selections.SelectedAction, selections.SelectedVote);
        this.setState({ ...this.state, SelectedData: selections, loading: false });
    }

    private _setErrorState(message: string, loading: boolean): void {
        this.setState({
            ...this.state,
            error: message,
            loading,
        });
    }
}