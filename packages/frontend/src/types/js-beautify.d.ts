declare module 'js-beautify' {
  export interface BeautifyOptions {
    indent_size?: number;
    indent_char?: string;
    indent_with_tabs?: boolean;
    eol?: string;
    end_with_newline?: boolean;
    preserve_newlines?: boolean;
    max_preserve_newlines?: number;
    space_in_paren?: boolean;
    space_in_empty_paren?: boolean;
    jslint_happy?: boolean;
    space_after_anon_function?: boolean;
    brace_style?: 'collapse' | 'expand' | 'end-expand' | 'none';
    keep_array_indentation?: boolean;
    keep_function_indentation?: boolean;
    space_before_conditional?: boolean;
    break_chained_methods?: boolean;
    eval_code?: boolean;
    unescape_strings?: boolean;
    wrap_line_length?: number;
    wrap_attributes?: string;
    wrap_attributes_indent_size?: number;
    e4x?: boolean;
    comma_first?: boolean;
    operator_position?: string;
    indent_empty_lines?: boolean;
    templating?: string[];
    unformatted?: string[];
    content_unformatted?: string[];
    extra_liners?: string[];
    indent_inner_html?: boolean;
    indent_scripts?: 'keep' | 'separate' | 'normal';
    selector_separator_newline?: boolean;
    newline_between_rules?: boolean;
    space_around_selector_separator?: boolean;
  }

  export function js(code: string, options?: BeautifyOptions): string;
  export function html(code: string, options?: BeautifyOptions): string;
  export function css(code: string, options?: BeautifyOptions): string;
}
