import * as React from "react";
import { css } from "office-ui-fabric-react";
import { ISPFormFieldProps } from "./SPFormField";
import DateFormField from "./DateFormField";
import { FormFieldStrings  } from "./FormFieldStrings";
import styles from "./SPFormField.module.scss";
import { Locales } from "../Locales";

// tslint:disable-next-line:variable-name
const SPFieldDateEdit: React.SFC<ISPFormFieldProps> = (props) => {
  const locale: string = Locales[props.fieldSchema.LocaleId];
  return <DateFormField
    className={css(styles.dateFormField, "ard-dateFormField")}
    placeholder={FormFieldStrings.DateFormFieldPlaceholder}
    isRequired={props.fieldSchema.Required}
    ariaLabel={props.fieldSchema.Title}
    locale={Locales[locale]}
    firstDayOfWeek={props.fieldSchema.FirstDayOfWeek}
    allowTextInput
    onSelectDate={(date) => props.valueChanged(date.toLocaleDateString(locale))}
  />;
};

export default SPFieldDateEdit;
