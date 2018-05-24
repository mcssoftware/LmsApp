import * as React from "react";
import { DatePicker, IDatePickerProps } from "office-ui-fabric-react";
import { FormFieldStrings  } from "./FormFieldStrings";

export interface IDateFormFieldProps extends IDatePickerProps {
  locale: string;
}

export default class DateFormField extends React.Component<IDateFormFieldProps> {
  public constructor() {
    super();
  }

  public render(): React.ReactElement<IDateFormFieldProps> {
    return (
      <DatePicker
        {...this.props}
        parseDateFromString={(dateStr: string) => new Date(Date.parse(dateStr))}
        formatDate={(date: Date) => (typeof date.toLocaleDateString === "function") ? date.toLocaleDateString(this.props.locale) : ""}
        strings={FormFieldStrings}
      />
    );
  }
}
