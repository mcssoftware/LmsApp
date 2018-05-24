import * as React from "react";
import * as ReactDom from "react-dom";
import { Version, Environment, EnvironmentType } from "@microsoft/sp-core-library";
import {
  BaseClientSideWebPart,
  IPropertyPaneConfiguration,
  PropertyPaneTextField,
} from "@microsoft/sp-webpart-base";

import * as strings from "CreateFormalDraftWebPartStrings";
import CreateFormalDraft from "./components/CreateFormalDraft";
import { ICreateFormalDraftProps } from "./components/ICreateFormalDraftProps";
import { config } from "mcs-lms-core";

export interface ICreateFormalDraftWebPartProps {
  description: string;
}

export default class CreateFormalDraftWebPart extends BaseClientSideWebPart<ICreateFormalDraftWebPartProps> {

  public render(): void {
    config.setupUrl(this.context.pageContext.site.absoluteUrl, this.context.pageContext.web.absoluteUrl);
    const element: React.ReactElement<ICreateFormalDraftProps> = React.createElement(
      CreateFormalDraft,
      {
        title: "Create Formal Draft",
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
