import * as React from "react";
import {
    autobind,
    Checkbox,
    Label,
    Spinner,
} from "office-ui-fabric-react";
import { IAsyncChoiceProps } from "./IAsyncChoiceProps";
import { IAsyncChoiceState } from "./IAsyncChoiceState";

export default class AsyncChoice extends React.Component<IAsyncChoiceProps, IAsyncChoiceState> {
    private selectedKey: React.ReactText;

    constructor(props: IAsyncChoiceProps, state: IAsyncChoiceState) {
        super(props);
        this.state = {
            loading: false,
            options: undefined,
            error: undefined,
        };
    }

    public componentDidMount(): void {
        this.loadOptions();
    }

    public componentDidUpdate(prevProps: IAsyncChoiceProps, prevState: IAsyncChoiceState): void {
        if (this.props.disabled !== prevProps.disabled ||
            this.props.stateKey !== prevProps.stateKey) {
            this.loadOptions();
        }
    }

    public render(): JSX.Element {
        const loading: boolean = this.state.loading;
        // tslint:disable-next-line:max-line-length
        const error: JSX.Element = this.state.error !== undefined ? <div className={"ms-TextField-errorMessage ms-u-slideDownIn20"}>Error while loading items: {this.state.error}</div> : <div />;

        return (
            <div>
                <Label>{this.props.label}</Label>
                {this.props.disabled || !!this.state.options || this.state.loading || this.state.error !== undefined &&
                    <Checkbox label="Not available" disabled={true} />
                }
                {!this.props.disabled && this.state.options && !this.state.loading && this.state.error === undefined &&
                    <div>
                        {this.state.options.map((e) => {
                            return <Checkbox
                                label={e.label}
                                value={e.value}
                                defaultChecked={this.props.selectedKey.indexOf(e.value) >= 0}
                                onChange={this._onCheckboxChange}
                            />;
                        })}
                    </div>
                }
                {error}
            </div>
        );
    }

    private loadOptions(): void {
        this.setState({
            ...this.state,
            loading: true,
            error: undefined,
            options: undefined,
        });

        this.props.loadOptions()
            .then((options: Array<{ label: string, value: string, isChecked: boolean }>): void => {
                this.setState({
                    ...this.state,
                    loading: false,
                    error: undefined,
                    options,
                });
            }, (error: any): void => {
                this.setState((prevState: IAsyncChoiceState, props: IAsyncChoiceProps): IAsyncChoiceState => {
                    prevState.loading = false;
                    prevState.error = error;
                    return prevState;
                });
            });
    }

    @autobind
    // tslint:disable-next-line:no-empty
    private _onCheckboxChange(ev: React.FormEvent<HTMLElement>, isChecked: boolean): void {
    }
}