import { ResultValueType } from '@prisma/client';

type ParameterRanges = {
  resultType?: ResultValueType;
  refRangeLow?: number;
  refRangeHigh?: number;
  criticalRangeLow?: number;
  criticalRangeHigh?: number;
};

/**
 * Numeric ranges only mean something for NUMERIC parameters (resultType
 * defaults to NUMERIC when omitted). For qualitative types such as
 * REACTIVE_NONREACTIVE the reference/critical values live in the *Text
 * fields, so any numeric range sent alongside them is dropped.
 */
export function stripNonNumericRanges<T extends ParameterRanges>(param: T): T {
  if (!param.resultType || param.resultType === ResultValueType.NUMERIC) {
    return param;
  }
  return {
    ...param,
    refRangeLow: undefined,
    refRangeHigh: undefined,
    criticalRangeLow: undefined,
    criticalRangeHigh: undefined,
  };
}
