import * as React from "react";
import {
    autobind,
    Spinner,
    FocusZone,
    FocusZoneDirection,
    List,
    Checkbox,
    ICheckboxStyles,
    Label,
} from "office-ui-fabric-react";
import { IListSelectProps } from "./IListSelectProps";
import { IListSelectState } from "./IListSelectState";
import { find, findIndex } from "@microsoft/sp-lodash-subset";
import { IList, IListSelection } from "mcs-lms-core";

export default class ListSelect extends React.Component<IListSelectProps, IListSelectState> {
    private _selectedList: IList[];

    constructor(props: IListSelectProps, state: IListSelectState) {
        super(props);
        this.state = {
            loading: false,
            error: undefined,
            items: [],
        };
    }

    public componentDidMount(): void {
        this._loadOptions();
    }

    public componentDidUpdate(prevProps: IListSelectProps, prevState: IListSelectState): void {
        if (this.props.disabled !== prevProps.disabled ||
            this.props.stateKey !== prevProps.stateKey) {
            this._loadOptions();
        }
    }

    public render(): JSX.Element {
        const { items } = this.state;
        const loading: JSX.Element = this.state.loading ? <div><Spinner label={"Loading options..."} /></div> : <div />;
        // tslint:disable-next-line:max-line-length
        const error: JSX.Element = this.state.error !== undefined ? <div className={"ms-TextField-errorMessage ms-u-slideDownIn20"}>Error while loading items: {this.state.error}</div> : <div />;

        return (
            <div>
                {loading}
                {!this.state.loading && <FocusZone direction={FocusZoneDirection.vertical}>
                    <Label>{this.props.label}</Label>
                    <List
                        items={items}
                        onRenderCell={this._onRenderCell}
                    />
                </FocusZone>}
                {error}
            </div>
        );
    }

    @autobind
    private _onRenderCell(item: IList, index: number | undefined): JSX.Element {
        const styles: ICheckboxStyles = {
            root: {
                marginTop: "10px",
            },
        };
        const isdefaultChecked: boolean = this._isDefaultChecked(item);
        return (
            <div className="ms-ListBasicExample-itemCell" data-is-focusable={true}>
                <div className="ms-ListBasicExample-itemContent">
                    <Checkbox
                        label={item.Title}
                        value={item.Id}
                        disabled={this.props.disabled}
                        defaultChecked={isdefaultChecked}
                        onChange={(ev, checked) => this._onCheckboxChange(item, checked)}
                        styles={styles}
                    />
                </div>
            </div>
        );
    }

    private _loadOptions(): void {
        this.setState({
            ...this.state,
            loading: true,
            error: undefined,
            items: [],
        });

        this.props.loadOptions()
            .then((options: IList[]): void => {
                const selectedKey: string[] = (this.props.selectedKey || []).map((s) => s.Id);
                this._selectedList = options.filter((v: IList) => {
                    // tslint:disable-next-line:prefer-for-of
                    for (let i: number = 0; i < selectedKey.length; i++) {
                        if (selectedKey[i] === v.Id) {
                            return true;
                        }
                    }
                    return false;
                });
                this.setState({
                    ...this.state,
                    loading: false,
                    error: undefined,
                    items: options,
                });
            }, (error: any): void => {
                this.setState((prevState: IListSelectState, props: IListSelectProps): IListSelectState => {
                    prevState.loading = false;
                    prevState.error = error;
                    return prevState;
                });
            });
    }

    @autobind
    private _isDefaultChecked(item: IList): boolean {
        const indexOfItem: number = findIndex(this._selectedList, (v) => {
            return item.Id === v.Id;
        });
        return indexOfItem >= 0;
    }

    private _onCheckboxChange(item: IList, isChecked: boolean): void {
        if (isChecked) {
            this._selectedList.push(item);
        } else {
            const index: number = findIndex(this._selectedList, (v: IList) => {
                return v.Id === item.Id;
            });
            if (index >= 0) {
                this._selectedList.splice(index, 1);
            }
        }
        const options: IListSelection[] = this._selectedList.map((v) => {
            return {
                Id: v.Id,
                Title: v.Title,
                BaseTemplate: v.BaseTemplate,
                BaseType: v.BaseType,
                searchField: v.Fields[0].InternalName,
                fieldType: v.Fields[0].TypeAsString,
            };
        });
        this.props.onChanged(options);
    }
}