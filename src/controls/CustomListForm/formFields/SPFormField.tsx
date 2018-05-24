import * as React from "react";
import FormField from "./FormField";
import { IFormFieldProps } from "./FormField";
import { TextField, Icon } from "office-ui-fabric-react";

import SPFieldTextEdit from "./SPFieldTextEdit";
import SPFieldLookupEdit from "./SPFieldLookupEdit";
import SPFieldChoiceEdit from "./SPFieldChoiceEdit";
import SPFieldNumberEdit from "./SPFieldNumberEdit";
import SPFieldDateEdit from "./SPFieldDateEdit";
import SPFieldBooleanEdit from "./SPFieldBooleanEdit";
import SPFieldTextDisplay from "./SPFieldTextDisplay";
import SPFieldLookupDisplay from "./SPFieldLookupDisplay";
import SPFieldUserDisplay from "./SPFieldUserDisplay";
import SPFieldUrlDisplay from "./SPFieldUrlDisplay";
import SPFileEdit from "./SPFileEdit";

import { FormFieldStrings  } from "./FormFieldStrings";
import styles from "./SPFormField.module.scss";
import { IFieldSchema } from "../RenderListData";
import { ControlMode } from "../ControlMode";

// tslint:disable-next-line:variable-name
const EditFieldTypeMappings: { [fieldType: string]: React.StatelessComponent<ISPFormFieldProps> } = {
  Text: SPFieldTextEdit,
  Note: SPFieldTextEdit,
  Lookup: SPFieldLookupEdit,
  LookupMulti: SPFieldLookupEdit,
  Choice: SPFieldChoiceEdit,
  MultiChoice: SPFieldChoiceEdit,
  Number: SPFieldNumberEdit,
  Currency: SPFieldNumberEdit,
  DateTime: SPFieldDateEdit,
  Boolean: SPFieldBooleanEdit,
  File: SPFileEdit,
  /* The following are known but unsupported types as of now:
  User: null,
  UserMulti: null,
  URL: null,
  TaxonomyFieldType: null,
  Attachments: null,
  TaxonomyFieldTypeMulti: null,
  */
};

// tslint:disable-next-line:variable-name
const DisplayFieldTypeMappings: { [fieldType: string]: { component: React.StatelessComponent<ISPFormFieldProps>, valuePreProcess?: (value: any) => any } } = {
  Text: { component: SPFieldTextDisplay },
  Note: { component: SPFieldTextDisplay },
  Lookup: { component: SPFieldLookupDisplay },
  LookupMulti: { component: SPFieldLookupDisplay },
  Choice: { component: SPFieldTextDisplay },
  MultiChoice: { component: SPFieldTextDisplay, valuePreProcess: (val) => val ? val.join(", ") : "" },
  Number: { component: SPFieldTextDisplay },
  Currency: { component: SPFieldTextDisplay },
  DateTime: { component: SPFieldTextDisplay },
  Boolean: { component: SPFieldTextDisplay },
  User: { component: SPFieldUserDisplay },
  UserMulti: { component: SPFieldUserDisplay },
  URL: { component: SPFieldUrlDisplay },
  File: { component: SPFieldTextDisplay },
  TaxonomyFieldType: { component: SPFieldTextDisplay, valuePreProcess: (val) => val ? val.Label : "" },
  TaxonomyFieldTypeMulti: { component: SPFieldTextDisplay, valuePreProcess: (val) => val ? val.map((v) => v.Label).join(", ") : "" },
  /* The following are known but unsupported types as of now:
  Attachments: null,
  */
};

export interface ISPFormFieldProps extends IFormFieldProps {
  extraData?: any;
  fieldSchema: IFieldSchema;
  hideIfFieldUnsupported?: boolean;
}

// tslint:disable-next-line:variable-name
const SPFormField: React.SFC<ISPFormFieldProps> = (props) => {
  let fieldControl: any = null;
  const fieldType: any = props.fieldSchema.FieldType;
  if (props.controlMode === ControlMode.Display) {
    if (DisplayFieldTypeMappings.hasOwnProperty(fieldType)) {
      const fieldMapping: any = DisplayFieldTypeMappings[fieldType];
      const childProps: any = fieldMapping.valuePreProcess ? { ...props, value: fieldMapping.valuePreProcess(props.value) } : props;
      fieldControl = React.createElement(fieldMapping.component, childProps);
    } else if (!props.hideIfFieldUnsupported) {
      const value: string = (props.value) ? ((typeof props.value === "string") ? props.value : JSON.stringify(props.value)) : "";
      fieldControl = <div className={`ard-${fieldType}field-display`}>
        <span>{value}</span>
        <div className={styles.unsupportedFieldMessage}><Icon iconName="Error" />{`${FormFieldStrings.UnsupportedFieldType} "${fieldType}"`}</div>
      </div>;
    }
  } else {
    if (EditFieldTypeMappings.hasOwnProperty(fieldType)) {
      fieldControl = React.createElement(EditFieldTypeMappings[fieldType], props);
    } else if (!props.hideIfFieldUnsupported) {
      const isObjValue: boolean = (props.value) && (typeof props.value !== "string");
      const value: string = (props.value) ? ((typeof props.value === "string") ? props.value : JSON.stringify(props.value)) : "";
      fieldControl = <TextField
        readOnly
        multiline={isObjValue}
        value={value}
        errorMessage={`${FormFieldStrings.UnsupportedFieldType} "${fieldType}"`}
        underlined
      />;
    }
  }
  return (fieldControl)
    ? <FormField
      {...props}
      label={props.label || props.fieldSchema.Title}
      description={props.description || props.fieldSchema.Description}
      required={props.fieldSchema.Required}
      errorMessage={props.errorMessage}
    >
      {fieldControl}
    </FormField>
    : null;
};

export {SPFormField};
