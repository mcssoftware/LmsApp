import * as React from "react";
import * as ReactDom from "react-dom";
import { Version, Environment, EnvironmentType } from "@microsoft/sp-core-library";
import {
  BaseClientSideWebPart,
  IPropertyPaneConfiguration,
  PropertyPaneTextField,
} from "@microsoft/sp-webpart-base";

import * as strings from "LmsTaskWebPartStrings";
import LmsTask from "./components/LmsTask";
import { ILmsTaskProps } from "./components/ILmsTaskProps";
import { config } from "mcs-lms-core";

export interface ILmsTaskWebPartProps {
  description: string;
}

export default class LmsTaskWebPart extends BaseClientSideWebPart<ILmsTaskWebPartProps> {

  public render(): void {
    config.setupUrl(this.context.pageContext.site.absoluteUrl, this.context.pageContext.web.absoluteUrl);
    const element: React.ReactElement<ILmsTaskProps> = React.createElement(
      LmsTask,
      {
        title: "Bill Processing",
        isLocalEnvironment: (Environment.type === EnvironmentType.Test || Environment.type === EnvironmentType.Local),
        spHttpClient: this.context.spHttpClient,
        showTaskAction: true,
        showSpinner: false,
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
