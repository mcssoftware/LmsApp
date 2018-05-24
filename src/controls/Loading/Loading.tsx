import * as React from "react";
import {
    Spinner,
} from "office-ui-fabric-react";

export class Loading extends React.Component<{}, {}> {
    constructor() {
        super({}, {});
    }

    public render(): React.ReactElement<{}> {
        return (
            <div>
                <Spinner label={"Loading options..."} />
            </div>
        );
    }
}

export interface IError {
    message: string;
}

// tslint:disable:max-classes-per-file
export class Error extends React.Component<IError, {}> {
    constructor(props: IError, context?: any) {
        super(props, context);
    }

    public render(): React.ReactElement<{}> {
        return (
            <div className={"ms-TextField-errorMessage ms-u-slideDownIn20"}>{this.props.message}</div>
        );
    }
}
