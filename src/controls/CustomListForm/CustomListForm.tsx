import * as React from "react";
import { Loading, Error } from "../Loading/Loading";
import { autobind, DefaultButton, PrimaryButton, DirectionalHint, css, MessageBar, MessageBarType, SpinnerSize, Spinner } from "office-ui-fabric-react";
import { ListFormService } from "../../services/ListFormService";
import styles from "./CustomListForm.module.scss";
import { SPFormField } from "./formFields/SPFormField";
import { ICustomListFormProps } from "./ICustomListFormProps";
import { ICustomListFormState } from "./ICustomListFormState";
import { IFieldConfiguration } from "./IFieldConfiguration";
import { cloneDeep } from "@microsoft/sp-lodash-subset";
import { ControlMode } from "./ControlMode";
import { IFieldSchema } from "./RenderListData";

export class CustomListForm extends React.Component<ICustomListFormProps, ICustomListFormState> {
    private listFormService: ListFormService;

    public static configureListMessage: string = "Invalid list id.";

    constructor(props: ICustomListFormProps, context?: any) {
        super(props, context);
        this.listFormService = new ListFormService(this.props.webUrl, this.props.listId);
        this.state = {
            hideDialog: true,
            isLoadingSchema: false,
            isLoadingData: false,
            errors: [],
            notifications: [],
            data: {},
            originalData: {},
            fieldErrors: {},
            isSaving: false,
        };
    }

    public render(): React.ReactElement<ICustomListFormProps> {
        return (
            <div className={styles.listForm}>
                <div className={css(styles.title, "ms-font-xl")}>{this.props.formTitle}</div>
                {this._renderNotifications()}
                {this._renderErrors()}
                {(!this.props.listId) ? <MessageBar messageBarType={MessageBarType.warning}>Please configure a list for this component first.</MessageBar> : ""}
                {(this.state.isLoadingSchema)
                    ? (<Spinner size={SpinnerSize.large} label="Loading the form..." />)
                    : ((this.state.fieldsSchema) &&
                        <div>
                            <div className={css(styles.formFieldsContainer, this.state.isLoadingData ? styles.isDataLoading : null)}>
                                {this._renderFields()}
                            </div>
                            <div className={styles.formButtonsContainer}>
                                {(this.props.formType !== ControlMode.Display) &&
                                    <PrimaryButton
                                        disabled={false}
                                        text="Save"
                                        onClick={this._saveItem}
                                    />
                                }
                                <DefaultButton
                                    disabled={false}
                                    text="Cancel"
                                    onClick={this._cancel}
                                />
                            </div>
                        </div>
                    )
                }
                {this.state.isSaving && <div className={styles.spinner}> <Spinner size={SpinnerSize.large} label="Saving the form..." /> </div>}
            </div>
        );
    }

    public componentDidMount(): void {
        this._readSchema(this.props.listId, this.props.formType).then(
            () => {
                return this._readData(this.props.listId, this.props.formType, this.props.itemId);
            });
    }

    public componentWillReceiveProps(nextProps: ICustomListFormProps): void {
        if ((this.props.listId !== nextProps.listId) || (this.props.formType !== nextProps.formType)) {
            this.listFormService = new ListFormService(nextProps.webUrl, nextProps.listId);
            this._readSchema(nextProps.listId, nextProps.formType).then(
                () => this._readData(nextProps.listId, nextProps.formType, nextProps.itemId),
            );
        } else if ((this.props.itemId !== nextProps.itemId) || (this.props.formType !== nextProps.formType)) {
            this._readData(nextProps.listId, nextProps.formType, nextProps.itemId);
        }
    }

    private _renderNotifications(): any {
        if (this.state.notifications.length === 0) {
            return null;
        }
        setTimeout(() => { this.setState({ ...this.state, notifications: [] }); }, 4000);
        return <div>
            {
                this.state.notifications.map((item, idx) =>
                    <MessageBar messageBarType={MessageBarType.success}>{item}</MessageBar>,
                )
            }
        </div>;
    }

    private _renderErrors(): React.ReactElement<any> {
        return this.state.errors.length > 0
            ?
            <div>
                {
                    this.state.errors.map((item, idx) =>
                        <MessageBar
                            messageBarType={MessageBarType.error}
                            isMultiline={true}
                            onDismiss={(ev) => this._clearError(idx)}
                        >
                            {item}
                        </MessageBar>,
                    )
                }
            </div>
            : null;
    }

    private _renderFields(): any {
        const { fieldsSchema, data, fieldErrors } = this.state;
        const fields: IFieldConfiguration[] = this._getFields();
        const defaultvalues: { [fieldName: string]: string } = this.props.defaultValues || {};
        return (fields && (fields.length > 0))
            ?
            <div className="ard-formFieldsContainer" >
                {
                    fields.map((field, idx) => {
                        const fieldSchemas: IFieldSchema[] = fieldsSchema.filter((f) => f.InternalName === field.fieldName);
                        if (fieldSchemas.length > 0) {
                            const fieldSchema: IFieldSchema = fieldSchemas[0];
                            const value: any = data[field.fieldName];
                            let extraData: any;
                            if (data.hasOwnProperty(field.fieldName + ".")) {
                                extraData = data[field.fieldName + "."];
                            } else {
                                extraData = Object.keys(data)
                                    .filter((propName) => propName.indexOf(field.fieldName + ".") === 0)
                                    .reduce((newData, pn) => { newData[pn.substring(field.fieldName.length + 1)] = data[pn]; return newData; }, {});
                            }
                            const errorMessage: string = fieldErrors[field.fieldName];
                            const fieldComponent: any = SPFormField({
                                fieldSchema,
                                controlMode: this.props.formType,
                                value,
                                extraData,
                                errorMessage,
                                hideIfFieldUnsupported: !this.props.showUnsupportedFields,
                                valueChanged: (val) => this._valueChanged(field.fieldName, val),
                            });
                            return fieldComponent;
                        }
                    })
                }
            </div>
            : <MessageBar messageBarType={MessageBarType.warning}>No fields available!</MessageBar>;
    }

    private _getFields(): IFieldConfiguration[] {
        // let fields: IFieldConfiguration[];
        if (this.state.fieldsSchema) {
            return this.state.fieldsSchema.map((field) => ({ key: field.InternalName, fieldName: field.InternalName }));
        }
        return [];
    }

    private _clearError(idx: number): any {
        this.setState((prevState, props) => {
            return { ...prevState, errors: prevState.errors.splice(idx, 1) };
        });
    }

    @autobind
    private async _readSchema(listId: string, formType: ControlMode): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (!listId) {
                reject(CustomListForm.configureListMessage);
                // this.setState({ ...this.state, loading: false, fieldsSchema: null, error: messages.configureListMessage });
            } else {
                this.listFormService.getFieldSchemasForForm(formType).then((data) => {
                    this.setState({ ...this.state, fieldsSchema: data });
                    resolve();
                }, (err) => { reject(err); });
            }
        });
    }

    @autobind
    private async _readData(listUrl: string, formType: ControlMode, id?: number): Promise<void> {
        if ((formType === ControlMode.New) || !id) {
            const data: any = this.state.fieldsSchema
                .reduce((newData, fld) => { newData[fld.InternalName] = fld.DefaultValue; return newData; }, {});
            const newdata: any = this._getdataWithDefault(data);
            this.setState({ ...this.state, data: { ...newdata }, originalData: { ...data }, fieldErrors: {}, isLoadingData: false });
            return;
        }
        this.setState({ ...this.state, data: {}, originalData: {}, fieldErrors: {}, isLoadingData: true });
        this.listFormService.getDataForForm(id, formType)
            .then((dataObj) => {
                // We shallow clone here, so that changing values on dataObj object fields won't be changing in originalData too
                const dataObjOriginal: any = { ...dataObj };
                this.setState({ ...this.state, data: dataObj, originalData: dataObjOriginal, isLoadingData: false });
            }, (errorText) => {
                this.setState({ ...this.state, data: {}, isLoadingData: false, errors: [...this.state.errors, errorText] });
            });
    }

    @autobind
    private _getdataWithDefault(tempdata: any): any {
        const data: any = cloneDeep(tempdata);
        if (this.props.formType === ControlMode.New) {
            const defaultvalues: { [fieldName: string]: string } = this.props.defaultValues || {};
            for (const key in defaultvalues) {
                if (defaultvalues.hasOwnProperty(key) && data.hasOwnProperty(key)) {
                    const value: any = data[key];
                    if (!value) {
                        data[key] = defaultvalues[key];
                    }
                }
            }
        }
        return data;
    }

    @autobind
    private _valueChanged(fieldName: string, newValue: any): any {
        this.setState((prevState, props) => {
            return {
                ...prevState,
                data: { ...prevState.data, [fieldName]: newValue },
                fieldErrors: {
                    ...prevState.fieldErrors,
                    [fieldName]:
                    (prevState.fieldsSchema.filter((item) => item.InternalName === fieldName)[0].Required) && !newValue
                        ? "Please enter a value!"
                        : "",
                },
            };
        },
        );
    }

    @autobind
    private async _saveItem(): Promise<void> {
        this.setState({ ...this.state, isSaving: true, errors: [] });
        try {
            let updatedValues: any;
            if (this.props.itemId) {
                updatedValues = await this.listFormService.updateItem(
                    this.props.itemId,
                    this.state.fieldsSchema,
                    this.state.data,
                    this.state.originalData);
            } else {
                updatedValues = await this.listFormService.createItem(this.state.fieldsSchema, this.state.data);
            }
            let dataReloadNeeded: boolean = false;
            const newState: ICustomListFormState = { ...this.state, fieldErrors: {} };
            let hadErrors: boolean = false;
            updatedValues.filter((fieldVal) => fieldVal.HasException).forEach((element) => {
                newState.fieldErrors[element.FieldName] = element.ErrorMessage;
                hadErrors = true;
            });
            if (hadErrors) {
                if (this.props.onSubmitFailed) {
                    this.props.onSubmitFailed(newState.fieldErrors);
                } else {
                    newState.errors = [...newState.errors, "The item could not be saved. Please check detailed error messages on the fields below."];
                }
            } else {
                updatedValues.reduce(
                    (val, merged) => {
                        merged[val.FieldName] = merged[val.FieldValue]; return merged;
                    },
                    newState.data,
                );
                // we shallow clone here, so that changing values on state.data won't be changing in state.originalData too
                newState.originalData = { ...newState.data };
                let id: number = (this.props.itemId) ? this.props.itemId : 0;
                if (id === 0 && updatedValues.length > 0) {
                    id = updatedValues[0].ItemId;
                }
                if (this.props.onSubmitSucceeded) { this.props.onSubmitSucceeded(id); }
                newState.notifications = [...newState.notifications, "Item saved successfully."];
                dataReloadNeeded = true;
            }
            newState.isSaving = false;
            this.setState(newState);

            if (dataReloadNeeded) { this._readData(this.props.listId, this.props.formType, this.props.itemId); }
        } catch (error) {
            const errorText: string = "Error on loading lists";
            this.setState({ ...this.state, errors: [...this.state.errors, errorText] });
        }
    }

    @autobind
    private async _cancel(): Promise<void> {
        if (this.props.onCancel) { this.props.onCancel(); }
    }

}