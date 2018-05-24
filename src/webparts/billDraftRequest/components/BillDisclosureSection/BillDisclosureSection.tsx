import * as React from "react";
import styles from "./BillDisclosureSection.module.scss";
import { IBillDisclosureSectionProps } from "./IBillDisclosureSectionProps";
import {
    autobind,
    TextField,
    Dropdown,
    ChoiceGroup,
    IChoiceGroupOption,
} from "office-ui-fabric-react";
import { IBillDisclosureSectionState } from "./IBillDisclosureSectionState";
import { clone } from "@microsoft/sp-lodash-subset";
import InfoReceivedSection from "../InfoReceivedSection/InfoReceivedSection";
import { McsUtil } from "mcs-lms-core";

export default class BillDisclosureSection extends React.Component<IBillDisclosureSectionProps, IBillDisclosureSectionState>  {
    constructor(props: IBillDisclosureSectionProps, context?: any) {
        super(props, context);
        this.state = { billDisclosed: "Unknown", billDisclosedLevel: "Entire" };
    }

    public componentDidUpdate(prevProp: IBillDisclosureSectionProps): void {
        if (prevProp.billDisclosed !== this.props.billDisclosed) {
            let billDisclosed: string = "Unknown";
            let billDisclosedLevel: string = "Entire";
            if (McsUtil.isDefined(this.props)) {
                switch (this.props.billDisclosed) {
                    case "BillDraftsOnly":
                    case "Entire":
                        billDisclosed = "Yes";
                        billDisclosedLevel = this.props.billDisclosed;
                        break;
                    case "Unknown":
                    case "No":
                        billDisclosed = this.props.billDisclosed;
                        break;
                    default:
                        billDisclosed = "Yes";
                        billDisclosedLevel = this.props.billDisclosed;
                }
            }
            this.setState({ ...this.state, billDisclosed, billDisclosedLevel });
        }
    }

    public render(): React.ReactElement<IBillDisclosureSectionProps> {
        const { billDisclosed, billDisclosedLevel } = this.state;
        return (
            <div className={styles.billdisclosuresection} >
                <div className={styles.container}>
                    <div className={styles.row}>
                        <div className={styles.column12}>
                            <ChoiceGroup
                                className={styles.inlineflex}
                                label="Should this bill be disclosed?"
                                selectedKey={billDisclosed}
                                options={this._getBillDisclosedOptions()}
                                onChange={this._shouldBillBeDisclosed} />
                        </div>
                    </div>
                    <div className={styles.row}>
                        <div className={styles.column12}>
                            <InfoReceivedSection selectedValue={billDisclosedLevel}
                                label="At level bill is disclosed?"
                                options={this._getBillDisclosedLevels()} onChanged={this._onBillDisclosureLevelChanged} />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    @autobind
    private _getBillDisclosedOptions(): IChoiceGroupOption[] {
        const options: IChoiceGroupOption[] = [
            { key: "Yes", text: "Yes" } as IChoiceGroupOption,
            { key: "No", text: "No" },
            { key: "Unknown", text: "Unknown" },
        ];
        return options;
    }

    @autobind
    private _getBillDisclosedLevels(): IChoiceGroupOption[] {
        const options: IChoiceGroupOption[] = [
            { key: "Entire", text: "Entire Drafting Folder", disabled: this.state.billDisclosed !== "Yes" } as IChoiceGroupOption,
            { key: "BillDraftsOnly", text: "Bill Drafts Only", disabled: this.state.billDisclosed !== "Yes" },
            { key: "Other", text: "Other", disabled: this.state.billDisclosed !== "Yes" },
        ];
        return options;
    }

    @autobind
    private _onBillDisclosureLevelChanged(value: string): void {
        this.setState({ ...this.state, billDisclosedLevel: value });
        this._callbackOnChanged(this.state.billDisclosed, value);
    }

    @autobind
    private _shouldBillBeDisclosed(ev?: React.FormEvent<HTMLElement | HTMLInputElement>, option?: IChoiceGroupOption): void {
        this.setState({ ...this.state, billDisclosed: option.key });
        this._callbackOnChanged(option.key, this.state.billDisclosedLevel);
    }

    private _callbackOnChanged(billDisclosed: string, billDisclosedLevel: string): void {
        if (McsUtil.isDefined(this.props.onChanged)) {
            if (billDisclosed !== "Yes") {
                this.props.onChanged(billDisclosed);
            } else {
                this.props.onChanged(billDisclosedLevel);
            }
        }
    }
}
