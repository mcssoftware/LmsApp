import * as React from "react";
import styles from "./JccAssignment.module.scss";
import { escape, clone } from "@microsoft/sp-lodash-subset";
import {
  autobind,
  Label,
  TextField,
  PrimaryButton,
  DetailsList, Selection, IColumn,
  MarqueeSelection,
  DatePicker,
  MessageBar, MessageBarType,
} from "office-ui-fabric-react";

import { IJccAssignmentProps } from "./IJccAssignmentProps";
import { IJccAssignmentState, IJccAssignment } from "./IJccAssignmentState";
import { ITasks, ICommittee } from "mcs-lms-core";
import LmsTask from "../../lmsTask/components/LmsTask";
import { SponsorService } from "../../../services/SponsorService";
import { Loading } from "../../../controls/Loading/Loading";
import WebpartHeader from "../../../controls/WebpartHeader/WebpartHeader";

export interface IButtonPermission {
  CanAddItem: boolean;
  CanRemoveItem: boolean;
  CanSetChairman: boolean;
}
export default class JccAssignment extends React.Component<IJccAssignmentProps, IJccAssignmentState> {
  private _sponsorService: SponsorService;
  private _buttonPermission: IButtonPermission;
  private _inactiveSelection: Selection;
  private _activeSelection: Selection;

  constructor(props: any, context: any) {
    super(props, context);
    this._sponsorService = new SponsorService(props.isLocalEnvironment);
    this._buttonPermission = {
      CanAddItem: false,
      CanRemoveItem: false,
      CanSetChairman: false,
    };

    this._inactiveSelection = new Selection({
      onSelectionChanged: () => this._selectionChanged(),
    });
    this._activeSelection = new Selection({
      onSelectionChanged: () => this._selectionChanged(),
    });

    this.state = ({
      loading: true,
      error: "",
      inactiveCommittees: [],
      jccAssignment: this._getDefaultJccAssignment(),
      showSpinner: false,
    });
  }

  public componentDidMount(): void {
    this._loadData();
  }

  public render(): React.ReactElement<IJccAssignmentProps> {
    const { title } = this.props;
    return (
      <div>
        <div className={styles.jccAssignment}>
          <div className={styles.row}>
            {this._getJCCAssignmentSection()}
            <LmsTask
              title="Bill Processing Task"
              isLocalEnvironment={this.props.isLocalEnvironment}
              spHttpClient={this.props.spHttpClient}
              showTaskSpecificSection={true}
              showTaskAction={true}
              showSpinner={this.state.showSpinner}
            />
          </div>
        </div>
      </div >
    );
  }

  private _getSelectionDetails(isActiveSelection: boolean = false): any {
    const selection: Selection = isActiveSelection ? this._activeSelection : this._inactiveSelection;
  }

  @autobind
  private _getJCCAssignmentSection(): JSX.Element {
    const { jccAssignment } = this.state;
    return (
      <div className={styles.jccAssignment}>
        <WebpartHeader webpartTitle={this.props.title} />
        {this.state.loading && <Loading />}
        {!this.state.loading &&
          <div className={styles.content}>
            <div className={styles.row}>
              <div className={styles.column6}>
                <DatePicker
                  value={new Date(this.state.jccAssignment.MeetingDate)}
                  label="Meeting Date"
                  isRequired={true}
                  allowTextInput={false}
                  isMonthPickerVisible={false}
                  onSelectDate={this._onMeetingDateSelected}
                  placeholder="Select date received..." />
              </div>
              <div className={styles.column6}>
                <TextField label="Meeting Time" placeholder="Enter meeting time ..." value={jccAssignment.MeetingTime} onChanged={this._meetingTimeChanged} />
              </div>
            </div>
            <div className={styles.row}>
              <div className={styles.column6}>
                <TextField label="Meeting Location" value={jccAssignment.MeetingLocation}
                  onChanged={this._onMeetingLocationChanged}
                  required={true}
                  placeholder="Enter a location ..." />
              </div>
            </div>
            <div className={styles.row}>
              <div className={styles.column5} >
                <div className={styles.borderedTable}>
                  <MarqueeSelection selection={this._inactiveSelection}>
                    <DetailsList
                      items={this.state.inactiveCommittees}
                      columns={this._createColumn("CommitteeDisplayTitle")}
                      selectionPreservedOnEmptyClick={true}
                      selection={this._inactiveSelection}
                      ariaLabelForSelectionColumn="Toggle selection"
                      ariaLabelForSelectAllCheckbox="Toggle selection for all items"
                    />
                  </MarqueeSelection>
                </div>
              </div>
              <div className={styles.column2} >
                <div>
                  <PrimaryButton text="Add" onClick={this._addCommittees} disabled={!this._buttonPermission.CanAddItem} />
                </div>
                <div>
                  <PrimaryButton text="Remove" onClick={this._removeCommittees} disabled={!this._buttonPermission.CanRemoveItem} />
                </div>
              </div>
              <div className={styles.column5}>
                <div className={styles.borderedTable}>
                  <MarqueeSelection selection={this._activeSelection}>
                    <DetailsList
                      items={this.state.jccAssignment.Committees}
                      columns={this._createColumn("CommitteeDisplayTitle")}
                      selection={this._activeSelection}
                      selectionPreservedOnEmptyClick={true}
                      ariaLabelForSelectionColumn="Toggle selection"
                      ariaLabelForSelectAllCheckbox="Toggle selection for all items"
                    />
                  </MarqueeSelection>
                </div>
              </div>
            </div>
            <div className={styles.row}>
              <div className={styles.column8}>
                <MessageBar messageBarType={MessageBarType.info} isMultiline={true}>
                  To appoint the Committee chairman, select a JCC Member and click the Chairman button.</MessageBar>
              </div>
              <div className={styles.column4}>
                <div>
                  <PrimaryButton text="Set Chairman" onClick={this._setChairman} disabled={!this._buttonPermission.CanSetChairman} />
                </div>
                <div>
                  <TextField value={jccAssignment.Chairman} readOnly={true} />
                </div>
                <div>
                  <PrimaryButton text="Save JCC" onClick={this._saveJccAssignment} />
                </div>
              </div>
            </div>
          </div>}
      </div>
    );
  }

  private _selectionChanged(): void {
    const inActiveItems: number = this._inactiveSelection.getSelectedCount();
    const activeItems: number = this._activeSelection.getSelectedCount();
    this._buttonPermission.CanAddItem = inActiveItems > 0;
    this._buttonPermission.CanRemoveItem = activeItems > 0;
    this._buttonPermission.CanSetChairman = activeItems === 1;
    this.setState({ ...this.state });
  }

  private _getSelectedItems(active: boolean = true): ICommittee[] {
    return ((active) ? this._activeSelection.getSelection() : this._inactiveSelection.getSelection()) as ICommittee[];
  }

  private _createColumn(columnName: string): IColumn[] {
    return [{
      key: columnName,
      name: columnName,
      fieldName: columnName,
      minWidth: 50,
    }];
  }

  @autobind
  private _onMeetingDateSelected(date: Date | null | undefined): void {
    const jcc: IJccAssignment = clone(this.state.jccAssignment);
    jcc.MeetingDate = date.toString();
    this.setState({
      ...this.state,
      jccAssignment: jcc,
    });
  }

  @autobind
  private _meetingTimeChanged(value: string): void {
    const jcc: IJccAssignment = clone(this.state.jccAssignment);
    jcc.MeetingTime = value;
    this.setState({
      ...this.state,
      jccAssignment: jcc,
    });
  }

  @autobind
  private _onMeetingLocationChanged(value: string): void {
    const jcc: IJccAssignment = clone(this.state.jccAssignment);
    jcc.MeetingLocation = value;
    this.setState({
      ...this.state,
      jccAssignment: jcc,
    });
  }

  @autobind
  private _addCommittees(): void {
    const jccAssignment: IJccAssignment = clone(this.state.jccAssignment);
    const inactiveCommittees: ICommittee[] = clone(this.state.inactiveCommittees);
    this._getSelectedItems(false).forEach((selectedItem) => {
      jccAssignment.Committees.push(selectedItem);
      inactiveCommittees.splice(inactiveCommittees.indexOf(selectedItem), 1);
    });
    this.setState({ ...this.state, jccAssignment, inactiveCommittees });
  }

  @autobind
  private _removeCommittees(): void {
    const jccAssignment: IJccAssignment = clone(this.state.jccAssignment);
    const inactiveCommittees: ICommittee[] = clone(this.state.inactiveCommittees);
    this._getSelectedItems(true).forEach((selectedItem) => {
      inactiveCommittees.push(selectedItem);
      jccAssignment.Committees.splice(jccAssignment.Committees.indexOf(selectedItem), 1);
    });
    this.setState({ ...this.state, jccAssignment, inactiveCommittees });
  }

  @autobind
  private _setChairman(): void {
    const jccAssignment: IJccAssignment = clone(this.state.jccAssignment);
    const selectedItem: ICommittee = this._getSelectedItems(true)[0];
    jccAssignment.Chairman = selectedItem.CommitteeShortName;
    this.setState({
      ...this.state,
      jccAssignment,
    });
  }

  @autobind
  private _saveJccAssignment(): void {
    this.setState({ ...this.state, showSpinner: true });
  }

  @autobind
  private _preTaskCompletionAction(): Promise<ITasks> {
    return null; // currently null for error reduction only
  }

  private _loadData(): void {
    this._sponsorService.getCommittee().then((committees) => {
      this.setState({
        ...this.setState,
        inactiveCommittees: committees,
        loading: false,
      });
    }, (err) => {
      this.setState({ ...this.setState, loading: false, error: err });
    });
  }

  private _getDefaultJccAssignment(): IJccAssignment {
    return {
      MeetingTime: "",
      MeetingLocation: "",
      MeetingDate: new Date().toString(),
      Committees: [],
      Chairman: "",
    } as IJccAssignment;
  }
}
