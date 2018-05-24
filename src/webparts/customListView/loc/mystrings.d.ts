declare interface ICustomListViewWebPartStrings {
  PropertyPaneDescription: string;
  BasicGroupName: string;
  TitleLabel: string;
  ListLabel: string;
  ViewLabel: string;
  HeightLabel: string;
}

declare module 'CustomListViewWebPartStrings' {
  const strings: ICustomListViewWebPartStrings;
  export = strings;
}
