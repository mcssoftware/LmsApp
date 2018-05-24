import React = require("react");
import { Link, autobind, Icon } from "office-ui-fabric-react";
import { Item } from "sp-pnp-js/lib/pnp";
import { config, McsUtil } from "mcs-lms-core";

export interface IFileNameProps {
    item: any;
    listId: string;
    showVersion: boolean;
}

export class FileNameColumn extends React.Component<IFileNameProps, {}> {

    constructor(props: any) {
        super(props);
    }

    public render(): React.ReactElement<{}> {
        const { item, showVersion } = this.props;
        return (
            <span style={{ width: "100%" }}>
                {McsUtil.isDefined(item) &&
                    <div>
                        <Link style={{ padding: "0 15px 0 0" }}
                            onClick={this._openInWordApp}>{this._getProperty("Name")}
                        </Link>
                        <Link href={this._getProperty("LinkingUrl")}
                            target="_blank"
                            style={{ float: "right", fontSize: "14px", paddingTop: "3px" }}>
                            <Icon iconName={"Print"} style={{ color: "#00bfff" }} />
                        </Link>
                        {showVersion &&
                            <Link onClick={this._openDialog}
                                style={{ float: "right", fontSize: "14px", paddingTop: "3px", minWidth: "22px", maxWidth: "22px" }}>
                                <Icon iconName={"SearchAndApps"} style={{ color: "#00bfff" }} />
                            </Link>
                        }
                    </div>}
                {!McsUtil.isDefined(this.props.item) &&
                    <div>Invalid file</div>
                }
            </span>
        );
    }

    @autobind
    private _openInWordApp(event: any): void {
        event.preventDefault();
        const serverRelativeUrl: string = this._getProperty("ServerRelativeUrl").split("?")[0];
        _WriteDocEngagement("DocLibECB_Click_ID_EditIn_Word", "OneDrive_DocLibECB_Click_ID_EditIn_Word");
        editDocumentWithProgID2(serverRelativeUrl, "", "SharePoint.OpenDocuments", "0", config.getLmsUrl(), "0", "ms-word");
    }

    @autobind
    private _openDialog(): void {
        event.preventDefault();
        const propId: string = this._getProperty("Id");
        const strSetApprovalUrl: string = McsUtil.combinePaths(config.getLmsUrl(),
            "_layouts/15/Versions.aspx?IsDlg=1&list=" + this.props.listId +
            (McsUtil.isString(propId) ? ("&ID=" + propId) : "") +
            "&FileName=" + this._getProperty("ServerRelativeUrl")
            + "&source=" + window.location.href);
        const options: any = {
            title: "Version History: " + this._getProperty("Name"),
            width: "500",
            args: {},
            url: strSetApprovalUrl,
            // tslint:disable-next-line:no-empty
            dialogReturnValueCallback: () => { },
        };
        SP.UI.ModalDialog.showModalDialog(options);
    }

    private _getProperty(propertyName: string): string {
        const { item } = this.props;
        if (McsUtil.isDefined(item.File)) {
            return item.File[propertyName] || "";
        }
        return item["File." + propertyName] || "";
    }
}
// declare var SP: any;
declare function _WriteDocEngagement(a: string, b: string): void;
declare function editDocumentWithProgID2(a: string, b: string, c: string, d: string, e: string, f: string, g: string): void;