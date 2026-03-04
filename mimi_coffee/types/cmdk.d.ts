declare module "cmdk" {
  import * as React from "react";

  type PrimitiveProps = React.HTMLAttributes<HTMLElement>;
  type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

  type CommandComponent = React.ForwardRefExoticComponent<
    PrimitiveProps & React.RefAttributes<HTMLElement>
  > & {
    Input: React.ForwardRefExoticComponent<
      InputProps & React.RefAttributes<HTMLInputElement>
    >;
    List: React.ForwardRefExoticComponent<
      PrimitiveProps & React.RefAttributes<HTMLElement>
    >;
    Empty: React.ForwardRefExoticComponent<
      PrimitiveProps & React.RefAttributes<HTMLElement>
    >;
    Group: React.ForwardRefExoticComponent<
      PrimitiveProps & React.RefAttributes<HTMLElement>
    >;
    Separator: React.ForwardRefExoticComponent<
      PrimitiveProps & React.RefAttributes<HTMLElement>
    >;
    Item: React.ForwardRefExoticComponent<
      PrimitiveProps & React.RefAttributes<HTMLElement>
    >;
  };

  export const Command: CommandComponent;
}
