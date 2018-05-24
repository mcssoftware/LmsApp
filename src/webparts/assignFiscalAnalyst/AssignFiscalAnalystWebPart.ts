import * as React from "react";
import * as ReactDom from "react-dom";
import { Version, Environment, EnvironmentType } from "@microsoft/sp-core-library";
import {
  BaseClientSideWebPart,
  IPropertyPaneConfiguration,
  PropertyPaneTextField,
} from "@microsoft/sp-webpart-base";

import * as strings from "AssignFiscalAnalystWebPartStrings";
import AssignFiscalAnalyst from "./components/AssignFiscalAnalyst";
import { IAssignFiscalAnalystProps } from "./components/IAssignFiscalAnalystProps";
import { config } from "mcs-lms-core";

export interface IAssignFiscalAnalystWebPartProps {
  description: string;
}

export default class AssignFiscalAnalystWebPart extends BaseClientSideWebPart<IAssignFiscalAnalystWebPartProps> {

  public render(): void {
    config.setupUrl(this.context.pageContext.site.absoluteUrl, this.context.pageContext.web.absoluteUrl);
    const element: React.ReactElement<IAssignFiscalAnalystProps > = React.createElement(
      AssignFiscalAnalyst,
      {
        title: "Assign Fiscal Analyst",
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
                  label: strings.DescriptionFieldLabel,
                }),
              ],
            },
          ],
        },
      ],
    };
  }
}
