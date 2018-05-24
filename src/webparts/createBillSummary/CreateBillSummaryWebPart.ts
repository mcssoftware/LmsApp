import * as React from "react";
import * as ReactDom from "react-dom";
import { Version, Environment, EnvironmentType } from "@microsoft/sp-core-library";
import {
  BaseClientSideWebPart,
  IPropertyPaneConfiguration,
  PropertyPaneTextField,
} from "@microsoft/sp-webpart-base";

import * as strings from "CreateBillSummaryWebPartStrings";
import CreateBillSummary from "./components/CreateBillSummary";
import { ICreateBillSummaryProps } from "./components/ICreateBillSummaryProps";
import { config } from "mcs-lms-core";

export interface ICreateBillSummaryWebPartProps {
  description: string;
}

export default class CreateBillSummaryWebPart extends BaseClientSideWebPart<ICreateBillSummaryWebPartProps> {

  public render(): void {
    config.setupUrl(this.context.pageContext.site.absoluteUrl, this.context.pageContext.web.absoluteUrl);
    const element: React.ReactElement<ICreateBillSummaryProps > = React.createElement(
      CreateBillSummary,
      {
        title: "Create Bill Summary Task",
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
