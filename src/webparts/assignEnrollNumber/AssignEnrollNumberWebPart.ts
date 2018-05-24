import * as React from "react";
import * as ReactDom from "react-dom";
import { Version, Environment, EnvironmentType } from "@microsoft/sp-core-library";
import {
  BaseClientSideWebPart,
  IPropertyPaneConfiguration,
  PropertyPaneTextField,
} from "@microsoft/sp-webpart-base";

import * as strings from "AssignEnrollNumberWebPartStrings";
import AssignEnrollNumber from "./components/AssignEnrollNumber";
import { IAssignEnrollNumberProps } from "./components/IAssignEnrollNumberProps";
import { config } from "mcs-lms-core";

export interface IAssignEnrollNumberWebPartProps {
  description: string;
}

export default class AssignEnrollNumberWebPart extends BaseClientSideWebPart<IAssignEnrollNumberWebPartProps> {

  public render(): void {
    config.setupUrl(this.context.pageContext.site.absoluteUrl, this.context.pageContext.web.absoluteUrl);
    const element: React.ReactElement<IAssignEnrollNumberProps> = React.createElement(
      AssignEnrollNumber,
      {
        title: "Assign Enroll Number",
        isLocalEnvironment: (Environment.type === EnvironmentType.Test || Environment.type === EnvironmentType.Local),
        spHttpClient: this.context.spHttpClient,
        httpClient: this.context.httpClient,
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
