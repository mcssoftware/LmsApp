import React = require("react");
import styles from "./JccReport.module.scss";
import { IJccReportProps } from "./IJccReportProps";
import { IJccReportState } from "./IJccReportState";
import { Modal } from "office-ui-fabric-react/lib/components/Modal";
import {
    autobind,
    PrimaryButton,
    DefaultButton,
    List,
    MessageBar,
    MessageBarType,
    ChoiceGroup,
    IChoiceGroupOption,
} from "office-ui-fabric-react";
import { McsUtil, IAmendmentEntity, JccAmendType } from "mcs-lms-core";
import { Loading, Error } from "../../../../controls/Loading/Loading";
import { AdoptedAmendmentService } from "../../../../services/AdoptedAmendmentService";

export default class JccReport extends React.Component<IJccReportProps, IJccReportState> {
    private _adoptedAmendmentService: AdoptedAmendmentService;
    constructor(props: IJccReportProps, context?: any) {
        super(props, context);
        this.state = {
            showModal: false,
            loading: true,
            error: "",
            adoptedAmendments: null,
        };
        this._adoptedAmendmentService = new AdoptedAmendmentService(props.isLocalEnvironment);
    }

    public componentWillReceiveProps(nextProps: IJccReportProps, nextContext: any): void {
        if (nextProps.showJccForm) {
            this.setState({ showModal: true, loading: true, error: "", adoptedAmendments: null });
            this._getData();
        }
    }

    public render(): React.ReactElement<IJccReportProps> {
        const canCreateJccAmendment: boolean = McsUtil.isDefined(this.props.bill) && McsUtil.isString(this.props.bill.BillNumber) &&
            McsUtil.isArray(this.state.adoptedAmendments) && this.state.adoptedAmendments.length > 0;
        return (
            <Modal isOpen={this.state.showModal}
                onDismiss={this._closeModal}
                isBlocking={true}
                containerClassName={styles.modalContainer}>
                <div className={styles.modalHeader}>
                    <span>JCC Report</span>
                </div>
                <div className={styles.modalBody}>
                    {!McsUtil.isDefined(this.props.bill) &&
                        <MessageBar messageBarType={MessageBarType.error} isMultiline={false}>
                            Invalid bill number.
                        </MessageBar>
                    }
                    {McsUtil.isDefined(this.props.bill) &&
                        <div>
                            {this.state.loading && <Loading />}
                            {!this.state.loading && (this.state.error !== "") && <Error message={this.state.error} />}
                            {!this.state.loading && (this.state.error === "") &&
                                <div className="listScrollingContainer" data-is-scrollable={true}>
                                    <List
                                        items={this.state.adoptedAmendments}
                                        onRenderCell={this._onRenderCell}
                                        renderedWindowsAhead={4} />
                                </div>}
                        </div>
                    }
                </div>
                <div className={styles.modalFooter}>
                    <PrimaryButton disabled={!canCreateJccAmendment} text="Create Jcc" onClick={this._createJccClicked} />
                    <DefaultButton text="Cancel" onClick={this._closeModal} />
                </div>
            </Modal>
        );
    }

    private _onRenderCell(item: IAmendmentEntity, index: number | undefined): JSX.Element {
        const choices: IChoiceGroupOption[] = [
            {
                key: JccAmendType.Adopt.toString(),
                text: "Adopt",
            } as IChoiceGroupOption,
            {
                key: JccAmendType.Delete.toString(),
                text: "Delete",
            },
            {
                key: JccAmendType.Amend.toString(),
                text: "Delete and further Amend",
            },
        ];
        return (
            <div className={styles.row}>
                <div className={styles.column4}>{item.AmendmentNumber}</div>
                <div className={styles.column8}>
                    <ChoiceGroup label=""
                        id={item.AmendmentNumber}
                        selectedKey={item.amendType.toString()}
                        className={styles.inlineflex}
                        options={choices}
                        onChange={this._onRadioChange}
                        required={true}
                    />
                </div>
            </div>
        );
    }

    private _getData(): void {
        if (McsUtil.isDefined(this.props.bill) && McsUtil.isString(this.props.bill.BillNumber)) {
            this._adoptedAmendmentService.getAdoptedAmendments(this.props.bill)
                .then((response: IAmendmentEntity[]) => {
                    if (McsUtil.isArray(response)) {
                        const adoptedAmendments: IAmendmentEntity[] = response.map((v) => {
                            const v1: IAmendmentEntity = v as IAmendmentEntity;
                            v1.amendType = JccAmendType.Amend;
                            return v1;
                        });
                        this.setState({ ...this.state, loading: false, error: "", adoptedAmendments });
                    } else {
                        this.setState({ ...this.state, loading: false, error: "Unable to get adopted amendments." });
                    }
                });
        } else {
            this.setState({ ...this.state, loading: false, error: "Bill number is required." });
        }
    }

    @autobind
    private _onRadioChange(ev?: React.FormEvent<HTMLElement | HTMLInputElement>, option?: IChoiceGroupOption): void {
        // tslint:disable-next-line:no-console
        console.log(ev);
    }

    @autobind
    private _closeModal(): void {
        this.setState({ showModal: false });
        this.props.onDismiss(null, null);
    }

    @autobind
    private _createJccClicked(): void {
        this.setState({ showModal: false });
        const houseOfOriginAdoptedAmendment: IAmendmentEntity[] = this.state.adoptedAmendments.filter((v) => v.Chamber === this.props.bill.HouseofOrigin);
        const oppositeChamberAdoptedAmendment: IAmendmentEntity[] = this.state.adoptedAmendments.filter((v) => v.Chamber !== this.props.bill.HouseofOrigin);
        this.props.onDismiss(houseOfOriginAdoptedAmendment, oppositeChamberAdoptedAmendment);
    }
}