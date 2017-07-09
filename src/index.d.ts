import { Options } from './options';

type ConversionResult = {
  code: string,
};

export function convert(source: string, options?: Options): ConversionResult;
