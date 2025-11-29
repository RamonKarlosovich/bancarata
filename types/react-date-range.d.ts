// types/react-date-range.d.ts
declare module "react-date-range" {
    import * as React from "react";
  
    export interface Range {
      startDate?: Date;
      endDate?: Date;
      key?: string;
      color?: string;
    }
  
    export interface RangeKeyDict {
      [key: string]: Range;
    }
  
    export interface DateRangeProps {
      ranges: Range[];
      onChange?: (ranges: RangeKeyDict) => void;
      months?: number;
      direction?: "vertical" | "horizontal";
      moveRangeOnFirstSelection?: boolean;
      locale?: any;
      editableDateInputs?: boolean;
      showSelectionPreview?: boolean;
      showMonthAndYearPickers?: boolean;
    }
  
    export const DateRange: React.ComponentType<DateRangeProps>;
  }
  