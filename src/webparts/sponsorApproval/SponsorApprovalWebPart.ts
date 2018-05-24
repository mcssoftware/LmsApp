import * as React from "react";
import * as ReactDom from "react-dom";
import { Version, EnvironmentType, Environment } from "@microsoft/sp-core-library";
import {
  BaseClientSideWebPart,
  IPropertyPaneConfiguration,
  PropertyPaneTextField,
} from "@microsoft/sp-webpart-base";

import * as strings from "SponsorApprovalWebPartStrings";
import SponsorApproval from "./components/SponsorApproval";
import { ISponsorApprovalProps } from "./components/ISponsorApprovalProps";
import { config } from "mcs-lms-core";

export interface ISponsorApprovalWebPartProps {
  description: string;
}

export default class SponsorApprovalWebPart extends BaseClientSideWebPart<ISponsorApprovalWebPartProps> {

  public render(): void {
    config.setupUrl(this.context.pageContext.site.absoluteUrl, this.context.pageContext.web.absoluteUrl);
    const element: React.ReactElement<ISponsorApprovalProps > = React.createElement(
      SponsorApproval,
      {
        title: "Sponsor Approval Task",
        isLocalEnvironment: (Environment.type === EnvironmentType.Test || Environment.type === EnvironmentType.Local),
        spHttpClient: this.context.spHttpClient,
      },
    );

    ReactDom.render(element, this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse("1.0");
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: strings.PropertyPaneDescription,
          },
          groups: [
            {
              groupName: strings.BasicGroupName,
              groupFields: [
                PropertyPaneTextField("description", {
                  label: strings.DescriptionFieldLabel
                }),
              ],
            },
          ],
        },
      ],
    };
  }
}
