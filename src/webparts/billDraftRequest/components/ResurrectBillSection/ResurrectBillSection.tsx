import * as React from "react";
import styles from "./ResurrectBillSection.module.scss";
import { IResurrectBillSectionProps } from "./IResurrectBillSectionProps";
import {
    TextField,
    ChoiceGroup,
    IChoiceGroupOption,
    Dropdown,
} from "office-ui-fabric-react";
import { IResurrectBillSectionState } from "./IResurrectBillSectionState";
import { McsUtil } from "mcs-lms-core";

export default class ResurrectBillSection extends React.Component<IResurrectBillSectionProps, IResurrectBillSectionState>  {
    constructor(props: any) {
        super(props);
        this.state = {
            resurrectBill: "No",
        };
    }

    public render(): React.ReactElement<IResurrectBillSectionProps> {
        const options: IChoiceGroupOption[] = this._getResurrectBillOptions();
        return (
            <div className={styles.resurrectbillsection}>
                <div className={styles.container}>
                    <ChoiceGroup
                        className={styles.inlineflex}
                        label="Resurrect Bill?"
                        options={options}
                    />
                    {this.state.resurrectBill === "Manual" && (
                        <div className={styles.row}>
                            <div className={styles.column6}>
                                <TextField
                                    className={styles.inlineflex}
                                    label="Year"
                                    resizable={false} />
                            </div>
                            <div className={styles.column6}>
                                <TextField
                                    className={styles.inlineflex}
                                    label="LsoNumber"
                                    resizable={false} />
                            </div>
                            <div className={styles.column12}>
                                <TextField
                                    className={styles.inlineflex}
                                    label="Catch Title"
                                    resizable={false} />
                            </div>
                        </div>
                    )}
                    {this.state.resurrectBill === "Sharepoint" && (

                        <div className={styles.row}>
                            <div className={styles.column4}>
                                <Dropdown
                                    placeHolder="Select Bill Year"
                                    options={[
                                        { key: "2015", text: "2015" },
                                        { key: "2016", text: "2016" },
                                        { key: "2017", text: "2017" },
                                        { key: "2018", text: "2018" },
                                    ]} />
                            </div>
                            <div className={styles.column4}>
                                <Dropdown
                                    placeHolder="Select Bill to Resurrect"
                                    options={[
                                        { key: "SelectBillYear", text: "Select Bill Year" },
                                        { key: "12LSO-0001", text: "12LSO-0001" },
                                        { key: "12LSO-0002", text: "12LSO-0002" },
                                    ]} />
                            </div>
                            <div className={styles.column4}>
                                <Dropdown
                                    placeHolder="Select Version"
                                    options={[
                                        { key: "SelectVersion", text: "Select Version" },
                                        { key: "WorkingDraft", text: "Working Draft" },
                                    ]} />
                            </div>
                            <div className={styles.column12}>
                                <TextField
                                    className={styles.inlineflex}
                                    label="Catch Title"
                                    resizable={false} />
                            </div>
                            <div className={styles.column12}>
                                <TextField
                                    className={styles.inlineflex}
                                    label="Sponsor"
                                    resizable={false} />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    private _getResurrectBillOptions(): IChoiceGroupOption[] {
        const options: IChoiceGroupOption[] =
            [
                {
                    key: "Manual",
                    text: "Manual",
                } as IChoiceGroupOption,
                {
                    key: "Sharepoint",
                    text: "Sharepoint",
                },
                {
                    key: "No",
                    text: "No",
                },
            ];
        return options;
    }
}
