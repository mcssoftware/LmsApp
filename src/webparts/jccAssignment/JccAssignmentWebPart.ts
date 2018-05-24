import * as React from "react";
import * as ReactDom from "react-dom";
import { Version, Environment, EnvironmentType } from "@microsoft/sp-core-library";
import {
  BaseClientSideWebPart,
  IPropertyPaneConfiguration,
  PropertyPaneTextField,
} from "@microsoft/sp-webpart-base";

import * as strings from "JccAssignmentWebPartStrings";
import JccAssignment from "./components/JccAssignment";
import { IJccAssignmentProps } from "./components/IJccAssignmentProps";
import { config } from "mcs-lms-core";

export interface IJccAssignmentWebPartProps {
  description: string;
}

export default class JccAssignmentWebPart extends BaseClientSideWebPart<IJccAssignmentWebPartProps> {

  public render(): void {
    config.setupUrl(this.context.pageContext.site.absoluteUrl, this.context.pageContext.web.absoluteUrl);
    const element: React.ReactElement<IJccAssignmentProps > = React.createElement(
      JccAssignment,
      {
        title: "JCC Assignment Task",
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
