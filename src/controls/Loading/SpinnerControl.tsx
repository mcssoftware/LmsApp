import * as React from "react";
import {
    Spinner,
} from "office-ui-fabric-react";
import styles from "./spinner.module.scss";
import {
    Logger,
    FunctionListener,
    LogEntry,
    LogLevel,
} from "sp-pnp-js";

export interface ISpinnerProps {
    onRef: (reference: SpinnerControl) => void;
}

export interface ISpinnerState {
    message: string;
    visible: boolean;
}

export default class SpinnerControl extends React.Component<ISpinnerProps, ISpinnerState> {

    constructor(props: ISpinnerProps, context?: any) {
        super(props, context);
        this.state = {
            message: "",
            visible: false,
        };
        const listener: FunctionListener = new FunctionListener((entry: LogEntry) => {
            if (this.state.visible) {
                this.setState({ ...this.state, message: entry.message });
            }
        });
        Logger.subscribe(listener);
        // set the active log level
        Logger.activeLogLevel = LogLevel.Info;
    }

    public componentDidMount(): void {
        this.props.onRef(this);
    }

    public componentWillUnmount(): void {
        this.props.onRef(undefined);
    }

    public setVisibility(visible: boolean): void {
        if (this.state.visible !== visible) {
            this.setState({ ...this.state, visible });
        }
    }

    public render(): React.ReactElement<ISpinnerProps> {
        return (
            <div>
                {this.state.visible &&
                    <div className={styles.spinner}>
                        <Spinner label={this.state.message} />
                    </div>
                }
            </div>
        );
    }
}